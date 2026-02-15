// Native fetch is available in Node.js 18+ (Netlify default)

exports.handler = async function (event, context) {
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        };
    }

    const { query, page = 1, per_page = 15, orientation } = event.queryStringParameters;

    if (!query) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Query parameter is required' }),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        };
    }

    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

    if (!PEXELS_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: API key missing' }),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        };
    }

    try {
        let url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}`;
        if (orientation) {
            url += `&orientation=${encodeURIComponent(orientation)}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': PEXELS_API_KEY
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                statusCode: response.status,
                body: JSON.stringify(data),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(data),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
                // Cache for 1 hour to reduce API calls
                'Cache-Control': 'public, max-age=3600'
            },
        };

    } catch (error) {
        console.error('Error fetching from Pexels:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch images' }),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        };
    }
};
