document.addEventListener("DOMContentLoaded", () => {

  const elements = document.querySelectorAll("#car_outofcity h2, #car-outofcity table, #car_outofcity-animate");

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        }
      });
    },
    { threshold: 0.2 }
  );

  elements.forEach(el => observer.observe(el));
});
