
/**
 * Cloudflare Pages Function: Pexels API Proxy
 * 
 * Proxies requests to the Pexels API, keeping the API key server-side.
 * Adds caching headers so Cloudflare CDN caches responses for 1 hour.
 * 
 * Environment variable required: PEXELS_API_KEY
 * Set in Cloudflare Pages Dashboard → Settings → Environment Variables
 */

export async function onRequest(context) {
    const { request, env } = context;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const apiKey = env.PEXELS_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Get the search parameters from the incoming request
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Build the Pexels API URL
    const pexelsUrl = `https://api.pexels.com/v1/search?${searchParams.toString()}`;

    try {
        const pexelsResponse = await fetch(pexelsUrl, {
            headers: {
                'Authorization': apiKey,
            },
        });

        if (!pexelsResponse.ok) {
            const errorText = await pexelsResponse.text();
            return new Response(JSON.stringify({
                error: `Pexels API error: ${pexelsResponse.status}`,
                details: errorText
            }), {
                status: pexelsResponse.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }

        const data = await pexelsResponse.json();

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                // Cache for 1 hour on CDN, 30 min in browser
                'Cache-Control': 'public, s-maxage=3600, max-age=1800',
                // Serve stale content while revalidating (up to 24h)
                'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch from Pexels API' }), {
            status: 502,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
}
