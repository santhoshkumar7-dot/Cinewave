/**
 * CineWave - Interactive Online Chatbot Assistant
 */

document.addEventListener('DOMContentLoaded', () => {
  // Wait for CineWaveApp API to load
  let CineWaveApp = window.CineWaveApp;
  
  // Retry mechanism if app.js is slightly delayed
  let retryCount = 0;
  const checkAppReady = setInterval(() => {
    if (window.CineWaveApp) {
      CineWaveApp = window.CineWaveApp;
      clearInterval(checkAppReady);
      initChatbot();
    } else if (retryCount++ > 20) {
      clearInterval(checkAppReady);
      console.error('CineWaveApp API failed to load.');
    }
  }, 100);

  function initChatbot() {
    // --- STATE MACHINE FOR GUIDED BOOKING ---
    const BookingStates = {
      IDLE: 'idle',
      WAITING_FOR_MOVIE: 'waiting_for_movie',
      WAITING_FOR_CINEMA: 'waiting_for_cinema',
      WAITING_FOR_DATE: 'waiting_for_date',
      WAITING_FOR_TIME: 'waiting_for_time',
      WAITING_FOR_SEAT_CLASS: 'waiting_for_seat_class',
      WAITING_FOR_SEAT_QTY: 'waiting_for_seat_qty',
      WAITING_FOR_CONFIRM: 'waiting_for_confirm'
    };

    let chatState = {
      bookingState: BookingStates.IDLE,
      movie: null,       // movie object
      cinema: null,      // cinema object
      date: null,        // date object
      showtime: null,    // showtime string
      seatClass: null,   // VIP / Premium / Standard
      seatQty: 0,        // 1 - 10
      hasSeenIntro: false
    };

    // DOM Elements
    const chatContainer = document.getElementById('chatbot-container');
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    const closeBtn = document.getElementById('chat-close');
    const clearBtn = document.getElementById('chat-clear');
    const messagesFeed = document.getElementById('chatbot-messages');
    const chatInput = document.getElementById('chat-input-field');
    const sendBtn = document.getElementById('chat-send-btn');
    const micBtn = document.getElementById('chat-mic-btn');

    // Toggle Badge
    let notificationBadge = toggleBtn.querySelector('.notification-badge');
    if (!notificationBadge) {
      notificationBadge = document.createElement('span');
      notificationBadge.className = 'notification-badge';
      toggleBtn.appendChild(notificationBadge);
    }

    // Toggle Chat Window Visibility
    toggleBtn.addEventListener('click', () => {
      chatContainer.classList.toggle('open');
      if (chatContainer.classList.contains('open')) {
        if (notificationBadge) {
          notificationBadge.remove();
          notificationBadge = null;
        }
        chatInput.focus();
        if (!chatState.hasSeenIntro) {
          sendBotIntroduction();
        }
      }
    });

    closeBtn.addEventListener('click', () => {
      chatContainer.classList.remove('open');
    });

    clearBtn.addEventListener('click', () => {
      if (confirm('Clear chat history?')) {
        messagesFeed.innerHTML = '';
        chatState.bookingState = BookingStates.IDLE;
        sendBotIntroduction();
      }
    });

    // Send Handlers
    sendBtn.addEventListener('click', handleUserMessageSend);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleUserMessageSend();
      }
    });

    // Voice / Mic Speech Dictation
    let recognition;
    let isListening = false;
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('listening');
        chatInput.placeholder = 'Listening...';
      };

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        chatInput.value = text;
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopListening();
      };

      recognition.onend = () => {
        stopListening();
      };
    } else {
      micBtn.style.display = 'none'; // Speech recognition not supported
    }

    function stopListening() {
      isListening = false;
      micBtn.classList.remove('listening');
      chatInput.placeholder = 'Ask me anything...';
      if (recognition) recognition.stop();
    }

    micBtn.addEventListener('click', () => {
      if (!recognition) return;
      if (isListening) {
        stopListening();
      } else {
        recognition.start();
      }
    });

    // --- RENDER METHODS ---

    function appendMessage(sender, text, extraHtml = '') {
      const msgRow = document.createElement('div');
      msgRow.className = `chat-msg-row ${sender}-row`;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      msgRow.innerHTML = `
        <div class="chat-bubble">
          ${text.replace(/\n/g, '<br>')}
          ${extraHtml}
        </div>
        <div class="chat-time">${timeStr}</div>
      `;

      messagesFeed.appendChild(msgRow);
      messagesFeed.scrollTop = messagesFeed.scrollHeight;
    }

    function showTypingIndicator() {
      let indicator = document.getElementById('chat-typing-indicator');
      if (indicator) return;

      indicator = document.createElement('div');
      indicator.id = 'chat-typing-indicator';
      indicator.className = 'chat-msg-row bot-row';
      indicator.innerHTML = `
        <div class="chat-bubble" style="padding: 8px 12px;">
          <div class="typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      `;
      messagesFeed.appendChild(indicator);
      messagesFeed.scrollTop = messagesFeed.scrollHeight;
    }

    function hideTypingIndicator() {
      const indicator = document.getElementById('chat-typing-indicator');
      if (indicator) {
        indicator.remove();
      }
    }

    function renderChips(chips, onClickCallback) {
      const chipsContainer = document.createElement('div');
      chipsContainer.className = 'chat-chips-container';

      chips.forEach(chip => {
        const chipBtn = document.createElement('button');
        chipBtn.className = 'chat-chip';
        chipBtn.textContent = chip.label;
        chipBtn.addEventListener('click', () => {
          onClickCallback(chip);
          chipsContainer.remove(); // Clear after selection
        });
        chipsContainer.appendChild(chipBtn);
      });

      messagesFeed.appendChild(chipsContainer);
      messagesFeed.scrollTop = messagesFeed.scrollHeight;
    }

    // --- CHATBOT INTRO ---

    function sendBotIntroduction() {
      chatState.hasSeenIntro = true;
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        appendMessage('bot', "Hello! 👋 I'm **CineWave Assistant**. How can I help you today? You can search for movies, ask FAQs, check active tickets, or book a show right here!");
        renderInitialOptions();
      }, 700);
    }

    function renderInitialOptions() {
      const options = [
        { label: "🎬 What's Showing?", value: "what_is_showing" },
        { label: "🎟️ Book Tickets", value: "book_tickets" },
        { label: "📅 Active Bookings", value: "active_bookings" },
        { label: "💬 Refund/FAQs", value: "refund_faq" }
      ];

      renderChips(options, (chip) => {
        appendMessage('user', chip.label);
        processSystemCommand(chip.value);
      });
    }

    // --- SYSTEM COMMANDS ---

    function processSystemCommand(cmdValue) {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        switch (cmdValue) {
          case 'what_is_showing':
            displayMoviesList();
            break;
          case 'book_tickets':
            startBookingFlow();
            break;
          case 'active_bookings':
            displayActiveBookings();
            break;
          case 'refund_faq':
            displayFAQMenu();
            break;
        }
      }, 800);
    }

    // --- FAQS & DETAILS ---

    function displayFAQMenu() {
      appendMessage('bot', "Select an FAQ category or ask me in natural language (e.g. 'Can I get a refund?'):");
      const faqs = [
        { label: "💸 Cancellation/Refund", value: "faq_cancel" },
        { label: "🛋️ Seating & Prices", value: "faq_seating" },
        { label: "💳 Payment Methods", value: "faq_payments" },
        { label: "📞 Support Contact", value: "faq_support" }
      ];
      renderChips(faqs, (chip) => {
        appendMessage('user', chip.label);
        showTypingIndicator();
        setTimeout(() => {
          hideTypingIndicator();
          handleFaqResponse(chip.value);
        }, 600);
      });
    }

    function handleFaqResponse(faqCode) {
      let reply = "";
      switch (faqCode) {
        case 'faq_cancel':
          reply = "You can cancel any booking up to **2 hours** before the showtime. Simply go to **My Bookings** tab, find your ticket, and click 'Cancel'. Your refund will be processed immediately to your original payment method.";
          break;
        case 'faq_seating':
          reply = "We offer three seating classes:\n- **VIP Recliner ($25.00)**: Luxurious leather recliners with extra legroom & snacker service.\n- **Premium Club ($18.00)**: Plush high-back seats with premium center angles.\n- **Standard Classic ($12.00)**: Comfortable classic cinema seats.";
          break;
        case 'faq_payments':
          reply = "We support multiple mock payment routes:\n1. **Credit/Debit Cards**: Visa, MasterCard, etc.\n2. **UPI QR Code**: Scan code with any simulator app.\n3. **WavePay Wallet**: Pre-loaded credits.";
          break;
        case 'faq_support':
          reply = "Need help? Call our support desk at **+1 (555) 999-CINE** or email **support@cinewave.com**. We are available 24/7!";
          break;
      }
      appendMessage('bot', reply);
      renderInitialOptions();
    }

    // --- DISPLAY BOOKINGS ---

    function displayActiveBookings() {
      const state = CineWaveApp.getState();
      const active = state.bookings.filter(b => b.status === 'active');

      if (active.length === 0) {
        appendMessage('bot', "You don't have any active bookings at the moment. Would you like to book one now?");
        renderInitialOptions();
        return;
      }

      appendMessage('bot', `I found **${active.length} active ticket(s)** for you:`);
      
      active.forEach(b => {
        const dateText = new Date(b.dateString).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });

        const ticketHtml = `
          <div class="chat-ticket">
            <div class="chat-ticket-header">
              <span>REF: <strong>${b.id}</strong></span>
              <span>ACTIVE</span>
            </div>
            <div class="chat-ticket-body">
              <div class="chat-ticket-title">${b.movieTitle}</div>
              <div class="chat-ticket-grid">
                <div><span class="chat-ticket-lbl">Theater</span><br><span class="chat-ticket-val">${b.cinemaName.split(':')[0]}</span></div>
                <div><span class="chat-ticket-lbl">Date & Time</span><br><span class="chat-ticket-val">${dateText} @ ${b.showtime.split(' ')[0]}</span></div>
                <div style="grid-column: span 2;"><span class="chat-ticket-lbl">Seats Selected</span><br><span class="chat-ticket-val seats">${b.seats.join(', ')}</span></div>
              </div>
            </div>
            <div class="chat-ticket-footer">
              <span class="chat-ticket-ref">Paid via ${b.paymentMethod.toUpperCase()}</span>
              <span class="chat-ticket-price">$${b.amountPaid.toFixed(2)}</span>
            </div>
          </div>
        `;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ticketHtml;
        messagesFeed.appendChild(tempDiv.firstElementChild);
      });

      messagesFeed.scrollTop = messagesFeed.scrollHeight;

      // Provide navigation helper
      setTimeout(() => {
        appendMessage('bot', "Would you like me to open the active ticket management view on the main website screen?");
        renderChips([
          { label: "Yes, open My Bookings", value: "nav_bookings" },
          { label: "No, keep chatting", value: "keep_chatting" }
        ], (chip) => {
          appendMessage('user', chip.label);
          if (chip.value === 'nav_bookings') {
            CineWaveApp.switchView('view-bookings');
            appendMessage('bot', "I have opened the bookings dashboard on the main view.");
          } else {
            appendMessage('bot', "Got it! Let's continue chatting.");
            renderInitialOptions();
          }
        });
      }, 500);
    }

    // --- MOVIE LISTING CARDS ---

    function displayMoviesList() {
      const state = CineWaveApp.getState();
      appendMessage('bot', "Here are the movies currently showing at our theaters:");

      const container = document.createElement('div');
      container.className = 'chat-movies-list';

      state.movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'chat-movie-card';
        card.innerHTML = `
          <img class="chat-movie-poster" src="${movie.posterUrl}" onerror="this.src='https://placehold.co/80x120/1e293b/ffffff?text=${encodeURIComponent(movie.title)}'">
          <div class="chat-movie-info">
            <div class="chat-movie-title">${movie.title}</div>
            <div class="chat-movie-meta">${movie.genre.slice(0,2).join('/')} • ⭐ ${movie.userRating}</div>
            <div class="chat-movie-actions">
              <button class="chat-movie-btn btn-details" data-id="${movie.id}">Details</button>
              <button class="chat-movie-btn btn-book" data-id="${movie.id}">Book</button>
            </div>
          </div>
        `;

        card.querySelector('.btn-details').addEventListener('click', () => {
          CineWaveApp.openMovieDetails(movie.id);
          appendMessage('bot', `I've opened the details page for **${movie.title}** on the main website screen!`);
        });

        card.querySelector('.btn-book').addEventListener('click', () => {
          chatState.movie = movie;
          chatState.bookingState = BookingStates.WAITING_FOR_CINEMA;
          askForCinema();
        });

        container.appendChild(card);
      });

      messagesFeed.appendChild(container);
      messagesFeed.scrollTop = messagesFeed.scrollHeight;
    }

    // --- BOOKING STATE MACHINE LOGIC ---

    function startBookingFlow() {
      chatState.bookingState = BookingStates.WAITING_FOR_MOVIE;
      chatState.movie = null;
      chatState.cinema = null;
      chatState.date = null;
      chatState.showtime = null;
      chatState.seatClass = null;
      chatState.seatQty = 0;

      const state = CineWaveApp.getState();
      appendMessage('bot', "Which movie would you like to book? Please click one below:");
      
      const chips = state.movies.map(m => ({ label: m.title, value: m.id }));
      renderChips(chips, (chip) => {
        appendMessage('user', `Book ${chip.label}`);
        const selected = state.movies.find(m => m.id === chip.value);
        if (selected) {
          chatState.movie = selected;
          chatState.bookingState = BookingStates.WAITING_FOR_CINEMA;
          askForCinema();
        }
      });
    }

    function askForCinema() {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        appendMessage('bot', `Excellent choice! **${chatState.movie.title}** is playing. Which cinema location do you prefer?`);
        
        // Starlight Indie screen filter simulation
        const availableCinemas = CINEMAS.filter(cinema => {
          if (cinema.id === 'cin-3' && 
              !(chatState.movie.genre.includes('Drama') || 
                chatState.movie.genre.includes('Romance') || 
                chatState.movie.genre.includes('Fantasy'))) {
            return false;
          }
          return true;
        });

        const chips = availableCinemas.map(c => ({ label: c.name.split(':')[0], value: c.id }));
        renderChips(chips, (chip) => {
          appendMessage('user', chip.label);
          chatState.cinema = CINEMAS.find(c => c.id === chip.value);
          chatState.bookingState = BookingStates.WAITING_FOR_DATE;
          askForDate();
        });
      }, 600);
    }

    function askForDate() {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        appendMessage('bot', `Got it: **${chatState.cinema.name.split(':')[0]}**. Which date would you like to attend?`);

        const dates = getBookingDates().slice(0, 4); // show next 4 days
        const chips = dates.map(d => ({ label: `${d.dayName}, ${d.month} ${d.dayNum}`, value: d.isoString }));
        renderChips(chips, (chip) => {
          appendMessage('user', chip.label);
          chatState.date = dates.find(d => d.isoString === chip.value);
          chatState.bookingState = BookingStates.WAITING_FOR_TIME;
          askForShowtime();
        });
      }, 600);
    }

    function askForShowtime() {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        appendMessage('bot', `Great! Select a showtime session:`);

        let showtimes = [];
        if (chatState.cinema.id === 'cin-1') {
          showtimes = ['11:00 AM (IMAX)', '2:30 PM (IMAX)', '5:45 PM (IMAX)', '9:00 PM (IMAX)'];
        } else if (chatState.cinema.id === 'cin-2') {
          showtimes = ['1:30 PM (Dolby)', '4:45 PM (Dolby)', '8:00 PM (Dolby)'];
        } else {
          showtimes = ['12:15 PM (2D)', '3:45 PM (2D)', '7:15 PM (2D)'];
        }

        const chips = showtimes.map(t => ({ label: t, value: t }));
        renderChips(chips, (chip) => {
          appendMessage('user', chip.label);
          chatState.showtime = chip.value;
          chatState.bookingState = BookingStates.WAITING_FOR_SEAT_CLASS;
          askForSeatClass();
        });
      }, 600);
    }

    function askForSeatClass() {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        appendMessage('bot', `Which seating category would you like?\n- **VIP ($25.00)**\n- **Premium ($18.00)**\n- **Standard ($12.00)**`);

        const categories = [
          { label: "🛋️ VIP ($25.00)", value: "VIP" },
          { label: "⭐ Premium ($18.00)", value: "Premium" },
          { label: "🎟️ Standard ($12.00)", value: "Standard" }
        ];

        renderChips(categories, (chip) => {
          appendMessage('user', chip.value);
          chatState.seatClass = chip.value;
          chatState.bookingState = BookingStates.WAITING_FOR_SEAT_QTY;
          askForSeatQty();
        });
      }, 600);
    }

    function askForSeatQty() {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        appendMessage('bot', `How many seats would you like to book? (Max 10 seats)`);

        const qtys = [
          { label: "1", value: 1 },
          { label: "2", value: 2 },
          { label: "3", value: 3 },
          { label: "4", value: 4 },
          { label: "5", value: 5 }
        ];

        renderChips(qtys, (chip) => {
          appendMessage('user', `${chip.value} seat(s)`);
          chatState.seatQty = parseInt(chip.value);
          chatState.bookingState = BookingStates.WAITING_FOR_CONFIRM;
          confirmBookingDetails();
        });
      }, 600);
    }

    function confirmBookingDetails() {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();

        const seatPrice = SEAT_LAYOUT.categories[chatState.seatClass].price;
        const subtotal = chatState.seatQty * seatPrice;
        const fees = subtotal * 0.10;
        const total = subtotal + fees;

        const summary = `
          **Order Summary:**
          🎥 Movie: **${chatState.movie.title}**
          📍 Theater: **${chatState.cinema.name.split(':')[0]}**
          📅 Date: **${chatState.date.dayName}, ${chatState.date.month} ${chatState.date.dayNum}**
          ⏰ Session: **${chatState.showtime}**
          🛋️ Seats Type: **${chatState.seatClass}** (${chatState.seatQty}x)
          💵 Total Payable: **$${total.toFixed(2)}** (inc. 10% booking fee)
        `;

        appendMessage('bot', summary + "\nWould you like to authorize this mock booking?");

        renderChips([
          { label: "💳 Pay & Confirm", value: "confirm" },
          { label: "❌ Cancel Booking", value: "cancel" }
        ], (chip) => {
          appendMessage('user', chip.label);
          if (chip.value === 'confirm') {
            executeTicketBooking();
          } else {
            appendMessage('bot', "Booking process cancelled. Let me know if you want to search other shows.");
            chatState.bookingState = BookingStates.IDLE;
            renderInitialOptions();
          }
        });
      }, 700);
    }

    function executeTicketBooking() {
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();

        // 1. Check seat conflicts and pick seats
        const state = CineWaveApp.getState();
        const reserveKey = `${chatState.movie.id}_${chatState.cinema.id}_${chatState.date.isoString}_${chatState.showtime}`;
        const bookedSeats = state.reservedSeatsMap[reserveKey] || [];
        
        // Scan for available seats of selected category
        const catConfig = SEAT_LAYOUT.categories[chatState.seatClass];
        const chosenSeats = [];
        
        for (const rowLetter of catConfig.rows) {
          for (let col = 1; col <= SEAT_LAYOUT.cols; col++) {
            const seatLabel = `${rowLetter}-${col}`;
            if (!bookedSeats.includes(seatLabel)) {
              chosenSeats.push(seatLabel);
              if (chosenSeats.length >= chatState.seatQty) break;
            }
          }
          if (chosenSeats.length >= chatState.seatQty) break;
        }

        if (chosenSeats.length < chatState.seatQty) {
          appendMessage('bot', `🚨 **Booking Error**: I'm sorry, there are not enough available **${chatState.seatClass}** seats remaining for this showtime. Please try a different category or time slot.`);
          chatState.bookingState = BookingStates.IDLE;
          renderInitialOptions();
          return;
        }

        // 2. Build booking object
        const txId = 'TX-' + Math.floor(100000 + Math.random() * 900000) + '-C';
        const seatPrice = catConfig.price;
        const subtotal = chatState.seatQty * seatPrice;
        const total = subtotal + (subtotal * 0.1);

        const newBooking = {
          id: txId,
          movieId: chatState.movie.id,
          movieTitle: chatState.movie.title,
          cinemaId: chatState.cinema.id,
          cinemaName: chatState.cinema.name,
          dateString: chatState.date.isoString,
          showtime: chatState.showtime,
          seats: chosenSeats,
          customerName: 'CineWave Assistant Guest',
          customerEmail: 'assistant.guest@cinewave.com',
          customerPhone: '+1 (555) 000-8888',
          paymentMethod: 'card',
          amountPaid: parseFloat(total.toFixed(2)),
          timestamp: Date.now(),
          status: 'active'
        };

        // 3. Inject into global App
        state.bookings.push(newBooking);
        CineWaveApp.syncBookings();
        CineWaveApp.renderMoviesGrid();
        CineWaveApp.renderBookingsHistory();
        CineWaveApp.renderAdminDashboard();

        // 4. Render Boarding Pass in Chat
        appendMessage('bot', "🎉 **Success!** Your booking has been confirmed and stored in LocalStorage. Here is your digital ticket pass:");

        const ticketHtml = `
          <div class="chat-ticket">
            <div class="chat-ticket-header">
              <span>REF: <strong>${newBooking.id}</strong></span>
              <span>CONFIRMED</span>
            </div>
            <div class="chat-ticket-body">
              <div class="chat-ticket-title">${newBooking.movieTitle}</div>
              <div class="chat-ticket-grid">
                <div><span class="chat-ticket-lbl">Theater</span><br><span class="chat-ticket-val">${newBooking.cinemaName.split(':')[0]}</span></div>
                <div><span class="chat-ticket-lbl">Date & Time</span><br><span class="chat-ticket-val">${chatState.date.dayName}, ${chatState.date.month} ${chatState.date.dayNum} @ ${newBooking.showtime.split(' ')[0]}</span></div>
                <div style="grid-column: span 2;"><span class="chat-ticket-lbl">Seats Assigned</span><br><span class="chat-ticket-val seats">${newBooking.seats.join(', ')}</span></div>
              </div>
            </div>
            <div class="chat-ticket-footer">
              <span class="chat-ticket-ref">Paid via CARD</span>
              <span class="chat-ticket-price">$${newBooking.amountPaid.toFixed(2)}</span>
            </div>
          </div>
        `;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = ticketHtml;
        messagesFeed.appendChild(tempDiv.firstElementChild);
        messagesFeed.scrollTop = messagesFeed.scrollHeight;

        // Reset chatbot state
        chatState.bookingState = BookingStates.IDLE;

        setTimeout(() => {
          appendMessage('bot', "Enjoy your movie! You can check this ticket anytime in your booking history on the main page. Let me know if you need anything else!");
          renderInitialOptions();
        }, 800);

      }, 1500);
    }

    // --- CHAT MESSAGE ROUTER (NLP PATTERNS) ---

    function handleUserMessageSend() {
      const text = chatInput.value.trim();
      if (!text) return;

      appendMessage('user', text);
      chatInput.value = '';
      stopListening();

      // If we are currently in a guided booking state, hand off to state parser
      if (chatState.bookingState !== BookingStates.IDLE) {
        parseBookingStateInput(text);
        return;
      }

      // FAQ / NLP Keyword Router
      showTypingIndicator();
      setTimeout(() => {
        hideTypingIndicator();
        parseNlpKeywords(text);
      }, 700);
    }

    function parseBookingStateInput(input) {
      // Natural speech fallback for booking flow steps (e.g. typing details)
      const text = input.toLowerCase().trim();
      
      if (text.includes('cancel') || text.includes('exit') || text.includes('quit') || text.includes('stop')) {
        appendMessage('bot', "Booking cancelled. Back to main menu.");
        chatState.bookingState = BookingStates.IDLE;
        renderInitialOptions();
        return;
      }

      const state = CineWaveApp.getState();

      switch (chatState.bookingState) {
        case BookingStates.WAITING_FOR_MOVIE:
          const matchedMovie = state.movies.find(m => m.title.toLowerCase().includes(text));
          if (matchedMovie) {
            chatState.movie = matchedMovie;
            chatState.bookingState = BookingStates.WAITING_FOR_CINEMA;
            askForCinema();
          } else {
            appendMessage('bot', "Sorry, I couldn't match that movie. Please click one of the option buttons above, or type 'cancel' to exit.");
          }
          break;

        case BookingStates.WAITING_FOR_CINEMA:
          const matchedCinema = CINEMAS.find(c => c.name.toLowerCase().includes(text) || c.location.toLowerCase().includes(text));
          if (matchedCinema) {
            chatState.cinema = matchedCinema;
            chatState.bookingState = BookingStates.WAITING_FOR_DATE;
            askForDate();
          } else {
            appendMessage('bot', "I couldn't find that cinema location. Please select one of the suggested buttons.");
          }
          break;

        case BookingStates.WAITING_FOR_DATE:
          const dates = getBookingDates();
          const matchedDate = dates.find(d => d.dayName.toLowerCase() === text || text.includes(d.dayNum.toString()));
          if (matchedDate) {
            chatState.date = matchedDate;
            chatState.bookingState = BookingStates.WAITING_FOR_TIME;
            askForShowtime();
          } else {
            appendMessage('bot', "Please enter a valid day (e.g. 'Today', 'Sun' or click the date button).");
          }
          break;

        case BookingStates.WAITING_FOR_TIME:
          // Just verify if text matches format
          if (text.includes('am') || text.includes('pm')) {
            chatState.showtime = input; // take original casing
            chatState.bookingState = BookingStates.WAITING_FOR_SEAT_CLASS;
            askForSeatClass();
          } else {
            appendMessage('bot', "Please select a showtime button.");
          }
          break;

        case BookingStates.WAITING_FOR_SEAT_CLASS:
          if (text.includes('vip')) {
            chatState.seatClass = 'VIP';
          } else if (text.includes('premium')) {
            chatState.seatClass = 'Premium';
          } else if (text.includes('standard') || text.includes('classic')) {
            chatState.seatClass = 'Standard';
          } else {
            appendMessage('bot', "Please select VIP, Premium, or Standard.");
            return;
          }
          chatState.bookingState = BookingStates.WAITING_FOR_SEAT_QTY;
          askForSeatQty();
          break;

        case BookingStates.WAITING_FOR_SEAT_QTY:
          const num = parseInt(text.replace(/[^0-9]/g, ''));
          if (num >= 1 && num <= 10) {
            chatState.seatQty = num;
            chatState.bookingState = BookingStates.WAITING_FOR_CONFIRM;
            confirmBookingDetails();
          } else {
            appendMessage('bot', "Please enter a valid seat count between 1 and 10.");
          }
          break;

        case BookingStates.WAITING_FOR_CONFIRM:
          if (text.includes('yes') || text.includes('pay') || text.includes('confirm') || text.includes('ok')) {
            executeTicketBooking();
          } else {
            appendMessage('bot', "Authorisation cancelled. Back to main menu.");
            chatState.bookingState = BookingStates.IDLE;
            renderInitialOptions();
          }
          break;
      }
    }

    function parseNlpKeywords(inputText) {
      const text = inputText.toLowerCase().trim();

      // Greeting
      if (text.match(/^(hello|hi|hey|greetings|yo|morning|afternoon|evening|hola)/)) {
        appendMessage('bot', "Hi there! Welcome back. How can I help you check showtimes or book seats today?");
        renderInitialOptions();
        return;
      }

      // Help
      if (text.includes('help') || text.includes('menu') || text.includes('option') || text.includes('what can you do')) {
        appendMessage('bot', "I can help you with:\n1. **🎬 Browse Movies**: Show currently playing movies.\n2. **🎟️ Book Tickets**: Guides you step-by-step through seat reservations.\n3. **📅 View Tickets**: View details of active reservations.\n4. **💬 FAQs**: Help with refund policy, ticket prices, and payment methods.");
        renderInitialOptions();
        return;
      }

      // Booking triggers
      if (text.includes('book') || text.includes('ticket') || text.includes('reserve') || text.includes('seats')) {
        const state = CineWaveApp.getState();
        // check if movie title mentioned in command
        const mentionedMovie = state.movies.find(m => text.includes(m.title.toLowerCase()));
        if (mentionedMovie) {
          chatState.movie = mentionedMovie;
          chatState.bookingState = BookingStates.WAITING_FOR_CINEMA;
          askForCinema();
        } else {
          startBookingFlow();
        }
        return;
      }

      // Movies Search
      if (text.includes('movies') || text.includes('playing') || text.includes('showing') || text.includes('schedule') || text.includes('roster')) {
        displayMoviesList();
        return;
      }

      // Active bookings list
      if (text.includes('my booking') || text.includes('my ticket') || text.includes('history') || text.includes('active')) {
        displayActiveBookings();
        return;
      }

      // Cancel booking / refunds FAQ
      if (text.includes('cancel') || text.includes('refund') || text.includes('return')) {
        handleFaqResponse('faq_cancel');
        return;
      }

      // Pricing & Seat Class FAQ
      if (text.includes('price') || text.includes('cost') || text.includes('charge') || text.includes('vip') || text.includes('premium') || text.includes('standard') || text.includes('pricing')) {
        handleFaqResponse('faq_seating');
        return;
      }

      // Payment Options FAQ
      if (text.includes('payment') || text.includes('pay') || text.includes('card') || text.includes('upi') || text.includes('wallet')) {
        handleFaqResponse('faq_payments');
        return;
      }

      // Location & Cinema FAQ
      if (text.includes('location') || text.includes('cinema') || text.includes('theater') || text.includes('address') || text.includes('where')) {
        appendMessage('bot', "We have 3 major cinema theater complexes:\n1. **Apex Cinemas: Grand Central**: Midtown terminal, features IMAX 3D, Dolby Atmos.\n2. **Nova Theaters: Horizon Mall**: Westside Blvd, features Dolby Cinema, VIP reclining loungers.\n3. **Starlight Screen: Downtown**: Arts district, classic indie retro feel.");
        renderInitialOptions();
        return;
      }

      // Contact & Support FAQ
      if (text.includes('contact') || text.includes('support') || text.includes('help desk') || text.includes('phone') || text.includes('email')) {
        handleFaqResponse('faq_support');
        return;
      }

      // Search filters matched to movies
      const state = CineWaveApp.getState();
      const filteredMovies = state.movies.filter(movie => {
        return movie.genre.some(g => text.includes(g.toLowerCase())) ||
               movie.cast.some(c => text.includes(c.toLowerCase())) ||
               movie.director.toLowerCase().includes(text);
      });

      if (filteredMovies.length > 0) {
        appendMessage('bot', `I found **${filteredMovies.length} movie(s)** matching your query:`);
        const container = document.createElement('div');
        container.className = 'chat-movies-list';
        filteredMovies.forEach(movie => {
          const card = document.createElement('div');
          card.className = 'chat-movie-card';
          card.innerHTML = `
            <img class="chat-movie-poster" src="${movie.posterUrl}" onerror="this.src='https://placehold.co/80x120/1e293b/ffffff?text=${encodeURIComponent(movie.title)}'">
            <div class="chat-movie-info">
              <div class="chat-movie-title">${movie.title}</div>
              <div class="chat-movie-meta">${movie.genre.slice(0,2).join('/')} • ⭐ ${movie.userRating}</div>
              <div class="chat-movie-actions">
                <button class="chat-movie-btn btn-details" data-id="${movie.id}">Details</button>
                <button class="chat-movie-btn btn-book" data-id="${movie.id}">Book</button>
              </div>
            </div>
          `;
          card.querySelector('.btn-details').addEventListener('click', () => {
            CineWaveApp.openMovieDetails(movie.id);
            appendMessage('bot', `I've opened the details page for **${movie.title}**!`);
          });
          card.querySelector('.btn-book').addEventListener('click', () => {
            chatState.movie = movie;
            chatState.bookingState = BookingStates.WAITING_FOR_CINEMA;
            askForCinema();
          });
          container.appendChild(card);
        });
        messagesFeed.appendChild(container);
        messagesFeed.scrollTop = messagesFeed.scrollHeight;
        return;
      }

      // Fallback response
      appendMessage('bot', "I'm not sure I understand that. Can you rephrase it, or choose one of the options below?");
      renderInitialOptions();
    }
  }
});
