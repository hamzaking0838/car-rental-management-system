document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("userToken");
  const alertBox = document.getElementById("userDashAlert");
  const tbody = document.querySelector("#bookingsTable tbody");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profilePhone = document.getElementById("profilePhone");
  const bookingSearch = document.getElementById("bookingSearchUser");
  const refreshBtn = document.getElementById("refreshUserBookings");
  const statTotal = document.getElementById("statTotalBookings");
  const statUpcoming = document.getElementById("statUpcoming");
  const statCompleted = document.getElementById("statCompleted");
  const userAvatar = document.getElementById("userAvatar");

  let allBookings = [];

  
  tbody?.addEventListener('click', async (e) => {
    const target = e.target;
    if (target && target.classList.contains('cancel-booking')) {
      const bookingId = target.getAttribute('data-id');
      if (!bookingId) return;
      // Optionally confirm with the user
      if (!confirm('Are you sure you want to cancel this booking?')) return;
      try {
        const res = await fetch(`/api/user/bookings/${encodeURIComponent(bookingId)}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Cancellation failed');
        // Reload bookings after cancelling
        allBookings = allBookings.map(b => {
          const id = b.booking_id ?? b.id;
          if (String(id) === String(bookingId)) {
            return { ...b, status: 'Cancelled' };
          }
          return b;
        });
        renderBookings();
        renderStats();
      } catch (err) {
        showError(err.message || 'An error occurred while cancelling');
      }
    }
  });

  function showError(msg) {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.classList.remove("d-none");
  }

  function statusBadge(status) {
    const s = (status || "Pending").toLowerCase();
    let cls = "text-bg-secondary";
    if (s === "confirmed") cls = "text-bg-primary";
    else if (s === "completed") cls = "text-bg-success";
    else if (s === "cancelled") cls = "text-bg-danger";
    else if (s === "pending") cls = "text-bg-warning";
    return `<span class="badge ${cls}">${status || "Pending"}</span>`;
  }

  function renderBookings() {
    const q = (bookingSearch?.value || "").trim().toLowerCase();
    const filtered = q
      ? allBookings.filter(b => String(b.car_name || b.car || "").toLowerCase().includes(q))
      : allBookings;

    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="ud-empty">No bookings found.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(b => {
      const id = b.booking_id ?? b.id ?? "-";
      const carName = b.car_name ?? b.car ?? "-";
      const pickupDate = b.pickup_date ?? "-";
      const pickupTime = b.pickup_time ?? "-";
      const days = b.duration_days ?? "-";
      const statusCell = statusBadge(b.status);
      // Only show cancel button if booking is not already cancelled or completed
      const s = String(b.status || '').toLowerCase();
      const allowCancel = s !== 'cancelled' && s !== 'completed';
      const actionCell = allowCancel ? `<button class="btn btn-sm btn-danger cancel-booking" data-id="${id}">Cancel</button>` : '';
      return `
      <tr>
        <td>${id}</td>
        <td class="fw-semibold">${carName}</td>
        <td>${pickupDate}</td>
        <td>${pickupTime}</td>
        <td>${days}</td>
        <td>${statusCell}</td>
        <td>${actionCell}</td>
      </tr>`;
    }).join("");
  }

  function renderStats() {
    const total = allBookings.length;
    const upcoming = allBookings.filter(b => String(b.status || "").toLowerCase() === "confirmed" || String(b.status || "").toLowerCase() === "pending").length;
    const completed = allBookings.filter(b => String(b.status || "").toLowerCase() === "completed").length;
    if (statTotal) statTotal.textContent = total;
    if (statUpcoming) statUpcoming.textContent = upcoming;
    if (statCompleted) statCompleted.textContent = completed;
  }

  if (!token) {
    window.location.href = "/user/login.html";
    return;
  }

  bookingSearch?.addEventListener("input", renderBookings);
  refreshBtn?.addEventListener('click', async ()=>{
    try { await loadBookings(); } catch(e){ showError(e.message||'Failed to refresh'); }
  });

  
  async function loadBookings() {
    await loadBookings();
  }

try {
    const verifyRes = await fetch("/api/user/verify", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) throw new Error("Please log in again.");

    const bookRes = await fetch("/api/user/bookings", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const bookData = await bookRes.json();

    allBookings = Array.isArray(bookData.bookings) ? bookData.bookings : [];
    renderBookings();
    renderStats();

    const storedName = localStorage.getItem("userName") || "";
    const storedEmail = localStorage.getItem("userEmail") || "";
    const storedPhone = localStorage.getItem("userPhone") || "";
    if (profileName) profileName.textContent = storedName || "-";
    if (profileEmail) profileEmail.textContent = storedEmail || "-";
    if (profilePhone) profilePhone.textContent = storedPhone || "-";

    // Fetch profile from API to ensure latest values
    try {
      const profRes = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profData = await profRes.json();
      if (profData.success && profData.user) {
        if (profileName) profileName.textContent = profData.user.name || (profileName.textContent || "-");
        if (profileEmail) profileEmail.textContent = profData.user.email || (profileEmail.textContent || "-");
       
      }
    } catch (e) {}

    if (userAvatar) userAvatar.textContent = (storedName.trim()[0] || storedEmail.trim()[0] || "U").toUpperCase();
  } catch (err) {
    showError(err.message || "Session expired.");
    setTimeout(() => {
      localStorage.removeItem("userToken");
      window.location.href = "/user/login.html";
    }, 1500);
  }
});
