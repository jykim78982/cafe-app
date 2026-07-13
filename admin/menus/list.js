(async function () {
  "use strict";

  await CafeUtils.mountAuthNav(document.getElementById("authLink"));
  if (!(await CafeUtils.requireAdmin())) return;

  var VIEW_KEY = "cafeapp_admin_menu_view";

  var activeCategory = "전체";
  var view = localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  var tabsEl = document.getElementById("tabs");
  var listEl = document.getElementById("menu-list");
  var emptyEl = document.getElementById("empty-msg");
  var gridViewBtn = document.getElementById("gridViewBtn");
  var listViewBtn = document.getElementById("listViewBtn");

  function applyView() {
    listEl.classList.toggle("is-list", view === "list");
    gridViewBtn.setAttribute("aria-pressed", String(view === "grid"));
    listViewBtn.setAttribute("aria-pressed", String(view === "list"));
  }

  function setView(next) {
    view = next;
    localStorage.setItem(VIEW_KEY, view);
    applyView();
  }

  gridViewBtn.addEventListener("click", function () { setView("grid"); });
  listViewBtn.addEventListener("click", function () { setView("list"); });

  function renderTabs() {
    var categories = CafeData.getCategories();
    tabsEl.innerHTML = categories.map(function (c) {
      return '<button type="button" class="tab' + (c === activeCategory ? " is-active" : "") + '" data-category="' + CafeUtils.escapeHtml(c) + '">' + CafeUtils.escapeHtml(c) + "</button>";
    }).join("");

    tabsEl.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        activeCategory = tab.dataset.category;
        renderTabs();
        renderList();
      });
    });
  }

  async function renderList() {
    var all = await CafeData.getMenus();
    var menus = activeCategory === "전체" ? all : all.filter(function (m) { return m.category === activeCategory; });

    if (menus.length === 0) {
      listEl.innerHTML = "";
      emptyEl.style.display = "block";
      return;
    }
    emptyEl.style.display = "none";

    listEl.innerHTML = menus.map(function (m) {
      var image = m.image
        ? '<img src="' + CafeUtils.escapeHtml(CafeUtils.getMenuImageSrc(m.image)) + '" alt="' + CafeUtils.escapeHtml(m.name) + '" style="object-position:' + CafeUtils.escapeHtml(m.imagePosition || "50% 50%") + '">'
        : "";

      var badge = m.soldOut ? '<span class="badge">품절</span>' : "";

      return (
        '<div class="glass menu-card' + (m.soldOut ? " is-soldout" : "") + '" data-id="' + CafeUtils.escapeHtml(m.id) + '">' +
          '<div class="thumb">' + badge + image + "</div>" +
          '<div class="name">' + CafeUtils.escapeHtml(m.name) + "</div>" +
          '<div class="category">' + CafeUtils.escapeHtml(m.category) + "</div>" +
          '<div class="price">' + CafeUtils.formatPrice(m.price) + "</div>" +
          '<div class="actions">' +
            '<a class="btn btn-outline" href="detail?id=' + encodeURIComponent(m.id) + '">상세</a>' +
            '<button type="button" class="btn btn-outline toggle-soldout" data-id="' + m.id + '">' + (m.soldOut ? "품절 해제" : "품절 처리") + "</button>" +
            '<button type="button" class="btn btn-danger delete-menu" data-id="' + m.id + '">삭제</button>' +
          "</div>" +
        "</div>"
      );
    }).join("");

    listEl.querySelectorAll(".toggle-soldout").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        var menu = await CafeData.getMenuById(btn.dataset.id);
        await CafeData.updateMenu(btn.dataset.id, { soldOut: !menu.soldOut });
        renderList();
      });
    });

    listEl.querySelectorAll(".delete-menu").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        if (!confirm("이 메뉴를 삭제할까요?")) return;
        await CafeData.deleteMenu(btn.dataset.id);
        renderList();
      });
    });

    applyView();
  }

  listEl.addEventListener("click", function (event) {
    if (event.target.closest("a, button")) return;
    var card = event.target.closest("[data-id]");
    if (!card) return;
    location.href = "detail?id=" + encodeURIComponent(card.dataset.id);
  });

  renderTabs();
  renderList();
})();
