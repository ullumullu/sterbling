(function () {
  'use strict';

  function arrowAnimation() {
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

  const domReady = new Promise((resolve, reject) => {
    function completed() {
      document.removeEventListener( 'load', completed );
      window.removeEventListener( 'load', completed );
      resolve();
    }
    
    if ( document.readyState === 'complete' ||
    ( document.readyState !== 'loading' && !document.documentElement.doScroll ) ) {
      // Handle it asynchronously to allow scripts the opportunity to delay ready
      window.setTimeout( completed );
    
    } else {
      // Use the handy event callback
      document.addEventListener( 'DOMContentLoaded', completed );
      // A fallback to window.onload, that will always work
      window.addEventListener('load', completed);
    }
  });


  async function ready (fn) {
    await domReady;
    return fn ? fn() : null;
  }

  ready()
    .then(() => arrowAnimation());

}());
