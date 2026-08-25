
function initDifferentSectionAnimations() {
  const options = {
    root: null,
    rootMargin: "0px 0px -8% 0px",
    threshold: 0.12
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        obs.unobserve(entry.target);
      }
    });
  }, options);

  const cards = document.querySelectorAll("#different .fade-up");
  cards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 80}ms`; // stagger
    observer.observe(card);
  });
}

// Wait until DOM content loaded and section exists
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (document.querySelector("#different")) {
      initDifferentSectionAnimations();
    }
  }, 220);
});


function initDifferentSectionAnimations() {
  const cards = document.querySelectorAll("#different .fade-up");
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = [...cards].indexOf(entry.target) * 150; // stagger delay
          setTimeout(() => {
            entry.target.classList.add("in-view");
          }, delay);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
  );

  cards.forEach((card) => observer.observe(card));
}

document.addEventListener("DOMContentLoaded", initDifferentSectionAnimations);
