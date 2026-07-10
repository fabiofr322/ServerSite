const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dzfmtmlgbyxnqjdwutfp.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Zm10bWxnYnl4bnFqZHd1dGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODE1MjcsImV4cCI6MjA5NzU1NzUyN30.8W_0L9OzmLSDH1ZMRtFFlc3Pyf54ENgVNV535TW1T7U';

exports.handler = async function handler(event) {
    const nick = String(event.queryStringParameters?.nick || '').trim();

    if (!/^[A-Za-z0-9_\.]{3,17}$/.test(nick)) {
        return jsonResponse(400, { error: 'Invalid player nickname.' });
    }

    try {
        const profile = await fetchSingle('player_profiles', {
            select: '*',
            minecraft_username: `ilike.${nick}`,
            limit: '1'
        });

        if (!profile) {
            return jsonResponse(404, { error: 'Player not found.' });
        }

        const [stats, activity] = await Promise.all([
            fetchSingle('player_stats', {
                select: '*',
                player_id: `eq.${profile.id}`,
                limit: '1'
            }),
            fetchRows('player_activity', {
                select: '*',
                player_id: `eq.${profile.id}`,
                order: 'created_at.desc',
                limit: '8'
            })
        ]);

        return jsonResponse(200, {
            profile,
            stats: stats || {},
            activity: activity || []
        });
    } catch (error) {
        return jsonResponse(502, { error: 'Unable to fetch player profile.' });
    }
};

async function fetchSingle(table, params) {
    const rows = await fetchRows(table, params);
    return rows[0] || null;
}

async function fetchRows(table, params) {
    const search = new URLSearchParams(params);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${search}`, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            accept: 'application/json'
        }
    });

    const body = await response.json();
    if (!response.ok) {
        throw new Error(body.message || `Unable to fetch ${table}.`);
    }

    return Array.isArray(body) ? body : [];
}

function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'content-type': 'application/json',
            'cache-control': statusCode === 200 ? 'public, max-age=30' : 'no-store'
        },
        body: JSON.stringify(body)
    };
}
