/* 공통 유틸리티: 장바구니(localStorage)와 포맷팅. 모든 역할별 페이지가 공통으로 사용합니다. */
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

  global.CafeUtils = {
    formatPrice: formatPrice,
    escapeHtml: escapeHtml,
    getMenuImageSrc: getMenuImageSrc,
    getCart: getCart,
    saveCart: saveCart,
    addToCart: addToCart,
    updateCartQty: updateCartQty,
    removeFromCart: removeFromCart,
    clearCart: clearCart,
    getCartCount: getCartCount,
    getCartTotal: getCartTotal
  };
})(window);
