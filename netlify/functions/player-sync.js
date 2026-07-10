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
    if (token !== PLAYER_BRIDGE_TOKEN) {
        return jsonResponse(401, { error: 'Invalid bridge token.' });
    }

    const player = payload.player || {};
    const stats = payload.stats || {};
    const eventType = normalizeEventType(payload.event);

    const username = String(player.minecraft_username || '').trim();
    const uuid = String(player.minecraft_uuid || '').trim();

    if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
        return jsonResponse(400, { error: 'Invalid Minecraft username.' });
    }
    if (!uuid) {
        return jsonResponse(400, { error: 'Missing Minecraft UUID.' });
    }

    try {
        let profile = await findProfile(uuid, username);
        const now = new Date().toISOString();
        const profilePayload = {
            minecraft_username: username,
            minecraft_uuid: uuid,
            first_join_at: toIsoOrNull(player.first_join_at),
            last_login_at: toIsoOrNull(player.last_login_at) || now,
            total_playtime_seconds: safeInteger(player.total_playtime_seconds),
            is_online: Boolean(player.is_online),
            updated_at: now
        };

        if (profile) {
            await patchRows('player_profiles', profilePayload, { id: `eq.${profile.id}` });
        } else {
            profile = await insertRow('player_profiles', {
                ...profilePayload,
                bio: 'Perfil publico do jogador no FR32SURVIVAL.'
            });
        }

        const freshProfile = profile.id ? profile : await findProfile(uuid, username);
        if (!freshProfile) throw new Error('Unable to resolve synced profile.');

        await upsertStats(freshProfile.id, stats);

        if (eventType) {
            await insertActivity(freshProfile.id, eventType, username);
        }

        return jsonResponse(200, {
            ok: true,
            player_id: freshProfile.id,
            minecraft_username: username
        });
    } catch (error) {
        return jsonResponse(500, { error: error.message || 'Unable to sync player.' });
    }
};

async function findProfile(uuid, username) {
    const byUuid = await fetchSingle('player_profiles', {
        select: '*',
        minecraft_uuid: `eq.${uuid}`,
        limit: '1'
    });
    if (byUuid) return byUuid;

    return fetchSingle('player_profiles', {
        select: '*',
        minecraft_username: `ilike.${username}`,
        limit: '1'
    });
}

async function upsertStats(playerId, stats) {
    const existing = await fetchSingle('player_stats', {
        select: 'player_id',
        player_id: `eq.${playerId}`,
        limit: '1'
    });

    const row = {
        player_id: playerId,
        playtime_hours: safeNumber(stats.playtime_hours),
        deaths: safeInteger(stats.deaths),
        kills: safeInteger(stats.kills),
        blocks_broken: safeInteger(stats.blocks_broken),
        blocks_placed: safeInteger(stats.blocks_placed),
        distance_walked: safeNumber(stats.distance_walked),
        mobs_killed: safeInteger(stats.mobs_killed),
        rank: cleanOptionalText(stats.rank),
        clan: cleanOptionalText(stats.clan),
        role: cleanOptionalText(stats.role),
        homes: safeInteger(stats.homes),
        claims: safeInteger(stats.claims),
        achievements: safeInteger(stats.achievements),
        events_won: safeInteger(stats.events_won),
        updated_at: new Date().toISOString()
    };

    if (existing) {
        await patchRows('player_stats', row, { player_id: `eq.${playerId}` });
    } else {
        await insertRow('player_stats', row);
    }
}

async function insertActivity(playerId, eventType, username) {
    const data = {
        player_id: playerId,
        type: eventType,
        title: eventType === 'login' ? 'Entrou no servidor' : 'Saiu do servidor',
        description: eventType === 'login'
            ? `${username} entrou no FR32SURVIVAL.`
            : `${username} saiu do FR32SURVIVAL.`,
        icon: eventType === 'login' ? 'fa-solid fa-right-to-bracket' : 'fa-solid fa-right-from-bracket'
    };
    await insertRow('player_activity', data);
}

function normalizeEventType(value) {
    const text = String(value || '').toLowerCase();
    if (text === 'login' || text === 'logout') return text;
    return '';
}

function toIsoOrNull(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function safeInteger(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function cleanOptionalText(value) {
    const text = String(value || '').trim();
    return text ? text.slice(0, 80) : null;
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
        ...serviceHeaders({ Prefer: 'return=representation' }),
        body: JSON.stringify(row)
    });
    const body = await response.json().catch(() => ([]));
    if (!response.ok) throw new Error(body.message || `Unable to insert ${table}.`);
    return Array.isArray(body) ? body[0] : body;
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
