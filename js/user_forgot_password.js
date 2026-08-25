// Logic for user password reset page
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("userResetForm");
  const errorAlert = document.getElementById("userResetAlert");
  const successAlert = document.getElementById("userResetSuccess");
  const sendCodeBtn = document.getElementById("sendCodeBtn");
  const codeGroup = document.getElementById("codeGroup");
  const passwordGroup = document.getElementById("passwordGroup");
  const resetBtn = document.getElementById("resetBtn");

  // Initially hide the code and new password inputs and the reset button
  if (codeGroup) codeGroup.style.display = "none";
  if (passwordGroup) passwordGroup.style.display = "none";
  if (resetBtn) resetBtn.style.display = "none";

  // Hide alerts helper
  function hideAlerts() {
    if (errorAlert) errorAlert.classList.add("d-none");
    if (successAlert) successAlert.classList.add("d-none");
  }

  // Send verification code to user's email
  if (sendCodeBtn) {
    sendCodeBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      hideAlerts();
      const email = document.getElementById("resetEmail").value.trim();
      if (!email) {
        if (errorAlert) {
          errorAlert.textContent = "Please enter your email address";
          errorAlert.classList.remove("d-none");
        }
        return;
      }
      try {
        const res = await fetch("/api/user/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to send verification code");
        }
        // Show success and reveal code/password fields
        if (successAlert) {
          successAlert.textContent = data.message || "Verification code sent";
          successAlert.classList.remove("d-none");
        }
        if (codeGroup) codeGroup.style.display = "block";
        if (passwordGroup) passwordGroup.style.display = "block";
        if (resetBtn) resetBtn.style.display = "block";
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message;
          errorAlert.classList.remove("d-none");
        }
      }
    });
  }

  // Handle password reset after the user enters the verification code and new password
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlerts();
    const email = document.getElementById("resetEmail").value.trim();
    const code = document.getElementById("resetCode").value.trim();
    const password = document.getElementById("resetPassword").value;
    if (!email || !code || !password) {
      if (errorAlert) {
        errorAlert.textContent = "Please complete all fields";
        errorAlert.classList.remove("d-none");
      }
      return;
    }
    try {
      const res = await fetch("/api/user/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, new_password: password }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Reset failed");
      }
      // Show success message and redirect after a short delay
      if (successAlert) {
        successAlert.textContent = data.message || "Password reset successfully";
        successAlert.classList.remove("d-none");
      }
      setTimeout(() => {
        window.location.href = "/user/login.html";
      }, 2000);
    } catch (err) {
      if (errorAlert) {
        errorAlert.textContent = err.message;
        errorAlert.classList.remove("d-none");
      }
    }
  });
});