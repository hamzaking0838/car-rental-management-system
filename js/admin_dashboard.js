
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("adminToken");
  const alertBox = document.getElementById("authAlert");
  const logoutBtn = document.getElementById("logoutBtn");
  const sessionBadge = document.getElementById("sessionBadge");
  const pageTitle = document.getElementById("pageTitle");

  // Navigation + sections
  const nav = document.getElementById("adminNav");
  const sections = {
    dashboard: document.getElementById("section-dashboard"),
    analytics: document.getElementById("section-analytics"),
    calendar: document.getElementById("section-calendar"),
    bookings: document.getElementById("section-bookings"),
    customers: document.getElementById("section-customers"),
    cars: document.getElementById("section-cars"),
    payments: document.getElementById("section-payments"),
    contacts: document.getElementById("section-contacts"),
  };

  // Dashboard widgets
  const cardTotalBookings = document.getElementById("cardTotalBookings");
  const cardTodayBookings = document.getElementById("cardTodayBookings");
  const cardCars = document.getElementById("cardCars");
  const cardMessages = document.getElementById("cardMessages");
  const recentBookingsTbody = document.querySelector("#recentBookingsTable tbody");

  // Tables
  const bookingsTbody = document.querySelector("#bookingsTable tbody");
  const contactsTbody = document.querySelector("#contactsTable tbody");
  const carsTbody = document.querySelector("#carsTable tbody");
  const customersTbody = document.querySelector("#customersTable tbody");
  const paymentsTbody = document.querySelector("#paymentsTable tbody");

  // Controls
  const bookingSearch = document.getElementById("bookingSearch");
  const refreshDashboardBtn = document.getElementById("refreshDashboard");
  const refreshBookingsBtn = document.getElementById("refreshBookings");
  const refreshContactsBtn = document.getElementById("refreshContacts");
  const refreshCarsBtn = document.getElementById("refreshCars");
  const refreshPaymentsBtn = document.getElementById("refreshPayments");
  const refreshCustomersBtn = document.getElementById("refreshCustomers");
  const customerSearch = document.getElementById("customerSearch");
  const paymentSearch = document.getElementById("paymentSearch");
  const paymentStatus = document.getElementById("paymentStatus");
  const paymentFrom = document.getElementById("paymentFrom");
  const paymentTo = document.getElementById("paymentTo");
  const clearPaymentFiltersBtn = document.getElementById("clearPaymentFilters");

  // Cars CRUD form
  const carCrudForm = document.getElementById("carCrudForm");
  const carCrudHint = document.getElementById("carCrudHint");
  const carFormMode = document.getElementById("carFormMode");
  const carIdInput = document.getElementById("carIdInput");
  const carNameInput = document.getElementById("carNameInput");
  const carColorInput = document.getElementById("carColorInput");
  const carPriceInput = document.getElementById("carPriceInput");
  const carAvailableInput = document.getElementById("carAvailableInput");
  // Additional car specification inputs
  const carModelYearInput = document.getElementById("carModelYearInput");
  const carBrandInput = document.getElementById("carBrandInput");
  const carSeatsInput = document.getElementById("carSeatsInput");
  const carAcInput = document.getElementById("carAcInput");
  const carFuelTypeInput = document.getElementById("carFuelTypeInput");
  const carTransmissionInput = document.getElementById("carTransmissionInput");
  // File input for car image
  const carImageInput = document.getElementById("carImageInput");
  const carCancelEditBtn = document.getElementById("carCancelEditBtn");


  // Responsive sidebar toggle
  
  const menuToggleBtn = document.getElementById('menuToggle');
  const apSidebar = document.querySelector('.ap-sidebar');
  const apOverlay = document.querySelector('.ap-overlay');
  if (menuToggleBtn && apSidebar) {
    menuToggleBtn.addEventListener('click', () => {
      apSidebar.classList.toggle('show');
      if (apOverlay) apOverlay.classList.toggle('show');
    });
  }
  if (apOverlay) {
    apOverlay.addEventListener('click', () => {
      apSidebar && apSidebar.classList.remove('show');
      apOverlay.classList.remove('show');
    });
  }

  // In-memory data for UI rendering
  let allBookings = [];
  let allContacts = [];
  let allCars = [];
  let allCustomers = [];
  let allPayments = [];
  let bookingCalendar = null;

  const redirectToLogin = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login.html";
  };

  // Log out handler
  logoutBtn.addEventListener("click", async () => {
    if (!token) return redirectToLogin();
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      // ignore errors on logout
    }
    redirectToLogin();
  });

  // If no token is present, redirect immediately
  if (!token) {
    return redirectToLogin();
  }

  // Verify token with backend. Once verified, load bookings and contact messages.
  fetch("/api/admin/verify", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) {
        throw new Error("Session expired. Please log in again.");
      }
      // Token is valid
      if (sessionBadge) {
        sessionBadge.textContent = "Session Active";
        sessionBadge.className = "badge text-bg-success";
      }

      // Init navigation and load data
      initNavigation();
      wireButtons();
      loadAllData();
    })
    .catch((err) => {
      alertBox.textContent = err.message;
      alertBox.classList.remove("d-none");
      if (sessionBadge) {
        sessionBadge.textContent = "Session Invalid";
        sessionBadge.className = "badge text-bg-danger";
      }
      setTimeout(() => {
        redirectToLogin();
      }, 2000);
    });

  function initNavigation() {
    if (!nav) return;
    nav.addEventListener("click", (e) => {
      const link = e.target.closest("a[data-section]");
      if (!link) return;
      e.preventDefault();
      const sectionKey = link.getAttribute("data-section");
      setActiveSection(sectionKey);
    });
  }

  function setActiveSection(sectionKey) {
    // Toggle active nav item
    if (nav) {
      nav.querySelectorAll(".nav-link").forEach((a) => {
        a.classList.toggle("active", a.getAttribute("data-section") === sectionKey);
      });
    }
    // Toggle sections
    Object.entries(sections).forEach(([key, el]) => {
      if (!el) return;
      el.classList.toggle("d-none", key !== sectionKey);
    });
    
    // For Calendar to render properly when it becomes visible
    if (sectionKey === "calendar" && bookingCalendar) {
      setTimeout(() => { bookingCalendar.render(); }, 10);
    }

    if (pageTitle) {
      pageTitle.textContent =
        sectionKey === "dashboard"
          ? "Dashboard"
          : sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
    }
  }

  function wireButtons() {
    refreshDashboardBtn && refreshDashboardBtn.addEventListener("click", loadAllData);
    refreshBookingsBtn && refreshBookingsBtn.addEventListener("click", loadBookings);
    refreshContactsBtn && refreshContactsBtn.addEventListener("click", loadContacts);
    refreshCarsBtn && refreshCarsBtn.addEventListener("click", loadCars);
    refreshCustomersBtn && refreshCustomersBtn.addEventListener("click", loadCustomers);
    refreshPaymentsBtn && refreshPaymentsBtn.addEventListener("click", loadPayments);

    bookingSearch && bookingSearch.addEventListener("input", () => {
      renderBookings();
    });

    customerSearch && customerSearch.addEventListener("input", () => {
      renderCustomers();
    });

    paymentSearch && paymentSearch.addEventListener("input", () => {
      renderPayments();
    });

    // Payments filters
    paymentStatus && paymentStatus.addEventListener('change', renderPayments);
    paymentFrom && paymentFrom.addEventListener('change', renderPayments);
    paymentTo && paymentTo.addEventListener('change', renderPayments);
    clearPaymentFiltersBtn && clearPaymentFiltersBtn.addEventListener('click', () => {
      if (paymentSearch) paymentSearch.value = '';
      if (paymentStatus) paymentStatus.value = '';
      if (paymentFrom) paymentFrom.value = '';
      if (paymentTo) paymentTo.value = '';
      renderPayments();
    });

    // Booking status change (admin)
    const bookingsTable = document.getElementById('bookingsTable');
    bookingsTable && bookingsTable.addEventListener('change', async (e) => {
      const sel = e.target.closest('select[data-action="status"]');
      if (!sel) return;
      const bookingId = sel.getAttribute('data-id');
      const newStatus = sel.value;
      try {
        const res = await fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Status update failed');
        // update local cache
        allBookings = allBookings.map(b => b.booking_id == bookingId ? { ...b, booking_status: newStatus } : b);
        renderBookings();
        renderDashboard();
      } catch (err) {
        if (typeof showCarHint === 'function') showCarHint(err.message, true);
        else console.error(err.message);
        // revert selection
        const prev = allBookings.find(b => b.booking_id == bookingId)?.booking_status || 'Pending';
        sel.value = prev;
      }
    });

    // Cars CRUD: create/update
    carCrudForm && carCrudForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = (carIdInput?.value || "").trim();
      // Build a FormData payload so that a file can be uploaded.  The API
      // will treat any missing fields as null and ignore them on update.
      const formData = new FormData();
      formData.append("name", (carNameInput?.value || "").trim());
      formData.append("color", (carColorInput?.value || "").trim());
      formData.append("price_per_day", carPriceInput?.value || "");
      formData.append("available", carAvailableInput?.checked ? 1 : 0);
      formData.append("model_year", (carModelYearInput?.value || "").trim());
      formData.append("brand", (carBrandInput?.value || "").trim());
      formData.append("seats", (carSeatsInput?.value || "").trim());
      formData.append("ac", (carAcInput?.value || "").trim());
      formData.append("fuel_type", (carFuelTypeInput?.value || "").trim());
      formData.append("transmission", (carTransmissionInput?.value || "").trim());
      // Attach image file if selected
      if (carImageInput && carImageInput.files && carImageInput.files[0]) {
        formData.append("image", carImageInput.files[0]);
      }
      // Validate required fields
      if (!formData.get("name") || !formData.get("price_per_day")) {
        showCarHint("Please provide car name and price.", true);
        return;
      }
      try {
        if (!token) return redirectToLogin();
        const url = id ? `/api/admin/cars/${encodeURIComponent(id)}` : "/api/admin/cars";
        const method = id ? "PUT" : "POST";
        const res = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Save failed");
        showCarHint(id ? "Car updated successfully" : "Car created successfully");
        resetCarForm();
        loadCars();
      } catch (err) {
        showCarHint(err.message, true);
      }
    });

    carCancelEditBtn && carCancelEditBtn.addEventListener("click", () => {
      resetCarForm();
    });
  }


  // Data Loading
 
  function loadAllData() {
    loadBookings();
    loadContacts();
    loadCars();
    loadCustomers();
    loadPayments();
  }

  // Fetch and render customers (admin)
  function loadCustomers() {
    if (!customersTbody) return;
    customersTbody.innerHTML = "";
    fetch("/api/admin/customers", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          throw new Error(data.message || "Failed to load customers");
        }
        allCustomers = data.customers || [];
        renderCustomers();
      })
      .catch((err) => {
        console.error(err);
        // show a small row error
        customersTbody.innerHTML = `<tr><td colspan="9" class="text-danger">${err.message}</td></tr>`;
      });
  }

  function renderCustomers() {
    if (!customersTbody) return;
    const q = (customerSearch?.value || "").toLowerCase();
    const filtered = (allCustomers || []).filter((c) => {
      const hay = `${c.name || ""} ${c.phone || ""} ${c.email || ""}`.toLowerCase();
      return !q || hay.includes(q);
    });

    customersTbody.innerHTML = "";
    if (filtered.length === 0) {
      customersTbody.innerHTML = `<tr><td colspan="9" class="text-secondary">No customers found.</td></tr>`;
      return;
    }

    filtered.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.id ?? ""}</td>
        <td>${escapeHtml(c.name || "-")}</td>
        <td>${escapeHtml(c.father_name || "-")}</td>
        <td>${escapeHtml(c.email || "-")}</td>
        <td>${escapeHtml(c.phone || "-")}</td>
        <td>${escapeHtml(c.cnic || "-")}</td>
        <td>${renderThumb(c.cnic_front_url)}</td>
        <td>${renderThumb(c.cnic_back_url)}</td>
        <td>${formatDate(c.created_at)}</td>
      `;
      customersTbody.appendChild(tr);
    });
  }

  // Fetch and render all bookings
  function loadBookings() {
    if (!bookingsTbody) return;
    bookingsTbody.innerHTML = "";
    fetch("/api/admin/bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          throw new Error(data.message || "Failed to load bookings");
        }
        allBookings = data.bookings || [];
        renderBookings();
        renderDashboard();
        updateCalendar();
        renderCharts();
      })
      .catch((err) => {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 12;
        td.className = "text-center text-danger";
        td.textContent = err.message;
        tr.appendChild(td);
        bookingsTbody.appendChild(tr);
      });
  }

  // Fetch and render all payments
  function loadPayments() {
    if (!paymentsTbody) return;
    paymentsTbody.innerHTML = `<tr><td colspan="9" class="text-center text-secondary">Loading…</td></tr>`;
    fetch("/api/admin/payments", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          throw new Error(data.message || "Failed to load payments");
        }
        allPayments = data.payments || [];
        renderPayments();
        renderCharts();
      })
      .catch((err) => {
        paymentsTbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger">${escapeHtml(err.message)}</td></tr>`;
      });
  }

  // Fetch and render all contact messages
  function loadContacts() {
    if (!contactsTbody) return;
    contactsTbody.innerHTML = "";
    fetch("/api/admin/contacts", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          throw new Error(data.message || "Failed to load contacts");
        }
        allContacts = data.contacts || [];
        renderContacts();
        renderDashboard();
      })
      .catch((err) => {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 5;
        td.className = "text-center text-danger";
        td.textContent = err.message;
        tr.appendChild(td);
        contactsTbody.appendChild(tr);
      });
  }

  // Load cars list (public endpoint)
  function loadCars() {
    if (!carsTbody) return;
    carsTbody.innerHTML = "";
    fetch("/api/admin/cars", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Failed to load cars");
        allCars = data.cars || [];
        renderCars();
        renderDashboard();
      })
      .catch((err) => {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 6;
        td.className = "text-center text-danger";
        td.textContent = err.message;
        tr.appendChild(td);
        carsTbody.appendChild(tr);
      });
  }

  function renderBookings() {
    if (!bookingsTbody) return;
    const q = (bookingSearch?.value || "").trim().toLowerCase();
    const filtered = !q
      ? allBookings
      : allBookings.filter((b) => {
          const name = String(b.customer_name || "").toLowerCase();
          const phone = String(b.customer_phone || "").toLowerCase();
          return name.includes(q) || phone.includes(q);
        });

    bookingsTbody.innerHTML = "";
    if (!filtered || filtered.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      // Adjust colspan to match the number of table columns when a driver column is present
      td.colSpan = 13;
      td.className = "text-center text-secondary";
      td.textContent = "No bookings found.";
      tr.appendChild(td);
      bookingsTbody.appendChild(tr);
      return;
    }

    filtered.forEach((b) => {
      const tr = document.createElement("tr");
      const status = b.booking_status || "Pending";
      const payStatus = b.payment_status || "unpaid";
      tr.innerHTML = `
        <td>${b.booking_id}</td>
        <td>${escapeHtml(b.customer_name)}</td>
        <td>${escapeHtml(b.customer_email)}</td>
        <td>${escapeHtml(b.customer_phone)}</td>
        <td>${escapeHtml(b.car_name)}</td>
        <td>${escapeHtml(b.car_color)}</td>
        <td>${escapeHtml(b.driver_option || "")}</td>
        <td>${escapeHtml(b.pickup_date || "")}</td>
        <td>${escapeHtml(b.pickup_time || "")}</td>
        <td>${escapeHtml(b.duration_days || "")}</td>
        <td>${renderStatusBadge(status)}</td>
        <td>${renderPaymentBadge(payStatus, b.payment_amount)}</td>
        <td class="ap-ellipsis" title="${escapeHtml(b.notes || "")}">${escapeHtml(b.notes || "")}</td>
        <td class="text-end">
          <select class="form-select form-select-sm d-inline-block" style="width:140px" data-action="status" data-id="${b.booking_id}">
            ${["Pending","Confirmed","Completed","Cancelled"].map(s=>`<option value="${s}" ${s===status?"selected":""}>${s}</option>`).join('')}
          </select>
        </td>
      `;
      bookingsTbody.appendChild(tr);
    });
  }

  function renderContacts() {
    if (!contactsTbody) return;
    contactsTbody.innerHTML = "";
    if (!allContacts || allContacts.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 5;
      td.className = "text-center text-secondary";
      td.textContent = "No contact messages found.";
      tr.appendChild(td);
      contactsTbody.appendChild(tr);
      return;
    }
    allContacts.forEach((m) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.id}</td>
        <td>${escapeHtml(m.name)}</td>
        <td>${escapeHtml(m.email)}</td>
        <td>${escapeHtml(m.message)}</td>
        <td>${escapeHtml(m.created_at || "")}</td>
      `;
      contactsTbody.appendChild(tr);
    });
  }

  function renderPayments() {
    if (!paymentsTbody) return;
    const q = (paymentSearch?.value || "").trim().toLowerCase();
    const statusFilter = (paymentStatus?.value || "").trim().toLowerCase();
    const fromVal = (paymentFrom?.value || "").trim();
    const toVal = (paymentTo?.value || "").trim();

    const fromDate = fromVal ? new Date(fromVal + 'T00:00:00') : null;
    const toDate = toVal ? new Date(toVal + 'T23:59:59') : null;

    const matchesFilters = (p) => {
      // status filter
      if (statusFilter) {
        const st = String(p.status || '').toLowerCase();
        if (st !== statusFilter) return false;
      }
      // date range filter
      if (fromDate || toDate) {
        const dRaw = p.payment_date || p.created_at;
        const d = dRaw ? new Date(dRaw) : null;
        if (!d || isNaN(d.getTime())) {
          // if date is invalid and filter is active, exclude
          return false;
        }
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
      }
      return true;
    };

    const filtered = !q
      ? (allPayments || []).filter(matchesFilters)
      : (allPayments || []).filter((p) => {
          if (!matchesFilters(p)) return false;
          const booking = String(p.booking_id || "").toLowerCase();
          const customer = String(p.customer_name || "").toLowerCase();
          const phone = String(p.customer_phone || "").toLowerCase();
          const car = String(p.car_name || "").toLowerCase();
          return booking.includes(q) || customer.includes(q) || phone.includes(q) || car.includes(q);
        });

    paymentsTbody.innerHTML = "";
    if (!filtered || filtered.length === 0) {
      paymentsTbody.innerHTML = `<tr><td colspan="9" class="text-center text-secondary">No payments found.</td></tr>`;
      return;
    }

    filtered.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.payment_id}</td>
        <td>${p.booking_id}</td>
        <td>${escapeHtml(p.customer_name || "-")}</td>
        <td>${escapeHtml((p.car_name || "-") + (p.car_color ? ` (${p.car_color})` : ""))}</td>
        <td>${formatMoney(p.amount)}</td>
        <td>${formatDate(p.payment_date || p.created_at)}</td>
        <td>${escapeHtml(p.payment_method || "-")}</td>
        <td>${renderPaymentStatusBadge(p.status)}</td>
        <td class="ap-ellipsis" title="${escapeHtml(p.stripe_payment_intent_id || "")}">${escapeHtml(p.stripe_payment_intent_id || "-")}</td>
      `;
      paymentsTbody.appendChild(tr);
    });
  }

  function renderCars() {
    if (!carsTbody) return;
    carsTbody.innerHTML = "";
    if (!allCars || allCars.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.className = "text-center text-secondary";
      td.textContent = "No cars found.";
      tr.appendChild(td);
      carsTbody.appendChild(tr);
      return;
    }
    allCars.forEach((c) => {
      const tr = document.createElement("tr");
      const checked = c.available ? "checked" : "";
      tr.innerHTML = `
        <td>${c.id}</td>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.color || "")}</td>
        <td>${escapeHtml(c.price_per_day ?? "")}</td>
        <td>
          <div class="form-check form-switch m-0">
            <input class="form-check-input ap-switch" type="checkbox" data-action="toggle" data-id="${c.id}" ${checked}>
          </div>
        </td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${c.id}">Edit</button>
          <button class="btn btn-sm btn-outline-danger ms-1" data-action="delete" data-id="${c.id}">Delete</button>
        </td>
      `;
      carsTbody.appendChild(tr);
    });

    // Wire row actions
    carsTbody.querySelectorAll("[data-action='edit']").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const car = (allCars || []).find((x) => String(x.id) === String(id));
        if (!car) return;
        setCarFormForEdit(car);
      });
    });
    carsTbody.querySelectorAll("[data-action='delete']").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (!confirm("Delete this car? If it is referenced by bookings, deletion may fail.")) return;
        try {
          const res = await fetch(`/api/admin/cars/${encodeURIComponent(id)}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.message || "Delete failed");
          showCarHint("Car deleted successfully");
          resetCarForm();
          loadCars();
        } catch (err) {
          showCarHint(err.message, true);
        }
      });
    });
    carsTbody.querySelectorAll("[data-action='toggle']").forEach((sw) => {
      sw.addEventListener("change", async () => {
        const id = sw.getAttribute("data-id");
        const available = sw.checked ? 1 : 0;
        try {
          const res = await fetch(`/api/admin/cars/${encodeURIComponent(id)}/availability`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ available }),
          });
          const data = await res.json();
          if (!data.success) throw new Error(data.message || "Update failed");
          showCarHint("Availability updated successfully");
        } catch (err) {
          showCarHint(err.message, true);
          // revert UI
          sw.checked = !sw.checked;
        }
      });
    });
  }

  function showCarHint(message, isError = false) {
    if (!carCrudHint) return;
    carCrudHint.textContent = message;
    carCrudHint.className = isError ? "small mt-2 text-danger" : "small mt-2 text-success";
  }

  function resetCarForm() {
    if (carIdInput) carIdInput.value = "";
    if (carNameInput) carNameInput.value = "";
    if (carColorInput) carColorInput.value = "";
    if (carPriceInput) carPriceInput.value = "";
    if (carAvailableInput) carAvailableInput.checked = true;
    if (carModelYearInput) carModelYearInput.value = "";
    if (carBrandInput) carBrandInput.value = "";
    if (carSeatsInput) carSeatsInput.value = "";
    if (carAcInput) carAcInput.value = "";
    if (carFuelTypeInput) carFuelTypeInput.value = "";
    if (carTransmissionInput) carTransmissionInput.value = "";
    // Clear the image input so that the same file is not re‑submitted on next form submit
    if (carImageInput) carImageInput.value = "";
    if (carFormMode) {
      carFormMode.textContent = "Add";
      carFormMode.className = "badge text-bg-secondary";
    }
    if (carCancelEditBtn) carCancelEditBtn.classList.add("d-none");
  }

  function setCarFormForEdit(car) {
    if (carIdInput) carIdInput.value = String(car.id);
    if (carNameInput) carNameInput.value = car.name || "";
    if (carColorInput) carColorInput.value = car.color || "";
    if (carPriceInput) carPriceInput.value = car.price_per_day ?? "";
    if (carAvailableInput) carAvailableInput.checked = !!car.available;
    if (carModelYearInput) carModelYearInput.value = car.model_year || "";
    if (carBrandInput) carBrandInput.value = car.brand || "";
    if (carSeatsInput) carSeatsInput.value = car.seats || "";
    if (carAcInput) carAcInput.value = car.ac || "";
    if (carFuelTypeInput) carFuelTypeInput.value = car.fuel_type || "";
    if (carTransmissionInput) carTransmissionInput.value = car.transmission || "";
    if (carFormMode) {
      carFormMode.textContent = "Edit";
      carFormMode.className = "badge text-bg-primary";
    }
    if (carCancelEditBtn) carCancelEditBtn.classList.remove("d-none");
    showCarHint("Editing car ID " + car.id);
  }

  function renderDashboard() {
    // Cards
    if (cardTotalBookings) cardTotalBookings.textContent = String(allBookings?.length ?? 0);
    if (cardCars) {
      const availableCount = (allCars || []).filter((c) => c.available).length;
      cardCars.textContent = String(availableCount);
    }
    if (cardMessages) cardMessages.textContent = String(allContacts?.length ?? 0);

    // Today's bookings = bookings created today
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todays = (allBookings || []).filter((b) => {
      const raw = b.booking_created_at || b.created_at || "";
      if (!raw) return false;
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return key === todayKey;
      }
      return String(raw).slice(0, 10) === todayKey;
    });
    if (cardTodayBookings) cardTodayBookings.textContent = String(todays.length);

    // Recent bookings table (top 8)
    if (recentBookingsTbody) {
      recentBookingsTbody.innerHTML = "";
      const recent = (allBookings || []).slice(0, 8);
      if (recent.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 5;
        td.className = "text-center text-secondary";
        td.textContent = "No recent bookings.";
        tr.appendChild(td);
        recentBookingsTbody.appendChild(tr);
      } else {
        recent.forEach((b) => {
          const tr = document.createElement("tr");
          const pickup = `${b.pickup_date || ""} ${b.pickup_time || ""}`.trim();
          tr.innerHTML = `
            <td>${b.booking_id}</td>
            <td>${escapeHtml(b.customer_name)}</td>
            <td>${escapeHtml(b.car_name)}</td>
            <td>${escapeHtml(pickup)}</td>
            <td>${escapeHtml(b.duration_days || "")}</td>
          `;
          recentBookingsTbody.appendChild(tr);
        });
      }
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDate(dt) {
    if (!dt) return "-";
    try {
      const d = new Date(dt);
      if (Number.isNaN(d.getTime())) return String(dt);
      return d.toLocaleString();
    } catch {
      return String(dt);
    }
  }

  function formatMoney(amount) {
    if (amount == null || amount === "") return "-";
    const n = Number(amount);
    if (Number.isNaN(n)) return String(amount);
    return n.toLocaleString() + " PKR";
  }

  function renderStatusBadge(status) {
    const s = String(status || "Pending");
    const cls =
      s === "Confirmed" ? "text-bg-primary" :
      s === "Completed" ? "text-bg-success" :
      s === "Cancelled" ? "text-bg-danger" :
      "text-bg-warning";
    return `<span class="badge ${cls}">${escapeHtml(s)}</span>`;
  }

  function renderPaymentStatusBadge(status) {
    const s = String(status || "unpaid");
    const cls =
      s === "succeeded" ? "text-bg-success" :
      s === "processing" ? "text-bg-warning" :
      s === "requires_payment_method" ? "text-bg-danger" :
      s === "unpaid" ? "text-bg-secondary" :
      "text-bg-secondary";
    return `<span class="badge ${cls}">${escapeHtml(s)}</span>`;
  }

  function renderPaymentBadge(status, amount) {
    const badge = renderPaymentStatusBadge(status);
    const amt = amount != null ? `<div class="small text-secondary">${formatMoney(amount)}</div>` : "";
    return `<div>${badge}${amt}</div>`;
  }

  function renderThumb(url) {
    if (!url) return "-";
    const safe = escapeHtml(url);
    return `
      <a href="${safe}" target="_blank" rel="noopener">
        <img class="ap-thumb" src="${safe}" alt="CNIC" />
      </a>
    `;
  }

  // Calendar & Analytics
  // =============================================
  // Calendar init handled inside function
  function initCalendar() {
    const calendarEl = document.getElementById("bookingCalendar");
    if (!calendarEl || bookingCalendar || !window.FullCalendar) return;
    bookingCalendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek'
      },
      events: []
    });
    bookingCalendar.render();
  }

  function updateCalendar() {
    if (!bookingCalendar) initCalendar();
    if (!bookingCalendar) return;

    bookingCalendar.removeAllEvents();
    if (!allBookings) return;

    allBookings.forEach(b => {
      if (!b.pickup_date) return;
      const start = new Date(b.pickup_date);
      if (isNaN(start.getTime())) return;

      const duration = parseInt(b.duration_days, 10) || 1;
      const end = new Date(start);
      end.setDate(end.getDate() + duration);

      let color = '#3788d8'; // default blue
      if (b.booking_status === 'Confirmed') color = '#28a745';
      else if (b.booking_status === 'Completed') color = '#17a2b8';
      else if (b.booking_status === 'Cancelled') color = '#dc3545';
      else if (b.booking_status === 'Pending') color = '#ffc107';

      bookingCalendar.addEvent({
        id: b.booking_id,
        title: `${b.car_name} - ${b.customer_name}`,
        start: start,
        end: end,
        backgroundColor: color,
        borderColor: color
      });
    });
  }

  let revenueChartInstance = null;
  let carsChartInstance = null;

  function renderCharts() {
    if (!window.Chart) return;
    renderRevenueChart();
    renderCarsChart();
  }

  function renderRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    const monthlyData = {};
    if (allPayments) {
      allPayments.forEach(p => {
        if (p.status === 'succeeded' && (p.payment_date || p.created_at)) {
          const d = new Date(p.payment_date || p.created_at);
          if (!isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[key] = (monthlyData[key] || 0) + (parseFloat(p.amount) || 0);
          }
        }
      });
    }

    const labels = Object.keys(monthlyData).sort();
    const data = labels.map(k => monthlyData[k]);

    if (revenueChartInstance) revenueChartInstance.destroy();

    revenueChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue (PKR)',
          data: data,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  function renderCarsChart() {
    const ctx = document.getElementById('carsChart');
    if (!ctx) return;

    const carCounts = {};
    if (allBookings) {
      allBookings.forEach(b => {
        if (b.car_name && b.booking_status !== 'Cancelled') {
          carCounts[b.car_name] = (carCounts[b.car_name] || 0) + 1;
        }
      });
    }

    const sortedCars = Object.keys(carCounts).sort((a, b) => carCounts[b] - carCounts[a]).slice(0, 7);
    const data = sortedCars.map(c => carCounts[c]);

    if (carsChartInstance) carsChartInstance.destroy();

    carsChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedCars,
        datasets: [{
          label: 'Total Bookings',
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

});