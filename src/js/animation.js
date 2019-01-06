export function arrowAnimation() {
  const handleArrowAnimation = (entries, observer) => {
    entries.forEach((element, index) => { 
      const arrow_animate = 'splash__container--arrow-down-animate';
      const arrow = element.target;
      (element.intersectionRatio > 0.25) ? arrow.classList.add(arrow_animate) : arrow.classList.remove(arrow_animate);
    });
  };

  const io = new IntersectionObserver(handleArrowAnimation, {
      rootMargin: '0px',
      threshold: [0.25]
    });

  document.querySelectorAll('.splash__container--arrow-down')
  .forEach(element => {
    io.observe(element);
  });
}
