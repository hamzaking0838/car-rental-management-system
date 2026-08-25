// Logic for user registration page
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("userRegisterForm");
  const alertBox = document.getElementById("userRegisterAlert");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertBox.classList.add("d-none");
    const name = document.getElementById("registerName").value.trim();
    // Collect additional registration details
    const father_name = document.getElementById("registerFatherName")?.value.trim();
    const phone = document.getElementById("registerPhone")?.value.trim();
    const address = document.getElementById("registerAddress")?.value.trim();
    const cnic = document.getElementById("registerCnic")?.value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("registerConfirmPassword").value;
    if (password !== confirmPassword) {
      alertBox.textContent = "Passwords do not match";
      alertBox.classList.remove("d-none");
      return;
    }
    try {
      const res = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // send extra fields: father_name, phone, address, cnic
        body: JSON.stringify({ name, father_name, email, phone, address, cnic, password }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Registration failed");
      }
      // Redirect to login page after successful registration
      alertBox.classList.remove("d-none");
      alertBox.classList.remove("alert-danger");
      alertBox.classList.add("alert-success");
      alertBox.textContent = "Registration successful! Redirecting to login...";
      setTimeout(() => {
        window.location.href = "/user/login.html";
      }, 1500);
    } catch (err) {
      alertBox.textContent = err.message;
      alertBox.classList.remove("d-none");
    }
  });
});