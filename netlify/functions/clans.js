const CLANS_ENDPOINT = process.env.CLANS_ENDPOINT || 'http://enx-cirion-92.enx.host:10026/clans';

// Reuses RANKS_TOKEN because FrSiteBridge protects ranks and clans with the same token.
exports.handler = async function handler() {
    const token = process.env.RANKS_TOKEN;

    if (!token) {
        return jsonResponse(500, { error: 'RANKS_TOKEN is not configured.' });
    }

    try {
        const response = await fetch(`${CLANS_ENDPOINT}?token=${encodeURIComponent(token)}`, {
            headers: { accept: 'application/json' }
        });

        const contentType = response.headers.get('content-type') || 'application/json';
        const body = await response.text();

        return {
            statusCode: response.status,
            headers: {
                'content-type': contentType,
                'cache-control': 'public, max-age=30'
            },
            body
        };
    } catch (error) {
        return jsonResponse(502, { error: 'Unable to fetch clans.' });
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
