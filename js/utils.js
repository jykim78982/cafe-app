/* 공통 유틸리티: 장바구니(localStorage)와 Supabase Auth 기반 인증, 포맷팅. 모든 역할별 페이지가 공통으로 사용합니다. */
(function (global) {
  "use strict";

  var CART_KEY = "cafeapp_cart";

  function formatPrice(value) {
    return Number(value || 0).toLocaleString() + "원";
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  /* 사진 크롭 위치·확대 선택 모달. 프레임 안에서 사진을 드래그해 보여줄 영역을 정하고
     슬라이더로 확대할 수 있습니다. { position: "X% Y%", zoom: Number } 형태로 Promise를
     반환합니다(취소 시 null). */
  function openCropPicker(imageSrc, initialPosition, initialZoom) {
    return new Promise(function (resolve) {
      var FRAME = 320;
      var MIN_ZOOM = 1, MAX_ZOOM = 4;
      var naturalW = 0, naturalH = 0, coverScale = 1;
      var maxX = 0, maxY = 0;
      var zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, initialZoom || 1));

      var initParts = (initialPosition || "50% 50%").split(" ");
      var px = parseFloat(initParts[0]);
      var py = parseFloat(initParts[1]);
      if (isNaN(px)) px = 50;
      if (isNaN(py)) py = 50;

      var dragging = false, startX = 0, startY = 0, startPx = 0, startPy = 0;

      var overlay = document.createElement("div");
      overlay.className = "crop-picker-overlay";
      overlay.innerHTML = "" +
        '<div class="crop-picker-modal">' +
          '<p class="crop-picker-title">보여줄 영역을 드래그로 선택하세요</p>' +
          '<div class="crop-picker-frame"><img class="crop-picker-img" alt="크롭 대상 이미지"></div>' +
          '<div class="crop-picker-zoom">' +
            '<span aria-hidden="true">－</span>' +
            '<input type="range" class="crop-picker-zoom-range" min="' + MIN_ZOOM + '" max="' + MAX_ZOOM + '" step="0.1" value="' + zoom + '">' +
            '<span aria-hidden="true">＋</span>' +
          "</div>" +
          '<div class="crop-picker-actions">' +
            '<button type="button" class="btn btn-outline" data-action="cancel">취소</button>' +
            '<button type="button" class="btn btn-primary" data-action="confirm">적용</button>' +
          "</div>" +
        "</div>";
      document.body.appendChild(overlay);

      var frame = overlay.querySelector(".crop-picker-frame");
      var img = overlay.querySelector(".crop-picker-img");
      var zoomRange = overlay.querySelector(".crop-picker-zoom-range");

      function render() {
        var scale = coverScale * zoom;
        var scaledW = naturalW * scale;
        var scaledH = naturalH * scale;
        img.style.width = scaledW + "px";
        img.style.height = scaledH + "px";
        maxX = Math.max(0, scaledW - FRAME);
        maxY = Math.max(0, scaledH - FRAME);
        var offsetX = maxX * (px / 100);
        var offsetY = maxY * (py / 100);
        img.style.transform = "translate(" + (-offsetX) + "px, " + (-offsetY) + "px)";
      }

      function onPointerDown(e) {
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startPx = px;
        startPy = py;
      }

      function onPointerMove(e) {
        if (!dragging) return;
        px = maxX === 0 ? 50 : Math.min(100, Math.max(0, startPx - ((e.clientX - startX) / maxX) * 100));
        py = maxY === 0 ? 50 : Math.min(100, Math.max(0, startPy - ((e.clientY - startY) / maxY) * 100));
        render();
      }

      function onPointerUp() {
        dragging = false;
      }

      function onZoomInput() {
        zoom = Number(zoomRange.value);
        render();
      }

      function cleanup(result) {
        frame.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        zoomRange.removeEventListener("input", onZoomInput);
        document.body.removeChild(overlay);
        resolve(result);
      }

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) cleanup(null);
      });
      overlay.querySelector('[data-action="cancel"]').addEventListener("click", function () {
        cleanup(null);
      });
      overlay.querySelector('[data-action="confirm"]').addEventListener("click", function () {
        cleanup({
          position: Math.round(px) + "% " + Math.round(py) + "%",
          zoom: Math.round(zoom * 10) / 10
        });
      });

      img.addEventListener("load", function () {
        naturalW = img.naturalWidth;
        naturalH = img.naturalHeight;
        coverScale = Math.max(FRAME / naturalW, FRAME / naturalH);
        render();
      });
      img.src = imageSrc;

      frame.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      zoomRange.addEventListener("input", onZoomInput);
    });
  }

  function getMenuImageSrc(image) {
    if (!image) return "";
    if (/^(https?:|data:|blob:|\/)/.test(image)) return image;
    if (/^(\.\.?\/)/.test(image)) return image;
    if (location.pathname.indexOf("/admin/menus/") !== -1) return "../../" + image;
    if (location.pathname.indexOf("/menus/") !== -1 || location.pathname.indexOf("/basket/") !== -1 || location.pathname.indexOf("/orders/") !== -1) return "../" + image;
    return image;
  }

  function getMenuImageStyle(imagePosition, imageZoom) {
    var position = imagePosition || "50% 50%";
    var zoom = imageZoom || 1;
    return "object-position:" + position + ";transform-origin:" + position + ";transform:scale(" + zoom + ")";
  }

  function rootPath() {
    var p = location.pathname;
    if (p.indexOf("/admin/menus/") !== -1 || p.indexOf("/admin/orders/") !== -1) return "../../";
    if (p.indexOf("/admin/") !== -1) return "../";
    if (p.indexOf("/auth/") !== -1 || p.indexOf("/menus/") !== -1 || p.indexOf("/basket/") !== -1 || p.indexOf("/orders/") !== -1 || p.indexOf("/my/") !== -1) return "../";
    return "";
  }

  /* ===== 회원 인증 (Supabase Auth) ===== */
  function signup(data) {
    return global.sb.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name } }
    }).then(function (res) {
      if (res.error) return { error: res.error.message };
      if (res.data.session) return { session: res.data.session };
      return { needsConfirmation: true };
    });
  }

  function login(email, password) {
    return global.sb.auth.signInWithPassword({ email: email, password: password }).then(function (res) {
      if (res.error) return null;
      var session = res.data.session;
      var role = session.user.app_metadata && session.user.app_metadata.role === "admin" ? "admin" : "customer";
      return { session: session, role: role };
    });
  }

  function logout() {
    return global.sb.auth.signOut();
  }

  function getSession() {
    return global.sb.auth.getSession().then(function (res) {
      return res.data.session;
    });
  }

  function getRole(session) {
    return session && session.user.app_metadata && session.user.app_metadata.role === "admin" ? "admin" : "customer";
  }

  function requireLogin(loginPath) {
    return getSession().then(function (session) {
      if (!session) {
        location.href = (loginPath || rootPath() + "auth/login") + "?redirect=" + encodeURIComponent(location.pathname);
        return null;
      }
      return session;
    });
  }

  function requireAdmin(loginPath) {
    return getSession().then(function (session) {
      if (!session || getRole(session) !== "admin") {
        location.href = loginPath || rootPath() + "auth/login";
        return null;
      }
      return session;
    });
  }

  /* ===== 장바구니 ===== */
  function getCart() {
    var raw = localStorage.getItem(CART_KEY);
    if (raw === null) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    return cart;
  }

  function addToCart(item) {
    var cart = getCart();
    var existing = cart.find(function (c) { return c.menuId === item.menuId; });
    if (existing) {
      existing.qty += item.qty || 1;
    } else {
      cart.push(Object.assign({ qty: 1 }, item));
    }
    saveCart(cart);
    return cart;
  }

  function updateCartQty(menuId, qty) {
    var cart = getCart();
    var line = cart.find(function (c) { return c.menuId === menuId; });
    if (!line) return cart;
    if (qty <= 0) {
      cart = cart.filter(function (c) { return c.menuId !== menuId; });
    } else {
      line.qty = qty;
    }
    saveCart(cart);
    return cart;
  }

  function removeFromCart(menuId) {
    var cart = getCart().filter(function (c) { return c.menuId !== menuId; });
    saveCart(cart);
    return cart;
  }

  function clearCart() {
    saveCart([]);
  }

  function getCartCount() {
    return getCart().reduce(function (sum, item) { return sum + item.qty; }, 0);
  }

  function getCartTotal() {
    return getCart().reduce(function (sum, item) { return sum + item.price * item.qty; }, 0);
  }

  /* ===== 헤더 로그인/로그아웃 버튼 ===== */
  function mountAuthNav(el) {
    if (!el) return Promise.resolve();
    return getSession().then(function (session) {
      if (!session) {
        el.textContent = "LOGIN";
        el.setAttribute("href", rootPath() + "auth/login");
        return;
      }

      var role = getRole(session);
      var name = session.user.user_metadata && session.user.user_metadata.name;
      el.textContent = (name || (role === "admin" ? "관리자" : "회원")) + "님 · LOGOUT";
      el.setAttribute("href", "#");
      el.addEventListener("click", function (e) {
        e.preventDefault();
        logout().then(function () {
          location.href = rootPath() + "auth/login";
        });
      });
    });
  }

  global.CafeUtils = {
    formatPrice: formatPrice,
    escapeHtml: escapeHtml,
    getMenuImageSrc: getMenuImageSrc,
    getMenuImageStyle: getMenuImageStyle,
    openCropPicker: openCropPicker,
    rootPath: rootPath,
    getCart: getCart,
    saveCart: saveCart,
    addToCart: addToCart,
    updateCartQty: updateCartQty,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    getCartCount: getCartCount,
    getCartTotal: getCartTotal,
    signup: signup,
    login: login,
    logout: logout,
    getSession: getSession,
    getRole: getRole,
    requireLogin: requireLogin,
    requireAdmin: requireAdmin,
    mountAuthNav: mountAuthNav
  };
})(window);
