/* Supabase 클라이언트 초기화. window.supabase(CDN UMD 빌드 전역)를 사용해 window.sb로 인스턴스를 노출합니다. */
(function (global) {
  "use strict";

  var SUPABASE_URL = "https://ftxyinvojjjtieylpskm.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_FAA8BDwjB6Y41R9lSB_tVA_VG15lhcC";

  global.sb = global.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
})(window);
