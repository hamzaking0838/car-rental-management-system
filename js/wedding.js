
document.addEventListener("sectionsLoaded", () => {
  const section = document.querySelector("#wedding");
  if (!section) return;

  
  setTimeout(() => {
    const fadeUps = section.querySelectorAll(".fade-up");
    fadeUps.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add("animate");
      }, i * 200);
    });
  }, 200);
});
