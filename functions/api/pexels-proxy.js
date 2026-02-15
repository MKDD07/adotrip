/**
 * Cloudflare Pages Function: Pexels API Proxy
 * 
 * Proxies requests to the Pexels API, keeping the API key server-side.
 * Uses Cloudflare Cache API to cache responses for 6 hours.
 * Includes retry logic with exponential backoff for 429 rate limits.
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

    // Create a cache key based on the search params (normalized)
    const cacheKey = new Request(url.toString(), request);
    const cache = caches.default;

    // Check Cloudflare Cache API first
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
        // Return cached response with a header indicating cache hit
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-Cache', 'HIT');
        return new Response(cachedResponse.body, {
            status: cachedResponse.status,
            headers: headers,
        });
    }

    // Build the Pexels API URL
    const pexelsUrl = `https://api.pexels.com/v1/search?${searchParams.toString()}`;

    // Retry with exponential backoff for 429 errors
    const MAX_RETRIES = 3;
    let lastError = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            // Wait before retry (exponential backoff: 0, 1s, 3s)
            if (attempt > 0) {
                await new Promise(r => setTimeout(r, attempt * 1500));
            }

            const pexelsResponse = await fetch(pexelsUrl, {
                headers: {
                    'Authorization': apiKey,
                },
            });

            // If rate limited, retry
            if (pexelsResponse.status === 429 && attempt < MAX_RETRIES - 1) {
                lastError = '429 rate limited';
                continue;
            }

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

            const response = new Response(JSON.stringify(data), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    // Cache for 6 hours on CDN, 3 hours in browser
                    'Cache-Control': 'public, s-maxage=21600, max-age=10800',
                    // Serve stale content while revalidating (up to 7 days)
                    'CDN-Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=604800',
                    'X-Cache': 'MISS',
                },
            });

            // Store in Cloudflare Cache API for future requests
            context.waitUntil(cache.put(cacheKey, response.clone()));

            return response;
        } catch (error) {
            lastError = error.message;
        }
    }

    return new Response(JSON.stringify({
        error: 'Failed to fetch from Pexels API',
        details: lastError
    }), {
        status: 502,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}
