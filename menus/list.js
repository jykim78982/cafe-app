(async function () {
  "use strict";

  await CafeUtils.mountAuthNav(document.getElementById("authLink"));

  var VIEW_KEY = "cafeapp_menu_view";

  var state = {
    search: "",
    category: "전체",
    sort: "recommended",
    view: localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid"
  };

  var cachedMenus = [];

  var searchInput = document.getElementById("searchInput");
  var categoryFilter = document.getElementById("categoryFilter");
  var sortSelect = document.getElementById("sortSelect");
  var gridViewBtn = document.getElementById("gridViewBtn");
  var listViewBtn = document.getElementById("listViewBtn");
  var menuGrid = document.getElementById("menuGrid");
  var emptyState = document.getElementById("emptyState");
  var resultCount = document.getElementById("resultCount");
  var cartCount = document.getElementById("cartCount");

  function updateCartCount() {
    cartCount.textContent = CafeUtils.getCartCount();
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

    return cachedMenus
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
      "<a class=\"menu-card" + (menu.soldOut ? " is-soldout" : "") + "\" href=\"detail?id=" + encodeURIComponent(menu.id) + "\">" +
        "<span class=\"menu-visual\">" +
          badge +
          createImageMarkup(menu) +
        "</span>" +
        "<div class=\"menu-body\">" +
          "<span class=\"category-label\">" + CafeUtils.escapeHtml(menu.category) + "</span>" +
          "<h3>" + CafeUtils.escapeHtml(menu.name) + "</h3>" +
          "<p class=\"menu-desc\">" + CafeUtils.escapeHtml(menu.description) + "</p>" +
          "<strong class=\"price\">" + CafeUtils.formatPrice(menu.price) + "</strong>" +
        "</div>" +
      "</a>";
  }

  function applyView() {
    menuGrid.classList.toggle("is-list", state.view === "list");
    gridViewBtn.setAttribute("aria-pressed", String(state.view === "grid"));
    listViewBtn.setAttribute("aria-pressed", String(state.view === "list"));
  }

  function setView(view) {
    state.view = view;
    localStorage.setItem(VIEW_KEY, view);
    applyView();
  }

  function render() {
    var menus = getFilteredMenus();
    menuGrid.innerHTML = menus.map(renderMenuCard).join("");
    emptyState.hidden = menus.length > 0;
    resultCount.textContent = menus.length + "개 표시 중";
    applyView();
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

  gridViewBtn.addEventListener("click", function () { setView("grid"); });
  listViewBtn.addEventListener("click", function () { setView("list"); });

  renderCategoryOptions();
  updateCartCount();
  cachedMenus = await CafeData.getMenus();
  render();
})();
