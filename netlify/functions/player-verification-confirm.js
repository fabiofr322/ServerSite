const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dzfmtmlgbyxnqjdwutfp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PLAYER_BRIDGE_TOKEN = process.env.PLAYER_BRIDGE_TOKEN || process.env.RANKS_TOKEN;

exports.handler = async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed.' });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
        return jsonResponse(500, { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' });
    }

    if (!PLAYER_BRIDGE_TOKEN) {
        return jsonResponse(500, { error: 'PLAYER_BRIDGE_TOKEN is not configured.' });
    }

    let payload;
    try {
        payload = JSON.parse(event.body || '{}');
    } catch {
        return jsonResponse(400, { error: 'Invalid request body.' });
    }

    const token = String(payload.token || event.headers['x-player-bridge-token'] || '').trim();
    const code = String(payload.code || '').trim().toUpperCase();
    const minecraftUsername = String(payload.minecraft_username || '').trim();
    const minecraftUuid = String(payload.minecraft_uuid || '').trim();

    if (token !== PLAYER_BRIDGE_TOKEN) {
        return jsonResponse(401, { error: 'Invalid bridge token.' });
    }
    if (!/^FR32-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
        return jsonResponse(400, { error: 'Invalid verification code.' });
    }
    if (!/^[A-Za-z0-9_]{3,16}$/.test(minecraftUsername)) {
        return jsonResponse(400, { error: 'Invalid Minecraft username.' });
    }

    try {
        const codeHash = hashCode(code);
        const verification = await fetchSingle('player_verifications', {
            select: '*',
            code_hash: `eq.${codeHash}`,
            used_at: 'is.null',
            order: 'created_at.desc',
            limit: '1'
        });

        if (!verification) {
            return jsonResponse(404, { error: 'Verification code not found.' });
        }

        if (new Date(verification.expires_at).getTime() < Date.now()) {
            await patchRows('player_verifications', { attempts: Number(verification.attempts || 0) + 1 }, { id: `eq.${verification.id}` });
            return jsonResponse(410, { error: 'Verification code expired.' });
        }

        const profile = await fetchSingle('player_profiles', {
            select: 'id,minecraft_username',
            id: `eq.${verification.player_id}`,
            limit: '1'
        });

        if (!profile) return jsonResponse(404, { error: 'Player profile not found.' });
        if (profile.minecraft_username.toLowerCase() !== minecraftUsername.toLowerCase()) {
            await patchRows('player_verifications', { attempts: Number(verification.attempts || 0) + 1 }, { id: `eq.${verification.id}` });
            return jsonResponse(409, { error: 'This code belongs to another player.' });
        }

        await patchRows('player_profiles', {
            minecraft_uuid: minecraftUuid || null,
            is_verified: true,
            verified_at: new Date().toISOString(),
            verified_by_user_id: verification.user_id,
            updated_at: new Date().toISOString()
        }, { id: `eq.${profile.id}` });

        await patchRows('player_verifications', {
            used_at: new Date().toISOString()
        }, { id: `eq.${verification.id}` });

        return jsonResponse(200, {
            ok: true,
            minecraft_username: profile.minecraft_username
        });
    } catch (error) {
        return jsonResponse(500, { error: error.message || 'Unable to confirm verification.' });
    }
};

function hashCode(code) {
    return crypto.createHash('sha256').update(String(code).trim().toUpperCase()).digest('hex');
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

function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'content-type': 'application/json',
            'cache-control': 'no-store'
        },
        body: JSON.stringify(body)
    };
}
