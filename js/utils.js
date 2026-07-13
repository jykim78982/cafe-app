/* 공통 유틸리티: 장바구니(localStorage)와 포맷팅. 모든 역할별 페이지가 공통으로 사용합니다. */
(function (global) {
  "use strict";

  var CART_KEY = "cafeapp_cart";
  var USERS_KEY = "cafeapp_users";
  var SESSION_KEY = "cafeapp_session";
  var ADMIN_KEY = "cafeapp_admin";
  var ADMIN_SESSION_KEY = "cafeapp_admin_session";
  var SEED_ADMIN = { id: "admin1", email: "admin@cafe.com", password: "admin1234", name: "사장님" };

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

  function uid(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function readJSON(key, fallback) {
    var raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /* ===== 회원 인증 ===== */
  function getUsers() {
    return readJSON(USERS_KEY, []);
  }

  function signup(data) {
    var users = getUsers();
    if (users.some(function (u) { return u.email === data.email; })) {
      return { error: "이미 가입된 이메일입니다." };
    }
    var user = { id: uid("u"), email: data.email, password: data.password, name: data.name };
    users.push(user);
    writeJSON(USERS_KEY, users);
    return user;
  }

  function login(email, password) {
    var found = getUsers().find(function (u) { return u.email === email && u.password === password; });
    if (!found) return null;
    var session = { id: found.id, email: found.email, name: found.name };
    writeJSON(SESSION_KEY, session);
    return session;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function getSession() {
    return readJSON(SESSION_KEY, null);
  }

  function requireLogin(loginPath) {
    var session = getSession();
    if (!session) {
      location.href = (loginPath || rootPath() + "auth/login") + "?redirect=" + encodeURIComponent(location.pathname);
      return null;
    }
    return session;
  }

  /* ===== 관리자 인증 ===== */
  function ensureSeedAdmin() {
    var admins = readJSON(ADMIN_KEY, null);
    if (!admins) writeJSON(ADMIN_KEY, [SEED_ADMIN]);
  }

  function getAdmins() {
    ensureSeedAdmin();
    return readJSON(ADMIN_KEY, []);
  }

  function adminLogin(email, password) {
    var found = getAdmins().find(function (a) { return a.email === email && a.password === password; });
    if (!found) return null;
    var session = { id: found.id, email: found.email, name: found.name };
    writeJSON(ADMIN_SESSION_KEY, session);
    return session;
  }

  function adminLogout() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  function getAdminSession() {
    return readJSON(ADMIN_SESSION_KEY, null);
  }

  function requireAdmin(loginPath) {
    var session = getAdminSession();
    if (!session) {
      location.href = loginPath || rootPath() + "auth/login";
      return null;
    }
    return session;
  }

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
    if (!el) return;
    var session = getSession();
    var admin = getAdminSession();

    if (admin) {
      el.textContent = (admin.name || "관리자") + "님 · 로그아웃";
      el.setAttribute("href", "#");
      el.addEventListener("click", function (e) {
        e.preventDefault();
        adminLogout();
        location.href = rootPath() + "auth/login";
      });
      return;
    }

    if (session) {
      el.textContent = (session.name || "회원") + "님 · 로그아웃";
      el.setAttribute("href", "#");
      el.addEventListener("click", function (e) {
        e.preventDefault();
        logout();
        location.reload();
      });
      return;
    }

    el.textContent = "LOGIN";
    el.setAttribute("href", rootPath() + "auth/login");
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
    requireLogin: requireLogin,
    adminLogin: adminLogin,
    adminLogout: adminLogout,
    getAdminSession: getAdminSession,
    requireAdmin: requireAdmin,
    mountAuthNav: mountAuthNav
  };
})(window);
