// car_details.js
//
// This module drives the car details page.  It imports a static
// dictionary of car specifications from car_details_data.js, maps
// synonyms to canonical names, looks up the correct image and
// availability status, and then renders everything to the DOM.  When
// the car is not available the "Book Now" button is hidden.

import { carDetailsData } from './car_details_data.js';

// A mapping of car names to their corresponding image paths.  This
// largely mirrors the mapping found in rent.js so that the same
// images are reused in the details view.  If a name is not found
// here then a default image will be used instead.
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
  'Toyota Revo': '/images/Tayota Revo.png',
  'Land_Curiser(LC300)': '/images/Land_Curiser(LC300).png',
  'Land-Cruiser(LC200)': '/images/Land-Cruiser(LC200).png',
  'Land_Curiser(LC200)': '/images/Land-Cruiser(LC200).png',
  'Land-Cruiser(LC300)': '/images/Land_Curiser(LC300).png',
  'Prado(Uplifted)': '/images/Prado(Uplifted).png',
  'Sonata(Model 22-24)': '/images/Sonata(Model 22-24).png',
  'Fortuner(Uplifted)M 19-23': '/images/Toyota-Fortuner.png',
  'Kia-Sportage(Full Option)': '/images/Kia-Sportage-sunroop.png',
  'Hundai-Elantra': '/images/Hundai-Elantra.png',
  'Honda Civic(Model18-22)': '/images/Honda Civic(Model18-22).png',
  'Honda Civic(New Shape)': '/images/Honda Civic(New Shape).png',
  'Honda City(New Shape)': '/images/Honda City(New Shape).png',
  'Honda City(Model 19-22)': '/images/Honda City(Model 19-22).png',
  'Corolla(Model 17-21)': '/images/Corolla(Manual).png',
  'Corolla(Manual)': '/images/Corolla(Manual).png',
  'Suzuki ALTO': '/images/Suzuki ALTO.png',
  'BMW X5': '/images/BMW.jpg',
  'Land Cruiser(LC300)': '/images/Land_Curiser(LC300).png'
  ,
  'Land Cruiser (LC300)': '/images/Land_Curiser(LC300).png',
  'Toyota Prado': '/images/Prado(Uplifted).png',
  'Range Rover': '/images/rang rover.png'
};

// Synonyms map: maps database names or alternate strings to canonical
// keys used in carDetailsData.  Additional names can be added here
// without modifying the data file.
const synonymMap = {
  'Kia-Sportage(Alpha)': 'Kia Sportage',
  'Kia Sportage (Sunroof)': 'Kia Sportage',
  'Kia-Sportage(Full Option)': 'Kia Sportage',
  'Hundai-Elantra': 'Hundai Elantra',
  'Hyundai Tucson': 'Hundai Tucson',
  'Corolla(Manual)': 'Corolla Manual',
  'Corolla(Model 17-21)': 'Corolla Manual',
  'Corolla(Manual)': 'Corolla Manual',
  'Suzuki ALTO': 'Suzuki Alto',
  'Toyota YARIS(Manual)': 'Toyota Yaris(Manual)',
  'Toyota Yaris(Manual)': 'Toyota Yaris(Manual)',
  'Yaris Manual': 'Toyota Yaris(Manual)',
  'Yaris Auto': 'Toyota Yaris(Manual)' // treat auto same spec
  ,
  // Map common variations of Land Cruiser and Prado to their canonical keys
  'Land Cruiser(LC300)': 'Land Cruiser (LC300)',
  'Land Cruiser (LC300)': 'Land Cruiser (LC300)',
  'Land Cruiser(LC200)': 'Land Cruiser (LC300)',
  'Land Cruiser (LC200)': 'Land Cruiser (LC300)',
  'Land Curiser(LC200)': 'Land Cruiser (LC300)',
  'Land Curiser(LC300)': 'Land Cruiser (LC300)',
  'Land Cruiser V8 (LC200)': 'Land Cruiser (LC300)',
  'Prado(Uplifted)': 'Toyota Prado',
  'Toyota Prado(Uplifted)': 'Toyota Prado',
  'Prado': 'Toyota Prado',
  // Range Rover synonyms
  'Rang Rover': 'Range Rover',
  'rang rover': 'Range Rover'
};


// Normalize car names to improve matching between URL params and database values.
// Example: "Audi (A5)" and "Audi(A5)" will match.
function normalizeCarName(value) {
  return String(value || '').toLowerCase().replace(/[\s\-()]/g, '');
}

// Fetch list of cars from the API to determine availability and price.
async function fetchCars() {
  try {
    const resp = await fetch('/api/cars');
    if (!resp.ok) throw new Error('Could not fetch cars');
    const json = await resp.json();
    return json.cars || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  let carParam = params.get('car') || '';
  carParam = decodeURIComponent(carParam);
  // Determine canonical name
  const canonical = synonymMap[carParam] || carParam;
  const details = carDetailsData[canonical] || carDetailsData['__default__'];

  // Populate name. If details dataset falls back to "Unknown Model", use the
  // real car name from URL first. After the API call below, this is overridden
  // with the exact database car name when available.
  const nameEl = document.getElementById('detailName');
  const initialName = (details.name && details.name !== 'Unknown Model') ? details.name : canonical;
  if (nameEl) nameEl.textContent = initialName;

  // Populate image: default to static mapping, override with DB image later
  const imgEl = document.getElementById('detailImage');
  let imgPath = carImages[carParam] || carImages[canonical] || '/images/default-car.png';
  if (imgEl) imgEl.src = imgPath;

  // Build details list with new attributes.  We'll populate the list
  // after fetching availability and DB data.
  const listEl = document.getElementById('detailList');

  // Fetch price and specification fields from the API
  const cars = await fetchCars();
  let pricePerDay = null;
  let carRecord = null;
  if (Array.isArray(cars)) {
    const wantedParam = normalizeCarName(carParam);
    const wantedCanonical = normalizeCarName(canonical);
    carRecord = cars.find((c) => {
      const carName = c && c.name ? String(c.name) : '';
      const normalizedDbName = normalizeCarName(carName);
      return carName === carParam || carName === canonical || normalizedDbName === wantedParam || normalizedDbName === wantedCanonical;
    });
    if (carRecord) {
      pricePerDay = carRecord.price_per_day;
      // Use the exact car name stored in the database so the title never shows
      // "Unknown Model" for newly added/edited cars.
      if (nameEl && carRecord.name) {
        nameEl.textContent = carRecord.name;
      }
    }
  }

  // Fetch dynamic availability if we have a record with an id
  let availabilityStr = 'Unknown';
  if (carRecord && carRecord.id) {
    try {
      const respAvail = await fetch(`/api/cars/${encodeURIComponent(carRecord.id)}/availability`);
      if (respAvail.ok) {
        const availData = await respAvail.json();
        if (availData.success) {
          if (availData.available) {
            availabilityStr = 'Yes';
          } else if (availData.until) {
            const bookedDays = parseInt(availData.days || 0, 10);
            const daysText = bookedDays ? `, ${bookedDays} day${bookedDays > 1 ? 's' : ''}` : '';
            availabilityStr = `No (until ${availData.until}${daysText})`;
          } else {
            availabilityStr = 'No';
          }
        }
      }
    } catch (err) {
      console.error('Error fetching availability:', err);
    }
  } else if (carRecord) {
    // fallback to available flag if API not found
    availabilityStr = carRecord.available == 1 ? 'Yes' : 'No';
  }

  if (listEl) {
    listEl.innerHTML = '';
    const addItem = (label, value) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `<span>${label}</span> <span>${value ?? '—'}</span>`;
      listEl.appendChild(li);
    };
    // For each attribute, prefer the value from the database (carRecord) and fall back to
    // the specification dataset.  Use a dash when neither is available.
    const modelYearVal = (carRecord?.model_year && carRecord.model_year !== '')
      ? carRecord.model_year
      : (details.modelYear || '—');
    const brandVal = (carRecord?.brand && carRecord.brand !== '')
      ? carRecord.brand
      : (details.brand || '—');
    const seatsVal = (carRecord?.seats && carRecord.seats !== '')
      ? carRecord.seats
      : (details.seats || details.seatingCapacity || '—');
    const acVal = (carRecord?.ac && carRecord.ac !== '')
      ? carRecord.ac
      : (details.ac || '—');
    const fuelVal = (carRecord?.fuel_type && carRecord.fuel_type !== '')
      ? carRecord.fuel_type
      : (details.fuelCategory || details.fuelType || '—');
    const transVal = (carRecord?.transmission && carRecord.transmission !== '')
      ? carRecord.transmission
      : (details.transmissionType || details.transmission || '—');
    addItem('Model / Year', modelYearVal);
    addItem('Brand', brandVal);
    if (pricePerDay !== null && pricePerDay !== undefined) {
      addItem('Price per day', `${Number(pricePerDay).toLocaleString()} PKR`);
    } else {
      addItem('Price per day', '—');
    }
    addItem('Seats', seatsVal);
    addItem('AC', acVal);
    addItem('Fuel Type', fuelVal);
    addItem('Transmission', transVal);
    addItem('Availability Status', availabilityStr);
  }

  // Update Book Now link. Keep it visible even if the car is unavailable today,
  // because customers can still book the same car for a future available date.
  const bookBtn = document.getElementById('bookNowBtn');
  if (bookBtn) {
    bookBtn.href = `/sections/booking_form.html?car=${encodeURIComponent(canonical)}`;
    bookBtn.style.display = '';
  }

  // Override image with database image if available.  We wait until after
  // the API call so that carRecord is available.  This ensures newly
  // added cars with uploaded photos display their image on the details page.
  if (imgEl && carRecord && carRecord.image_path) {
    imgEl.src = `/uploads/${carRecord.image_path}`;
  }
});