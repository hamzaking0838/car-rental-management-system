document.addEventListener('sectionsLoaded', () => {
  const hero = document.querySelector('.hero-section');
  if (!hero) return;

  const title = hero.querySelector('.hero-title');
  const text = hero.querySelector('.hero-text');
  const car = hero.querySelector('.car-image');
  const stripe = hero.querySelector('.red-stripe');
  const bgCar = hero.querySelector('.bg-car');


  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {

        // Reset previous animations
        [title, text, car, stripe, bgCar].forEach(el => el.style.animation = 'none');

        // Force reflow
        void title.offsetWidth;

        // Re-add animations
        title.style.animation = 'fadeUp 1.2s ease forwards';
        text.style.animation = 'fadeUp 1.6s ease forwards';
        car.style.animation = 'floatCar 4s ease-in-out infinite';
        stripe.style.animation = 'stripeGlow 4s ease-in-out infinite alternate';
      }
    });
  }, { threshold: 0.6 });

  observer.observe(hero);

 
  window.addEventListener("scroll", () => {
    const scrollY = window.scrollY;
    const heroTop = hero.offsetTop;
    const heroHeight = hero.offsetHeight;

    if (scrollY + window.innerHeight > heroTop && scrollY < heroTop + heroHeight) {
      const offset = (scrollY - heroTop) * 0.2;
      stripe.style.transform = `translateY(${offset}px)`;
    }
  });
});
