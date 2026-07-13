(async function () {
  "use strict";

  await CafeUtils.mountAuthNav(document.getElementById("authLink"));
  if (!(await CafeUtils.requireAdmin())) return;

  var id = new URLSearchParams(window.location.search).get("id");
  var menu = id ? await CafeData.getMenuById(id) : null;

  if (!menu) {
    document.querySelector(".page").innerHTML = "<h1>메뉴를 찾을 수 없습니다</h1><a class=\"btn btn-outline\" href=\"list\">목록으로</a>";
    return;
  }

  document.getElementById("name").value = menu.name;
  document.getElementById("category").value = menu.category;
  document.getElementById("price").value = menu.price;
  document.getElementById("description").value = menu.description || "";
  document.getElementById("soldOut").checked = !!menu.soldOut;

  var form = document.getElementById("edit-form");
  var errorEl = document.getElementById("form-error");
  var imageInput = document.getElementById("image");
  var imagePreview = document.getElementById("image-preview");
  var selectedFile = null;
  var existingImage = menu.image || "";

  function renderImagePreview(src) {
    imagePreview.innerHTML = src
      ? '<img src="' + CafeUtils.escapeHtml(src) + '" alt="메뉴 사진 미리보기">'
      : "이미지 없음";
  }

  renderImagePreview(CafeUtils.getMenuImageSrc(existingImage));

  imageInput.addEventListener("change", function () {
    var file = imageInput.files && imageInput.files[0];
    selectedFile = file || null;
    renderImagePreview(file ? URL.createObjectURL(file) : CafeUtils.getMenuImageSrc(existingImage));
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var name = document.getElementById("name").value.trim();
    var price = Number(document.getElementById("price").value);

    if (!name || !price || price < 0) {
      errorEl.textContent = "메뉴명과 올바른 가격을 입력해주세요.";
      errorEl.style.display = "block";
      return;
    }

    try {
      var image = selectedFile ? await CafeData.uploadMenuImage(selectedFile) : existingImage;

      await CafeData.updateMenu(menu.id, {
        name: name,
        category: document.getElementById("category").value,
        price: price,
        description: document.getElementById("description").value.trim(),
        image: image,
        soldOut: document.getElementById("soldOut").checked
      });

      window.location.href = "detail?id=" + encodeURIComponent(menu.id);
    } catch (err) {
      errorEl.textContent = "메뉴 수정에 실패했습니다: " + (err.message || err);
      errorEl.style.display = "block";
    }
  });
})();
