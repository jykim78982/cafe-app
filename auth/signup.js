(function () {
  "use strict";

  CafeData.init();

  if (CafeUtils.getSession()) {
    location.href = "../my/index.html";
    return;
  }

  var form = document.getElementById("signupForm");
  var errorEl = document.getElementById("formError");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.hidden = true;

    var name = document.getElementById("name").value.trim();
    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;
    var passwordConfirm = document.getElementById("passwordConfirm").value;

    if (!name || !email || !password) {
      errorEl.textContent = "모든 항목을 입력해주세요.";
      errorEl.hidden = false;
      return;
    }
    if (password !== passwordConfirm) {
      errorEl.textContent = "비밀번호가 일치하지 않습니다.";
      errorEl.hidden = false;
      return;
    }

    var result = CafeUtils.signup({ name: name, email: email, password: password });
    if (result && result.error) {
      errorEl.textContent = result.error;
      errorEl.hidden = false;
      return;
    }

    CafeUtils.login(email, password);
    location.href = "../my/index.html";
  });
})();
