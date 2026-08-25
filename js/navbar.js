document.addEventListener("sectionsLoaded", () => {
  const navbar = document.querySelector(".animated-navbar");

  if (navbar) {
    setTimeout(() => navbar.classList.add("visible"), 200);

    window.addEventListener("scroll", () => {
      if (window.scrollY > 100) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    });
  }

  const guestLogin = document.getElementById("navGuestLogin");
  const guestRegister = document.getElementById("navGuestRegister");
  const userBookings = document.getElementById("navUserBookings");
  const userProfile = document.getElementById("navUserProfile");
  const userLogout = document.getElementById("navUserLogout");
  const logoutBtn = document.getElementById("userLogoutBtn");

  const userToken = localStorage.getItem("userToken");
  const isLoggedIn = !!userToken;

  if (guestLogin) {
    guestLogin.classList.toggle("d-none", isLoggedIn);
  }

  if (guestRegister) {
    guestRegister.classList.toggle("d-none", isLoggedIn);
  }

  if (userBookings) {
    userBookings.classList.toggle("d-none", !isLoggedIn);
  }

  if (userProfile) {
    userProfile.classList.toggle("d-none", !isLoggedIn);
  }

  if (userLogout) {
    userLogout.classList.toggle("d-none", !isLoggedIn);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (event) => {
      // Prevent anchor default navigation so that logout logic runs cleanly
      if (event) event.preventDefault();
      try {
        if (userToken) {
          await fetch("/api/user/logout", {
            method: "POST",
            headers: { Authorization: `Bearer ${userToken}` }
          });
        }
      } catch (e) {}

      localStorage.removeItem("userToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userPhone");

      window.location.href = "/index.html";
    });
  }
});