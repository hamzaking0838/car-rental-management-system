document.addEventListener("sectionsLoaded", () => {
  const aboutSection = document.querySelector("#about");
  if (!aboutSection) return;

 
  AOS.refresh();


  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        // Remove and re-add AOS attributes to re-trigger animation
        entry.target.querySelectorAll('[data-aos]').forEach(el => {
          const aosType = el.getAttribute('data-aos');
          el.classList.remove('aos-animate');
          setTimeout(() => {
            el.classList.add('aos-animate');
          }, 50);
        });
      }
    });
  }, { threshold: 0.3 }); // 30% of section visible

  observer.observe(aboutSection);
});
