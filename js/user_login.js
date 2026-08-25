// Logic for user login page
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("userLoginForm");
  const alertBox = document.getElementById("userLoginAlert");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertBox.classList.add("d-none");
    const email = document.getElementById("userEmail").value.trim();
    const password = document.getElementById("userPassword").value;
    try {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }
      // Save token and user details for later use
      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userName", data.name);
      if (data.email) {
        localStorage.setItem("userEmail", data.email);
      }
      if (data.user_id) {
        localStorage.setItem("userId", data.user_id);
      }
   
      if (data.father_name) {
        localStorage.setItem("userFatherName", data.father_name);
      }
      if (data.phone) {
        localStorage.setItem("userPhone", data.phone);
      }
      if (data.address) {
        localStorage.setItem("userAddress", data.address);
      }
      if (data.cnic) {
        localStorage.setItem("userCnic", data.cnic);
      }
      
      window.location.href = "/index.html";
    } catch (err) {
      alertBox.textContent = err.message;
      alertBox.classList.remove("d-none");
    }
  });
});