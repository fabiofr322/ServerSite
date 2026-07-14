const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dzfmtmlgbyxnqjdwutfp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CODE_TTL_MINUTES = 10;
const CODE_REQUEST_COOLDOWN_SECONDS = 60;

exports.handler = async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed.' });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
        return jsonResponse(500, { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' });
    }

    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const userToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!userToken) {
        return jsonResponse(401, { error: 'Login required.' });
    }

    let payload;
    try {
        payload = JSON.parse(event.body || '{}');
    } catch {
        return jsonResponse(400, { error: 'Invalid request body.' });
    }

    const playerId = String(payload.player_id || '').trim();
    if (!isUuid(playerId)) {
        return jsonResponse(400, { error: 'Invalid player id.' });
    }

    try {
        const user = await getUser(userToken);
        const profile = await fetchSingle('player_profiles', {
            select: 'id,minecraft_username,is_verified,verified_by_user_id',
            id: `eq.${playerId}`,
            limit: '1'
        });

        if (!profile) return jsonResponse(404, { error: 'Player not found.' });
        if (profile.is_verified && profile.verified_by_user_id && profile.verified_by_user_id !== user.id) {
            return jsonResponse(409, { error: 'This player profile is already verified.' });
        }

        const latestVerification = await fetchSingle('player_verifications', {
            select: 'created_at',
            player_id: `eq.${playerId}`,
            user_id: `eq.${user.id}`,
            order: 'created_at.desc',
            limit: '1'
        });
        const latestCreatedAt = latestVerification?.created_at
            ? new Date(latestVerification.created_at).getTime()
            : 0;
        const retryAfterSeconds = Math.ceil(
            (latestCreatedAt + CODE_REQUEST_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
        );

        if (retryAfterSeconds > 0) {
            return jsonResponse(429, {
                error: 'Please wait before requesting another verification code.',
                retry_after_seconds: retryAfterSeconds
            }, { 'retry-after': String(retryAfterSeconds) });
        }

        await patchRows('player_verifications', { used_at: new Date().toISOString() }, {
            player_id: `eq.${playerId}`,
            user_id: `eq.${user.id}`,
            used_at: 'is.null'
        });

        const code = generateCode();
        const codeHash = hashCode(code);
        const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

        await insertRow('player_verifications', {
            player_id: playerId,
            user_id: user.id,
            code_hash: codeHash,
            expires_at: expiresAt,
            attempts: 0
        });

        return jsonResponse(200, {
            code,
            command: `/verificar ${code}`,
            expires_at: expiresAt,
            expires_in_seconds: CODE_TTL_MINUTES * 60,
            minecraft_username: profile.minecraft_username
        });
    } catch (error) {
        return jsonResponse(500, { error: error.message || 'Unable to start verification.' });
    }
};

function generateCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(12);
    let raw = '';
    for (let i = 0; i < 12; i++) {
        raw += alphabet[bytes[i] % alphabet.length];
    }
    return `FR32-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

function hashCode(code) {
    return crypto.createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex');
}

function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getUser(token) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            authorization: `Bearer ${token}`,
            accept: 'application/json'
        }
    });
    const body = await response.json();
    if (!response.ok || !body.id) throw new Error('Invalid user session.');
    return body;
}

async function fetchSingle(table, params) {
    const rows = await fetchRows(table, params);
    return rows[0] || null;
}

async function fetchRows(table, params) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${new URLSearchParams(params)}`, serviceHeaders());
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || `Unable to fetch ${table}.`);
    return Array.isArray(body) ? body : [];
}

async function insertRow(table, row) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        ...serviceHeaders({ Prefer: 'return=minimal' }),
        body: JSON.stringify(row)
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Unable to insert ${table}.`);
    }
}

async function patchRows(table, row, filters) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${new URLSearchParams(filters)}`, {
        method: 'PATCH',
        ...serviceHeaders({ Prefer: 'return=minimal' }),
        body: JSON.stringify(row)
    });
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Unable to update ${table}.`);
    }
}

function serviceHeaders(extra = {}) {
    return {
        headers: {
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            accept: 'application/json',
            'content-type': 'application/json',
            ...extra
        }
    };
}

function jsonResponse(statusCode, body, extraHeaders = {}) {
    return {
        statusCode,
        headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store',
            ...extraHeaders
        },
        body: JSON.stringify(body)
    };
}
