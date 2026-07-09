const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dzfmtmlgbyxnqjdwutfp.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6Zm10bWxnYnl4bnFqZHd1dGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODE1MjcsImV4cCI6MjA5NzU1NzUyN30.8W_0L9OzmLSDH1ZMRtFFlc3Pyf54ENgVNV535TW1T7U';

exports.handler = async function handler(event) {
    const q = String(event.queryStringParameters?.q || '').trim();

    if (!/^[A-Za-z0-9_]{2,16}$/.test(q)) {
        return jsonResponse(200, { players: [] });
    }

    try {
        const params = new URLSearchParams({
            select: 'id,minecraft_username,minecraft_uuid,is_verified,is_online',
            minecraft_username: `ilike.${q}%`,
            order: 'minecraft_username.asc',
            limit: '6'
        });

        const response = await fetch(`${SUPABASE_URL}/rest/v1/player_profiles?${params}`, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                accept: 'application/json'
            }
        });

        const body = await response.json();
        if (!response.ok) {
            return jsonResponse(response.status, { error: body.message || 'Unable to search players.' });
        }

        return jsonResponse(200, { players: body });
    } catch (error) {
        return jsonResponse(502, { error: 'Unable to search players.' });
    }
};

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
