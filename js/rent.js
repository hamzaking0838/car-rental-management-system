
document.addEventListener('sectionsLoaded', () => {
  const rentSection = document.querySelector('.rent-section');
  if (!rentSection) return;

  const textContainer = rentSection.querySelector('.rent-section-text');
  const grid = document.getElementById('rentCarsGrid');
  if (!grid) return;

  const carImages = {
    'Toyota Corolla': '/images/Corolla Grande.png',
    'Honda Civic': '/images/Honda Civic(New Shape).png',
    'BMW X5': '/images/BMW.jpg',
 
    'BMW': '/images/BMW.jpg',
    'bmw': '/images/BMW.jpg',
    'Rang Rover': '/images/rang rover.png',
    'rang rover': '/images/rang rover.png',
    'Audi (A5)': '/images/audi a5.png',
    'Audi A5': '/images/audi a5.png',
    'audi a5': '/images/audi a5.png',
    'Audi (A6)': '/images/audi a6.png',
    'Audi A6': '/images/audi a6.png',
    'audi a6': '/images/audi a6.png',
    'Hyundai Tucson': '/images/Hundai-Tucson.png',
    'Hundai-Tucson': '/images/Hundai-Tucson.png',
    'Kia Sportage': '/images/kia-sportage-alpha.png',
    'Kia-Sportage(Alpha)': '/images/kia-sportage-alpha.png',
    'Kia Sportage (Sunroof)': '/images/Kia-Sportage-sunroop.png',
    'Toyota Fortuner': '/images/Toyota-Fortuner.png',
    'Toyota Prado': '/images/Prado(Uplifted).png',
    'Land Cruiser V8': '/images/Land-Cruiser(LC200).png',
    'Land Curiser(LC200)': '/images/Land-Cruiser(LC200).png',
    'Land Curiser(LC300)': '/images/Land_Curiser(LC300).png',
    // Synonyms and alternate spacing/casing for Land Cruiser
    'Land Cruiser (LC200)': '/images/Land-Cruiser(LC200).png',
    'Land Cruiser(LC200)': '/images/Land-Cruiser(LC200).png',
    'Land Cruiser V8 (LC200)': '/images/Land-Cruiser(LC200).png',
    'Land Cruiser (LC300)': '/images/Land_Curiser(LC300).png',
    'Land Cruiser(LC300)': '/images/Land_Curiser(LC300).png',
    'Suzuki Alto': '/images/Suzuki ALTO.png',
    'Suzuki Cultus': '/images/cultus_manual.png',
    'Cultus(Auto)': '/images/Cultus(Auto).png',
    'Wagon-R': '/images/Wagon-R.png',
    'Mehran': '/images/Mehran.png',
    'Coaster': '/images/coaster.png',
    'Sonata': '/images/Sonata(Model 22-24).png',
    'MG': '/images/MG.png',
    'Honda City': '/images/Honda City(New Shape).png',
    'Honda Civic(Model18-22)': '/images/Honda Civic(Model18-22).png',
    'Honda Civic(New Shape)': '/images/Honda Civic(New Shape).png',
    'Honda BRV': '/images/Honda BRV.png',
    'Hundai Elantra': '/images/Hundai-Elantra.png',
    'Changan Karvaan': '/images/Changan Karvaan.png',
    'Corolla Manual': '/images/Corolla(Manual).png',
    'Corolla Grande': '/images/Corolla Grande.png',
    'Toyota YARIS(Manual)': '/images/Toyota YARIS(Manual).png',
    'Yaris Manual': '/images/Toyota YARIS(Manual).png',
    'Yaris Auto': '/images/yaris_auto.png',
    'Mercedes S-Class': '/images/Mercedes-benz(S-Class).png',
    'Mercedes C-Class': '/images/Mercedes-benz(C-Class).png',
    'Mercedes-benz(S-Class)': '/images/Mercedes-benz(S-Class).png',
    'Mercedes-benz(C-Class)': '/images/Mercedes-benz(C-Class).png',
    'Tayota Revo': '/images/Tayota Revo.png',
    'Toyota Revo': '/images/Tayota Revo.png'
    ,
    // Additional entries to cover database names not previously mapped
    'Land_Curiser(LC300)': '/images/Land_Curiser(LC300).png',
    'Land-Cruiser(LC200)': '/images/Land-Cruiser(LC200).png',
    'Land_Curiser(LC200)': '/images/Land-Cruiser(LC200).png',
    'Land-Cruiser(LC300)': '/images/Land_Curiser(LC300).png',
    'Prado(Uplifted)': '/images/Prado(Uplifted).png',
    'Sonata(Model 22-24)': '/images/Sonata(Model 22-24).png',
    'Fortuner(Uplifted)M 19-23': '/images/Toyota-Fortuner.png',
    'Kia-Sportage(Full Option)': '/images/Kia-Sportage-sunroop.png',
    'Kia-Sportage(Alpha)': '/images/kia-sportage-alpha.png',
    'Hundai-Elantra': '/images/Hundai-Elantra.png',
    'Honda Civic(New Shape)': '/images/Honda Civic(New Shape).png',
    'Honda Civic(Model18-22)': '/images/Honda Civic(Model18-22).png',
    'Honda City(New Shape)': '/images/Honda City(New Shape).png',
    'Honda City(Model 19-22)': '/images/Honda City(Model 19-22).png',
    'Corolla(Model 17-21)': '/images/Corolla(Manual).png',
    'Corolla(Manual)': '/images/Corolla(Manual).png',
    'Suzuki ALTO': '/images/Suzuki ALTO.png'
  };

  const DEFAULT_IMG = '/images/default-car.png';
  let allCars = [];
  let currentSearchQuery = '';

  const formatMoney = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString();
  };

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_\-()\/,.:;]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function compactText(value) {
    return normalizeText(value).replace(/[^a-z0-9]/g, '');
  }

  function fuzzyMatch(haystack, needle) {
    haystack = compactText(haystack);
    needle = compactText(needle);
    if (!needle) return true;
    if (!haystack) return false;
    if (haystack.includes(needle)) return true;

    let index = -1;
    for (const ch of needle) {
      index = haystack.indexOf(ch, index + 1);
      if (index === -1) return false;
    }
    return true;
  }

  const STOP_WORDS = new Set([
    'car', 'cars', 'rent', 'rental', 'gaari', 'gari', 'gaadi', 'vehicle', 'vehical',
    'mujhe', 'mujhy', 'mujhay', 'please', 'plz', 'show', 'search', 'find', 'need',
    'dikhao', 'dikhado', 'dekhna', 'dekhana', 'konsi', 'kon', 'kaun', 'kya', 'kis',
    'wali', 'wala', 'waly', 'hain', 'hai', 'hy', 'ha', 'ki', 'ka', 'ke', 'ky', 'ko',
    'se', 'mein', 'me', 'ma', 'aj', 'aaj', 'today', 'kal', 'chahiye', 'chahye',
    'chaya', 'mil', 'sakti', 'sakta', 'do', 'dy', 'de', 'liye', 'lia', 'for', 'with',
    'available', 'availability', 'dostiyab', 'dastyab', 'dastiyab', 'khali', 'free'
  ]);

  const FIELD_SYNONYMS = {
    auto: 'automatic',
    automatic: 'automatic',
    manual: 'manual',
    gear: 'transmission',
    petrol: 'petrol',
    diesel: 'diesel',
    hybrid: 'hybrid',
    electric: 'electric',
    seat: 'seats',
    seats: 'seats',
    seater: 'seats',
    ac: 'ac',
    black: 'black',
    white: 'white'
  };

  function getSearchTerms(rawQuery) {
    const normalized = normalizeText(rawQuery);
    if (!normalized) return [];

    return normalized
      .split(' ')
      .map((term) => FIELD_SYNONYMS[term] || term)
      .filter(Boolean)
      .filter((term) => !STOP_WORDS.has(term));
  }

  function queryNeedsAvailable(rawQuery) {
    const q = normalizeText(rawQuery);
    return /\b(available|availability|dostiyab|dastyab|dastiyab|free|khali)\b/.test(q);
  }

  function queryNeedsUnavailable(rawQuery) {
    const q = normalizeText(rawQuery);
    return /\b(not available|unavailable|booked|reserved|busy|not free|not khali)\b/.test(q);
  }

  function carIsAvailable(car) {
    if (!car) return false;
    // Prefer dynamic availability from the booking table when available.
    // This prevents cars booked for today from appearing as "available" in search.
    if (car.current_available !== undefined && car.current_available !== null) {
      return car.current_available === true || car.current_available === 1 || car.current_available === '1';
    }
    return car.available === 1 || car.available === true || car.available === '1';
  }

  function parsePriceFilter(rawQuery) {
    const q = normalizeText(rawQuery).replace(/,/g, '');
    const result = { min: null, max: null };

    const maxMatch = q.match(/(?:under|below|less than|max|maximum|budget|tak|andar)\s*(?:rs|pkr)?\s*(\d{3,})/);
    if (maxMatch) result.max = Number(maxMatch[1]);

    const minMatch = q.match(/(?:above|over|more than|min|minimum|kam az kam)\s*(?:rs|pkr)?\s*(\d{3,})/);
    if (minMatch) result.min = Number(minMatch[1]);

    return result;
  }

  function parseSeatFilter(rawQuery) {
    const q = normalizeText(rawQuery);
    const match = q.match(/\b(4|5|6|7|8|9|10)\s*(seat|seats|seater|persons|people)?\b/);
    if (match && /seat|seater|person|people/.test(q)) {
      return match[1];
    }
    return null;
  }

  async function enrichCarsWithDynamicAvailability(cars) {
    if (!Array.isArray(cars) || cars.length === 0) return [];
    const enriched = await Promise.all(cars.map(async (car) => {
      if (!car || !car.id) return car;
      try {
        const resp = await fetch(`/api/cars/${encodeURIComponent(car.id)}/availability`);
        if (!resp.ok) return car;
        const data = await resp.json();
        if (data && data.success) {
          return {
            ...car,
            current_available: data.available,
            booked_until: data.until || null,
            booked_days: data.days || null
          };
        }
      } catch (err) {
        console.warn('Could not load dynamic availability for car:', car.name, err.message);
      }
      return car;
    }));
    return enriched;
  }

  function getCarSearchText(car) {
    const availability = carIsAvailable(car) ? 'available yes free khali' : 'not available unavailable booked no reserved busy';
    return [
      car.name,
      car.brand,
      car.model,
      car.model_year,
      car.color,
      car.seats,
      car.ac,
      car.fuel_type,
      car.transmission,
      car.price_per_day,
      availability
    ].map(normalizeText).join(' ');
  }

  function levenshteinDistance(a, b) {
    a = compactText(a);
    b = compactText(b);
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[a.length][b.length];
  }

  function termMatchesCar(term, car) {
    const t = normalizeText(term);
    const compactTerm = compactText(t);
    if (!compactTerm) return true;

    const haystack = getCarSearchText(car);
    const compactHaystack = compactText(haystack);
    if (haystack.includes(t) || compactHaystack.includes(compactTerm) || fuzzyMatch(haystack, t)) {
      return true;
    }

    // Fuzzy typo tolerance against individual tokens.  This catches queries such as
    // "aud" / "audi", "civc" / "civic", or "fortuner" typed partially.
    const tokens = haystack.split(' ').filter(Boolean);
    return tokens.some((token) => {
      const compactToken = compactText(token);
      if (!compactToken) return false;
      if (compactToken.includes(compactTerm) || compactTerm.includes(compactToken)) return true;
      const allowedDistance = compactTerm.length <= 4 ? 1 : 2;
      return levenshteinDistance(compactToken, compactTerm) <= allowedDistance;
    });
  }

  function matchesQuery(car, rawQuery) {
    if (!rawQuery || !normalizeText(rawQuery)) return true;

    const priceFilter = parsePriceFilter(rawQuery);
    if (priceFilter.max !== null && Number(car.price_per_day || 0) > priceFilter.max) return false;
    if (priceFilter.min !== null && Number(car.price_per_day || 0) < priceFilter.min) return false;

    const seatFilter = parseSeatFilter(rawQuery);
    if (seatFilter !== null && String(car.seats || '').trim() !== String(seatFilter)) return false;

    if (queryNeedsUnavailable(rawQuery)) {
      if (carIsAvailable(car)) return false;
    } else if (queryNeedsAvailable(rawQuery) && !carIsAvailable(car)) {
      return false;
    }

    const terms = getSearchTerms(rawQuery).filter((term) => !/^\d{3,}$/.test(term));
    if (terms.length === 0) {
      return true;
    }

    return terms.every((term) => termMatchesCar(term, car));
  }

  function updateSearchStatus(count, query) {
    const status = document.getElementById('carSearchStatus');
    if (!status) return;
    const total = allCars.length;
    if (!query || !normalizeText(query)) {
      status.textContent = total ? `Showing all ${total} cars` : '';
      return;
    }
    status.textContent = count
      ? `Found ${count} matching car${count > 1 ? 's' : ''} for "${query}"`
      : 'No exact match found. Try a car name, brand, fuel type, seats, price or availability.';
  }

  function updateQuickFilterState(activeQuery) {
    const normalizedActive = normalizeText(activeQuery);
    rentSection.querySelectorAll('.rent-filter-chip').forEach((chip) => {
      const chipQuery = normalizeText(chip.dataset.query || chip.textContent);
      chip.classList.toggle('active', normalizedActive === chipQuery);
    });
  }

  function updateSuggestions(query) {
    const suggestionBox = document.getElementById('carSearchSuggestions');
    if (!suggestionBox) return;

    const normalized = normalizeText(query);
    if (!normalized) {
      suggestionBox.classList.remove('show');
      suggestionBox.innerHTML = '';
      return;
    }

    const suggestions = allCars
      .filter((car) => matchesQuery(car, query))
      .slice(0, 5);

    if (!suggestions.length) {
      suggestionBox.classList.remove('show');
      suggestionBox.innerHTML = '';
      return;
    }

    suggestionBox.innerHTML = suggestions.map((car) => `
      <button type="button" class="rent-suggestion-item" data-name="${String(car.name || '').replace(/"/g, '&quot;')}">
        <span>
          <span class="rent-suggestion-name">${car.name || 'Car'}</span>
          <span class="rent-suggestion-meta">${car.color || 'Any color'} • ${formatMoney(car.price_per_day)} / day</span>
        </span>
        <span class="rent-suggestion-meta">${carIsAvailable(car) ? 'Available' : 'Booked'}</span>
      </button>
    `).join('');
    suggestionBox.classList.add('show');

    suggestionBox.querySelectorAll('.rent-suggestion-item').forEach((item) => {
      item.addEventListener('click', () => {
        const input = document.getElementById('carSearchInput');
        if (input) input.value = item.dataset.name || '';
        runCarSearch();
        suggestionBox.classList.remove('show');
      });
    });
  }

  function revealCards() {
    requestAnimationFrame(() => {
      rentSection.querySelectorAll('.rent-car-card').forEach((card) => {
        card.classList.add('animate-card');
      });
    });
  }

  function renderCars(cars, query = currentSearchQuery) {
    if (!Array.isArray(cars) || cars.length === 0) {
      grid.innerHTML = `
        <div class="col-12">
          <div class="rent-empty-search-box">
            <strong>No matching cars found</strong>
            <span>Try another car name, brand, fuel type, seats, price, or clear the search.</span>
          </div>
        </div>
      `;
      updateSearchStatus(0, query);
      return;
    }

    const unique = [];
    const seen = new Set();

    cars.forEach((car) => {
      if (!car || !car.name) return;
      const rawName = car.name.toString();
      const normalizedKey = compactText(rawName);
      if (!seen.has(normalizedKey)) {
        unique.push(car);
        seen.add(normalizedKey);
      }
    });

    grid.innerHTML = unique
      .map((car) => {
        const carName = car.name || '';
        const normalized = carName.toLowerCase().replace(/\s+/g, '_');

        const img = car.image_path
          ? `/uploads/${car.image_path}`
          : (carImages[carName] || carImages[normalized] || DEFAULT_IMG);

        const price = car.price_per_day || 0;
        const color = car.color || '-';
        const bookUrl = `/sections/booking_form.html?car=${encodeURIComponent(car.name)}`;
        const detailsUrl = `/sections/car_details.html?car=${encodeURIComponent(car.name)}`;
        const isAvailableNow = carIsAvailable(car);
        const searchMode = Boolean(normalizeText(query));
        const availabilityBadge = searchMode
          ? `<div class="rent-card-search-status ${isAvailableNow ? 'is-available' : 'is-booked'}">
               ${isAvailableNow ? 'Available' : 'Booked'}
             </div>`
          : '';

        return `
          <div class="col-12 col-md-6 col-lg-4">
            <div class="rent-car-card animate-card" data-available="${isAvailableNow ? 1 : 0}">
              <div class="card-image">
                <img src="${img}" alt="${car.name}">
                <div class="price-badge">${formatMoney(price)} / day</div>
              </div>
              <div class="card-body text-center">
                <h5 class="card-title fw-bold">${car.name}</h5>
                <p class="text-muted">Color: ${color}</p>
                ${availabilityBadge}
                <div class="d-flex justify-content-center gap-2 flex-wrap">
                  <a href="${bookUrl}" class="btn btn-gradient">Book Now</a>
                  <a href="${detailsUrl}" class="btn btn-details">Details</a>
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    updateSearchStatus(unique.length, query);
    revealCards();
  }

  function runCarSearch() {
    const input = document.getElementById('carSearchInput');
    currentSearchQuery = input ? input.value.trim() : '';
    const filteredCars = allCars.filter((car) => matchesQuery(car, currentSearchQuery));
    updateQuickFilterState(currentSearchQuery);
    renderCars(filteredCars, currentSearchQuery);
    updateSuggestions(currentSearchQuery);
  }

  function clearCarSearch() {
    const input = document.getElementById('carSearchInput');
    const suggestionBox = document.getElementById('carSearchSuggestions');
    if (input) {
      input.value = '';
      input.focus();
    }
    if (suggestionBox) {
      suggestionBox.classList.remove('show');
      suggestionBox.innerHTML = '';
    }
    currentSearchQuery = '';
    updateQuickFilterState(currentSearchQuery);
    renderCars(allCars, currentSearchQuery);
  }

  function setupSearchControls() {
    const input = document.getElementById('carSearchInput');
    const searchBtn = document.getElementById('carSearchBtn');
    const clearBtn = document.getElementById('carSearchClearBtn');
    const suggestionBox = document.getElementById('carSearchSuggestions');

    if (searchBtn && !searchBtn.dataset.listenerAttached) {
      searchBtn.addEventListener('click', runCarSearch);
      searchBtn.dataset.listenerAttached = 'true';
    }

    if (clearBtn && !clearBtn.dataset.listenerAttached) {
      clearBtn.addEventListener('click', clearCarSearch);
      clearBtn.dataset.listenerAttached = 'true';
    }

    rentSection.querySelectorAll('.rent-filter-chip').forEach((chip) => {
      if (chip.dataset.listenerAttached) return;
      chip.addEventListener('click', () => {
        const query = chip.dataset.query || chip.textContent.trim();
        if (input) input.value = query;
        currentSearchQuery = query;
        runCarSearch();
      });
      chip.dataset.listenerAttached = 'true';
    });

    if (input && !input.dataset.listenerAttached) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          runCarSearch();
          if (suggestionBox) suggestionBox.classList.remove('show');
        }
      });

      let searchTimer;
      input.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(runCarSearch, 140);
      });

      input.addEventListener('focus', () => {
        updateSuggestions(input.value);
      });

      document.addEventListener('click', (e) => {
        if (!rentSection.contains(e.target) && suggestionBox) {
          suggestionBox.classList.remove('show');
        }
      });

      input.dataset.listenerAttached = 'true';
    }
  }

  async function loadCars() {
    try {
      const resp = await fetch('/api/cars');
      if (!resp.ok) throw new Error('Failed to load cars');
      const json = await resp.json();
      const rawCars = json.cars || [];
      // Sync cards and search results with real booking availability.
      // If a car is booked today, it will not appear in "available" search results.
      allCars = await enrichCarsWithDynamicAvailability(rawCars);
      setupSearchControls();
      renderCars(allCars, currentSearchQuery);
      setupAnimations();
    } catch (err) {
      console.error(err);
      grid.innerHTML = `
        <div class="col-12">
          <div class="text-center text-danger">Could not load cars. Please refresh.</div>
        </div>
      `;
    }
  }

  function setupAnimations() {
    const cards = rentSection.querySelectorAll('.rent-car-card');

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            textContainer && textContainer.classList.add('animate-text');

            cards.forEach((card, idx) => {
              setTimeout(() => {
                card.classList.add('animate-card');
              }, idx * 150);
            });

            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(rentSection);

    if (window.innerWidth <= 768) {
      textContainer && textContainer.classList.add('animate-text');
      cards.forEach((card) => card.classList.add('animate-card'));
    }
  }

  loadCars();
});
