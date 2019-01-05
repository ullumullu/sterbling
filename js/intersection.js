"use strict"

window.addEventListener('load', function () {
  var io = new IntersectionObserver(
    function (entries, observer) {
      entries.forEach(function (element, index) {
        if (element.isIntersecting) {
          var img = element.target;
          img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: "300px",
      threshold: [0]
    }
  );

  document.querySelectorAll('img.lazyload')
    .forEach(function (element, index) {
      io.observe(element);
    });
});