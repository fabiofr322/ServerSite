const CLANS_ENDPOINT = process.env.CLANS_ENDPOINT || 'http://enx-cirion-92.enx.host:10026/clans';

// Reuses RANKS_TOKEN because FrSiteBridge protects ranks and clans with the same token.
exports.handler = async function handler() {
    const token = process.env.RANKS_TOKEN;

    if (!token) {
        return jsonResponse(500, { error: 'RANKS_TOKEN is not configured.' });
    }

    try {
        const url = new URL(CLANS_ENDPOINT);
        url.searchParams.set('token', token);
        url.searchParams.set('_', Date.now().toString());

        const response = await fetch(url.toString(), {
            headers: { accept: 'application/json' }
        });

        const contentType = response.headers.get('content-type') || 'application/json';
        const body = await response.text();

        return {
            statusCode: response.status,
            headers: {
                'content-type': contentType,
                'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
                pragma: 'no-cache',
                expires: '0'
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
