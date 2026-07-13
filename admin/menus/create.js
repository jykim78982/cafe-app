(function () {
  "use strict";
  CafeData.init();

  var form = document.getElementById("create-form");
  var errorEl = document.getElementById("form-error");
  var imageInput = document.getElementById("image");
  var imagePreview = document.getElementById("image-preview");
  var imagePath = "";

  imageInput.addEventListener("change", function () {
    var file = imageInput.files && imageInput.files[0];
    imagePath = file ? "images/menus/" + file.name : "";
    imagePreview.innerHTML = file
      ? '<img src="' + URL.createObjectURL(file) + '" alt="선택한 메뉴 사진 미리보기">'
      : "이미지 없음";
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("name").value.trim();
    var price = Number(document.getElementById("price").value);

    if (!name || !price || price < 0) {
      errorEl.textContent = "메뉴명과 올바른 가격을 입력해주세요.";
      errorEl.style.display = "block";
      return;
    }

    CafeData.addMenu({
      name: name,
      category: document.getElementById("category").value,
      price: price,
      description: document.getElementById("description").value.trim(),
      image: imagePath
    });

    window.location.href = "list.html";
  });
})();
