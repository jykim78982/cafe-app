(function () {
  "use strict";

  var state = {
    search: "",
    category: "전체",
    sort: "recommended"
  };

  var searchInput = document.getElementById("searchInput");
  var categoryFilter = document.getElementById("categoryFilter");
  var sortSelect = document.getElementById("sortSelect");
  var menuGrid = document.getElementById("menuGrid");
  var emptyState = document.getElementById("emptyState");
  var resultCount = document.getElementById("resultCount");
  var cartCount = document.getElementById("cartCount");
  var toast = document.getElementById("toast");
  var toastTimer = null;

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

  function renderCategoryOptions() {
    categoryFilter.innerHTML = CafeData.getCategories().map(function (category) {
      return "<option value=\"" + CafeUtils.escapeHtml(category) + "\">" +
        CafeUtils.escapeHtml(category) +
        "</option>";
    }).join("");
  }

  function getFilteredMenus() {
    var keyword = state.search.trim().toLowerCase();

    return CafeData.getMenus()
      .filter(function (menu) {
        return state.category === "전체" || menu.category === state.category;
      })
      .filter(function (menu) {
        if (!keyword) return true;

        return menu.name.toLowerCase().indexOf(keyword) !== -1 ||
          menu.description.toLowerCase().indexOf(keyword) !== -1;
      })
      .sort(function (a, b) {
        if (state.sort === "name") {
          return a.name.localeCompare(b.name, "ko-KR");
        }

        if (state.sort === "priceAsc") {
          return Number(a.price) - Number(b.price);
        }

        if (state.sort === "priceDesc") {
          return Number(b.price) - Number(a.price);
        }

        return Number(a.soldOut) - Number(b.soldOut);
      });
  }

  function createImageMarkup(menu) {
    if (!menu.image) {
      return "이미지 없음";
    }

    return "<img src=\"" + CafeUtils.escapeHtml(CafeUtils.getMenuImageSrc(menu.image)) + "\" alt=\"" +
      CafeUtils.escapeHtml(menu.name) + "\">";
  }

  function renderMenuCard(menu) {
    var badge = menu.soldOut ? "<span class=\"menu-badge\">품절</span>" : "";

    return "" +
      "<article class=\"menu-card" + (menu.soldOut ? " is-soldout" : "") + "\">" +
        "<a class=\"menu-visual\" href=\"detail.html?id=" + encodeURIComponent(menu.id) + "\">" +
          badge +
          createImageMarkup(menu) +
        "</a>" +
        "<div class=\"menu-body\">" +
          "<span class=\"category-label\">" + CafeUtils.escapeHtml(menu.category) + "</span>" +
          "<a href=\"detail.html?id=" + encodeURIComponent(menu.id) + "\"><h3>" + CafeUtils.escapeHtml(menu.name) + "</h3></a>" +
          "<p class=\"menu-desc\">" + CafeUtils.escapeHtml(menu.description) + "</p>" +
          "<strong class=\"price\">" + CafeUtils.formatPrice(menu.price) + "</strong>" +
          "<button class=\"btn btn-primary btn-block add-btn\" type=\"button\" data-cart-id=\"" + CafeUtils.escapeHtml(menu.id) + "\"" +
            (menu.soldOut ? " disabled" : "") + ">담기</button>" +
        "</div>" +
      "</article>";
  }

  function render() {
    var menus = getFilteredMenus();
    menuGrid.innerHTML = menus.map(renderMenuCard).join("");
    emptyState.hidden = menus.length > 0;
    resultCount.textContent = menus.length + "개 표시 중";
  }

  searchInput.addEventListener("input", function (event) {
    state.search = event.target.value;
    render();
  });

  categoryFilter.addEventListener("change", function (event) {
    state.category = event.target.value;
    render();
  });

  sortSelect.addEventListener("change", function (event) {
    state.sort = event.target.value;
    render();
  });

  menuGrid.addEventListener("click", function (event) {
    var button = event.target.closest("[data-cart-id]");
    if (!button) return;

    var menu = CafeData.getMenuById(button.dataset.cartId);
    if (!menu || menu.soldOut) return;

    CafeUtils.addToCart({
      menuId: menu.id,
      name: menu.name,
      price: menu.price,
      image: menu.image,
      qty: 1
    });
    updateCartCount();
    showToast("'" + menu.name + "' 메뉴를 장바구니에 담았습니다.");
  });

  renderCategoryOptions();
  updateCartCount();
  render();
})();
