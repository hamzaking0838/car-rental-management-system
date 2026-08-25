

function prefillFromUserSession(form) {
  try {
    const token = localStorage.getItem('userToken');
    if (!token) return;
    const name = localStorage.getItem('userName') || '';
    const fatherName = localStorage.getItem('userFatherName') || '';
    const email = localStorage.getItem('userEmail') || '';
    const phone = localStorage.getItem('userPhone') || '';
    const address = localStorage.getItem('userAddress') || '';
    const cnic = localStorage.getItem('userCnic') || '';
    const nameEl = form.querySelector('input[name="name"]');
    const fatherEl = form.querySelector('input[name="father_name"]');
    const emailEl = form.querySelector('input[name="email"]');
    const phoneEl = form.querySelector('input[name="phone"]');
    const addressEl = form.querySelector('textarea[name="address"]') || form.querySelector('input[name="address"]');
    const cnicEl = form.querySelector('input[name="cnic"]');
    if (nameEl && name && !nameEl.value) nameEl.value = name;
    if (fatherEl && fatherName && !fatherEl.value) fatherEl.value = fatherName;
    if (emailEl && email) {
      emailEl.value = email;
      // lock email so bookings map correctly to the user
      emailEl.readOnly = true;
    }
    if (phoneEl && phone && !phoneEl.value) phoneEl.value = phone;
    if (addressEl && address && !addressEl.value) addressEl.value = address;
    if (cnicEl && cnic && !cnicEl.value) cnicEl.value = cnic;
  } catch (e) {}
}


function requireUserLoginForBooking() {
  const token = localStorage.getItem('userToken');
  if (!token) {
    window.location.href = '/user/login.html';
    return false;
  }
  return true;
}

// js/booking_form.js — 3-step wizard, previews, validation, submit to /api/book
document.addEventListener('DOMContentLoaded', initWizard);
document.addEventListener('sectionsLoaded', initWizard); // if loaded dynamically

function initWizard() {
  if (!requireUserLoginForBooking()) return;
  const form = document.getElementById('wizardForm');
  if (!form) return;


  // Prefill booking form from logged-in user session
  prefillFromUserSession(form);

  const steps = Array.from(document.querySelectorAll('.form-step'));
  const stepEls = Array.from(document.querySelectorAll('.step'));
  const progressFill = document.querySelector('.progress-fill');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');
  const msgEl = document.getElementById('formMsg');

  let current = 0; // index in steps (0..2)

  // shortcuts
  const carSelect = form.querySelector('select[name="car_id"]');
  // Driver option select. Determines whether a driver is included and affects pricing.
  const driverSelect = form.querySelector('select[name="driver_option"]');
  const carPreviewImg = document.getElementById('carPreviewImg');
  const carPreviewTitle = document.getElementById('carPreviewTitle');
  const carPreviewSub = document.getElementById('carPreviewSub');
  const fileFront = document.getElementById('cnic_front');
  const fileBack = document.getElementById('cnic_back');
  const filePreviews = document.getElementById('filePreviews');
  const carAvailability = {};

  /**
   * Validate that a selected image resembles a Pakistani CNIC card.
   *
   * This helper does a simple sanity check on the uploaded image by
   * examining its aspect ratio.  Pakistani identity cards are roughly
   * 8.5cm × 5.4cm so their width to height ratio falls around 1.57.  We
   * therefore consider any image with a ratio between ~1.3 and ~1.8
   * acceptable.  If the ratio is outside this range we treat the image
   * as invalid.  While this does not guarantee the image is a CNIC,
   * it prevents users from uploading square selfies or landscape photos
   * inadvertently.  See `handleCnicFileChange` for how this is used.
   *
   * @param {File} file The file selected via the file input.
   * @returns {Promise<boolean>} Resolves true if the image appears valid.
   */
  function isValidCnicImage(file) {
    return new Promise((resolve) => {
      if (!file || !file.type.startsWith('image/')) {
        resolve(false);
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        // Compute the aspect ratio of the uploaded image
        const ratio = img.naturalWidth / img.naturalHeight;
        URL.revokeObjectURL(url);
        // Accept images whose ratio loosely matches a card (roughly 8.5×5.4 cm)
        if (ratio > 1.3 && ratio < 1.8) {
          resolve(true);
        } else {
          resolve(false);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      img.src = url;
    });
  }

  /**
   * Event handler for CNIC image file changes.  When the user selects
   * a file for either the front or back of their CNIC, we validate
   * that the image resembles a card.  If not, we clear the input and
   * display an error message.  Valid selections trigger a refresh
   * of the preview area and clear any previous error text.
   *
   * @param {Event} e The change event from the file input.
   */
  function handleCnicFileChange(e) {
    const input = e.target;
    const file = input.files && input.files[0];
    if (!file) {
      return;
    }
    isValidCnicImage(file).then((valid) => {
      if (!valid) {
        showError('Please upload a valid CNIC image (front or back).');
        // Clear the invalid file selection so the user can pick again
        input.value = '';
        // Update previews to remove the invalid image
        updateFilePreview();
      } else {
        // Clear any previous error and update previews normally
        showError('');
        updateFilePreview();
      }
    });
  }

  
  const carImages = {
   
    'mg': '/images/MG.png',
    'coaster': '/images/coaster.png',
    'rang rover': '/images/rang rover.png',
    'sonata': '/images/Sonata(Model 22-24).png',
    'suzuki_alto': '/images/Suzuki ALTO.png',
    'toyota_prado': '/images/Prado(Uplifted).png',
    'toyota_revo': '/images/Tayota Revo.png',
    'toyota-fortuner': '/images/Toyota-Fortuner.png',
    'wagon-r': '/images/Wagon-R.png',
    'wagon_r': '/images/Wagon-R.png',
    'yaris_auto': '/images/yaris_auto.png',
    'yaris_manual': '/images/Toyota YARIS(Manual).png',
    'mercedes s-class': '/images/Mercedes-benz(S-Class).png',
    'mercedes c-class': '/images/Mercedes-benz(C-Class).png',
    'bmw': '/images/BMW.jpg',

    // Additional keys for the same cars with different casing or spacing.
    'MG': '/images/MG.png',
    'Coaster':  '/images/Coaster.png',
    'Sonata': '/images/Sonata(Model 22-24).png',
    'Suzuki Alto': '/images/Suzuki ALTO.png',
    'Toyota Prado': '/images/Prado(Uplifted).png',
    'Toyota Revo': '/images/Tayota Revo.png',
    'Toyota-Fortuner': '/images/Toyota-Fortuner.png',
    'Wagon-R': '/images/Wagon-R.png',
    'Yaris Manual': '/images/Toyota YARIS(Manual).png',
    'Yaris Auto': '/images/yaris_auto.png',
    'Mercedes S-Class': '/images/Mercedes-benz(S-Class).png',
    'Mercedes C-Class': '/images/Mercedes-benz(C-Class).png',
    'BMW': '/images/BMW.jpg',

  
    'Land Cruiser (LC200)': '/images/Land-Cruiser(LC200).png',
    'Land Cruiser(LC200)': '/images/Land-Cruiser(LC200).png',
    'Land Cruiser V8 (LC200)': '/images/Land-Cruiser(LC200).png',
    'Land Cruiser (LC300)': '/images/Land_Curiser(LC300).png',
    'Land Cruiser(LC300)': '/images/Land_Curiser(LC300).png',
    'Land_Curiser(LC300)': '/images/Land_Curiser(LC300).png',
    'land_curiser(lc300)': '/images/Land_Curiser(LC300).png',
    'Land-Cruiser(LC200)': '/images/Land-Cruiser(LC200).png',
    'land-cruiser(lc200)': '/images/Land-Cruiser(LC200).png',


    'Land_Curiser(LC300)': '/images/Land_Curiser(LC300).png',
    'land_curiser(lc300)': '/images/Land_Curiser(LC300).png',
    'Land-Cruiser(LC200)': '/images/Land-Cruiser(LC200).png',
    'land-cruiser(lc200)': '/images/Land-Cruiser(LC200).png',
    'Prado(Uplifted)': '/images/Prado(Uplifted).png',
    'prado(uplifted)': '/images/Prado(Uplifted).png',
    'Sonata(Model 22-24)': '/images/Sonata(Model 22-24).png',
    'sonata(model 22-24)': '/images/Sonata(Model 22-24).png',
    'sonata(model_22-24)': '/images/Sonata(Model 22-24).png',
    'Fortuner(Uplifted)M 19-23': '/images/Toyota-Fortuner.png',
    'fortuner(uplifted)m 19-23': '/images/Toyota-Fortuner.png',
    'fortuner(uplifted)m_19-23': '/images/Toyota-Fortuner.png',
    'Tayota Revo': '/images/Tayota Revo.png',
    'tayota revo': '/images/Tayota Revo.png',
    'tayota_revo': '/images/Tayota Revo.png',
    'MG': '/images/MG.png',
    'mg': '/images/MG.png',
    'Hundai-Tucson': '/images/Hundai-Tucson.png',
    'hundai tucson': '/images/Hundai-Tucson.png',
    'hundai-tucson': '/images/Hundai-Tucson.png',
    'Hundai-Elantra': '/images/Hundai-Elantra.png',
    'hundai elantra': '/images/Hundai-Elantra.png',
    'hundai-elantra': '/images/Hundai-Elantra.png',
    'Kia-Sportage(Full Option)': '/images/Kia-Sportage-sunroop.png',
    'kia-sportage(Full Option)': '/images/Kia-Sportage-sunroop.png',
    'kia-sportage(full option)': '/images/Kia-Sportage-sunroop.png',
    'kia-sportage full option': '/images/Kia-Sportage-sunroop.png',
    'kia-sportage_full_option': '/images/Kia-Sportage-sunroop.png',
    'Kia-Sportage(Alpha)': '/images/kia-sportage-alpha.png',
    'kia-sportage(Alpha)': '/images/kia-sportage-alpha.png',
    'kia-sportage(alpha)': '/images/kia-sportage-alpha.png',
    'kia-sportage alpha': '/images/kia-sportage-alpha.png',
    'kia-sportage_alpha': '/images/kia-sportage-alpha.png',
    'Hundai-Elantra': '/images/Hundai-Elantra.png',
    'Honda Civic(New Shape)': '/images/Honda Civic(New Shape).png',
    'honda civic(new shape)': '/images/Honda Civic(New Shape).png',
    'honda_civic(new_shape)': '/images/Honda Civic(New Shape).png',
    'Honda Civic(Model18-22)': '/images/Honda Civic(Model18-22).png',
    'honda civic(model18-22)': '/images/Honda Civic(Model18-22).png',
    'honda_civic(model18-22)': '/images/Honda Civic(Model18-22).png',
    'Honda City(New Shape)': '/images/Honda City(New Shape).png',
    'honda city(new shape)': '/images/Honda City(New Shape).png',
    'honda_city(new_shape)': '/images/Honda City(New Shape).png',
    'Honda City(Model 19-22)': '/images/Honda City(Model 19-22).png',
    'honda city(model 19-22)': '/images/Honda City(Model 19-22).png',
    'honda city(model_19-22)': '/images/Honda City(Model 19-22).png',
    'honda_city(model 19-22)': '/images/Honda City(Model 19-22).png',
    'honda_city(model_19-22)': '/images/Honda City(Model 19-22).png',
    'Corolla Grande': '/images/Corolla Grande.png',
    'corolla grande': '/images/Corolla Grande.png',
    'corolla_grande': '/images/Corolla Grande.png',
    'Corolla(Model 17-21)': '/images/Corolla Grande.png',
    'corolla(model 17-21)': '/images/Corolla Grande.png',
    'corolla(model_17-21)': '/images/Corolla Grande.png',
    'Changan Karvaan': '/images/Changan Karvaan.png',
    'changan karvaan': '/images/Changan Karvaan.png',
    'changan_karvaan': '/images/Changan Karvaan.png',
    'Honda BRV': '/images/Honda BRV.png',
    'honda brv': '/images/Honda BRV.png',
    'honda_brv': '/images/Honda BRV.png',
    'Wagon-R': '/images/Wagon-R.png',
    'wagon r': '/images/Wagon-R.png',
    'Cultus(Auto)': '/images/Cultus(Auto).png',
    'cultus(auto)': '/images/Cultus(Auto).png',
    'cultus auto': '/images/Cultus(Auto).png',
    'Corolla(Manual)': '/images/Corolla(Manual).png',
    'corolla(manual)': '/images/Corolla(Manual).png',
    'corolla manual': '/images/Corolla(Manual).png',
    'Toyota YARIS(Manual)': '/images/Toyota YARIS(Manual).png',
    'toyota yaris(manual)': '/images/Toyota YARIS(Manual).png',
    'toyota_yaris(manual)': '/images/Toyota YARIS(Manual).png',
    'Suzuki ALTO': '/images/Suzuki ALTO.png',
    'suzuki alto': '/images/Suzuki ALTO.png',
    'suzuki_alto': '/images/Suzuki ALTO.png',
    'Mehran': '/images/Mehran.png',
    'mehran': '/images/Mehran.png'
    ,
    // Add explicit mappings for Audi models and common luxury cars.
    'BMW': '/images/BMW.jpg',
    'bmw': '/images/BMW.jpg',
    'Rang Rover': '/images/rang rover.png',
    'rang rover': '/images/rang rover.png',
    'Audi (A5)': '/images/audi a5.png',
    'Audi A5': '/images/audi a5.png',
    'audi a5': '/images/audi a5.png',
    'Audi (A6)': '/images/audi a6.png',
    'Audi A6': '/images/audi a6.png',
    'audi a6': '/images/audi a6.png'
  };


  async function loadCars() {
    try {
      const resp = await fetch('/api/cars');
      if (resp.ok) {
        const json = await resp.json();
        if (json && Array.isArray(json.cars)) {
          // Remove existing dynamic options except the first placeholder
          while (carSelect.options.length > 1) {
            carSelect.remove(1);
          }
          json.cars.forEach(car => {
            const opt = document.createElement('option');
            opt.value = car.name;
            carAvailability[car.name] = (car.available == 1 || car.available === true);
            if (!carAvailability[car.name]) {
              opt.disabled = true;
              opt.textContent = car.name + ' (Unavailable)';
            } else {
              opt.textContent = car.name;
            }
            carSelect.appendChild(opt);
          });

         
          try {
            const params = new URLSearchParams(window.location.search);
            const preselected = params.get('car');
            if (preselected) {
              // Only set if the option exists
              const hasOption = Array.from(carSelect.options).some(o => o.value === preselected);
              if (hasOption) {
                carSelect.value = preselected;
                carSelect.dispatchEvent(new Event('change'));
              }
            }
          } catch (e) {
            // ignore URL parsing issues
          }
        }
      }
    } catch (err) {
      console.warn('Could not load cars:', err);
    }
  }


  let currentPerDayPrice = 0;
  let lastCarName = null;

  // initialise preview
  updateCarPreview();

  // Populate car dropdown from server
  loadCars().then(() => {
    // After loading cars, ensure preview is updated for first selection
    updateCarPreview();
  });


  async function updateTotalPrice() {
    const selectedCar = carSelect.value;
    const durationInputEl = form.querySelector('input[name="duration_days"]');
    const days = parseInt(durationInputEl?.value, 10) || 0;
    // If the selected car has changed, fetch its price from the server
    if (selectedCar && selectedCar !== lastCarName) {
      try {
        const resp = await fetch(`/api/car-price/${encodeURIComponent(selectedCar)}`);
        if (resp.ok) {
          const json = await resp.json();
          currentPerDayPrice = parseFloat(json.price_per_day) || 0;
        } else {
          currentPerDayPrice = 0;
        }
      } catch (err) {
        console.error('Failed to fetch car price:', err);
        currentPerDayPrice = 0;
      }
      lastCarName = selectedCar;
    }

    // Calculate the cost for a driver if selected. Each day costs 5000 PKR.
    let driverCost = 0;
    const driverOption = driverSelect ? driverSelect.value : '';
    if (driverOption && driverOption.toLowerCase() === 'with driver') {
      driverCost = 5000 * days;
    }

    const total = currentPerDayPrice * days + driverCost;
    const totalEl = document.getElementById('rev_total');
    if (totalEl) {
      totalEl.textContent = total > 0 ? `${total.toLocaleString()} PKR` : '-';
    }
    return total;
  }

  carSelect.addEventListener('change', updateCarPreview);
  // When the selected car changes, also recompute the total price
  carSelect.addEventListener('change', () => {
    // Reset lastCarName so that updateTotalPrice knows to fetch new price
    lastCarName = null;
    updateTotalPrice();
  });
  // Recompute total price when the driver preference changes.
  driverSelect && driverSelect.addEventListener('change', updateTotalPrice);
  // When the rental duration changes, recompute the total price
  const durationInput = form.querySelector('input[name="duration_days"]');
  durationInput && durationInput.addEventListener('input', updateTotalPrice);
  // Validate CNIC uploads when the file inputs change.  The
  // handleCnicFileChange function will call updateFilePreview on valid
  // images and clear the preview on invalid ones.  We therefore no
  // longer attach updateFilePreview directly here.
  fileFront && fileFront.addEventListener('change', handleCnicFileChange);
  fileBack && fileBack.addEventListener('change', handleCnicFileChange);

  prevBtn.addEventListener('click', () => { msgEl.textContent=''; goStep(current - 1); });
  nextBtn.addEventListener('click', () => {
    msgEl.textContent='';
    // validate current step before moving forward
    if (validateStep(current)) goStep(current + 1);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgEl.textContent = '';
    // final validation before processing
    if (!validateStep(current, true)) {
      return;
    }


    const totalAmount = await updateTotalPrice();

   
    const fd = new FormData(form);

    // Disable the submit button while we process the booking and payment.
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
  
      const bookingResp = await fetch('/api/create-booking', {
        method: 'POST',
        body: fd
      });
      if (!bookingResp.ok) throw new Error('Booking creation failed');
      const bookingData = await bookingResp.json();
      if (!bookingData.success) {
        throw new Error(bookingData.message || 'Booking creation failed');
      }
      const bookingId = bookingData.booking_id;

    
      const paymentInitResp = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: totalAmount, booking_id: bookingId })
      });
      if (!paymentInitResp.ok) throw new Error('Failed to initiate payment');
      const paymentInitData = await paymentInitResp.json();
      if (!paymentInitData.success) {
        throw new Error(paymentInitData.message || 'Failed to initiate payment');
      }
      const clientSecret = paymentInitData.clientSecret;


      const { paymentIntent, error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card }
      });
      if (stripeError) {
        msgEl.textContent = stripeError.message || 'Payment failed';
        return;
      }

      // Step 4: Persist the payment in the database if it succeeded.
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const recordResp = await fetch('/api/record-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: bookingId, payment_intent_id: paymentIntent.id })
        });
        const recordData = await recordResp.json();
        if (!recordData.success) {
          msgEl.textContent = 'Payment succeeded but could not be recorded: ' + (recordData.message || '');
        } else {
          msgEl.style.color = '#065f46';
          msgEl.style.background = '#d1fae5';
          msgEl.style.padding = '12px 16px';
          msgEl.style.borderRadius = '8px';
          msgEl.style.border = '1px solid #6ee7b7';
          msgEl.textContent = '✓ Your booking has been confirmed! A confirmation email will be sent to you shortly.';
          form.reset();
          updateCarPreview();
          filePreviews.innerHTML = '';
          // Return to the first step of the wizard
          goStep(0);
        }
      } else {
        msgEl.style.color = '#dc3545';
        msgEl.style.background = 'transparent';
        msgEl.style.padding = '0';
        msgEl.style.border = 'none';
        msgEl.textContent = 'Payment could not be completed. Please try again.';
      }
    } catch (err) {
      console.error(err);
      // Provide a generic error message or the one returned from the server
      msgEl.textContent = err.message || 'An unexpected error occurred';
    } finally {
      // Re‑enable the submit button regardless of success or failure
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Booking';
    }
  });

  // functions
  function goStep(idx) {
    if (idx < 0) idx = 0;
    if (idx > steps.length - 1) idx = steps.length - 1;
    current = idx;
    steps.forEach((s, i) => s.classList.toggle('form-step-active', i === current));
    stepEls.forEach((el, i) => el.classList.toggle('step-active', i === current));
    const pct = Math.round(((current + 1) / steps.length) * 100);
    progressFill.style.width = ((current + 1) / steps.length * 100) + '%';

    // controls visibility
    prevBtn.style.display = current === 0 ? 'none' : 'inline-block';
    nextBtn.style.display = current === steps.length - 1 ? 'none' : 'inline-block';
    submitBtn.classList.toggle('d-none', current !== steps.length - 1);

    // fill review if step 3
    if (current === steps.length - 1) fillReview();
    // scroll into view on small screens
    setTimeout(()=> { document.querySelector('.booking-card').scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 120);
  }

  function validateStep(idx, final=false) {
    const step = steps[idx];
    const inputs = Array.from(step.querySelectorAll('input, select, textarea')).filter(i=> !i.disabled);
    for (const input of inputs) {
      if (input.hasAttribute('required') && !input.value) {
        showError('Please fill required fields.');
        input.focus();
        return false;
      }
      if (input.type === 'email' && input.value) {
        const ok = /\S+@\S+\.\S+/.test(input.value);
        if (!ok) { showError('Enter a valid email.'); input.focus(); return false; }
      }
      if (input.name === 'phone' && input.value) {
        if (!/\+?\d{9,15}/.test(input.value)) { showError('Enter valid phone with country code.'); input.focus(); return false; }
      }
    }
    if (idx == 0 && carSelect.value && carAvailability[carSelect.value] === false) { showError('Selected car is currently unavailable.'); return false; }
    // extra: for step 1 ensure CNIC files present
    if (idx === 0 || final) {
      if (!fileFront.files[0] || !fileBack.files[0]) { showError('Please upload CNIC front and back images.'); return false; }
    }
    return true;
  }

  function showError(txt) {
    msgEl.textContent = txt;
  }

  function updateCarPreview() {
    const val = carSelect.value;
    if (!val) {
      carPreviewImg.src = '/images/default-car.png';
      carPreviewTitle.textContent = 'Select a car';
      carPreviewSub.textContent = 'Choose a model to preview image & details.';
      return;
    }
   
    const normalizedKey = val.toLowerCase().replace(/\s+/g, '_');
    const img = carImages[val] || carImages[normalizedKey] || '/images/default-car.png';
    carPreviewImg.src = img;
    carPreviewTitle.textContent = val;
    carPreviewSub.textContent = (carAvailability[val] === false ? 'Currently unavailable' : 'Quick preview — select color & duration on the left.');
  }

  function updateFilePreview() {
    filePreviews.innerHTML = '';
    const files = [fileFront.files[0], fileBack.files[0]].filter(Boolean);
    files.forEach(f => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(f);
      img.onload = () => URL.revokeObjectURL(img.src);
      filePreviews.appendChild(img);
    });
  }

  function fillReview() {
    const data = new FormData(form);
    document.getElementById('rev_name').textContent = data.get('name') || '-';
    document.getElementById('rev_phone').textContent = data.get('phone') || '-';
    document.getElementById('rev_car').textContent = data.get('car_id') || '-';

    // Show the selected color on the review page
    const selectedColor = data.get('color');
    const revColorEl = document.getElementById('rev_color');
    if (revColorEl) {
      revColorEl.textContent = selectedColor || '-';
    }

    // Show the selected driver preference on the review page
    const selectedDriver = data.get('driver_option');
    const revDriverEl = document.getElementById('rev_driver');
    if (revDriverEl) {
      revDriverEl.textContent = selectedDriver || '-';
    }
    document.getElementById('rev_duration').textContent = (data.get('duration_days') || '-') + ' days';
    document.getElementById('rev_pickup').textContent = (data.get('pickup_date') || '-') + ' ' + (data.get('pickup_time') || '');
    document.getElementById('rev_address').textContent = data.get('address') || '-';
    // Compute and display the total price whenever we populate the review.
    updateTotalPrice();
  }


  // Stripe public key (test mode)
  const stripe = Stripe("pk_test_51T4NQJRz4cBpOaa8HLq7xWXsF2j3HH0ZuLr3Rvi0LVNznprc3FW5CVwJoQkxh34AMpq9Kb8kXdm1c7dpZtkwYV1e00CLMKMGXe");

  const elements = stripe.elements();

  const card = elements.create("card", {
    hidePostalCode: true
  });

  card.mount("#card-element");

  card.on("change", function (event) {
    const displayError = document.getElementById("card-errors");
    displayError.textContent = event.error ? event.error.message : "";
  });


  // start at step 0
  goStep(0);
}
