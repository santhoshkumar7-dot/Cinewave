/**
 * CineWave - Movie Ticket Booking System Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- APPLICATION STATE ---
  let appState = {
    movies: [],
    bookings: [],
    reservedSeatsMap: {}, // Key: `${movId}_${cinId}_${dateString}_${timeString}`, Value: Array of seat labels
    selectedMovie: null,
    selectedDate: null, // object {isoString, dayName, dayNum, month}
    selectedCinema: null,
    selectedShowtime: null,
    selectedSeats: [],
    timerInterval: null,
    timerSeconds: 300, // 5 minutes hold
  };

  // --- SEED BOOKINGS DATA ---
  const DEFAULT_BOOKINGS_SEED = [
    {
      id: 'TX-728103-W',
      movieId: 'mov-1',
      movieTitle: 'Nebula Warriors: Starfall',
      cinemaId: 'cin-1',
      cinemaName: 'Apex Cinemas: Grand Central',
      dateString: getBookingDates()[0].isoString, // Today
      showtime: '2:30 PM',
      seats: ['A-5', 'A-6'],
      customerName: 'Alice Smith',
      customerEmail: 'alice@example.com',
      customerPhone: '+1 (555) 123-4567',
      paymentMethod: 'card',
      amountPaid: 55.00, // 2 * 25 + 10% fee
      timestamp: Date.now() - 3600000 * 24, // 1 day ago
      status: 'active'
    },
    {
      id: 'TX-910283-K',
      movieId: 'mov-2',
      movieTitle: 'The Midnight Protocol',
      cinemaId: 'cin-2',
      cinemaName: 'Nova Theaters: Horizon Mall',
      dateString: getBookingDates()[0].isoString, // Today
      showtime: '7:00 PM',
      seats: ['D-4', 'D-5', 'D-6'],
      customerName: 'Bob Jones',
      customerEmail: 'bob.j@example.com',
      customerPhone: '+1 (555) 987-6543',
      paymentMethod: 'upi',
      amountPaid: 59.40, // 3 * 18 + 10% fee
      timestamp: Date.now() - 3600000 * 5, // 5 hours ago
      status: 'active'
    },
    {
      id: 'TX-452190-Q',
      movieId: 'mov-3',
      movieTitle: 'Whispers of the Forest',
      cinemaId: 'cin-3',
      cinemaName: 'Starlight Screen: Downtown',
      dateString: getBookingDates()[1].isoString, // Tomorrow
      showtime: '4:15 PM',
      seats: ['G-1', 'G-2'],
      customerName: 'Carol Danvers',
      customerEmail: 'carol@marvel.com',
      customerPhone: '+1 (555) 444-8888',
      paymentMethod: 'wallet',
      amountPaid: 26.40, // 2 * 12 + 10% fee
      timestamp: Date.now() - 3600000 * 18,
      status: 'active'
    },
    {
      id: 'TX-338291-B',
      movieId: 'mov-4',
      movieTitle: 'Chronicles of Chronos',
      cinemaId: 'cin-1',
      cinemaName: 'Apex Cinemas: Grand Central',
      dateString: getBookingDates()[0].isoString, // Today
      showtime: '5:45 PM',
      seats: ['E-9', 'E-10'],
      customerName: 'David Tennant',
      customerEmail: 'doctor@tardis.org',
      customerPhone: '+1 (555) 909-0909',
      paymentMethod: 'card',
      amountPaid: 39.60, // 2 * 18 + 10% fee
      timestamp: Date.now() - 3600000 * 48, // 2 days ago
      status: 'completed'
    }
  ];

  // --- INITIALIZE APPLICATION ---
  function initApp() {
    loadDatabase();
    setupNavigation();
    setupExplorerView();
    setupDetailsViewEvents();
    setupSeatingViewEvents();
    setupCheckoutViewEvents();
    setupAdminViewEvents();
    
    // Initial router view
    switchView('view-explorer');
    renderMoviesGrid();
  }

  // --- DATABASE & LOCAL STORAGE SYNC ---
  function loadDatabase() {
    // 1. Load movies
    const storedMovies = localStorage.getItem('cw_movies');
    if (storedMovies) {
      appState.movies = JSON.parse(storedMovies);
    } else {
      appState.movies = INITIAL_MOVIES;
      localStorage.setItem('cw_movies', JSON.stringify(INITIAL_MOVIES));
    }

    // 2. Load Bookings
    const storedBookings = localStorage.getItem('cw_bookings');
    if (storedBookings) {
      appState.bookings = JSON.parse(storedBookings);
    } else {
      appState.bookings = DEFAULT_BOOKINGS_SEED;
      localStorage.setItem('cw_bookings', JSON.stringify(DEFAULT_BOOKINGS_SEED));
    }

    // 3. Compile Reserved Seat Map from active bookings
    compileReservedSeatsMap();
  }

  function compileReservedSeatsMap() {
    appState.reservedSeatsMap = {};
    appState.bookings.forEach(booking => {
      if (booking.status === 'active' || booking.status === 'completed') {
        const key = `${booking.movieId}_${booking.cinemaId}_${booking.dateString}_${booking.showtime}`;
        if (!appState.reservedSeatsMap[key]) {
          appState.reservedSeatsMap[key] = [];
        }
        appState.reservedSeatsMap[key] = [
          ...appState.reservedSeatsMap[key],
          ...booking.seats
        ];
      }
    });
  }

  function syncBookingsWithLocalStorage() {
    localStorage.setItem('cw_bookings', JSON.stringify(appState.bookings));
    compileReservedSeatsMap();
  }

  // --- SPA NAVIGATION ROUTER ---
  function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-target');
        
        // Stop seating timer if navigating away from seat selector
        if (targetView !== 'view-seats') {
          stopHoldTimer();
        }

        switchView(targetView);

        if (targetView === 'view-bookings') {
          renderBookingsHistory();
        } else if (targetView === 'view-admin') {
          renderAdminDashboard();
        }
      });
    });

    // Logo click returns to explorer
    document.getElementById('nav-logo').addEventListener('click', () => {
      stopHoldTimer();
      switchView('view-explorer');
    });
  }

  function switchView(viewId) {
    // 1. Toggle visibility
    const views = document.querySelectorAll('.app-view');
    views.forEach(view => {
      if (view.id === viewId) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // 2. Highlight Nav Link
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      if (btn.getAttribute('data-target') === viewId) {
        btn.classList.add('active');
      } else {
        // Special mapping for details / seating views back to movies button
        if ((viewId === 'view-details' || viewId === 'view-seats' || viewId === 'view-checkout' || viewId === 'view-ticket') 
            && btn.id === 'btn-nav-movies') {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- VIEW 1: MOVIE EXPLORER VIEW ---
  function setupExplorerView() {
    const searchInput = document.getElementById('search-input');
    const genreFilter = document.getElementById('genre-filter');
    const cinemaFilter = document.getElementById('cinema-filter');

    searchInput.addEventListener('input', renderMoviesGrid);
    genreFilter.addEventListener('change', renderMoviesGrid);
    cinemaFilter.addEventListener('change', renderMoviesGrid);

    // Hero Section buttons
    document.getElementById('hero-btn-book').addEventListener('click', (e) => {
      const mId = e.currentTarget.getAttribute('data-movie-id');
      openMovieDetails(mId);
    });

    document.getElementById('hero-btn-trailer').addEventListener('click', (e) => {
      const trailerUrl = e.currentTarget.getAttribute('data-trailer');
      openTrailerModal(trailerUrl);
    });
  }

  function renderMoviesGrid() {
    const gridContainer = document.getElementById('movies-grid-container');
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const selectedGenre = document.getElementById('genre-filter').value;
    const selectedCinemaId = document.getElementById('cinema-filter').value;

    gridContainer.innerHTML = '';

    // Filter logic
    const filteredMovies = appState.movies.filter(movie => {
      // 1. Search Query (Title, Genre, Cast, Director)
      const matchesQuery = !query || 
        movie.title.toLowerCase().includes(query) ||
        movie.genre.some(g => g.toLowerCase().includes(query)) ||
        movie.director.toLowerCase().includes(query) ||
        movie.cast.some(c => c.toLowerCase().includes(query));

      // 2. Genre Filter
      const matchesGenre = !selectedGenre || movie.genre.includes(selectedGenre);

      // 3. Cinema Filter (Verify if cinema plays this movie. For our simulation, Apex and Nova play all, Starlight plays only drama/romance/fantasy)
      let matchesCinema = true;
      if (selectedCinemaId) {
        if (selectedCinemaId === 'cin-3') {
          // Starlight Indie screen filter simulation
          matchesCinema = movie.genre.includes('Drama') || movie.genre.includes('Romance') || movie.genre.includes('Fantasy');
        }
      }

      return matchesQuery && matchesGenre && matchesCinema;
    });

    if (filteredMovies.length === 0) {
      gridContainer.innerHTML = `
        <div class="empty-bookings-state" style="grid-column: 1 / -1;">
          <svg viewBox="0 0 24 24" width="48" height="48"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-11h2v6h-2zm0-4h2v2h-2z" fill="currentColor"/></svg>
          <h3>No Movies Found</h3>
          <p>Try refining your search keyword or clearing the filters.</p>
        </div>
      `;
      return;
    }

    filteredMovies.forEach(movie => {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.innerHTML = `
        <div class="movie-card-poster-wrapper">
          <img class="movie-card-poster" src="${movie.posterUrl}" alt="${movie.title}" onerror="this.src='https://placehold.co/300x420/1e293b/ffffff?text=${encodeURIComponent(movie.title)}'">
          <div class="movie-card-rating">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg>
            <span>${movie.userRating}</span>
          </div>
        </div>
        <div class="movie-card-content">
          <span class="movie-card-genres">${movie.genre.slice(0, 2).join(' • ')}</span>
          <h3 class="movie-card-title">${movie.title}</h3>
          <div class="movie-card-meta">
            <span class="movie-card-duration">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor"/></svg>
              <span>${movie.duration}</span>
            </span>
            <span class="details-badge">${movie.rating}</span>
          </div>
        </div>
      `;
      card.addEventListener('click', () => openMovieDetails(movie.id));
      gridContainer.appendChild(card);
    });
  }

  // --- VIEW 2: MOVIE DETAILS VIEW ---
  function setupDetailsViewEvents() {
    document.getElementById('details-back-btn').addEventListener('click', () => {
      switchView('view-explorer');
    });
  }

  function openMovieDetails(movieId) {
    const movie = appState.movies.find(m => m.id === movieId);
    if (!movie) return;

    appState.selectedMovie = movie;
    appState.selectedDate = null;
    appState.selectedCinema = null;
    appState.selectedShowtime = null;

    const detailsContainer = document.getElementById('movie-details-content');
    
    // Create Date slider HTML
    const dates = getBookingDates();
    let datesHtml = '';
    dates.forEach((d, idx) => {
      datesHtml += `
        <div class="date-card" data-idx="${idx}" data-iso="${d.isoString}">
          <span class="date-day">${d.dayName}</span>
          <span class="date-num">${d.dayNum}</span>
          <span class="date-month">${d.month}</span>
        </div>
      `;
    });

    detailsContainer.innerHTML = `
      <div class="movie-details-left">
        <div class="details-poster-card">
          <img src="${movie.posterUrl}" alt="${movie.title}" onerror="this.src='https://placehold.co/300x450/1e293b/ffffff?text=${encodeURIComponent(movie.title)}'">
        </div>
        <button class="btn btn-secondary btn-block" id="btn-details-play-trailer">
          <svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
          <span>Watch Trailer</span>
        </button>
      </div>
      <div class="movie-details-right">
        <div class="details-title-section">
          <h1 class="details-title">${movie.title}</h1>
          <div class="details-meta-row">
            <span class="movie-card-rating">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/></svg>
              <strong>${movie.userRating}</strong> / 10
            </span>
            <span class="details-badge">${movie.rating}</span>
            <span>•</span>
            <span>${movie.duration}</span>
            <span>•</span>
            <span>${movie.language}</span>
          </div>
        </div>

        <div class="details-synopsis-box">
          <h3>Synopsis</h3>
          <p>${movie.synopsis}</p>
        </div>

        <div class="details-cast-box">
          <h3>Cast & Crew</h3>
          <div class="cast-grid">
            <div class="cast-pill"><strong>Director:</strong> ${movie.director}</div>
            ${movie.cast.map(c => `<div class="cast-pill">${c}</div>`).join('')}
          </div>
        </div>

        <!-- Showtime Picker -->
        <div class="showtime-picker-section">
          <h3>Select Date & Session</h3>
          
          <div class="date-slider">
            ${datesHtml}
          </div>

          <div class="cinema-showtimes-list" id="cinema-listings-wrapper">
            <div class="empty-bookings-state" style="padding: 1rem 0;">
              <p>Please select a date first to view showtimes.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Dynamic background colors custom theme
    document.getElementById('view-details').style.background = `linear-gradient(to bottom, rgba(7, 10, 19, 0.8), rgba(7, 10, 19, 1)), ${movie.bannerColor}`;

    // Date picker click binding
    const dateCards = detailsContainer.querySelectorAll('.date-card');
    dateCards.forEach(card => {
      card.addEventListener('click', () => {
        dateCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        const idx = card.getAttribute('data-idx');
        appState.selectedDate = dates[idx];
        renderCinemaShowtimes();
      });
    });

    // Trailer click
    document.getElementById('btn-details-play-trailer').addEventListener('click', () => {
      openTrailerModal(movie.trailerUrl);
    });

    switchView('view-details');
  }

  function renderCinemaShowtimes() {
    const wrapper = document.getElementById('cinema-listings-wrapper');
    wrapper.innerHTML = '';

    // Simulated Cinema showtime mappings based on cinema properties
    CINEMAS.forEach(cinema => {
      // Simulate movie constraints (Starlight doesn't show Action blockbusters)
      if (cinema.id === 'cin-3' && 
          !(appState.selectedMovie.genre.includes('Drama') || 
            appState.selectedMovie.genre.includes('Romance') || 
            appState.selectedMovie.genre.includes('Fantasy'))) {
        return; // Skip showing Action here
      }

      // Generate showtimes dynamically
      let showtimeSlots = [];
      if (cinema.id === 'cin-1') {
        showtimeSlots = ['11:00 AM (IMAX)', '2:30 PM (IMAX)', '5:45 PM (IMAX)', '9:00 PM (IMAX)', '10:30 PM (2D)'];
      } else if (cinema.id === 'cin-2') {
        showtimeSlots = ['1:30 PM (Dolby)', '4:45 PM (Dolby)', '8:00 PM (Dolby)', '11:15 PM (2D)'];
      } else {
        showtimeSlots = ['12:15 PM (2D)', '3:45 PM (2D)', '7:15 PM (2D)'];
      }

      const row = document.createElement('div');
      row.className = 'cinema-showtime-row';
      row.innerHTML = `
        <div class="cinema-row-header">
          <div class="cinema-row-name">${cinema.name}</div>
          <div class="cinema-row-loc">${cinema.location} • Amenities: ${cinema.amenities.join(', ')}</div>
        </div>
        <div class="showtimes-pills">
          ${showtimeSlots.map(time => `<button class="showtime-pill" data-cinema-id="${cinema.id}" data-time="${time}">${time}</button>`).join('')}
        </div>
      `;

      // Click pill binding
      row.querySelectorAll('.showtime-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          appState.selectedCinema = cinema;
          appState.selectedShowtime = pill.getAttribute('data-time');
          
          row.querySelectorAll('.showtime-pill').forEach(p => p.classList.remove('selected'));
          pill.classList.add('selected');

          // Advance to seat view
          openSeatSelection();
        });
      });

      wrapper.appendChild(row);
    });
  }

  // --- VIEW 3: SEAT SELECTION VIEW ---
  function setupSeatingViewEvents() {
    document.getElementById('seats-back-btn').addEventListener('click', () => {
      stopHoldTimer();
      openMovieDetails(appState.selectedMovie.id);
    });

    document.getElementById('btn-proceed-checkout').addEventListener('click', () => {
      openCheckoutPage();
    });
  }

  function openSeatSelection() {
    appState.selectedSeats = [];
    
    // Set Sidebar static summaries
    document.getElementById('summary-movie-title').textContent = appState.selectedMovie.title;
    document.getElementById('summary-cinema-name').textContent = appState.selectedCinema.name;
    document.getElementById('summary-show-time').textContent = `${appState.selectedDate.dayName}, ${appState.selectedDate.month} ${appState.selectedDate.dayNum} • ${appState.selectedShowtime}`;
    
    renderSeatingGrid();
    updatePricingSummary();
    
    // Holding timer initialization
    startHoldTimer();

    switchView('view-seats');
  }

  function renderSeatingGrid() {
    const grid = document.getElementById('seating-grid');
    grid.innerHTML = '';

    const { rows, cols, aisles, categories } = SEAT_LAYOUT;
    
    // Key to check reservations
    const reserveKey = `${appState.selectedMovie.id}_${appState.selectedCinema.id}_${appState.selectedDate.isoString}_${appState.selectedShowtime}`;
    const bookedSeats = appState.reservedSeatsMap[reserveKey] || [];

    rows.forEach(rowLetter => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'seat-row';
      
      // Left row label
      const leftLabel = document.createElement('div');
      leftLabel.className = 'row-label';
      leftLabel.textContent = rowLetter;
      rowDiv.appendChild(leftLabel);

      const seatsWrapper = document.createElement('div');
      seatsWrapper.className = 'seat-row-seats';

      // Find seat category based on row letter
      let seatCategory = 'Standard';
      for (const [catName, catConfig] of Object.entries(categories)) {
        if (catConfig.rows.includes(rowLetter)) {
          seatCategory = catName;
          break;
        }
      }

      for (let col = 1; col <= cols; col++) {
        // Check if aisle spacing is needed
        if (aisles.includes(col - 1)) {
          const spacer = document.createElement('div');
          spacer.className = 'seat-spacer';
          seatsWrapper.appendChild(spacer);
        }

        const seatLabel = `${rowLetter}-${col}`;
        const seatBtn = document.createElement('button');
        
        const isBooked = bookedSeats.includes(seatLabel);
        
        seatBtn.className = `seat seat-available seat-${seatCategory.toLowerCase()}`;
        if (isBooked) {
          seatBtn.className = 'seat booked';
          seatBtn.disabled = true;
        }
        
        seatBtn.setAttribute('data-seat', seatLabel);
        seatBtn.setAttribute('data-category', seatCategory);
        seatBtn.title = `${seatCategory} Seat ${seatLabel} ($${categories[seatCategory].price})`;

        seatBtn.addEventListener('click', () => toggleSeatSelection(seatBtn, seatLabel));

        seatsWrapper.appendChild(seatBtn);
      }

      rowDiv.appendChild(seatsWrapper);

      // Right row label
      const rightLabel = document.createElement('div');
      rightLabel.className = 'row-label';
      rightLabel.textContent = rowLetter;
      rowDiv.appendChild(rightLabel);

      grid.appendChild(rowDiv);
    });
  }

  function toggleSeatSelection(seatElement, seatLabel) {
    if (seatElement.classList.contains('booked')) return;

    const idx = appState.selectedSeats.indexOf(seatLabel);
    if (idx > -1) {
      appState.selectedSeats.splice(idx, 1);
      seatElement.classList.remove('selected');
    } else {
      // Limit to 10 seats per booking
      if (appState.selectedSeats.length >= 10) {
        alert('You can select a maximum of 10 seats per transaction.');
        return;
      }
      appState.selectedSeats.push(seatLabel);
      seatElement.classList.add('selected');
    }

    updatePricingSummary();
  }

  function updatePricingSummary() {
    const listContainer = document.getElementById('selected-seats-list');
    const checkoutBtn = document.getElementById('btn-proceed-checkout');
    
    listContainer.innerHTML = '';

    if (appState.selectedSeats.length === 0) {
      listContainer.innerHTML = '<span class="no-seats-selected">No seats chosen yet</span>';
      checkoutBtn.disabled = true;
      
      // Reset sidebar price rows
      document.getElementById('breakdown-vip-qty').textContent = '0x VIP Seats';
      document.getElementById('breakdown-vip-cost').textContent = '$0.00';
      document.getElementById('breakdown-premium-qty').textContent = '0x Premium Seats';
      document.getElementById('breakdown-premium-cost').textContent = '$0.00';
      document.getElementById('breakdown-standard-qty').textContent = '0x Standard Seats';
      document.getElementById('breakdown-standard-cost').textContent = '$0.00';
      document.getElementById('breakdown-fees').textContent = '$0.00';
      document.getElementById('summary-total-price').textContent = '$0.00';
      return;
    }

    // Process selection
    checkoutBtn.disabled = false;
    let counts = { VIP: 0, Premium: 0, Standard: 0 };
    
    appState.selectedSeats.sort().forEach(seat => {
      const badge = document.createElement('span');
      badge.className = 'seat-badge';
      badge.textContent = seat;
      listContainer.appendChild(badge);

      // Determine category
      const row = seat.split('-')[0];
      let cat = 'Standard';
      for (const [catName, config] of Object.entries(SEAT_LAYOUT.categories)) {
        if (config.rows.includes(row)) {
          cat = catName;
          break;
        }
      }
      counts[cat]++;
    });

    const vipPrice = SEAT_LAYOUT.categories.VIP.price;
    const premiumPrice = SEAT_LAYOUT.categories.Premium.price;
    const standardPrice = SEAT_LAYOUT.categories.Standard.price;

    const vipCost = counts.VIP * vipPrice;
    const premiumCost = counts.Premium * premiumPrice;
    const standardCost = counts.Standard * standardPrice;
    
    const subtotal = vipCost + premiumCost + standardCost;
    const fees = subtotal * 0.10; // 10% convenience fee
    const total = subtotal + fees;

    // Update quantities and costs
    document.getElementById('breakdown-vip-qty').textContent = `${counts.VIP}x VIP Seats`;
    document.getElementById('breakdown-vip-cost').textContent = `$${vipCost.toFixed(2)}`;
    document.getElementById('breakdown-premium-qty').textContent = `${counts.Premium}x Premium Seats`;
    document.getElementById('breakdown-premium-cost').textContent = `$${premiumCost.toFixed(2)}`;
    document.getElementById('breakdown-standard-qty').textContent = `${counts.Standard}x Standard Seats`;
    document.getElementById('breakdown-standard-cost').textContent = `$${standardCost.toFixed(2)}`;
    
    document.getElementById('breakdown-fees').textContent = `$${fees.toFixed(2)}`;
    document.getElementById('summary-total-price').textContent = `$${total.toFixed(2)}`;
  }

  // Hold Timer Methods
  function startHoldTimer() {
    stopHoldTimer(); // Clear existing
    appState.timerSeconds = 300;
    const timerText = document.getElementById('timer-text');
    timerText.textContent = '05:00';

    appState.timerInterval = setInterval(() => {
      appState.timerSeconds--;
      if (appState.timerSeconds <= 0) {
        stopHoldTimer();
        alert('Your seating reservation window has expired. The seats have been released.');
        openMovieDetails(appState.selectedMovie.id);
      } else {
        const mins = Math.floor(appState.timerSeconds / 60).toString().padStart(2, '0');
        const secs = (appState.timerSeconds % 60).toString().padStart(2, '0');
        timerText.textContent = `${mins}:${secs}`;
      }
    }, 1000);
  }

  function stopHoldTimer() {
    if (appState.timerInterval) {
      clearInterval(appState.timerInterval);
      appState.timerInterval = null;
    }
  }

  // --- VIEW 4: CHECKOUT & PAYMENT ---
  function setupCheckoutViewEvents() {
    document.getElementById('checkout-back-btn').addEventListener('click', () => {
      switchView('view-seats');
    });

    // Payment radio controllers
    const paymentRadios = document.querySelectorAll('input[name="payment-type"]');
    paymentRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const value = e.target.value;
        document.getElementById('card-fields').classList.toggle('hidden', value !== 'card');
        document.getElementById('upi-fields').classList.toggle('hidden', value !== 'upi');
        document.getElementById('wallet-fields').classList.toggle('hidden', value !== 'wallet');
        
        // Toggle input requirements based on display
        const cardInputs = document.querySelectorAll('#card-fields input');
        cardInputs.forEach(input => {
          input.required = (value === 'card');
        });
      });
    });

    // Auto format Card Input helpers
    const cardInput = document.getElementById('card-number');
    cardInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      let formatted = '';
      for (let i = 0; i < val.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += val[i];
      }
      e.target.value = formatted;
    });

    const cardExpiry = document.getElementById('card-expiry');
    cardExpiry.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      if (val.length >= 2) {
        e.target.value = val.slice(0, 2) + '/' + val.slice(2, 4);
      } else {
        e.target.value = val;
      }
    });

    // Submit booking form
    const bookingForm = document.getElementById('booking-info-form');
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      processBookingCheckout();
    });
  }

  function openCheckoutPage() {
    stopHoldTimer(); // Keep seats, but stop timer visual

    // Calc amounts
    const totals = calculateAmounts();
    
    document.getElementById('checkout-amount-label').textContent = `$${totals.total.toFixed(2)}`;
    
    // Render Order Recap
    const recapContainer = document.getElementById('checkout-recap-content');
    recapContainer.innerHTML = `
      <img class="recap-poster" src="${appState.selectedMovie.posterUrl}" onerror="this.src='https://placehold.co/300x420/1e293b/ffffff?text=${encodeURIComponent(appState.selectedMovie.title)}'">
      <div class="recap-details-row">
        <span>Movie</span>
        <strong>${appState.selectedMovie.title}</strong>
      </div>
      <div class="recap-details-row">
        <span>Location</span>
        <strong>${appState.selectedCinema.name}</strong>
      </div>
      <div class="recap-details-row">
        <span>Showtime</span>
        <strong>${appState.selectedDate.dayName}, ${appState.selectedDate.month} ${appState.selectedDate.dayNum} @ ${appState.selectedShowtime}</strong>
      </div>
      <div class="recap-details-row">
        <span>Seats</span>
        <strong style="color: var(--color-selected);">${appState.selectedSeats.join(', ')}</strong>
      </div>
      <div class="divider"></div>
      <div class="recap-details-row">
        <span>Ticket subtotal</span>
        <span>$${totals.subtotal.toFixed(2)}</span>
      </div>
      <div class="recap-details-row">
        <span>Convenience Fees (10%)</span>
        <span>$${totals.fees.toFixed(2)}</span>
      </div>
      <div class="divider"></div>
      <div class="recap-details-row" style="font-size: 1.1rem; color: #fff;">
        <span>Amount Payable</span>
        <strong class="text-gradient">$${totals.total.toFixed(2)}</strong>
      </div>
    `;

    // Ensure card inputs are required initially
    const cardInputs = document.querySelectorAll('#card-fields input');
    cardInputs.forEach(input => input.required = true);

    switchView('view-checkout');
  }

  function calculateAmounts() {
    let subtotal = 0;
    appState.selectedSeats.forEach(seat => {
      const row = seat.split('-')[0];
      let cat = 'Standard';
      for (const [catName, config] of Object.entries(SEAT_LAYOUT.categories)) {
        if (config.rows.includes(row)) {
          cat = catName;
          break;
        }
      }
      subtotal += SEAT_LAYOUT.categories[cat].price;
    });

    const fees = subtotal * 0.10;
    const total = subtotal + fees;

    return { subtotal, fees, total };
  }

  function processBookingCheckout() {
    const btn = document.getElementById('btn-submit-booking');
    const originalText = btn.innerHTML;
    
    // Visual processing spinner simulation
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="spinner" viewBox="0 0 50 50" width="20" height="20" style="animation: spin 1s linear infinite; margin-right: 8px;">
        <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="80, 200" stroke-linecap="round"></circle>
      </svg>
      <span>Authorizing Booking Transaction...</span>
    `;

    setTimeout(() => {
      // 1. Generate unique booking reference ID
      const txId = 'TX-' + Math.floor(100000 + Math.random() * 900000) + '-' + String.fromCharCode(65 + Math.floor(Math.random() * 26));
      
      const amounts = calculateAmounts();

      // 2. Build booking object
      const newBooking = {
        id: txId,
        movieId: appState.selectedMovie.id,
        movieTitle: appState.selectedMovie.title,
        cinemaId: appState.selectedCinema.id,
        cinemaName: appState.selectedCinema.name,
        dateString: appState.selectedDate.isoString,
        showtime: appState.selectedShowtime,
        seats: [...appState.selectedSeats],
        customerName: document.getElementById('checkout-name').value,
        customerEmail: document.getElementById('checkout-email').value,
        customerPhone: document.getElementById('checkout-phone').value,
        paymentMethod: document.querySelector('input[name="payment-type"]:checked').value,
        amountPaid: parseFloat(amounts.total.toFixed(2)),
        timestamp: Date.now(),
        status: 'active'
      };

      // 3. Push and sync
      appState.bookings.push(newBooking);
      syncBookingsWithLocalStorage();

      // Reset button
      btn.disabled = false;
      btn.innerHTML = originalText;

      // Reset form
      document.getElementById('booking-info-form').reset();

      // Render Confirmation receipt view
      renderConfirmationReceipt(newBooking);
      switchView('view-ticket');

    }, 2000);
  }

  // --- VIEW 5: CONFIRMATION RECEIPT TICKET ---
  function renderConfirmationReceipt(booking) {
    const container = document.getElementById('ticket-stub-receipt');
    
    // Parse formatting details
    const movie = appState.movies.find(m => m.id === booking.movieId) || { rating: 'PG-13', duration: '120 min' };
    
    const formattedDate = new Date(booking.dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    container.innerHTML = `
      <div class="ticket-stub">
        <div class="ticket-top">
          <div class="ticket-top-header">
            <span class="ticket-cinema-brand">${booking.cinemaName.split(':')[0]}</span>
            <span class="ticket-format-badge">${booking.showtime.includes('IMAX') ? 'IMAX 3D' : booking.showtime.includes('Dolby') ? 'DOLBY' : '2D CLASSIC'}</span>
          </div>
          <h2 class="ticket-movie-title">${booking.movieTitle}</h2>
          
          <div class="ticket-details-grid">
            <div class="ticket-info-block">
              <span class="ticket-info-label">Date</span>
              <span class="ticket-info-value">${formattedDate}</span>
            </div>
            <div class="ticket-info-block">
              <span class="ticket-info-label">Time</span>
              <span class="ticket-info-value">${booking.showtime.split(' ')[0]} ${booking.showtime.split(' ')[1]}</span>
            </div>
            <div class="ticket-info-block">
              <span class="ticket-info-label">Hall / Screen</span>
              <span class="ticket-info-value">${booking.cinemaId === 'cin-1' ? 'Screen 1 (IMAX)' : booking.cinemaId === 'cin-2' ? 'Screen 3 (Dolby)' : 'Screen 2'}</span>
            </div>
            <div class="ticket-info-block">
              <span class="ticket-info-label">Seats</span>
              <span class="ticket-info-value seat-value">${booking.seats.join(', ')}</span>
            </div>
            <div class="ticket-info-block">
              <span class="ticket-info-label">Customer</span>
              <span class="ticket-info-value">${booking.customerName}</span>
            </div>
            <div class="ticket-info-block">
              <span class="ticket-info-label">Price Total</span>
              <span class="ticket-info-value">$${booking.amountPaid.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="ticket-separator">
          <div class="ticket-hole-left"></div>
          <div class="ticket-hole-right"></div>
        </div>

        <div class="ticket-bottom">
          <div class="ticket-barcode-wrapper">
            <div class="ticket-barcode"></div>
            <span class="ticket-ref-id">${booking.id}</span>
          </div>
          <div class="ticket-qrcode-wrapper">
            <svg viewBox="0 0 100 100" width="60" height="60" style="color: #0f172a;">
              <rect x="0" y="0" width="20" height="20" fill="currentColor"/>
              <rect x="4" y="4" width="12" height="12" fill="#fff"/>
              <rect x="8" y="8" width="4" height="4" fill="currentColor"/>
              
              <rect x="80" y="0" width="20" height="20" fill="currentColor"/>
              <rect x="84" y="4" width="12" height="12" fill="#fff"/>
              <rect x="88" y="8" width="4" height="4" fill="currentColor"/>

              <rect x="0" y="80" width="20" height="20" fill="currentColor"/>
              <rect x="4" y="84" width="12" height="12" fill="#fff"/>
              <rect x="8" y="88" width="4" height="4" fill="currentColor"/>

              <rect x="30" y="20" width="8" height="8" fill="currentColor"/>
              <rect x="50" y="10" width="12" height="8" fill="currentColor"/>
              <rect x="45" y="45" width="15" height="15" fill="currentColor"/>
              <rect x="75" y="55" width="8" height="20" fill="currentColor"/>
              <rect x="35" y="70" width="16" height="8" fill="currentColor"/>
            </svg>
          </div>
        </div>
      </div>
    `;

    // Done confirmation button
    document.getElementById('btn-ticket-done').onclick = () => {
      switchView('view-explorer');
    };

    // Print button
    document.getElementById('btn-print-ticket').onclick = () => {
      window.print();
    };
  }

  // --- VIEW 6: BOOKINGS HISTORY LIST ---
  function renderBookingsHistory() {
    const list = document.getElementById('bookings-history-list');
    const tabActive = document.getElementById('tab-active-bookings');
    const tabPast = document.getElementById('tab-past-bookings');

    const showActive = tabActive.classList.contains('active');
    
    // Bind Tab Switching clicks
    tabActive.onclick = () => {
      tabActive.classList.add('active');
      tabPast.classList.remove('active');
      renderBookingsHistory();
    };
    tabPast.onclick = () => {
      tabPast.classList.add('active');
      tabActive.classList.remove('active');
      renderBookingsHistory();
    };

    list.innerHTML = '';

    const sortedBookings = [...appState.bookings].sort((a, b) => b.timestamp - a.timestamp);

    const filtered = sortedBookings.filter(b => {
      if (showActive) {
        return b.status === 'active';
      } else {
        return b.status === 'cancelled' || b.status === 'completed';
      }
    });

    if (filtered.length === 0) {
      list.innerHTML = `
        <div class="empty-bookings-state">
          <svg viewBox="0 0 24 24" width="48" height="48"><path d="M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2L7.5 3.5L6 2L4.5 3.5L3 2v20z" fill="currentColor"/></svg>
          <h3>No bookings found</h3>
          <p>You have no tickets in this category yet.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(booking => {
      const movieObj = appState.movies.find(m => m.id === booking.movieId) || { posterUrl: '' };
      
      const item = document.createElement('div');
      item.className = 'booking-item-card';
      
      const dateText = new Date(booking.dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      let statusBadge = '';
      if (booking.status === 'active') {
        statusBadge = `<span class="status-indicator-badge status-active">Active</span>`;
      } else if (booking.status === 'cancelled') {
        statusBadge = `<span class="status-indicator-badge status-cancelled">Cancelled</span>`;
      } else {
        statusBadge = `<span class="status-indicator-badge status-completed">Completed</span>`;
      }

      item.innerHTML = `
        <div class="booking-item-left">
          <img class="booking-item-poster" src="${movieObj.posterUrl}" onerror="this.src='https://placehold.co/80x120/1e293b/ffffff?text=${encodeURIComponent(booking.movieTitle)}'">
          <div class="booking-item-title-info">
            <h3>${booking.movieTitle}</h3>
            <div class="booking-item-meta">
              <span><strong>Theater:</strong> ${booking.cinemaName}</span>
              <span><strong>Session:</strong> ${dateText} @ ${booking.showtime}</span>
              <span><strong>Seats:</strong> ${booking.seats.join(', ')}</span>
            </div>
          </div>
        </div>
        <div class="booking-item-right">
          <div class="booking-item-cost">$${booking.amountPaid.toFixed(2)}</div>
          ${statusBadge}
          ${booking.status === 'active' ? `<button class="btn btn-outline cancel-booking-btn" data-id="${booking.id}">Cancel</button>` : ''}
        </div>
      `;

      // Cancel button action
      const cancelBtn = item.querySelector('.cancel-booking-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (confirm('Are you sure you want to cancel this booking? This will refund $${booking.amountPaid.toFixed(2)} and release the seats.')) {
            cancelBooking(booking.id);
          }
        });
      }

      list.appendChild(item);
    });
  }

  function cancelBooking(bookingId) {
    const booking = appState.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'cancelled';
      syncBookingsWithLocalStorage();
      renderBookingsHistory();
      // Toast notification or popup
      alert('Booking ' + bookingId + ' has been cancelled successfully.');
    }
  }

  // --- VIEW 7: ADMIN PORTAL DASHBOARD ---
  function setupAdminViewEvents() {
    // Add movie form handler
    const addForm = document.getElementById('add-movie-form');
    addForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addNewMovie();
    });

    // Reset database handler
    document.getElementById('btn-admin-reset-bookings').addEventListener('click', () => {
      if (confirm('This action will reset the movies and booking database back to factory values. Continue?')) {
        localStorage.removeItem('cw_bookings');
        localStorage.removeItem('cw_movies');
        loadDatabase();
        renderAdminDashboard();
        alert('System database has been successfully reset.');
      }
    });
  }

  function renderAdminDashboard() {
    // 1. Calculate Mini Metrics
    const totalTickets = appState.bookings.reduce((sum, b) => b.status !== 'cancelled' ? sum + b.seats.length : sum, 0);
    const totalRevenue = appState.bookings.reduce((sum, b) => b.status !== 'cancelled' ? sum + b.amountPaid : sum, 0);
    
    // Calculate total seats possible vs occupied to show occupancy
    // E.g. Assume 10 showtimes exist, each has 108 seats = 1080 total slots.
    const totalSlotsPossible = 15 * 108; // 15 dynamic sessions
    const occupancyRate = (totalTickets / totalSlotsPossible) * 100;

    document.getElementById('stat-total-tickets').textContent = totalTickets;
    document.getElementById('stat-total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('stat-occupancy-rate').textContent = `${occupancyRate.toFixed(1)}%`;

    // 2. Render Revenue Bar Chart (Revenue Share per Movie)
    const chartBarsContainer = document.getElementById('revenue-chart-bars');
    chartBarsContainer.innerHTML = '';

    // Calculate revenue per movie
    const movieRevenues = {};
    appState.movies.forEach(m => movieRevenues[m.id] = { title: m.title, revenue: 0 });
    
    appState.bookings.forEach(b => {
      if (b.status !== 'cancelled' && movieRevenues[b.movieId]) {
        movieRevenues[b.movieId].revenue += b.amountPaid;
      }
    });

    // Find max revenue to scale percentages
    let maxRevenue = 0;
    Object.values(movieRevenues).forEach(mObj => {
      if (mObj.revenue > maxRevenue) maxRevenue = mObj.revenue;
    });

    Object.values(movieRevenues).forEach(mObj => {
      const pct = maxRevenue > 0 ? (mObj.revenue / maxRevenue) * 100 : 0;
      
      const chartRow = document.createElement('div');
      chartRow.className = 'chart-row';
      chartRow.innerHTML = `
        <div class="chart-row-labels">
          <span class="chart-row-title">${mObj.title}</span>
          <span class="chart-row-value">$${mObj.revenue.toFixed(2)}</span>
        </div>
        <div class="chart-bar-bg">
          <div class="chart-bar-fill" style="width: 0%;"></div>
        </div>
      `;
      chartBarsContainer.appendChild(chartRow);

      // Trigger width slide animation
      setTimeout(() => {
        chartRow.querySelector('.chart-bar-fill').style.width = `${pct}%`;
      }, 50);
    });

    // 3. Render Recent Reserves Table
    const tableBody = document.getElementById('admin-recent-bookings-table');
    tableBody.innerHTML = '';

    const recent = [...appState.bookings]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5); // top 5 recent

    recent.forEach(booking => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${booking.id.split('-')[1]}</strong></td>
        <td>${booking.movieTitle.split(':')[0]}</td>
        <td><span style="color: var(--color-selected); font-weight: 700;">${booking.seats.length} seats</span></td>
        <td>${booking.cinemaName.split(':')[0]}</td>
        <td>$${booking.amountPaid.toFixed(2)}</td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function addNewMovie() {
    const titleVal = document.getElementById('admin-title').value;
    const genreVal = document.getElementById('admin-genre').value.split(',').map(s => s.trim());
    const ratingVal = document.getElementById('admin-rating').value;
    const durationVal = document.getElementById('admin-duration').value;
    const userRatingVal = parseFloat(document.getElementById('admin-userrating').value) || 8.0;
    const directorVal = document.getElementById('admin-director').value;
    const castVal = document.getElementById('admin-cast').value.split(',').map(s => s.trim());
    const synopsisVal = document.getElementById('admin-synopsis').value;

    const idVal = 'mov-' + (appState.movies.length + 1);

    // Random banner gradient matching palette
    const bannerGradients = [
      'linear-gradient(135deg, rgba(88, 28, 135, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)',
      'linear-gradient(135deg, rgba(6, 95, 70, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)',
      'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)'
    ];
    const randBanner = bannerGradients[Math.floor(Math.random() * bannerGradients.length)];

    const newMovie = {
      id: idVal,
      title: titleVal,
      genre: genreVal,
      rating: ratingVal,
      userRating: userRatingVal,
      duration: durationVal,
      language: 'English',
      releaseDate: new Date().toISOString().split('T')[0],
      director: directorVal,
      cast: castVal,
      synopsis: synopsisVal,
      bannerColor: randBanner,
      posterUrl: 'assets/poster_nebula.png', // default mockup fallback
      trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    };

    appState.movies.push(newMovie);
    localStorage.setItem('cw_movies', JSON.stringify(appState.movies));

    // Reset Form
    document.getElementById('add-movie-form').reset();
    
    // Refresh admin UI
    renderAdminDashboard();
    
    // Refresh Explorer
    renderMoviesGrid();

    alert(`Movie "${titleVal}" added successfully to the catalog!`);
  }

  // --- TRAILER LIGHTBOX MODAL ---
  function openTrailerModal(embedUrl) {
    const modal = document.getElementById('trailer-modal');
    const iframe = document.getElementById('trailer-iframe');
    
    iframe.src = embedUrl;
    modal.classList.add('open');

    const closeBtn = document.getElementById('trailer-close-btn');
    
    const closeModal = () => {
      modal.classList.remove('open');
      iframe.src = ''; // Clear source to stop audio play
    };

    closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  }

  // --- RUN APP ---
  initApp();

  // Expose CineWaveApp API globally for chatbot integration
  window.CineWaveApp = {
    getState: () => appState,
    switchView: (viewId) => {
      switchView(viewId);
      if (viewId === 'view-bookings') renderBookingsHistory();
      if (viewId === 'view-admin') renderAdminDashboard();
    },
    openMovieDetails: (movieId) => {
      openMovieDetails(movieId);
    },
    openSeatSelection: () => {
      openSeatSelection();
    },
    openCheckoutPage: () => {
      openCheckoutPage();
    },
    cancelBooking: (bookingId) => {
      cancelBooking(bookingId);
    },
    syncBookings: () => {
      syncBookingsWithLocalStorage();
    },
    loadDatabase: () => {
      loadDatabase();
    },
    renderMoviesGrid: () => {
      renderMoviesGrid();
    },
    renderBookingsHistory: () => {
      renderBookingsHistory();
    },
    renderAdminDashboard: () => {
      renderAdminDashboard();
    }
  };
});
