function initServices() {
  const cards = document.querySelectorAll(".service-card");
  if (!cards.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("in-view");
        }, index * 120);
      } else {
        entry.target.classList.remove("in-view");
      }
    });
  }, { threshold: 0.2 });

  cards.forEach(card => observer.observe(card));
}

document.addEventListener("DOMContentLoaded", initServices);
document.addEventListener("sectionsLoaded", initServices);
