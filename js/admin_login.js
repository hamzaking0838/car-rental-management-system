
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminLoginForm");
  const alertBox = document.getElementById("loginAlert");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertBox.classList.add("d-none");
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }
      // Save token in localStorage and redirect to dashboard
      localStorage.setItem("adminToken", data.token);
      window.location.href = "/admin/dashboard.html";
    } catch (err) {
      alertBox.textContent = err.message;
      alertBox.classList.remove("d-none");
    }
  });
});