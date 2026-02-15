// Pexels API proxy URL (Cloudflare Pages Function handles auth + caching)
const PEXELS_PROXY_URL = '/api/pexels-proxy';

// Function to get city from URL parameters
function getCityFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city');

    if (city) {
        // Extract only the city name, remove "hotels", "5 star", etc.
        const cleanCity = city
            .replace(/\+/g, ' ')
            .replace(/hotels?/gi, '')
            .replace(/\d+\s*star/gi, '')
            .replace(/resort/gi, '')
            .trim();

        return cleanCity;
    }

    // Fallback: check breadcrumb
    const lastCrumb = document.querySelector('.nav-bread-crumb .current:last-of-type');
    return lastCrumb ? lastCrumb.textContent.trim() : 'travel destination';
}

// Function to create optimized search query
function createSearchQuery(city) {
    const cityLower = city.toLowerCase();

    // City-specific enhancements
    const cityEnhancements = {
        'delhi': 'Delhi India Gate Red Fort landmark architecture',
        'mumbai': 'Mumbai Gateway India cityscape skyline',
        'bangalore': 'Bangalore India tech city urban',
        'jaipur': 'Jaipur Pink City Hawa Mahal palace',
        'goa': 'Goa beach paradise palm trees sunset',
        'kerala': 'Kerala backwaters houseboat tropical',
        'agra': 'Agra Taj Mahal monument India',
        'udaipur': 'Udaipur Lake Palace Rajasthan',
        'varanasi': 'Varanasi Ganges ghats spiritual',
        'paris': 'Paris Eiffel Tower cityscape France',
        'london': 'London Big Ben Thames cityscape',
        'new york': 'New York City Manhattan skyline',
        'tokyo': 'Tokyo Japan skyline urban modern',
        'dubai': 'Dubai Burj Khalifa skyline luxury',
        'bali': 'Bali Indonesia temple beach tropical',
        'maldives': 'Maldives beach paradise crystal water',
        'switzerland': 'Switzerland Alps mountain lake scenic',
        'santorini': 'Santorini Greece white buildings sunset'
    };

    // Check if we have a specific enhancement
    for (const [key, value] of Object.entries(cityEnhancements)) {
        if (cityLower.includes(key)) {
            return value;
        }
    }

    // Default: city + travel keywords
    return `${city} travel destination landmark cityscape`;
}

// Function to fetch and apply Pexels image
async function loadPexelsImage() {
    const breadcrumbArea = document.querySelector('.rts-breadcrumb-area');

    if (!breadcrumbArea) {
        console.error('Breadcrumb area not found');
        return;
    }

    const city = getCityFromURL();
    const searchQuery = createSearchQuery(city);

    console.log(`Searching Pexels for: "${searchQuery}"`);

    try {
        const response = await fetch(
            `${PEXELS_PROXY_URL}?query=${encodeURIComponent(searchQuery)}&per_page=20&orientation=landscape&size=large`
        );

        if (!response.ok) {
            throw new Error(`Pexels API error: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('Proxy not available (running locally?)');
        }

        const data = await response.json();

        if (data.photos && data.photos.length > 0) {
            // Select a high-quality photo (prefer first few results as they're most relevant)
            const photoIndex = Math.floor(Math.random() * Math.min(data.photos.length, 5));
            const photo = data.photos[photoIndex];

            // Use highest quality available
            const imageUrl = photo.src.original || photo.src.large2x || photo.src.large;

            console.log(`Loading image: ${imageUrl}`);

            // Preload image for smooth transition
            const img = new Image();
            img.onload = () => {
                breadcrumbArea.style.backgroundImage = `url('${imageUrl}')`;
                breadcrumbArea.style.backgroundSize = 'cover';
                breadcrumbArea.style.backgroundPosition = 'center';
                breadcrumbArea.style.backgroundRepeat = 'no-repeat';

                // Add photographer credit
                addPhotoCredit(photo.photographer, photo.photographer_url, photo.url);

                console.log('Image loaded successfully');
            };

            img.onerror = () => {
                console.error('Failed to load image');
                useFallbackImage(breadcrumbArea);
            };

            img.src = imageUrl;

        } else {
            console.warn('No images found for this location');
            useFallbackImage(breadcrumbArea);
        }

    } catch (error) {
        console.error('Error loading Pexels image:', error);
        useFallbackImage(breadcrumbArea);
    }
}

// Fallback to default image
function useFallbackImage(breadcrumbArea) {
    const defaultImage = breadcrumbArea.getAttribute('data-bg-src') || 'assets/images/breadcrumb/04.webp';
    breadcrumbArea.style.backgroundImage = `url('${defaultImage}')`;
    breadcrumbArea.style.backgroundSize = 'cover';
    breadcrumbArea.style.backgroundPosition = 'center';
}

// Add photographer credit
function addPhotoCredit(photographer, photographerUrl, photoUrl) {
    const breadcrumbArea = document.querySelector('.rts-breadcrumb-area');
    if (!breadcrumbArea) return;

    const credit = document.createElement('div');
    credit.className = 'photo-credit';
    credit.innerHTML = `Photo by <a href="${photographerUrl}" target="_blank" rel="noopener">${photographer}</a> on <a href="${photoUrl}" target="_blank" rel="noopener">Pexels</a>`;

    credit.style.cssText = `
        position: absolute;
        bottom: 10px;
        right: 10px;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.85);
        background: rgba(0, 0, 0, 0.6);
        padding: 5px 10px;
        border-radius: 4px;
        z-index: 10;
        backdrop-filter: blur(4px);
    `;

    // Style links
    const links = credit.querySelectorAll('a');
    links.forEach(link => {
        link.style.cssText = 'color: rgba(255, 255, 255, 0.95); text-decoration: none; transition: color 0.3s;';
        link.addEventListener('mouseenter', () => link.style.color = '#fff');
        link.addEventListener('mouseleave', () => link.style.color = 'rgba(255, 255, 255, 0.95)');
    });

    breadcrumbArea.style.position = 'relative';
    breadcrumbArea.appendChild(credit);
}

// Update breadcrumb text with city name
function updateBreadcrumbText() {
    const city = getCityFromURL();
    const lastCrumb = document.querySelector('.nav-bread-crumb .current:last-of-type');

    if (lastCrumb && city) {
        // Capitalize city name properly
        const capitalizedCity = city
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        lastCrumb.textContent = capitalizedCity;
    }
}

// Initialize when DOM is ready
function init() {
    updateBreadcrumbText();
    loadPexelsImage();
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
