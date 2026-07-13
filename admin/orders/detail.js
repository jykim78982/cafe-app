(async function () {
  "use strict";

  await CafeUtils.mountAuthNav(document.getElementById("authLink"));
  if (!(await CafeUtils.requireAdmin())) return;

  var STATUS_LABELS = {
    pending: "주문 대기",
    confirmed: "주문 확인",
    preparing: "제조 중",
    ready: "픽업 대기",
    completed: "완료",
    cancelled: "취소"
  };

  var params = new URLSearchParams(window.location.search);
  var orderId = params.get("id");
  var detailCard = document.getElementById("detailCard");
  var statusMessage = document.getElementById("statusMessage");
  var statusMessageTimer = null;

  function formatDate(value) {
    var date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return "날짜 없음";

    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getStatusLabel(status) {
    return STATUS_LABELS[status] || status;
  }

  function getStatusClass(status) {
    return "status-" + CafeUtils.escapeHtml(status);
  }

  function showStatusMessage(message) {
    statusMessage.textContent = message;
    statusMessage.hidden = false;
    clearTimeout(statusMessageTimer);
    statusMessageTimer = setTimeout(function () {
      statusMessage.hidden = true;
    }, 1800);
  }

  function renderNotFound() {
    detailCard.innerHTML = "" +
      "<div class=\"empty-state\">" +
        "<p>주문 ID에 해당하는 주문을 찾을 수 없습니다.</p>" +
        "<a class=\"btn btn-primary\" href=\"list\">주문 목록으로 이동</a>" +
      "</div>";
  }

  function renderItems(items) {
    if (items.length === 0) {
      return "<li><span class=\"item-name\">주문 메뉴 정보 없음</span></li>";
    }

    return items.map(function (item) {
      return "" +
        "<li>" +
          "<span class=\"item-name\">" + CafeUtils.escapeHtml(item.name) + "</span>" +
          "<span class=\"item-qty\">" + item.qty + "개</span>" +
          "<span class=\"item-total\">" + CafeUtils.formatPrice(item.price * item.qty) + "</span>" +
        "</li>";
    }).join("");
  }

  function renderDetail(order) {
    var itemCount = order.items.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
    var subtotal = order.items.reduce(function (sum, item) {
      return sum + item.price * item.qty;
    }, 0);

    detailCard.innerHTML = "" +
      "<div class=\"detail-top\">" +
        "<div>" +
          "<p class=\"eyebrow\">Order Detail</p>" +
          "<h1>주문번호 " + CafeUtils.escapeHtml(order.id) + "</h1>" +
          "<p class=\"order-date\">주문 시간 " + CafeUtils.escapeHtml(formatDate(order.createdAt)) + "</p>" +
        "</div>" +
        "<span class=\"status-chip " + getStatusClass(order.status) + "\">" +
          CafeUtils.escapeHtml(getStatusLabel(order.status)) +
        "</span>" +
      "</div>" +
      "<div class=\"info-grid\" aria-label=\"주문자 및 주문 요약\">" +
        "<div class=\"info-card\"><span>주문자</span><strong>방문 고객</strong></div>" +
        "<div class=\"info-card\"><span>연락처</span><strong>미입력</strong></div>" +
        "<div class=\"info-card\"><span>주문 상태</span><strong>" + CafeUtils.escapeHtml(getStatusLabel(order.status)) + "</strong></div>" +
        "<div class=\"info-card\"><span>총 수량</span><strong>" + itemCount + "개</strong></div>" +
      "</div>" +
      "<section class=\"section\" aria-label=\"주문 상태 변경\">" +
        "<div class=\"section-heading\">" +
          "<h2>상태 변경</h2>" +
          "<p>변경 즉시 저장됩니다</p>" +
        "</div>" +
        "<div class=\"info-card\">" +
          "<label for=\"statusSelect\"><span>주문 상태</span></label>" +
          "<select id=\"statusSelect\">" +
            "<option value=\"pending\"" + (order.status === "pending" ? " selected" : "") + ">접수</option>" +
            "<option value=\"preparing\"" + (order.status === "preparing" ? " selected" : "") + ">준비중</option>" +
            "<option value=\"completed\"" + (order.status === "completed" ? " selected" : "") + ">완료</option>" +
            "<option value=\"cancelled\"" + (order.status === "cancelled" ? " selected" : "") + ">취소</option>" +
          "</select>" +
        "</div>" +
      "</section>" +
      "<section class=\"section\" aria-label=\"주문 메뉴\">" +
        "<div class=\"section-heading\">" +
          "<h2>주문 메뉴</h2>" +
          "<p>" + order.items.length + "개 메뉴</p>" +
        "</div>" +
        "<ul class=\"items-list\">" + renderItems(order.items) + "</ul>" +
      "</section>" +
      "<div class=\"total-panel\" aria-label=\"금액 요약\">" +
        "<div class=\"total-row\"><span>메뉴 금액</span><strong>" + CafeUtils.formatPrice(subtotal) + "</strong></div>" +
        "<div class=\"total-row\"><span>할인/포인트</span><strong>0원</strong></div>" +
        "<div class=\"total-row final\"><span>총 금액</span><strong>" + CafeUtils.formatPrice(order.total) + "</strong></div>" +
      "</div>";

    document.getElementById("statusSelect").addEventListener("change", async function (event) {
      var updatedOrder = await CafeData.updateOrderStatus(order.id, event.target.value);
      if (!updatedOrder) {
        showStatusMessage("주문 상태를 저장하지 못했습니다.");
        return;
      }

      showStatusMessage("주문 상태가 저장되었습니다.");
      renderDetail(updatedOrder);
    });
  }

  var order = await CafeData.getOrderById(orderId);

  if (order) {
    renderDetail(order);
  } else {
    renderNotFound();
  }
})();
