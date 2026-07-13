(async function () {
  "use strict";

  await CafeUtils.mountAuthNav(document.getElementById("authLink"));
  if (!(await CafeUtils.requireAdmin())) return;

  var id = new URLSearchParams(window.location.search).get("id");
  var menu = id ? await CafeData.getMenuById(id) : null;
  var detailEl = document.getElementById("menu-detail");

  if (!menu) {
    detailEl.innerHTML = "<p>메뉴를 찾을 수 없습니다.</p><a class=\"btn btn-outline\" href=\"list\">목록으로</a>";
    return;
  }

  var image = menu.image
    ? '<img src="' + CafeUtils.escapeHtml(CafeUtils.getMenuImageSrc(menu.image)) + '" alt="' + CafeUtils.escapeHtml(menu.name) + '">'
    : "";

  detailEl.innerHTML =
    '<div class="glass detail-card">' +
      '<div class="detail-thumb">' + image + "</div>" +
      "<h1>" + CafeUtils.escapeHtml(menu.name) + (menu.soldOut ? '<span class="soldout-badge">품절</span>' : "") + "</h1>" +
      '<div class="detail-category">' + CafeUtils.escapeHtml(menu.category) + "</div>" +
      '<div class="detail-price">' + CafeUtils.formatPrice(menu.price) + "</div>" +
      '<p class="detail-desc">' + CafeUtils.escapeHtml(menu.description || "설명이 없습니다.") + "</p>" +
      '<div class="detail-actions">' +
        '<a class="btn btn-primary" href="edit?id=' + encodeURIComponent(menu.id) + '">수정</a>' +
        '<button type="button" class="btn btn-danger" id="delete-btn">삭제</button>' +
      "</div>" +
    "</div>";

  document.getElementById("delete-btn").addEventListener("click", async function () {
    if (!confirm("이 메뉴를 삭제할까요?")) return;
    await CafeData.deleteMenu(menu.id);
    window.location.href = "list";
  });
})();
