export function deferiframes() {

  var io = new IntersectionObserver(
    function (entries, observer) {

      entries.forEach(function (element, index) {
        if (element.isIntersecting) {
          var iframe = element.target;
          iframe.src = iframe.dataset.src;
          observer.unobserve(iframe);
        }
      });

    }, {
      rootMargin: "300px",
      threshold: [0]
    }
  );

  document.querySelectorAll('iframe.lazyload')
    .forEach(function (element, index) {
      io.observe(element);
    });

};