(function () {
  "use strict";

  CafeUtils.mountAuthNav(document.getElementById("authLink"));

  var ORDERS_KEY = "cafeapp_orders";

  var basketList = document.getElementById("basketList");
  var emptyState = document.getElementById("emptyState");
  var summaryCard = document.getElementById("summaryCard");
  var totalCount = document.getElementById("totalCount");
  var totalPrice = document.getElementById("totalPrice");
  var cartCount = document.getElementById("cartCount");
  var checkoutButton = document.getElementById("checkoutButton");
  var toast = document.getElementById("toast");
  var toastTimer = null;

  var paymentOverlay = document.getElementById("paymentOverlay");
  var paymentCount = document.getElementById("paymentCount");
  var paymentAmount = document.getElementById("paymentAmount");
  var paymentActions = document.getElementById("paymentActions");
  var paymentProcessing = document.getElementById("paymentProcessing");
  var paymentCancel = document.getElementById("paymentCancel");
  var paymentConfirm = document.getElementById("paymentConfirm");

  CafeData.init();

  function updateCartCount() {
    cartCount.textContent = CafeUtils.getCartCount();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.hidden = true;
    }, 1800);
  }

  function renderThumb(item) {
    if (!item.image) return "";
    return "<img src=\"" + CafeUtils.escapeHtml(CafeUtils.getMenuImageSrc(item.image)) + "\" alt=\"" + CafeUtils.escapeHtml(item.name) + "\">";
  }

  function renderRow(item) {
    return "" +
      '<article class="basket-row glass" data-menu-id="' + CafeUtils.escapeHtml(item.menuId) + '">' +
        '<div class="item-thumb">' + renderThumb(item) + "</div>" +
        '<div class="item-info">' +
          "<h3>" + CafeUtils.escapeHtml(item.name) + "</h3>" +
          '<p class="unit-price">' + CafeUtils.formatPrice(item.price) + "</p>" +
        "</div>" +
        '<div class="qty-control" aria-label="수량 선택">' +
          '<button type="button" class="decrease-btn" aria-label="수량 감소">-</button>' +
          "<output>" + item.qty + "</output>" +
          '<button type="button" class="increase-btn" aria-label="수량 증가">+</button>' +
        "</div>" +
        '<div class="line-actions">' +
          '<strong class="line-price">' + CafeUtils.formatPrice(item.price * item.qty) + "</strong>" +
          '<button type="button" class="remove-btn">삭제</button>' +
        "</div>" +
      "</article>";
  }

  function render() {
    var cart = CafeUtils.getCart();

    if (cart.length === 0) {
      basketList.innerHTML = "";
      emptyState.hidden = false;
      summaryCard.hidden = true;
    } else {
      emptyState.hidden = true;
      summaryCard.hidden = false;
      basketList.innerHTML = cart.map(renderRow).join("");
    }

    totalCount.textContent = CafeUtils.getCartCount() + "개";
    totalPrice.textContent = CafeUtils.formatPrice(CafeUtils.getCartTotal());
    updateCartCount();
  }

  basketList.addEventListener("click", function (event) {
    var row = event.target.closest("[data-menu-id]");
    if (!row) return;

    var menuId = row.dataset.menuId;
    var cart = CafeUtils.getCart();
    var item = cart.find(function (c) { return c.menuId === menuId; });
    if (!item) return;

    if (event.target.closest(".increase-btn")) {
      CafeUtils.updateCartQty(menuId, item.qty + 1);
      render();
    } else if (event.target.closest(".decrease-btn")) {
      CafeUtils.updateCartQty(menuId, item.qty - 1);
      render();
    } else if (event.target.closest(".remove-btn")) {
      CafeUtils.removeFromCart(menuId);
      showToast("'" + item.name + "'을(를) 장바구니에서 삭제했습니다.");
      render();
    }
  });

  function generateOrderId() {
    return "o_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function getSelectedPaymentMethod() {
    var checked = document.querySelector('input[name="paymentMethod"]:checked');
    return checked ? checked.value : "카드";
  }

  function createOrder(cart) {
    var raw = localStorage.getItem(ORDERS_KEY);
    var orders = [];
    try {
      var parsed = raw === null ? [] : JSON.parse(raw);
      orders = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      orders = [];
    }

    var order = {
      id: generateOrderId(),
      status: "pending",
      createdAt: new Date().toISOString(),
      total: CafeUtils.getCartTotal(),
      paymentMethod: getSelectedPaymentMethod(),
      items: cart.map(function (item) {
        return { name: item.name, price: item.price, qty: item.qty };
      })
    };

    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    return order;
  }

  function openPaymentModal() {
    var cart = CafeUtils.getCart();
    if (cart.length === 0) return;

    paymentCount.textContent = CafeUtils.getCartCount() + "개";
    paymentAmount.textContent = CafeUtils.formatPrice(CafeUtils.getCartTotal());
    paymentActions.hidden = false;
    paymentProcessing.hidden = true;
    paymentOverlay.hidden = false;
  }

  function closePaymentModal() {
    paymentOverlay.hidden = true;
  }

  paymentCancel.addEventListener("click", closePaymentModal);

  paymentOverlay.addEventListener("click", function (event) {
    if (event.target === paymentOverlay) closePaymentModal();
  });

  paymentConfirm.addEventListener("click", function () {
    var cart = CafeUtils.getCart();
    if (cart.length === 0) return;

    paymentActions.hidden = true;
    paymentProcessing.hidden = false;

    setTimeout(function () {
      var order = createOrder(cart);
      CafeUtils.clearCart();
      window.location.href = "../orders/detail.html?id=" + encodeURIComponent(order.id);
    }, 900);
  });

  checkoutButton.addEventListener("click", openPaymentModal);

  render();
})();
