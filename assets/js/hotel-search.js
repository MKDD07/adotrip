/**
 * Hotel Search Module using SerpAPI
 * Include this file on any page that needs hotel search functionality
 */

const HotelSearch = {
    // Configuration
    API_KEY: '7f83c49c4ab7a773e871e42237fd4775f124a8abb77e148899d0bbad6d307d69',
    PROXY: 'https://corsproxy.io/?',

    // State
    allHotels: [],
    savedHotels: [],

    // Pagination State
    currentHotels: [],
    currentPage: 1,
    itemsPerPage: 20,
    loadingMore: false,
    scrollListenerAttached: false,
    containerId: null,
    currentParams: null,

    /**
     * Initialize the hotel search module
     */
    init() {
        this.loadSavedHotels();
        this.setupEventListeners();
    },

    /**
     * Load saved hotels from localStorage
     */
    loadSavedHotels() {
        this.savedHotels = JSON.parse(localStorage.getItem('savedHotels') || '[]');
    },

    /**
     * Get URL parameters
     */
    getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            city: urlParams.get('city') || 'New Delhi',
            checkIn: urlParams.get('checkIn') || this.getDefaultCheckIn(),
            checkOut: urlParams.get('checkOut') || this.getDefaultCheckOut(),
            guests: urlParams.get('guests') || '2'
        };
    },

    /**
     * Get default check-in date (tomorrow)
     */
    getDefaultCheckIn() {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0];
    },

    /**
     * Get default check-out date (day after tomorrow)
     */
    getDefaultCheckOut() {
        const date = new Date();
        date.setDate(date.getDate() + 2);
        return date.toISOString().split('T')[0];
    },

    /**
     * Search hotels using SerpAPI
     * @param {Object} params - Search parameters {city, checkIn, checkOut}
     * @returns {Promise<Array>} Array of hotel objects
     */
    async searchHotels(params) {
        try {
            const searchParams = new URLSearchParams({
                engine: "google_hotels",
                q: `hotels in ${params.city}`,
                check_in_date: params.checkIn,
                check_out_date: params.checkOut,
                currency: "INR",
                gl: "in",
                api_key: this.API_KEY
            });

            const url = `https://serpapi.com/search.json?${searchParams}`;
            const response = await fetch(this.PROXY + encodeURIComponent(url));
            const data = await response.json();

            if (data.properties && data.properties.length > 0) {
                // Clean and enhance hotel data
                this.allHotels = data.properties.map(hotel => {
                    // Clean image URLs - remove size parameters for full-size images
                    if (hotel.images && hotel.images.length > 0) {
                        hotel.images = hotel.images.map(img => {
                            if (img.thumbnail) {
                                // Remove Google image size parameters (=s287-w287-h192-n-k-no-v1, etc.)
                                img.thumbnail = img.thumbnail.replace(/=s\d+-w\d+-h\d+-n-k-no-v\d+/g, '=s0');
                                img.thumbnail = img.thumbnail.replace(/=w\d+-h\d+/g, '=s0');
                            }
                            if (img.original_image) {
                                img.original_image = img.original_image.replace(/=s\d+-w\d+-h\d+-n-k-no-v\d+/g, '=s0');
                                img.original_image = img.original_image.replace(/=w\d+-h\d+/g, '=s0');
                            }
                            return img;
                        });
                    }

                    // Extract amenities properly
                    if (!hotel.amenities && hotel.extracted_amenities) {
                        hotel.amenities = hotel.extracted_amenities;
                    }

                    return hotel;
                });

                // Save to localStorage for use on detail pages
                localStorage.setItem('searchResults', JSON.stringify(this.allHotels));
                console.log('Saved', this.allHotels.length, 'hotels to localStorage');

                return this.allHotels;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching hotels:', error);
            throw error;
        }
    },

    /**
     * Generate HTML for a single hotel card
     */
    generateHotelCard(hotel, params) {
        const isSaved = this.savedHotels.some(h => h.name === hotel.name);

        // Robust price extraction
        let price = 0;

        // Try different price fields in order of preference
        const priceFields = [
            hotel.rate_per_night?.lowest,
            hotel.price,
            hotel.original_price,
            hotel.total_rate?.lowest,
            hotel.extracted_price
        ];

        for (const field of priceFields) {
            if (field) {
                if (typeof field === 'string') {
                    const cleanPrice = parseFloat(field.replace(/[^0-9.]/g, ''));
                    if (!isNaN(cleanPrice) && cleanPrice > 0) {
                        price = cleanPrice;
                        break;
                    }
                } else if (typeof field === 'number' && field > 0) {
                    price = field;
                    break;
                }
            }
        }

        // If price is still 0, try to extract from string representation if available
        if (!price && hotel.price_string) {
            const cleanPrice = parseFloat(hotel.price_string.replace(/[^0-9.]/g, ''));
            if (!isNaN(cleanPrice)) price = cleanPrice;
        }

        const rating = hotel.overall_rating || 0;
        const image = hotel.images?.[0]?.thumbnail || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600';
        const allImages = hotel.images?.map(img => img.thumbnail).filter(Boolean) || [];

        // Create detail page URL
        const detailsUrl = `tour-details.html?name=${encodeURIComponent(hotel.name)}&city=${encodeURIComponent(params.city)}&state=${encodeURIComponent(hotel.state || '')}&price=${price}&rating=${rating}&reviews=${hotel.reviews || 0}&image=${encodeURIComponent(image)}&images=${encodeURIComponent(JSON.stringify(allImages))}&amenities=${encodeURIComponent(JSON.stringify(hotel.amenities || []))}&link=${encodeURIComponent(hotel.link)}&checkIn=${params.checkIn}&checkOut=${params.checkOut}&type=hotel`;

        return `
            <a href="${detailsUrl}" class="hotel-card" style="visibility: visible; animation-delay: 0.5s; animation-name: fadeInRight;">
                <img src="${image}" alt="${hotel.name}" class="hotel-image" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600'">
<div class="box-container">                    <div class="hotel-info">
                    <h3 class="hotel-name">${hotel.name}</h3>
                    
                    ${rating > 0 ? `
                    <div class="hotel-rating relative">
                        <div class="rating-badge">
<i class="fa-regular fa-star"></i>                                ${rating.toFixed(1)}
                        </div>
                    </div>
                    ` : ''}                   
                    <div class="hotel-amenities">
                        ${hotel.amenities?.slice(0, 4).map(a => `
                            <span class="amenity-tag">${a}</span>
                        `).join('') || '<span class="amenity-tag">Free WiFi</span><span class="amenity-tag">Parking</span>'}
                    </div>
                </div>
                
                <div class="hotel-price">
                    
                    <div class="price-info">
                        <div class="price-amount d-flex">
                            <span class="price-currency mr--10">${price.toLocaleString('en-IN')}</span>                            <div class="price-label">per night</div>

                        </div>
                    </div>
                    
                    <button class="btn-book rts-btn btn-primary-3 btn-border-2" onclick="event.preventDefault(); event.stopPropagation(); HotelSearch.bookHotel('${hotel.link}')">
                        Book Now
                    </button>
                </div>       </div>
            </a>
        `;
    },

    /**
     * Display hotels in a grid with pagination
     * @param {Array} hotels - Array of hotel objects
     * @param {string} containerId - ID of the container element
     * @param {Object} params - Search parameters for detail page links
     */
    displayHotels(hotels, containerId, params) {
        this.currentHotels = hotels;
        this.containerId = containerId;
        this.currentParams = params;
        this.currentPage = 1;

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID "${containerId}" not found`);
            return;
        }

        // Reset container
        container.innerHTML = '';

        if (hotels.length === 0) {
            this.showEmptyState(container);
            return;
        }

        // Setup scroll listener if not already attached
        if (!this.scrollListenerAttached) {
            window.addEventListener('scroll', () => this.handleScroll());
            this.scrollListenerAttached = true;
        }

        // Initial load
        this.loadMoreHotels();
    },

    /**
     * Load next batch of hotels
     */
    loadMoreHotels() {
        if (this.loadingMore) return;

        const start = (this.currentPage - 1) * this.itemsPerPage;

        // Check if we have more hotels to show
        if (start >= this.currentHotels.length) return;

        this.loadingMore = true;

        const end = start + this.itemsPerPage;
        const hotelsSlice = this.currentHotels.slice(start, end);
        const container = document.getElementById(this.containerId);

        if (hotelsSlice.length > 0) {
            const html = hotelsSlice.map(hotel => this.generateHotelCard(hotel, this.currentParams)).join('');
            container.insertAdjacentHTML('beforeend', html);
            this.currentPage++;
        }

        this.loadingMore = false;
    },

    /**
     * Handle scroll event for infinite scrolling
     */
    handleScroll() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            this.loadMoreHotels();
        }
    },

    /**
     * Show empty state when no hotels found
     */
    showEmptyState(container) {
        container.innerHTML = `
            <div class="empty-state">
<i class="fa-solid fa-hotel"></i>                <h3>No hotels found</h3>
                <p>Try adjusting your search criteria or select a different city</p>
            </div>
        `;
    },

    /**
     * Generate HTML for a skeleton card
     */
    generateSkeletonCard() {
        return `
            <div class="hotel-card skeleton-card">
                <div class="hotel-image skeleton"></div>
                <div class="box-container">
                    <div class="hotel-info">
                        <div class="skeleton skeleton-text" style="width: 80%; height: 24px; margin-bottom: 12px;"></div>
                        <div class="skeleton skeleton-text" style="width: 40%; height: 16px; margin-bottom: 16px;"></div>
                        <div class="d-flex gap-2" style="gap: 10px;">
                            <div class="skeleton skeleton-tag"></div>
                            <div class="skeleton skeleton-tag"></div>
                            <div class="skeleton skeleton-tag"></div>
                        </div>
                    </div>
                    
                    <div class="hotel-price">
                        <div class="skeleton skeleton-text" style="width: 50%; height: 24px; margin-bottom: 8px;"></div>
                        <div class="skeleton skeleton-button"></div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Show loading state
     */
    showLoadingState(container) {
        container.innerHTML = Array(9).fill(0).map(() => this.generateSkeletonCard()).join('');
    },


    /**
     * Toggle save/bookmark hotel
     */
    toggleSave(name, image, price, link, city, checkIn, checkOut, event) {
        event.preventDefault();
        event.stopPropagation();

        const hotelData = { name, image, price, link, city, checkIn, checkOut };
        const index = this.savedHotels.findIndex(h => h.name === name);

        if (index > -1) {
            this.savedHotels.splice(index, 1);
        } else {
            this.savedHotels.push(hotelData);
        }

        localStorage.setItem('savedHotels', JSON.stringify(this.savedHotels));
        this.loadSavedHotels();

        // Refresh the display if we have hotels
        if (this.currentHotels.length > 0) {
            this.displayHotels(this.currentHotels, this.containerId, this.currentParams);
        }
    },

    /**
     * Open hotel booking link
     */
    bookHotel(link) {
        window.open(link, '_blank');
    },

    /**
     * Sort hotels
     * @param {string} sortBy - Sort criteria (price_low, price_high, rating)
     * @param {string} containerId - ID of the container element
     * @param {Object} params - Search parameters
     */
    sortHotels(sortBy, containerId, params) {
        let sorted = [...this.allHotels];

        switch (sortBy) {
            case 'price_low':
                sorted.sort((a, b) => (a.rate_per_night?.lowest || 0) - (b.rate_per_night?.lowest || 0));
                break;
            case 'price_high':
                sorted.sort((a, b) => (b.rate_per_night?.lowest || 0) - (a.rate_per_night?.lowest || 0));
                break;
            case 'rating':
                sorted.sort((a, b) => (b.overall_rating || 0) - (a.overall_rating || 0));
                break;
        }

        this.displayHotels(sorted, containerId, params);
    },

    /**
     * Setup event listeners for search form
     * @param {string} formId - ID of the search form
     */
    setupSearchForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const city = document.getElementById('location').value;
            const checkIn = document.getElementById('checkIn').value;
            const checkOut = document.getElementById('checkOut').value;
            const guests = document.getElementById('guests').value;

            window.location.href = `search.html?city=${encodeURIComponent(city)}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`;
        });
    },

    /**
     * Setup event listeners (called on init)
     */
    setupEventListeners() {
        // This can be extended for global event listeners
    },

    /**
     * Populate form fields with URL parameters
     */
    populateFormFields() {
        const params = this.getUrlParams();

        const locationField = document.getElementById('location');
        const checkInField = document.getElementById('checkIn');
        const checkOutField = document.getElementById('checkOut');
        const guestsField = document.getElementById('guests');
        const cityNameField = document.getElementById('cityName');

        if (locationField) locationField.value = params.city;
        if (checkInField) checkInField.value = params.checkIn;
        if (checkOutField) checkOutField.value = params.checkOut;
        if (guestsField) guestsField.value = params.guests;
        if (cityNameField) cityNameField.textContent = params.city;
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HotelSearch.init());
} else {
    HotelSearch.init();
}
