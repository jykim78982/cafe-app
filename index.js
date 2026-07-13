(function () {
  "use strict";

  CafeUtils.mountAuthNav(document.getElementById("authLink"));

  CafeData.init();

  document.getElementById("cartCount").textContent = CafeUtils.getCartCount();

  var heroVideo = document.querySelector(".hero-video");
  if (heroVideo && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    heroVideo.pause();
    heroVideo.removeAttribute("autoplay");
  }
})();
