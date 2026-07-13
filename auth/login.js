(async function () {
  "use strict";

  var session = await CafeUtils.getSession();
  if (session) {
    location.href = CafeUtils.getRole(session) === "admin" ? "../admin/" : "../my/";
    return;
  }

  var form = document.getElementById("loginForm");
  var errorEl = document.getElementById("formError");
  var params = new URLSearchParams(location.search);
  var redirect = params.get("redirect");

  if (params.get("confirm") === "1") {
    errorEl.textContent = "이메일로 전송된 링크로 인증을 완료한 뒤 로그인해주세요.";
    errorEl.hidden = false;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.hidden = true;

    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;

    var result = await CafeUtils.login(email, password);
    if (!result) {
      errorEl.textContent = "이메일 또는 비밀번호가 올바르지 않습니다.";
      errorEl.hidden = false;
      return;
    }

    location.href = result.role === "admin" ? "../admin/" : (redirect || "../my/");
  });
})();
