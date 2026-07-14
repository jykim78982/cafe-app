(async function () {
  "use strict";

  await CafeUtils.mountAuthNav(document.getElementById("authLink"));

  var VIEW_KEY = "cafeapp_menu_view";

  var state = {
    category: "전체",
    view: localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid"
  };

  var cachedMenus = [];

  var tabsEl = document.getElementById("tabs");
  var gridViewBtn = document.getElementById("gridViewBtn");
  var listViewBtn = document.getElementById("listViewBtn");
  var menuGrid = document.getElementById("menuGrid");
  var emptyState = document.getElementById("emptyState");
  var cartCount = document.getElementById("cartCount");

  function updateCartCount() {
    cartCount.textContent = CafeUtils.getCartCount();
  }

  function renderTabs() {
    var categories = CafeData.getCategories();
    tabsEl.innerHTML = categories.map(function (category) {
      return "<button type=\"button\" class=\"tab" + (category === state.category ? " is-active" : "") + "\" data-category=\"" + CafeUtils.escapeHtml(category) + "\">" + CafeUtils.escapeHtml(category) + "</button>";
    }).join("");

    tabsEl.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        state.category = tab.dataset.category;
        renderTabs();
        render();
      });
    });
  }

  function getFilteredMenus() {
    return state.category === "전체"
      ? cachedMenus
      : cachedMenus.filter(function (menu) { return menu.category === state.category; });
  }

  function createImageMarkup(menu) {
    if (!menu.image) {
      return "이미지 없음";
    }

    return "<img src=\"" + CafeUtils.escapeHtml(CafeUtils.getMenuImageSrc(menu.image)) + "\" alt=\"" +
      CafeUtils.escapeHtml(menu.name) + "\" style=\"" + CafeUtils.escapeHtml(CafeUtils.getMenuImageStyle(menu.imagePosition, menu.imageZoom)) + "\">";
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
    applyView();
  }

  gridViewBtn.addEventListener("click", function () { setView("grid"); });
  listViewBtn.addEventListener("click", function () { setView("list"); });

  renderTabs();
  updateCartCount();
  cachedMenus = await CafeData.getMenus();
  render();
})();
