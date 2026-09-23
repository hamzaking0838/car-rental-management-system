
document.addEventListener("sectionsLoaded", () => {
  // Fade‑up animation
  const elements = document.querySelectorAll(".fade-up");
  elements.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add("animate");
    }, i * 165);
  });

  // Contact form submission handling
  const contactForm = document.querySelector("#contact .contact-form");
  if (contactForm) {
    let msgBox = contactForm.querySelector('.contact-msg');
    if (!msgBox) {
      msgBox = document.createElement('div');
      msgBox.className = 'contact-msg mt-3 text-center';
      msgBox.style.borderRadius = '5px';
      msgBox.style.padding = '10px';
      msgBox.style.display = 'none';
      contactForm.appendChild(msgBox);
    }

    function showMsg(text, isError=false) {
      msgBox.textContent = text;
      msgBox.style.display = 'block';
      msgBox.style.backgroundColor = isError ? '#ffebee' : '#e8f5e9';
      msgBox.style.color = isError ? '#c62828' : '#2e7d32';
      msgBox.style.border = `1px solid ${isError ? '#ef9a9a' : '#a5d6a7'}`;
      setTimeout(() => { msgBox.style.display = 'none'; }, 5000);
    }

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameInput = contactForm.querySelector("input[type='text']");
      const emailInput = contactForm.querySelector("input[type='email']");
      const messageInput = contactForm.querySelector("textarea");
      const name = nameInput ? nameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const message = messageInput ? messageInput.value.trim() : "";
      if (!name || !email || !message) {
        showMsg("Please fill in all contact form fields.", true);
        return;
      }
      const btn = contactForm.querySelector("button[type='submit']");
      if (btn) btn.disabled = true;
      try {
        const resp = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, email, message })
        });
        const json = await resp.json();
        showMsg(json.message || "Thank you for reaching out!");
        contactForm.reset();
      } catch (err) {
        console.error(err);
        showMsg("Failed to send message. Please try again later.", true);
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }
});
