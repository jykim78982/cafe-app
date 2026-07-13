(function () {
  "use strict";

  CafeData.init();

  if (CafeUtils.getSession()) {
    location.href = "../my/index.html";
    return;
  }
  if (CafeUtils.getAdminSession()) {
    location.href = "../admin/index.html";
    return;
  }

  var form = document.getElementById("loginForm");
  var errorEl = document.getElementById("formError");
  var redirect = new URLSearchParams(location.search).get("redirect");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.hidden = true;

    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;

    var session = CafeUtils.login(email, password);
    if (session) {
      location.href = redirect || "../my/index.html";
      return;
    }

    var adminSession = CafeUtils.adminLogin(email, password);
    if (adminSession) {
      location.href = "../admin/index.html";
      return;
    }

    errorEl.textContent = "이메일 또는 비밀번호가 올바르지 않습니다.";
    errorEl.hidden = false;
  });
})();
