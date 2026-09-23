// js/main.js
const sections = [
  "navbar",
  "hero",
  "about",
  "rent",
  "wedding",
  "outcity",
  "car_outofcity",
  "services",
  "different",
  "contact",
  "footer"
];



function loadSection(section) {
  return fetch(`sections/${section}.html`)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${section}`);
      return res.text();
    })
    .then((data) => {
      const el = document.getElementById(section);
      if (el) el.innerHTML = data;
    });
}

// Load all sections then dispatch a custom event
Promise.all(sections.map(loadSection))
  .then(() => {
    // small delay so DOM updates
    setTimeout(() => {
      // dispatch custom event so other scripts can init
      document.dispatchEvent(new CustomEvent('sectionsLoaded'));
    }, 80);
  })
  .catch((err) => console.error("Error loading sections:", err));



// Initialize AOS only after all sections are loaded. Wrapping the call in a check
// ensures that the library has been loaded and avoids errors if it isn't available.
document.addEventListener('sectionsLoaded', () => {
  if (window.AOS && typeof AOS.init === 'function') {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 120,
      easing: 'ease-in-out',
    });
    // Refresh after initialization to register dynamically added elements
    if (typeof AOS.refresh === 'function') {
      AOS.refresh();
    }
  } else {
    console.warn('AOS library is not loaded yet.');
  }
});

// Apply dynamic site settings
document.addEventListener('sectionsLoaded', () => {
  fetch('/api/settings')
    .then(res => res.json())
    .then(data => {
      if (data.success && data.settings) {
        // Update all elements with data-setting attribute
        document.querySelectorAll('[data-setting]').forEach(el => {
          const key = el.getAttribute('data-setting');
          const val = data.settings[key];
          if (val) {
            // If it's a link, update href
            if (el.tagName === 'A' && key.startsWith('social_')) {
              el.href = val;
            } else if (el.tagName === 'A' && key === 'site_email') {
              el.href = `mailto:${val}`;
              el.textContent = val;
            } else if (el.tagName === 'A' && key === 'site_phone') {
              el.href = `tel:${val.replace(/[^0-9+]/g, '')}`;
              el.textContent = val;
            } else {
              el.textContent = val;
            }
          }
        });
      }
    })
    .catch(err => console.error("Error loading site settings:", err));
});

// Protect booking links for guest users
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (href.includes('/sections/booking_form.html')) {
    const token = localStorage.getItem('userToken');
    if (!token) {
      e.preventDefault();
      window.location.href = '/user/login.html';
    }
  }
}, true);
