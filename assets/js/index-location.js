(function () {
    'use strict';

    // Pexels API proxy URL (Cloudflare Pages Function handles auth + caching)
    const PEXELS_PROXY_URL = '/api/pexels-proxy';

    // Request queue to prevent bursting (200ms between requests)
    const requestQueue = [];
    let isProcessingQueue = false;

    async function enqueueRequest(url) {
        return new Promise((resolve, reject) => {
            requestQueue.push({ url, resolve, reject });
            if (!isProcessingQueue) {
                processQueue();
            }
        });
    }

    async function processQueue() {
        if (isProcessingQueue || requestQueue.length === 0) return;
        isProcessingQueue = true;

        while (requestQueue.length > 0) {
            const { url, resolve, reject } = requestQueue.shift();
            try {
                const response = await fetch(url);
                resolve(response);
            } catch (error) {
                reject(error);
            }
            // Wait 500ms between requests to avoid 429 rate limits
            if (requestQueue.length > 0) {
                await new Promise(r => setTimeout(r, 500));
            }
        }

        isProcessingQueue = false;
    }

    // Keywords to filter out unwanted images
    const UNWANTED_KEYWORDS = [
        'person', 'people', 'man', 'woman', 'face', 'portrait', 'selfie',
        'crowd', 'group', 'tourist', 'traveler', 'human', 'boy', 'girl',
        'child', 'baby', 'adult', 'model', 'hand', 'finger'
    ];

    // ============================================================================
    // DATA DEFINITIONS
    // ============================================================================

    // ... (rest of data definitions) ...


    // 50 Indian locations for random display
    const indianLocations = [
        { name: 'Agra', tours: 2547, search: 'taj mahal agra india' },
        { name: 'Jaipur', tours: 2184, search: 'jaipur pink city india' },
        { name: 'Varanasi', tours: 1956, search: 'varanasi ghat india' },
        { name: 'Goa', tours: 3247, search: 'goa beach india' },
        { name: 'Kerala', tours: 2468, search: 'kerala backwaters india' },
        { name: 'Ladakh', tours: 1892, search: 'ladakh mountains india' },
        { name: 'Udaipur', tours: 1745, search: 'udaipur lake palace india' },
        { name: 'Rishikesh', tours: 1634, search: 'rishikesh ganges india' },
        { name: 'Darjeeling', tours: 1523, search: 'darjeeling tea gardens india' },
        { name: 'Amritsar', tours: 1891, search: 'golden temple amritsar india' },
        { name: 'Munnar', tours: 1456, search: 'munnar tea plantations india' },
        { name: 'Hampi', tours: 1289, search: 'hampi ruins india' },
        { name: 'Khajuraho', tours: 1167, search: 'khajuraho temples india' },
        { name: 'Jodhpur', tours: 1834, search: 'jodhpur blue city india' },
        { name: 'Mysore', tours: 1678, search: 'mysore palace india' },
        { name: 'Shimla', tours: 1945, search: 'shimla hills india' },
        { name: 'Manali', tours: 2156, search: 'manali himalayas india' },
        { name: 'Ooty', tours: 1423, search: 'ooty nilgiri mountains india' },
        { name: 'Andaman', tours: 1789, search: 'andaman islands beach india' },
        { name: 'Lakshadweep', tours: 1234, search: 'lakshadweep islands india' },
        { name: 'Pushkar', tours: 1345, search: 'pushkar lake rajasthan india' },
        { name: 'Ranthambore', tours: 1567, search: 'ranthambore tiger india' },
        { name: 'Jim Corbett', tours: 1478, search: 'jim corbett national park india' },
        { name: 'Kaziranga', tours: 1289, search: 'kaziranga rhino assam india' },
        { name: 'Spiti Valley', tours: 1123, search: 'spiti valley himachal india' },
        { name: 'Coorg', tours: 1567, search: 'coorg coffee plantations india' },
        { name: 'Pondicherry', tours: 1689, search: 'pondicherry french colony india' },
        { name: 'Ajanta Ellora', tours: 1334, search: 'ajanta ellora caves india' },
        { name: 'Madhya Pradesh', tours: 1256, search: 'madhya pradesh temples india' },
        { name: 'Konark', tours: 1178, search: 'konark sun temple odisha india' },
        { name: 'Mahabalipuram', tours: 1289, search: 'mahabalipuram temples india' },
        { name: 'Kanyakumari', tours: 1456, search: 'kanyakumari sunset india' },
        { name: 'Rameshwaram', tours: 1367, search: 'rameshwaram temple india' },
        { name: 'Haridwar', tours: 1789, search: 'haridwar ganges aarti india' },
        { name: 'Mount Abu', tours: 1234, search: 'mount abu rajasthan india' },
        { name: 'Gangtok', tours: 1678, search: 'gangtok sikkim india' },
        { name: 'Shillong', tours: 1123, search: 'shillong meghalaya india' },
        { name: 'Tawang', tours: 1067, search: 'tawang monastery arunachal india' },
        { name: 'Khajjiar', tours: 1189, search: 'khajjiar mini switzerland india' },
        { name: 'Valley of Flowers', tours: 1345, search: 'valley of flowers uttarakhand india' },
        { name: 'Nainital', tours: 1567, search: 'nainital lake uttarakhand india' },
        { name: 'Mussoorie', tours: 1489, search: 'mussoorie hills india' },
        { name: 'Gulmarg', tours: 1734, search: 'gulmarg kashmir snow india' },
        { name: 'Pahalgam', tours: 1456, search: 'pahalgam kashmir india' },
        { name: 'Srinagar', tours: 1889, search: 'dal lake srinagar kashmir india' },
        { name: 'Mcleodganj', tours: 1278, search: 'mcleodganj dharamshala india' },
        { name: 'Kodaikanal', tours: 1456, search: 'kodaikanal lake tamil nadu india' },
        { name: 'Alleppey', tours: 1689, search: 'alleppey houseboat kerala india' },
        { name: 'Wayanad', tours: 1234, search: 'wayanad wildlife kerala india' },
        { name: 'Rann of Kutch', tours: 1567, search: 'rann of kutch gujarat india' }
    ];

    // Breathtaking world destinations
    const worldDestinations = [
        {
            id: 'main',
            title: 'Swiss Alps Adventure',
            subtitle: 'Breathtaking Destinations',
            description: 'We don\'t just offer trips — we deliver unforgettable, safe, and professionally guided mountain adventures across the world\'s most stunning landscapes.',
            buttonText: 'Explore Packages',
            search: 'swiss alps mountains snow',
            isBig: true
        },
        {
            id: 'dest1',
            title: 'Himalayan Peaks',
            icon: 'assets/images/why-choose/icon/03.svg',
            search: 'himalaya mountains nepal',
            isBig: false
        },
        {
            id: 'dest2',
            title: 'Northern Lights Iceland',
            icon: 'assets/images/why-choose/icon/04.svg',
            search: 'northern lights iceland aurora',
            isBig: false
        },
        {
            id: 'dest3',
            title: 'Patagonia Glaciers',
            icon: 'assets/images/why-choose/icon/05.svg',
            search: 'patagonia glacier argentina',
            isBig: false
        },
        {
            id: 'dest4',
            title: 'Norwegian Fjords',
            icon: 'assets/images/why-choose/icon/06.svg',
            search: 'norway fjords mountains',
            isBig: false
        }
    ];

    // Trip categories with multiple search terms
    const tripCategories = [
        {
            id: 'trip1',
            title: 'Beach Holiday',
            count: '01',
            searches: [
                'tropical beach sunset ocean',
                'beach paradise palm trees',
                'sandy beach clear water',
                'coastal beach scenery'
            ],
            link: 'tour.html'
        },
        {
            id: 'trip2',
            title: 'Adventure',
            count: '04',
            searches: [
                'mountain adventure landscape',
                'rock climbing mountain peak',
                'adventure sports nature',
                'extreme adventure outdoor'
            ],
            link: 'tour.html'
        },
        {
            id: 'trip3',
            title: 'Honeymoon',
            count: '05',
            searches: [
                'romantic sunset destination',
                'beautiful resort scenery',
                'luxury romantic location',
                'honeymoon paradise beach'
            ],
            link: 'tour.html'
        },
        {
            id: 'trip4',
            title: 'Trekking',
            count: '03',
            searches: [
                'mountain trail hiking path',
                'trekking route himalayas',
                'mountain landscape trail',
                'alpine hiking scenery'
            ],
            link: 'tour.html'
        },
        {
            id: 'trip5',
            title: 'Wildlife Safari',
            count: '02',
            searches: [
                'wild tiger jungle',
                'safari landscape wildlife',
                'african safari nature',
                'wildlife forest scenery'
            ],
            link: 'tour.html'
        },
        {
            id: 'trip6',
            title: 'Cultural Tour',
            count: '06',
            searches: [
                'ancient temple architecture',
                'historic monument building',
                'cultural heritage site',
                'traditional architecture palace'
            ],
            link: 'tour.html'
        },
        {
            id: 'trip7',
            title: 'Hill Station',
            count: '03',
            searches: [
                'mountain valley scenery',
                'hill station landscape',
                'mountain resort view',
                'alpine valley nature'
            ],
            link: 'tour.html'
        }
    ];

    // Popular international destinations
    const popularDestinations = [
        {
            id: 'dest1',
            city: 'Bali',
            country: 'Indonesia',
            packages: 12,
            search: 'bali rice terraces temple indonesia'
        },
        {
            id: 'dest2',
            city: 'Maldives',
            country: 'Asia',
            packages: 7,
            search: 'maldives resort beach ocean'
        },
        {
            id: 'dest3',
            city: 'Santorini',
            country: 'Greece',
            packages: 9,
            search: 'santorini greece blue dome'
        },
        {
            id: 'dest4',
            city: 'Paris',
            country: 'France',
            packages: 15,
            search: 'eiffel tower paris france'
        },
        {
            id: 'dest5',
            city: 'Dubai',
            country: 'UAE',
            packages: 11,
            search: 'dubai burj khalifa skyline'
        },
        {
            id: 'dest6',
            city: 'Tokyo',
            country: 'Japan',
            packages: 8,
            search: 'tokyo japan cherry blossom temple'
        },
        {
            id: 'dest7',
            city: 'London',
            country: 'UK',
            packages: 13,
            search: 'london big ben tower bridge'
        },
        {
            id: 'dest8',
            city: 'New York',
            country: 'USA',
            packages: 14,
            search: 'new york city skyline manhattan'
        },
        {
            id: 'dest9',
            city: 'Rome',
            country: 'Italy',
            packages: 10,
            search: 'colosseum rome italy ancient'
        },
        {
            id: 'dest10',
            city: 'Barcelona',
            country: 'Spain',
            packages: 6,
            search: 'sagrada familia barcelona spain'
        }
    ];
    // Activity destinations
    const activityDestinations = [
        {
            id: 'activity1',
            title: 'Phuket',
            count: 1147,
            search: 'phuket beach thailand island'
        },
        {
            id: 'activity2',
            title: 'Barcelona',
            count: 129,
            search: 'barcelona spain sagrada familia'
        },
        {
            id: 'activity3',
            title: 'Jungle Trekking',
            count: 85,
            search: 'jungle trekking trail forest'
        },
        {
            id: 'activity4',
            title: 'Hawaii (USA)',
            count: 47,
            search: 'hawaii beach volcano landscape'
        },
        {
            id: 'activity5',
            title: 'Mountain Hiking',
            count: 156,
            search: 'mountain hiking trail adventure'
        },
        {
            id: 'activity6',
            title: 'Scuba Diving',
            count: 92,
            search: 'coral reef underwater ocean'
        },
        {
            id: 'activity7',
            title: 'Desert Safari',
            count: 64,
            search: 'desert sand dunes safari'
        }
    ];
    // International tours

    const internationalTours = [
        {
            name: "Paris City Lights Experience",
            location: "Paris, France",
            search: "eiffel tower paris france"
        },
        {
            name: "Swiss Alps Scenic Adventure",
            location: "Interlaken, Switzerland",
            search: "swiss alps interlaken switzerland"
        },
        {
            name: "Santorini Sunset Escape",
            location: "Santorini, Greece",
            search: "santorini sunset greece"
        },
        {
            name: "Bali Tropical Island Retreat",
            location: "Bali, Indonesia",
            search: "bali beach indonesia"
        },
        {
            name: "New York City Explorer",
            location: "New York, USA",
            search: "new york skyline usa"
        },
        {
            name: "Dubai Desert & Skyline Tour",
            location: "Dubai, UAE",
            search: "dubai skyline desert safari uae"
        },
        {
            name: "Tokyo Cultural Discovery",
            location: "Tokyo, Japan",
            search: "tokyo city japan"
        },
        {
            name: "Cape Town Coastal Adventure",
            location: "Cape Town, South Africa",
            search: "cape town table mountain south africa"
        },
        {
            name: "Machu Picchu Heritage Trek",
            location: "Cusco, Peru",
            search: "machu picchu peru"
        },
        {
            name: "Sydney Harbour Experience",
            location: "Sydney, Australia",
            search: "sydney opera house australia"
        }
    ];



    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    /**
     * Shuffle array and return specified number of random items
     */
    function getRandomItems(arr, count) {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    /**
     * Get random search term from array
     */
    function getRandomSearch(searchArray) {
        const randomIndex = Math.floor(Math.random() * searchArray.length);
        return searchArray[randomIndex];
    }

    /**
     * Check if image description contains unwanted keywords
     */
    function hasUnwantedContent(description) {
        if (!description) return false;
        const lowerDesc = description.toLowerCase();
        return UNWANTED_KEYWORDS.some(keyword => lowerDesc.includes(keyword));
    }

    // Cache for image URLs to prevent re-fetching
    const imageCache = new Map();

    /**
     * Create Intersection Observer for lazy loading images
     */
    function createImageObserver(rootMargin = '100px') {
        return new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const searchQuery = img.getAttribute('data-search');

                    if (searchQuery) {
                        // Check cache first
                        if (imageCache.has(searchQuery)) {
                            const cachedUrl = imageCache.get(searchQuery);
                            if (img.src !== cachedUrl) {
                                img.src = cachedUrl;
                            }
                            img.setAttribute('data-loaded', 'true');
                            observer.unobserve(img);
                        } else if (img.getAttribute('data-loaded') === 'false') {
                            loadImageFromPexels(img, searchQuery);
                            observer.unobserve(img);
                        }
                    }
                }
            });
        }, { rootMargin });
    }

    /**
     * Load image from Pexels API with filtering
     */
    async function loadImageFromPexels(imgElement, searchQuery, options = {}) {
        const {
            perPage = 5,
            orientation = null,
            filterPeople = false,
            randomSelect = false,
            skipCache = false
        } = options;

        // If already cached, use it (unless skipCache is true)
        if (!skipCache && imageCache.has(searchQuery)) {
            imgElement.src = imageCache.get(searchQuery);
            imgElement.setAttribute('data-loaded', 'true');
            return;
        }

        try {
            let url = `${PEXELS_PROXY_URL}?query=${encodeURIComponent(searchQuery)}&per_page=${perPage}`;
            if (orientation) {
                url += `&orientation=${orientation}`;
            }

            console.log(`%c[PEXELS] 📡 Fetching: ${imgElement.alt}`, 'color: #2196F3', '\n  URL:', url);

            const response = await enqueueRequest(url);
            const contentType = response.headers.get('content-type') || '';

            console.log(`%c[PEXELS] 📥 Response for: ${imgElement.alt}`, response.ok ? 'color: #4CAF50' : 'color: #f44336',
                '\n  Status:', response.status,
                '\n  Content-Type:', contentType,
                '\n  URL:', response.url
            );

            // Check if response is valid JSON (not an HTML error page)
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            if (!contentType.includes('application/json')) {
                // Log first 200 chars of response to see what we got
                const textPreview = await response.text();
                console.error(`%c[PEXELS] ❌ Got HTML instead of JSON for: ${imgElement.alt}`, 'color: #f44336', '\n  Preview:', textPreview.substring(0, 200));
                throw new Error('Proxy returned HTML, not JSON');
            }

            const data = await response.json();
            console.log(`%c[PEXELS] ✅ Got ${data.photos ? data.photos.length : 0} photos for: ${imgElement.alt}`, 'color: #4CAF50');

            if (data.photos && data.photos.length > 0) {
                let photos = data.photos;

                // Filter out images with people if requested
                if (filterPeople) {
                    const filteredPhotos = photos.filter(photo => !hasUnwantedContent(photo.alt));
                    if (filteredPhotos.length > 0) {
                        photos = filteredPhotos;
                    }
                }

                // Select photo (random or first)
                const selectedIndex = randomSelect ? Math.floor(Math.random() * photos.length) : 0;
                const selectedPhoto = photos[selectedIndex];

                // Preload image
                const tempImg = new Image();
                tempImg.onload = function () {
                    const url = selectedPhoto.src.large;
                    imgElement.src = url;
                    imgElement.setAttribute('data-loaded', 'true');
                    imageCache.set(searchQuery, url);
                };
                tempImg.onerror = function () {
                    // Fallback to next photo or placeholder
                    let url;
                    if (photos.length > 1) {
                        const fallbackIndex = (selectedIndex + 1) % photos.length;
                        url = photos[fallbackIndex].src.large;
                    } else {
                        url = `https://via.placeholder.com/400x533?text=${encodeURIComponent(imgElement.alt)}`;
                    }
                    imgElement.src = url;
                    imgElement.setAttribute('data-loaded', 'true');
                    imageCache.set(searchQuery, url);
                };
                tempImg.src = selectedPhoto.src.large;
            } else {
                console.warn(`%c[PEXELS] ⚠️ No photos found for: ${imgElement.alt}`, 'color: #FF9800');
                const url = `https://via.placeholder.com/400x533?text=${encodeURIComponent(imgElement.alt)}`;
                imgElement.src = url;
                imgElement.setAttribute('data-loaded', 'true');
                imageCache.set(searchQuery, url);
            }
        } catch (error) {
            console.error(`%c[PEXELS] ❌ FAILED for: ${imgElement.alt}`, 'color: #f44336', '\n  Error:', error.message);
            const url = `https://via.placeholder.com/400x533?text=${encodeURIComponent(imgElement.alt)}`;
            imgElement.src = url;
            imgElement.setAttribute('data-loaded', 'true');
            imageCache.set(searchQuery, url);
        }
    }

    /**
     * Observer for Swiper slide duplication
     */
    function observeMutations(container, observer) {
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if the added node is an image or contains images
                        if (node.tagName === 'IMG' && node.hasAttribute('data-search')) {
                            observer.observe(node);
                        } else if (node.querySelectorAll) {
                            const images = node.querySelectorAll('img[data-search]');
                            images.forEach(img => observer.observe(img));
                        }
                    }
                });
            });
        });

        mutationObserver.observe(container, {
            childList: true,
            subtree: true
        });
        return mutationObserver;
    }

    // ============================================================================
    // MODULE 1: RANDOM INDIAN DESTINATIONS
    // ============================================================================

    function createIndianDestinationHTML(location, index) {
        const delay = (index + 1) * 0.2;
        const destinationId = `dest-${index}`;
        const imageId = `img-${index}`;

        return `
            <div class="col-lg-2 col-md-4 col-sm-6 col-6" id="${destinationId}">
                <div class="destination-wrapper-2 image-transform wow scaleIn" data-wow-delay="${delay}s">
                    <div class="image-area wow zoomIn">
                        <a href="search.html?city=${encodeURIComponent(location.name)}">
                            <img id="${imageId}"
                                class="hover-image"
                                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533'%3E%3Crect fill='%23e0e0e0' width='400' height='533'/%3E%3C/svg%3E"
                                alt="${location.name}"
                                data-search="${location.search}"
                                data-loaded="false"
                                loading="lazy">
                        </a>
                    </div>
                    <div class="content">
                        <h6 class="title"><a href="search.html?city=${encodeURIComponent(location.name)}">${location.name}</a></h6>
                        <p class="desc">${location.tours.toLocaleString()} Tours</p>
                    </div>
                </div>
            </div>
        `;
    }

    function initializeIndianDestinations() {
        const container = document.getElementById('destinations-container');
        if (!container) return;

        const randomLocations = getRandomItems(indianLocations, 6);
        const html = randomLocations.map((location, index) =>
            createIndianDestinationHTML(location, index)
        ).join('');

        container.innerHTML = html;

        const observer = createImageObserver('50px');
        const images = document.querySelectorAll('.hover-image[data-search]');
        images.forEach(img => {
            observer.observe(img);
            img.addEventListener('mouseenter', function () {
                const search = this.getAttribute('data-search');
                if (search && this.getAttribute('data-loaded') === 'false') {
                    loadImageFromPexels(this, search, { orientation: 'portrait' });
                }
            });
        });

        // Observe for Swiper duplicates
        observeMutations(container, observer);
    }

    // ============================================================================
    // MODULE 2: BREATHTAKING WORLD DESTINATIONS
    // ============================================================================

    function createBigDestinationHTML(dest) {
        return `
            <div class="col-lg-6">
                <div class="why-choose-wrapper big wow fadeInRight apple-shadow" data-wow-delay="0.2s" id="${dest.id}">
                    <div class="image-area" style="aspect-ratio: 1/1; width: 100%; height: 100%;">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect fill='%23e0e0e0' width='600' height='400'/%3E%3C/svg%3E" 
                             alt="${dest.title}"
                             data-search="${dest.search}"
                             data-loaded="false"
                             loading="lazy"
                             style="aspect-ratio: 1/1; width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="content">
                        <div class="section-title-area">
                            <p class="sub-title">${dest.subtitle}</p>
                            <h4 class="section-title">${dest.title}</h4>
                        </div>
                        <p class="desc">${dest.description}</p>
                        <a href="search.html?city=${dest.search}" class="rts-btn btn-secondary">${dest.buttonText}</a>
                    </div>
                </div>
            </div>
        `;
    }

    function createSmallDestinationHTML(dest, delay) {
        return `
            <div class="col-sm-6">
                <div class="why-choose-wrapper wow fadeInRight apple-shadow" data-wow-delay="${delay}s" id="${dest.id}">
                    <div class="image-area" style="aspect-ratio: 1/1; width: 100%; height: 100%;">
                        <a href="search.html?city=${dest.search}">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e0e0e0' width='400' height='300'/%3E%3C/svg%3E" 
                                 alt="${dest.title}"
                                 data-search="${dest.search}"
                                 data-loaded="false"
                                 loading="lazy"
                                 style="aspect-ratio: 1/1; width: 100%; height: 100%; object-fit: cover;">
                        </a>
                    </div>
                    <div class="content">
                        <div class="icon"><img src="${dest.icon}" alt=""></div>
                        <h5 class="title">${dest.title}</h5>
                    </div>
                </div>
            </div>
        `;
    }

    function initializeBreathtakingDestinations() {
        const container = document.getElementById('breathtaking-destinations');
        if (!container) return;

        let html = createBigDestinationHTML(worldDestinations[0]);
        html += '<div class="col-lg-6"><div class="row g-5">';

        const smallDestinations = worldDestinations.slice(1);
        smallDestinations.forEach((dest, index) => {
            const delay = 0.6 + (index * 0.2);
            html += createSmallDestinationHTML(dest, delay);
        });

        html += '</div></div>';
        container.innerHTML = html;

        const observer = createImageObserver('50px');
        const images = container.querySelectorAll('img[data-search]');
        images.forEach(img => observer.observe(img));

        // Observe for Swiper duplicates
        observeMutations(container, observer);
    }

    // ============================================================================
    // MODULE 3: TRIP CATEGORIES SLIDER
    // ============================================================================

    function createTripSlideHTML(trip, randomSearch) {
        return `
            <div class="swiper-slide">
                <div class="trip-wrapper radius-10 image-transform" id="${trip.id}">
                    <a href="search.html?city=${trip.title}">
                        <div class="image-area">
                            <img class="hover-image" 
                                 src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%23e0e0e0' width='400' height='400'/%3E%3C/svg%3E" 
                                 alt="${trip.title}"
                                 data-search="${randomSearch}"
                                 data-loaded="false"
                                 loading="lazy">
                        </div>
                        <div class="content">
                            <h5 class="title">${trip.title} (${trip.count})</h5>
                        </div>
                    </a>
                </div>
            </div>
        `;
    }

    function initializeTripSlider() {
        const container = document.getElementById('trip-slider-container');
        if (!container) return;

        const swiperWrapper = container.querySelector('.swiper-wrapper');
        if (!swiperWrapper) return;

        const html = tripCategories.map(trip => {
            const randomSearch = getRandomSearch(trip.searches);
            return createTripSlideHTML(trip, randomSearch);
        }).join('');

        swiperWrapper.innerHTML = html;

        const observer = createImageObserver('100px');
        const images = container.querySelectorAll('img[data-search]');
        images.forEach(img => {
            observer.observe(img);
            // Override loadImageFromPexels call with filtering options
            const originalSearch = img.getAttribute('data-search');
            img.addEventListener('load', function () {
                if (this.getAttribute('data-loaded') === 'false') {
                    loadImageFromPexels(this, originalSearch, {
                        perPage: 10,
                        filterPeople: true,
                        randomSelect: true
                    });
                }
            });
        });

        // Observe for Swiper duplicates
        observeMutations(container, observer);
    }

    // ============================================================================
    // MODULE 4: POPULAR DESTINATIONS SLIDER
    // ============================================================================

    function createPopularDestinationSlideHTML(destination) {
        return `
            <div class="swiper-slide">
                <div class="destination-wrapper radius-10 image-transform" id="${destination.id}">
                    <div class="image-area">
                        <a href="search.html?city=${encodeURIComponent(destination.city)}">
                            <img class="hover-image" 
                                 src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533'%3E%3Crect fill='%23e0e0e0' width='400' height='533'/%3E%3C/svg%3E" 
                                 alt="${destination.city}, ${destination.country}"
                                 data-search="${destination.search}"
                                 data-loaded="false"
                                 loading="lazy">
                        </a>
                    </div>
                    <div class="content">
                        <h5 class="title"><a href="search.html?city=${encodeURIComponent(destination.city)}">${destination.city}, ${destination.country}</a></h5>
                        <p class="tag"><img src="assets/images/destination/icon/01.svg" alt=""> ${destination.packages} Packages Available</p>
                    </div>
                </div>
            </div>
        `;
    }

    function initializePopularDestinations() {
        const container = document.getElementById('destination-slider-container');
        if (!container) return;

        const swiperWrapper = container.querySelector('.swiper-wrapper');
        if (!swiperWrapper) return;

        const html = popularDestinations.map(destination =>
            createPopularDestinationSlideHTML(destination)
        ).join('');

        swiperWrapper.innerHTML = html;

        const observer = createImageObserver('100px');
        const images = container.querySelectorAll('img[data-search]');
        images.forEach(img => {
            observer.observe(img);
            const originalSearch = img.getAttribute('data-search');
            img.addEventListener('mouseenter', function () {
                if (this.getAttribute('data-loaded') === 'false') {
                    loadImageFromPexels(this, originalSearch, {
                        perPage: 5,
                        orientation: 'portrait',
                        filterPeople: true
                    });
                }
            });
        });

        // Observe for Swiper duplicates
        observeMutations(container, observer);
    }
    // ============================================================================
    // MODULE 5: ACTIVITY DESTINATIONS SLIDER
    // ============================================================================

    function createActivityDestinationSlideHTML(activity) {
        return `
            <div class="swiper-slide">
                <div class="destination-wrapper radius-10 image-transform" id="${activity.id}">
                    <div class="image-area">
                        <a href="search.html?city=${encodeURIComponent(activity.title)}">
                            <img class="hover-image" 
                                 src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533'%3E%3Crect fill='%23e0e0e0' width='400' height='533'/%3E%3C/svg%3E" 
                                 alt="${activity.title}"
                                 data-search="${activity.search}"
                                 data-loaded="false"
                                 loading="lazy">
                        </a>
                    </div>
                    <div class="content">
                        <h5 class="title"><a href="search.html?city=${encodeURIComponent(activity.title)}">${activity.title}</a></h5>
                    </div>
                </div>
            </div>
        `;
    }

    function initializeActivityDestinations() {
        const container = document.getElementById('activity-slider-container');
        if (!container) return;

        const swiperWrapper = container.querySelector('.swiper-wrapper');
        if (!swiperWrapper) return;

        const html = activityDestinations.map(activity =>
            createActivityDestinationSlideHTML(activity)
        ).join('');

        swiperWrapper.innerHTML = html;

        const observer = createImageObserver('100px');
        const images = container.querySelectorAll('img[data-search]');
        images.forEach(img => {
            observer.observe(img);
            const originalSearch = img.getAttribute('data-search');
            img.addEventListener('mouseenter', function () {
                if (this.getAttribute('data-loaded') === 'false') {
                    loadImageFromPexels(this, originalSearch, {
                        perPage: 5,
                        orientation: 'portrait',
                        filterPeople: true,
                        randomSelect: true
                    });
                }
            });
        });

        // Observe for Swiper duplicates
        observeMutations(container, observer);
    }
    // ============================================================================
    // MODULE 5: INTERNATIONAL TOURS SLIDER
    // ============================================================================

    function createInternationalTourSlideHTML(tour) {
        return `
            <div class="swiper-slide">
                <div class="tour-pack radius-10 image-transform">
                    <div class="image-area image-transform">
                        <a href="search.html?city=${encodeURIComponent(tour.name)}">
                            <img class="hover-image" 
                                 src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='533'%3E%3Crect fill='%23e0e0e0' width='400' height='533'/%3E%3C/svg%3E" 
                                 alt="${tour.name}"
                                 data-search="${tour.search}"
                                 data-loaded="false"
                                 loading="lazy">
                        </a>
                    </div>
                    <div class="content">
                        <h5 class="title"><a href="search.html?city=${encodeURIComponent(tour.name)}">${tour.name}</a></h5>
                        <h6 class="location white">${tour.location}</h6>
                        <div class="tour-bottom-area">
                            <a href="search.html?city=${encodeURIComponent(tour.name)}"
                                class="rts-btn btn-primary-3 btn-border-2">View</a>
                        </div>
                    </div> 
                </div>
            </div>
        `;
    }

    function initializeInternationalTours() {
        const container = document.getElementById('international-tours-slider-container');
        if (!container) return;

        let swiperWrapper = container.querySelector('.swiper-wrapper');
        if (!swiperWrapper) {
            swiperWrapper = document.createElement('div');
            swiperWrapper.className = 'swiper-wrapper';
            container.appendChild(swiperWrapper);
        }

        const html = internationalTours.map(tour =>
            createInternationalTourSlideHTML(tour)
        ).join('');

        swiperWrapper.innerHTML = html;

        const observer = createImageObserver('100px');
        const images = container.querySelectorAll('img[data-search]');
        images.forEach(img => {
            observer.observe(img);
            const originalSearch = img.getAttribute('data-search');
            img.addEventListener('mouseenter', function () {
                if (this.getAttribute('data-loaded') === 'false') {
                    loadImageFromPexels(this, originalSearch, {
                        perPage: 5,
                        orientation: 'portrait',
                        filterPeople: true,
                        randomSelect: true
                    });
                }
            });
        });

        // Observe for Swiper duplicates
        observeMutations(container, observer);
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function initializeAll() {
        initializeIndianDestinations();
        initializeBreathtakingDestinations();
        initializeTripSlider();
        initializePopularDestinations();
        initializeActivityDestinations();
        initializeInternationalTours();
    }

    // Initialize when DOM is ready (delay to avoid competing with other API calls)
    function startWithDelay() {
        setTimeout(initializeAll, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startWithDelay);
    } else {
        startWithDelay();
    }

})();
// ============================================================================
// Random Hero Image
// ============================================================================
function initializeRandomHeroImage() {
    const container = document.getElementById('container-image');
    if (!container) return;

    // Ensure container has position relative for absolute children
    if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }

    // Capture and preserve existing overlay content
    let overlayContent = container.innerHTML.trim();

    const keywords = [
        'travel', 'nature', 'mountains', 'landmark', 'ocean',
        'cityscape', 'forest', 'adventure', 'beach', 'hiking',
        'camping', 'road trip', 'vacation', 'exploration'
    ];

    let nextImageUrl = null;
    let isFetching = false;

    // Fetch image from Pexels API via proxy
    async function fetchPexelsImage() {
        if (isFetching) return null;
        isFetching = true;

        try {
            const keyword = keywords[Math.floor(Math.random() * keywords.length)];
            const randomPage = Math.floor(Math.random() * 10) + 1;
            const heroUrl = `/api/pexels-proxy?query=${keyword}&orientation=landscape&per_page=20&page=${randomPage}`;
            console.log(`%c[HERO-v1] 📡 Fetching`, 'color: #9C27B0', '\n  Keyword:', keyword, '\n  URL:', heroUrl);

            const response = await fetch(heroUrl);
            const ct = response.headers.get('content-type') || '';
            console.log(`%c[HERO-v1] 📥 Response`, response.ok ? 'color: #4CAF50' : 'color: #f44336',
                '\n  Status:', response.status, '\n  Content-Type:', ct);

            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            if (!ct.includes('application/json')) {
                throw new Error('Proxy returned HTML, not JSON');
            }

            const data = await response.json();
            console.log(`%c[HERO-v1] ✅ Got ${data.photos ? data.photos.length : 0} photos`, 'color: #4CAF50');

            if (data.photos && data.photos.length > 0) {
                const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
                const imageUrl = randomPhoto.src.large;

                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(imageUrl);
                    img.onerror = () => reject(new Error('Image failed to load'));
                    img.src = imageUrl;
                });
            }

            return null;
        } catch (error) {
            console.error(`%c[HERO-v1] ❌ FAILED`, 'color: #f44336', error.message);
            return null;
        } finally {
            isFetching = false;
        }
    }

    // Preload next image in background
    async function preloadNextImage() {
        nextImageUrl = await fetchPexelsImage();
    }

    // Display image with fade transition
    function displayImage(imageUrl) {
        const currentImg = container.querySelector('.main-img');

        if (currentImg) {
            // Fade out current image
            currentImg.style.opacity = '0';

            setTimeout(() => {
                setNewImage(imageUrl);
            }, 500);
        } else {
            // No current image, display immediately
            setNewImage(imageUrl);
        }
    }

    function setNewImage(imageUrl) {
        // Image as background layer - NO absolute positioning, let it flow normally
        const imgHTML = `<img src="${imageUrl}" alt="Travel Destination" class="main-img" style="aspect-ratio: 1/1; object-fit: cover; width: 100%; height: auto; display: block; opacity: 0; transition: opacity 0.5s ease-in-out; border-radius: inherit;">`;

        // Insert image first, then overlay content
        container.innerHTML = imgHTML + overlayContent;

        // Fade in new image
        requestAnimationFrame(() => {
            setTimeout(() => {
                const newImg = container.querySelector('.main-img');
                if (newImg) {
                    newImg.style.opacity = '1';
                }
            }, 50);
        });
    }

    // Update image (use preloaded or fetch new)
    async function updateImage() {
        let imageUrl = nextImageUrl;

        // If no preloaded image, fetch one now
        if (!imageUrl) {
            imageUrl = await fetchPexelsImage();
        }

        if (imageUrl) {
            nextImageUrl = null; // Clear used preload
            displayImage(imageUrl);
            preloadNextImage(); // Start preloading next image
        }
    }

    // Initialize - wait a moment to ensure WOW.js animation has started
    setTimeout(() => {
        updateImage();
    }, 100);

    // Rotate every 10 seconds
    setInterval(updateImage, 10000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRandomHeroImage);
} else {
    initializeRandomHeroImage();
}
function initializeRandomHeroImagev2() {
    const container = document.getElementById('travel-based-flight');
    if (!container) return;

    const keywords = [
        'travel destination',
        'tourism',
        'holiday travel',
        'travel photography',
        'travel adventure',
        'backpacking',
        'road trip travel',
        'luxury travel',
        'travel culture',
        'travel experience',
        'travel lifestyle',
        'international travel',
        'travel vlog',
        'travel journey'
    ];


    let nextImageUrl1 = null;
    let nextImageUrl2 = null;
    let isFetching = false;

    // Fetch image from Pexels API via proxy
    async function fetchPexelsImage() {
        try {
            const keyword = keywords[Math.floor(Math.random() * keywords.length)];
            const randomPage = Math.floor(Math.random() * 10) + 1;
            const heroUrl2 = `/api/pexels-proxy?query=${keyword}&orientation=landscape&per_page=20&page=${randomPage}`;
            console.log(`%c[HERO-v2] 📡 Fetching`, 'color: #E91E63', '\n  Keyword:', keyword, '\n  URL:', heroUrl2);

            const response = await fetch(heroUrl2);
            const ct = response.headers.get('content-type') || '';
            console.log(`%c[HERO-v2] 📥 Response`, response.ok ? 'color: #4CAF50' : 'color: #f44336',
                '\n  Status:', response.status, '\n  Content-Type:', ct);

            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            if (!ct.includes('application/json')) {
                throw new Error('Proxy returned HTML, not JSON');
            }

            const data = await response.json();
            console.log(`%c[HERO-v2] ✅ Got ${data.photos ? data.photos.length : 0} photos`, 'color: #4CAF50');

            if (data.photos && data.photos.length > 0) {
                const randomPhoto = data.photos[Math.floor(Math.random() * data.photos.length)];
                const imageUrl = randomPhoto.src.large;

                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(imageUrl);
                    img.onerror = () => reject(new Error('Image failed to load'));
                    img.src = imageUrl;
                });
            }

            return null;
        } catch (error) {
            console.error(`%c[HERO-v2] ❌ FAILED`, 'color: #f44336', error.message);
            return null;
        }
    }

    // Preload next images in background
    async function preloadNextImages() {
        if (isFetching) return;
        isFetching = true;

        try {
            const [url1, url2] = await Promise.all([
                fetchPexelsImage(),
                fetchPexelsImage()
            ]);

            nextImageUrl1 = url1;
            nextImageUrl2 = url2;
        } catch (error) {
            console.error('Error preloading images:', error);
        } finally {
            isFetching = false;
        }
    }

    // Display images with fade transition
    function displayImages(imageUrl1, imageUrl2) {
        const currentContent = container.querySelector('.img');

        if (currentContent) {
            // Fade out current images
            currentContent.style.transition = 'opacity 0.5s ease-in-out';
            currentContent.style.opacity = '0';

            setTimeout(() => {
                setNewImages(imageUrl1, imageUrl2);
            }, 500);
        } else {
            setNewImages(imageUrl1, imageUrl2);
        }
    }

    function setNewImages(imageUrl1, imageUrl2) {
        // Create exact HTML structure you provided
        const newHTML = `
            <div class="img" style="opacity: 0; transition: opacity 0.5s ease-in-out;">
                <div class="floating-img overflow-hidden wow zoomIn" data-wow-delay="0.4s">
                    <img class="wow scaleIn" data-wow-delay="0.4s" src="${imageUrl1}" width="406" alt="">
                </div>
                <div class="rotate-img wow rotateImg2" data-wow-delay="0.2s">
                    <img src="${imageUrl2}" width="255" alt="">
                </div>
            </div>
        `;

        container.innerHTML = newHTML;

        // Fade in new images
        requestAnimationFrame(() => {
            setTimeout(() => {
                const imgContainer = container.querySelector('.img');
                if (imgContainer) {
                    imgContainer.style.opacity = '1';
                }
            }, 50);
        });
    }

    // Update images (use preloaded or fetch new)
    async function updateImages() {
        let imageUrl1 = nextImageUrl1;
        let imageUrl2 = nextImageUrl2;

        // If no preloaded images, fetch them now
        if (!imageUrl1 || !imageUrl2) {
            [imageUrl1, imageUrl2] = await Promise.all([
                fetchPexelsImage(),
                fetchPexelsImage()
            ]);
        }

        if (imageUrl1 && imageUrl2) {
            nextImageUrl1 = null;
            nextImageUrl2 = null;
            displayImages(imageUrl1, imageUrl2);
            preloadNextImages(); // Start preloading next images
        }
    }

    // Initialize
    setTimeout(() => {
        updateImages();
    }, 500); // Wait for WOW.js animations

    // Rotate every 10 seconds
    setInterval(updateImages, 10000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRandomHeroImagev2);
} else {
    initializeRandomHeroImagev2();
}
