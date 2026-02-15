// Hotel Search - Working version with CORS proxy
(function () {
    'use strict';

    const HotelSearch = {
        config: {
            API_KEY: '7f83c49c4ab7a773e871e42237fd4775f124a8abb77e148899d0bbad6d307d69',
            PROXY: 'https://corsproxy.io/?',
            debounceDelay: 300,
            minSearchLength: 2
        },

        state: {
            adults: 2,
            children: 0,
            locationTimeout: null
        },

        init() {
            // Wait for DOM to be fully loaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initElements());
            } else {
                this.initElements();
            }
        },

        initElements() {
            // Only initialize if elements exist
            const cityInput = document.getElementById('cityInput');

            if (cityInput) {
                console.log('✅ Initializing hotel search form...');
                this.setupLocationAutocomplete();
                this.setupDatePickers();
                this.setupGuestSelector();
                this.setupSearchButton();
            }

            // Initialize search results page if elements exist
            if (document.getElementById('hotelsGrid')) {
                console.log('✅ Initializing search results page...');
                this.initSearchPage();
            }
        },

        setupLocationAutocomplete() {
            const cityInput = document.getElementById('cityInput');
            const locationSuggestions = document.getElementById('locationSuggestions');

            if (!cityInput || !locationSuggestions) {
                console.warn('⚠️ Location autocomplete elements not found');
                return;
            }

            cityInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();

                if (this.state.locationTimeout) {
                    clearTimeout(this.state.locationTimeout);
                }

                if (query.length < this.config.minSearchLength) {
                    locationSuggestions.style.display = 'none';
                    return;
                }

                this.state.locationTimeout = setTimeout(() => {
                    this.fetchLocationSuggestions(query);
                }, this.config.debounceDelay);
            });

            // Close suggestions when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-input-wrapper')) {
                    locationSuggestions.style.display = 'none';
                }
            });

            cityInput.addEventListener('focus', () => {
                if (locationSuggestions.children.length > 0) {
                    locationSuggestions.style.display = 'block';
                }
            });
        },

        async fetchLocationSuggestions(query) {
            const locationSuggestions = document.getElementById('locationSuggestions');

            if (!locationSuggestions) return;

            try {
                locationSuggestions.innerHTML = '<li style="padding: 10px; list-style: none; color: #666;">🔍 Searching...</li>';
                locationSuggestions.style.display = 'block';

                // Use CORS proxy + SerpAPI
                const apiUrl = `https://serpapi.com/search.json?engine=google_autocomplete&q=${encodeURIComponent(query + ' hotels')}&api_key=${this.config.API_KEY}`;
                const url = this.config.PROXY + encodeURIComponent(apiUrl);

                console.log('🌐 Fetching locations for:', query);

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('✅ Received data:', data);

                const suggestions = data.suggestions || [];

                if (suggestions.length === 0) {
                    this.showFallbackCities(query);
                    return;
                }

                this.displayLocationSuggestions(suggestions);

            } catch (error) {
                console.error('❌ Error fetching locations:', error);
                this.showFallbackCities(query);
            }
        },

        showFallbackCities(query) {
            const popularCities = [
                'London, UK',
                'Paris, France',
                'New York, USA',
                'Dubai, UAE',
                'Tokyo, Japan',
                'Singapore',
                'Bangkok, Thailand',
                'Istanbul, Turkey',
                'Barcelona, Spain',
                'Amsterdam, Netherlands',
                'Rome, Italy',
                'Maldives',
                'Bali, Indonesia',
                'Sydney, Australia',
                'Mumbai, India',
                'Delhi, India',
                'Goa, India',
                'Jaipur, India',
                'Agra, India',
                'Udaipur, India'
            ];

            const filtered = popularCities.filter(city =>
                city.toLowerCase().includes(query.toLowerCase())
            );

            const locationSuggestions = document.getElementById('locationSuggestions');

            if (filtered.length > 0) {
                locationSuggestions.innerHTML = filtered.map(city =>
                    `<li style="padding: 10px; cursor: pointer; list-style: none; border-bottom: 1px solid #f0f0f0;" onclick="HotelSearch.selectLocation('${city.replace(/'/g, "\\'")}')">${city}</li>`
                ).join('');
            } else {
                locationSuggestions.innerHTML = '<li style="padding: 10px; list-style: none; color: #666;">💡 Type a city name...</li>';
            }

            locationSuggestions.style.display = 'block';
        },

        displayLocationSuggestions(suggestions) {
            const locationSuggestions = document.getElementById('locationSuggestions');

            if (!locationSuggestions) return;

            locationSuggestions.innerHTML = '';

            suggestions.forEach(suggestion => {
                const li = document.createElement('li');
                li.style.cssText = 'padding: 10px; cursor: pointer; list-style: none; border-bottom: 1px solid #f0f0f0;';
                li.textContent = suggestion.value;

                li.addEventListener('mouseenter', function () {
                    this.style.backgroundColor = '#f5f5f5';
                });

                li.addEventListener('mouseleave', function () {
                    this.style.backgroundColor = 'white';
                });

                li.addEventListener('click', () => {
                    const cityName = suggestion.value.replace(/\s+hotels?$/i, '').trim();
                    this.selectLocation(cityName);
                });

                locationSuggestions.appendChild(li);
            });

            locationSuggestions.style.display = 'block';
        },

        selectLocation(cityName) {
            const cityInput = document.getElementById('cityInput');
            const cityValue = document.getElementById('cityValue');
            const locationSuggestions = document.getElementById('locationSuggestions');

            if (cityInput) cityInput.value = cityName;
            if (cityValue) cityValue.value = cityName;
            if (locationSuggestions) locationSuggestions.style.display = 'none';
        },

        setupDatePickers() {
            const checkInDate = document.getElementById('checkInDate');
            const checkOutDate = document.getElementById('checkOutDate');

            if (!checkInDate || !checkOutDate) {
                console.warn('⚠️ Date picker elements not found');
                return;
            }

            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            checkInDate.min = todayStr;
            checkOutDate.min = todayStr;

            // Set default dates only if empty
            if (!checkInDate.value) {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                checkInDate.value = tomorrow.toISOString().split('T')[0];
            }

            if (!checkOutDate.value) {
                const checkInValue = checkInDate.value ? new Date(checkInDate.value) : new Date(today);
                checkInValue.setDate(checkInValue.getDate() + 2);
                checkOutDate.value = checkInValue.toISOString().split('T')[0];
            }

            checkInDate.addEventListener('change', () => {
                const checkinDate = new Date(checkInDate.value);
                checkinDate.setDate(checkinDate.getDate() + 1);
                checkOutDate.min = checkinDate.toISOString().split('T')[0];

                if (new Date(checkOutDate.value) <= new Date(checkInDate.value)) {
                    checkOutDate.value = checkinDate.toISOString().split('T')[0];
                }
            });
        },

        setupGuestSelector() {
            const guestsDisplay = document.getElementById('guestsDisplay');
            const guestsSelector = document.getElementById('guestsSelector');

            if (!guestsDisplay || !guestsSelector) {
                console.warn('⚠️ Guest selector elements not found');
                return;
            }

            guestsDisplay.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = guestsSelector.style.display === 'block';
                guestsSelector.style.display = isVisible ? 'none' : 'block';
            });

            // Setup button event listeners
            this.setupGuestButton('adultsIncrement', () => {
                if (this.state.adults < 10) {
                    this.state.adults++;
                    this.updateGuestsDisplay();
                }
            });

            this.setupGuestButton('adultsDecrement', () => {
                if (this.state.adults > 1) {
                    this.state.adults--;
                    this.updateGuestsDisplay();
                }
            });

            this.setupGuestButton('childrenIncrement', () => {
                if (this.state.children < 10) {
                    this.state.children++;
                    this.updateGuestsDisplay();
                }
            });

            this.setupGuestButton('childrenDecrement', () => {
                if (this.state.children > 0) {
                    this.state.children--;
                    this.updateGuestsDisplay();
                }
            });

            this.setupGuestButton('guestsDone', () => {
                guestsSelector.style.display = 'none';
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-input-wrapper') && !e.target.closest('#guestsSelector')) {
                    guestsSelector.style.display = 'none';
                }
            });

            // Add hover effects
            const allBtns = document.querySelectorAll('.counter-btn');
            allBtns.forEach(btn => {
                btn.addEventListener('mouseenter', function () {
                    this.style.background = '#2183DF';
                    this.style.color = 'white';
                });
                btn.addEventListener('mouseleave', function () {
                    this.style.background = 'white';
                    this.style.color = '#2183DF';
                });
            });

            this.updateGuestsDisplay();
        },

        setupGuestButton(id, callback) {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    callback();
                });
            }
        },

        updateGuestsDisplay() {
            const adultsCount = document.getElementById('adultsCount');
            const childrenCount = document.getElementById('childrenCount');
            const adultsValue = document.getElementById('adultsValue');
            const childrenValue = document.getElementById('childrenValue');
            const guestsDisplay = document.getElementById('guestsDisplay');

            if (adultsCount) adultsCount.textContent = this.state.adults;
            if (childrenCount) childrenCount.textContent = this.state.children;
            if (adultsValue) adultsValue.value = this.state.adults;
            if (childrenValue) childrenValue.value = this.state.children;

            if (guestsDisplay) {
                const adultsText = `${this.state.adults} Adult${this.state.adults !== 1 ? 's' : ''}`;
                const childrenText = this.state.children > 0 ? `, ${this.state.children} Child${this.state.children !== 1 ? 'ren' : ''}` : '';
                guestsDisplay.textContent = adultsText + childrenText;
            }
        },

        setupSearchButton() {
            const searchBtn = document.getElementById('hotelSearchBtn');

            if (!searchBtn) {
                console.warn('Search button not found');
                return;
            }

            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.performSearch();
            });
        },

        performSearch() {
            const cityInput = document.getElementById('cityInput');
            const cityValue = document.getElementById('cityValue');
            const checkInDate = document.getElementById('checkInDate');
            const checkOutDate = document.getElementById('checkOutDate');

            const city = (cityValue && cityValue.value) || (cityInput && cityInput.value) || '';
            const checkIn = checkInDate ? checkInDate.value : '';
            const checkOut = checkOutDate ? checkOutDate.value : '';

            if (!city.trim()) {
                alert('Please enter a location');
                if (cityInput) cityInput.focus();
                return;
            }

            if (!checkIn) {
                alert('Please select check-in date');
                return;
            }

            if (!checkOut) {
                alert('Please select check-out date');
                return;
            }

            const totalGuests = this.state.adults + this.state.children;

            const params = new URLSearchParams({
                city: city.trim(),
                checkIn: checkIn,
                checkOut: checkOut,
                guests: totalGuests,
                adults: this.state.adults,
                children: this.state.children
            });

            console.log('Searching hotels:', params.toString());
            window.location.href = `search.html?${params.toString()}`;
        },

        // Search results page functions
        getUrlParams() {
            const params = new URLSearchParams(window.location.search);
            return {
                city: params.get('city') || '',
                checkIn: params.get('checkIn') || '',
                checkOut: params.get('checkOut') || '',
                guests: parseInt(params.get('guests')) || 2,
                adults: parseInt(params.get('adults')) || 2,
                children: parseInt(params.get('children')) || 0
            };
        },

        populateFormFields() {
            const params = this.getUrlParams();

            const cityInput = document.getElementById('cityInput');
            const checkInDate = document.getElementById('checkInDate');
            const checkOutDate = document.getElementById('checkOutDate');

            if (cityInput) cityInput.value = params.city;
            if (checkInDate) checkInDate.value = params.checkIn;
            if (checkOutDate) checkOutDate.value = params.checkOut;

            this.state.adults = params.adults;
            this.state.children = params.children;
            this.updateGuestsDisplay();
        },

        setupSearchForm(formId) {
            const form = document.getElementById(formId);
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.performSearch();
                });
            }
        },

        async searchHotels(params) {
            try {
                console.log('🏨 Searching hotels for:', params);

                // Use CORS proxy + SerpAPI
                const apiUrl = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(params.city + ' hotels')}&check_in_date=${params.checkIn}&check_out_date=${params.checkOut}&adults=${params.adults}&currency=USD&gl=us&hl=en&api_key=${this.config.API_KEY}`;
                const url = this.config.PROXY + encodeURIComponent(apiUrl);

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('✅ Hotels data received:', data);

                const hotels = (data.properties || []).map(hotel => ({
                    id: hotel.property_token || hotel.link,
                    name: hotel.name || 'Unknown Hotel',
                    image: hotel.images?.[0]?.thumbnail || hotel.thumbnail || 'https://via.placeholder.com/400x300?text=No+Image',
                    rating: hotel.overall_rating || hotel.rating || 0,
                    reviews: hotel.reviews || 0,
                    price: hotel.rate_per_night?.lowest || hotel.price || 'N/A',
                    originalPrice: hotel.rate_per_night?.before_taxes_fees || null,
                    amenities: hotel.amenities || [],
                    link: hotel.link || '#',
                    extracted_price: hotel.rate_per_night?.extracted_lowest || 0
                }));

                return hotels;

            } catch (error) {
                console.error('❌ Error searching hotels:', error);
                throw error;
            }
        },

        displayHotels(hotels, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            if (!hotels || hotels.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <h3>No hotels found</h3>
                        <p>Try searching for a different location or dates</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = hotels.map(hotel => `
                <div class="hotel-card" data-price="${hotel.extracted_price}" style="border: 1px solid #ddd; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                    <img src="${hotel.image}" alt="${hotel.name}" style="width: 100%; height: 200px; object-fit: cover;" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
                    <div style="padding: 15px;">
                        <h3 style="margin: 0 0 10px 0;">${hotel.name}</h3>
                        ${hotel.rating > 0 ? `
                            <div style="margin-bottom: 10px;">
                                <span style="color: #FFD700;">${'★'.repeat(Math.round(hotel.rating))}${'☆'.repeat(5 - Math.round(hotel.rating))}</span>
                                <span style="font-weight: bold;">${hotel.rating}</span>
                                ${hotel.reviews > 0 ? `<span style="color: #666;">(${hotel.reviews} reviews)</span>` : ''}
                            </div>
                        ` : ''}
                        ${hotel.amenities && hotel.amenities.length > 0 ? `
                            <div style="margin-bottom: 10px;">
                                ${hotel.amenities.slice(0, 4).map(a => `<span style="display: inline-block; background: #f0f0f0; padding: 3px 8px; margin: 2px; border-radius: 3px; font-size: 12px;">${a}</span>`).join('')}
                            </div>
                        ` : ''}
                        <div style="margin-top: 10px;">
                            ${hotel.originalPrice ? `<span style="text-decoration: line-through; color: #999; margin-right: 5px;">$${hotel.originalPrice}</span>` : ''}
                            <span style="font-size: 24px; font-weight: bold; color: #2183DF;">${typeof hotel.price === 'number' ? `$${hotel.price}` : hotel.price}</span>
                            <span style="color: #666;"> /night</span>
                        </div>
                        <a href="${hotel.link}" target="_blank" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: #2183DF; color: white; text-decoration: none; border-radius: 5px;">View Details</a>
                    </div>
                </div>
            `).join('');
        },

        showLoadingState(container) {
            if (!container) return;
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #2183DF; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <h3>🔍 Searching for hotels...</h3>
                    <p>Please wait while we find the best options for you</p>
                </div>
            `;
        },

        sortHotels(sortBy, containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const hotelCards = Array.from(container.querySelectorAll('.hotel-card'));

            hotelCards.sort((a, b) => {
                const priceA = parseFloat(a.dataset.price) || 0;
                const priceB = parseFloat(b.dataset.price) || 0;

                switch (sortBy) {
                    case 'price-low':
                        return priceA - priceB;
                    case 'price-high':
                        return priceB - priceA;
                    default:
                        return 0;
                }
            });

            container.innerHTML = '';
            hotelCards.forEach(card => container.appendChild(card));
        },

        async initSearchPage() {
            const params = this.getUrlParams();

            // Populate form if it exists
            this.populateFormFields();

            // Setup search form if it exists
            this.setupSearchForm('searchForm');

            // Setup sorting
            const sortBy = document.getElementById('sortBy');
            if (sortBy) {
                sortBy.addEventListener('change', (e) => {
                    this.sortHotels(e.target.value, 'hotelsGrid');
                });
            }

            try {
                this.showLoadingState(document.getElementById('hotelsGrid'));
                const hotels = await this.searchHotels(params);
                this.displayHotels(hotels, 'hotelsGrid');

                const resultsCount = document.getElementById('resultsCount');
                if (resultsCount) {
                    resultsCount.textContent = `${hotels.length} hotels found`;
                }
            } catch (error) {
                console.error('❌ Search error:', error);
                const grid = document.getElementById('hotelsGrid');
                if (grid) {
                    grid.innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <h3>⚠️ Error loading hotels</h3>
                            <p>${error.message}</p>
                            <p>Please try again or search for a different city</p>
                        </div>
                    `;
                }
            }
        }
    };

    // Add CSS animation
    if (!document.getElementById('hotel-search-animation')) {
        const style = document.createElement('style');
        style.id = 'hotel-search-animation';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    // Initialize
    HotelSearch.init();

    // Export for global access
    window.HotelSearch = HotelSearch;

})();