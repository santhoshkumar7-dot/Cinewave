/**
 * Movie Ticket Booking System - Data Configuration
 */

// Seating Configurations
const SEAT_LAYOUT = {
  rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'], // Skipping 'I' for clarity
  cols: 12,
  aisles: [3, 9], // Aisles after column 3 and column 9
  categories: {
    VIP: {
      rows: ['A', 'B'],
      price: 25.00,
      label: 'VIP Recliner',
      color: 'var(--color-vip)',
      description: 'Ultra-luxurious leather recliners with extra legroom and complimentary snack service.'
    },
    Premium: {
      rows: ['C', 'D', 'E', 'F'],
      price: 18.00,
      label: 'Premium Club',
      color: 'var(--color-premium)',
      description: 'Plush high-back seats with prime center-theater viewing angles.'
    },
    Standard: {
      rows: ['G', 'H', 'J'],
      price: 12.00,
      label: 'Standard Classic',
      color: 'var(--color-standard)',
      description: 'Comfortable standard cinema seats with clear acoustic sound.'
    }
  }
};

// Cinemas
const CINEMAS = [
  {
    id: 'cin-1',
    name: 'Apex Cinemas: Grand Central',
    location: '4th Floor, Grand Central Terminal, Midtown',
    amenities: ['Dolby Atmos', 'Laser Projection', 'Valet Parking', 'Reclining Seats'],
    formats: ['2D', '3D', 'IMAX 3D']
  },
  {
    id: 'cin-2',
    name: 'Nova Theaters: Horizon Mall',
    location: 'Horizon Mall, Westside Boulevard',
    amenities: ['Dolby Cinema', 'VIP Lounge', 'Gourmet Kitchen', 'Heated Seats'],
    formats: ['2D', 'Dolby Cinema']
  },
  {
    id: 'cin-3',
    name: 'Starlight Screen: Downtown',
    location: '88 Retro Lane, Downtown Arts District',
    amenities: ['Classic Retro vibe', 'Student Discounts', 'Indie Features'],
    formats: ['2D']
  }
];

// Initial Movie Database
const INITIAL_MOVIES = [
  {
    id: 'mov-1',
    title: 'Nebula Warriors: Starfall',
    genre: ['Sci-Fi', 'Action', 'Adventure'],
    rating: 'PG-13',
    userRating: 8.7,
    duration: '142 min',
    language: 'English (Dolby 7.1)',
    releaseDate: '2026-06-15',
    director: 'Marcus Vance',
    cast: ['Elena Sterling', 'Caleb Vance', 'Dax Thorne', 'Dr. Aris Vance'],
    synopsis: 'A band of rogue outer-rim fighters must unite to prevent a dark energy weapon from consuming the Galactic Core, facing internal betrayals and a ruthless alien hegemony.',
    bannerColor: 'linear-gradient(135deg, rgba(88, 28, 135, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)',
    posterUrl: 'assets/poster_nebula.png',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Mock embedding link
  },
  {
    id: 'mov-2',
    title: 'The Midnight Protocol',
    genre: ['Action', 'Thriller', 'Crime'],
    rating: 'R',
    userRating: 7.9,
    duration: '118 min',
    language: 'English (Atmos)',
    releaseDate: '2026-07-02',
    director: 'Sarah Lin',
    cast: ['Kenji Sato', 'Mia Alvarez', 'Vector Cole', 'Chief Vance'],
    synopsis: 'A disgraced cybersecurity operative has five hours through the rain-slicked, neon streets of Tokyo to halt a catastrophic global infrastructure hack initiated by his former partner.',
    bannerColor: 'linear-gradient(135deg, rgba(6, 95, 70, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)',
    posterUrl: 'assets/poster_midnight.png',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'mov-3',
    title: 'Whispers of the Forest',
    genre: ['Fantasy', 'Adventure', 'Drama'],
    rating: 'PG',
    userRating: 8.3,
    duration: '130 min',
    language: 'English (Dolby 5.1)',
    releaseDate: '2026-07-08',
    director: 'Olin Thorne',
    cast: ['Aria Meadows', 'Garrett Stone', 'Sage (Voice)', 'Elia Sun'],
    synopsis: 'When a botanist discovers an ancient glyph carved into a giant redwood, she is transported into a vibrant, hidden realm where trees communicate and an ancient shadow seeks to dry the life well.',
    bannerColor: 'linear-gradient(135deg, rgba(146, 64, 14, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)',
    posterUrl: 'assets/poster_forest.png',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'mov-4',
    title: 'Chronicles of Chronos',
    genre: ['Sci-Fi', 'Mystery', 'Mind-bend'],
    rating: 'PG-13',
    userRating: 8.1,
    duration: '125 min',
    language: 'English & French (Subtitles)',
    releaseDate: '2026-06-28',
    director: 'Julian Pierce',
    cast: ['Dr. Arthur Pendelton', 'Clara Vance', 'The Archivist'],
    synopsis: 'A physicist trapped in a decaying 45-minute temporal loop uncovers a shadow syndicate that has orchestrated major global conflicts from the shadows since the Middle Ages.',
    bannerColor: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)',
    posterUrl: 'assets/poster_chronos.png',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'mov-5',
    title: 'Heartbeats & Haze',
    genre: ['Romance', 'Drama', 'Musical'],
    rating: 'PG-13',
    userRating: 7.6,
    duration: '105 min',
    language: 'English',
    releaseDate: '2026-07-09',
    director: 'Sophia Vance',
    cast: ['Luka Hayes', 'Clara Belle', 'Marcus Stone'],
    synopsis: 'Two struggling musicians who meet in a foggy coastal town during a winter festival inspire each other to write their masterpieces, but soon discover that fame requires painful compromises.',
    bannerColor: 'linear-gradient(135deg, rgba(190, 24, 74, 0.4) 0%, rgba(15, 23, 42, 0.9) 100%)',
    posterUrl: 'assets/poster_heartbeats.png',
    trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];

// Helper to generate dynamic dates (Today, Tomorrow, Day After)
function getBookingDates() {
  const dates = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      isoString: d.toISOString().split('T')[0],
      dayName: daysOfWeek[d.getDay()],
      dayNum: d.getDate(),
      month: months[d.getMonth()]
    });
  }
  return dates;
}

// Export configurations
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SEAT_LAYOUT, CINEMAS, INITIAL_MOVIES, getBookingDates };
}
