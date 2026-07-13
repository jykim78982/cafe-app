(function () {
  "use strict";

  CafeUtils.mountAuthNav(document.getElementById("authLink"));

  var params = new URLSearchParams(window.location.search);
  var menuId = params.get("id");
  var detailCard = document.getElementById("detailCard");
  var cartCount = document.getElementById("cartCount");
  var toast = document.getElementById("toast");
  var toastTimer = null;
  var quantity = 1;
  var cartModal = document.getElementById("cartModal");
  var cartModalDesc = document.getElementById("cartModalDesc");
  var modalContinueBtn = document.getElementById("modalContinueBtn");

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

  function createImageMarkup(menu) {
    if (!menu.image) {
      return "이미지 없음";
    }

    return "<img src=\"" + CafeUtils.escapeHtml(CafeUtils.getMenuImageSrc(menu.image)) + "\" alt=\"" +
      CafeUtils.escapeHtml(menu.name) + "\">";
  }

  function renderNotFound() {
    detailCard.innerHTML = "" +
      "<div class=\"empty-state\">" +
        "<p>메뉴를 찾을 수 없습니다.</p>" +
        "<a class=\"btn btn-primary\" href=\"list\">메뉴 목록으로 이동</a>" +
      "</div>";
  }

  function renderQuantity(menu) {
    var qtyOutput = document.getElementById("quantityOutput");
    var totalPrice = document.getElementById("totalPrice");
    qtyOutput.textContent = quantity;
    totalPrice.textContent = CafeUtils.formatPrice(Number(menu.price) * quantity);
  }

  function renderDetail(menu) {
    var soldOut = menu.soldOut ? "<span class=\"soldout-chip\">품절</span>" : "";

    detailCard.innerHTML = "" +
      "<div class=\"detail-layout\">" +
        "<div class=\"menu-visual\">" + createImageMarkup(menu) + "</div>" +
        "<div class=\"detail-body\">" +
          "<div class=\"chip-row\">" +
            "<span class=\"category-chip\">" + CafeUtils.escapeHtml(menu.category) + "</span>" +
            soldOut +
          "</div>" +
          "<h1>" + CafeUtils.escapeHtml(menu.name) + "</h1>" +
          "<strong class=\"price\">" + CafeUtils.formatPrice(menu.price) + "</strong>" +
          "<p class=\"description\">" + CafeUtils.escapeHtml(menu.description) + "</p>" +
          "<div class=\"order-panel\">" +
            "<div class=\"qty-row\">" +
              "<strong>수량</strong>" +
              "<div class=\"qty-control\" aria-label=\"수량 선택\">" +
                "<button type=\"button\" id=\"decreaseButton\" aria-label=\"수량 감소\">-</button>" +
                "<output id=\"quantityOutput\">1</output>" +
                "<button type=\"button\" id=\"increaseButton\" aria-label=\"수량 증가\">+</button>" +
              "</div>" +
            "</div>" +
            "<div class=\"total-row\">" +
              "<span>합계</span>" +
              "<strong id=\"totalPrice\">" + CafeUtils.formatPrice(menu.price) + "</strong>" +
            "</div>" +
            "<div class=\"order-actions\">" +
              "<button class=\"btn btn-outline\" type=\"button\" id=\"cartButton\"" +
                (menu.soldOut ? " disabled" : "") + ">장바구니 담기</button>" +
              "<button class=\"btn btn-primary\" type=\"button\" id=\"buyButton\"" +
                (menu.soldOut ? " disabled" : "") + ">바로 주문</button>" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>";

    document.getElementById("decreaseButton").addEventListener("click", function () {
      quantity = Math.max(1, quantity - 1);
      renderQuantity(menu);
    });

    document.getElementById("increaseButton").addEventListener("click", function () {
      quantity += 1;
      renderQuantity(menu);
    });

    document.getElementById("cartButton").addEventListener("click", function () {
      if (menu.soldOut) return;

      CafeUtils.addToCart({
        menuId: menu.id,
        name: menu.name,
        price: menu.price,
        image: menu.image,
        qty: quantity
      });
      updateCartCount();
      cartModalDesc.textContent = "'" + menu.name + "' " + quantity + "개를 장바구니에 담았습니다.";
      cartModal.hidden = false;
    });

    document.getElementById("buyButton").addEventListener("click", function () {
      if (menu.soldOut) return;

      CafeUtils.addToCart({
        menuId: menu.id,
        name: menu.name,
        price: menu.price,
        image: menu.image,
        qty: quantity
      });
      location.href = "../basket/list";
    });
  }

  modalContinueBtn.addEventListener("click", function () {
    cartModal.hidden = true;
  });

  cartModal.addEventListener("click", function (event) {
    if (event.target === cartModal) cartModal.hidden = true;
  });

  var menu = CafeData.getMenuById(menuId);
  updateCartCount();

  if (menu) {
    renderDetail(menu);
  } else {
    renderNotFound();
  }
})();
