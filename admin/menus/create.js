(async function () {
  "use strict";

  await CafeUtils.mountAuthNav(document.getElementById("authLink"));
  if (!(await CafeUtils.requireAdmin())) return;

  var form = document.getElementById("create-form");
  var errorEl = document.getElementById("form-error");
  var imageInput = document.getElementById("image");
  var imagePreview = document.getElementById("image-preview");
  var selectedFile = null;
  var imagePosition = "50% 50%";

  imageInput.addEventListener("change", function () {
    var file = imageInput.files && imageInput.files[0];
    selectedFile = file || null;
    imagePosition = "50% 50%";
    imagePreview.innerHTML = file
      ? '<img src="' + URL.createObjectURL(file) + '" alt="선택한 메뉴 사진 미리보기" style="object-position:' + imagePosition + '">'
      : "이미지 없음";
  });

  imagePreview.addEventListener("click", async function (event) {
    var img = event.target.closest("img");
    if (!img) return;
    var result = await CafeUtils.openCropPicker(img.src, imagePosition);
    if (result) {
      imagePosition = result;
      img.style.objectPosition = imagePosition;
    }
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
      var image = selectedFile ? await CafeData.uploadMenuImage(selectedFile) : "";

      await CafeData.addMenu({
        name: name,
        category: document.getElementById("category").value,
        price: price,
        description: document.getElementById("description").value.trim(),
        image: image,
        imagePosition: imagePosition
      });

      window.location.href = "list";
    } catch (err) {
      errorEl.textContent = "메뉴 등록에 실패했습니다: " + (err.message || err);
      errorEl.style.display = "block";
    }
  });
})();
