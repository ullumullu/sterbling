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


export async function ready (fn) {
  await domReady;
  return fn ? fn() : null;
}