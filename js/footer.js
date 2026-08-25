
Promise.all(sections.map(loadSection))
  .then(() => {
   
    setTimeout(() => {
      initFooterAnimations();
    }, 80);
  })
  .catch((err) => console.error("Error loading sections:", err));

/* --------- Footer/section animation init --------- */
function initFooterAnimations() {
  // select items we want to animate
  const observerOptions = {
    root: null,
    rootMargin: "0px 0px -8% 0px",
    threshold: 0.12
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        // once in view, unobserve to avoid repeated work
        io.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // animate fade items
  document.querySelectorAll(".footer-section .fade-up, .footer-section .fade-right, .footer-section .fade-left, .footer-section .hr-reveal, .footer-section .small")
    .forEach(el => io.observe(el));

  // ensure icon wrappers animate on load too (slight stagger)
  const icons = document.querySelectorAll(".footer-section .icon-wrapper");
  icons.forEach((ic, idx) => {
    ic.style.transitionDelay = `${idx * 70}ms`;
   
    ic.classList.add("fade-up");
    io.observe(ic);
  });
}


function initFooterAnimations() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -5% 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const targets = document.querySelectorAll(
    ".footer-section .fade-up, .footer-section .fade-left, .footer-section .fade-right"
  );

  targets.forEach((el) => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  // run after footer load
  setTimeout(() => {
    if (document.querySelector(".footer-section")) {
      initFooterAnimations();
    }
  }, 200);
});
