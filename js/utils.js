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

  function getMenuImageSrc(image) {
    if (!image) return "";
    if (/^(https?:|data:|blob:|\/)/.test(image)) return image;
    if (/^(\.\.?\/)/.test(image)) return image;
    if (location.pathname.indexOf("/admin/menus/") !== -1) return "../../" + image;
    if (location.pathname.indexOf("/menus/") !== -1 || location.pathname.indexOf("/basket/") !== -1 || location.pathname.indexOf("/orders/") !== -1) return "../" + image;
    return image;
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
      el.textContent = (name || (role === "admin" ? "관리자" : "회원")) + "님 · 로그아웃";
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
