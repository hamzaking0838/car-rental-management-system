document.addEventListener("DOMContentLoaded", () => {

  const elements = document.querySelectorAll("#outcity h2, #outcity table, #outcity-animate");

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
