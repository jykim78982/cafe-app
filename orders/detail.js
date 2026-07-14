(async function () {
  "use strict";

  await CafeUtils.mountAuthNav(document.getElementById("authLink"));

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
  var cartCount = document.getElementById("cartCount");
  var toast = document.getElementById("toast");
  var toastTimer = null;

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

  function canCancel(order) {
    return order.status !== "completed" && order.status !== "cancelled";
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.hidden = true;
    }, 1800);
  }

  function updateCartCount() {
    cartCount.textContent = CafeUtils.getCartCount();
  }

  function renderNotFound() {
    detailCard.innerHTML = "" +
      "<div class=\"empty-state\">" +
        "<p>주문 내역을 찾을 수 없습니다.</p>" +
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
          "<span class=\"item-price\">" + CafeUtils.formatPrice(item.price * item.qty) + "</span>" +
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
      "<div class=\"detail-layout\">" +
        "<div class=\"detail-top\">" +
          "<div>" +
            "<p class=\"eyebrow\">Order Detail</p>" +
            "<h1>주문번호 " + CafeUtils.escapeHtml(order.orderNo) + "</h1>" +
            "<p class=\"order-date\">주문일시 " + CafeUtils.escapeHtml(formatDate(order.createdAt)) + "</p>" +
          "</div>" +
          "<span class=\"status-chip " + getStatusClass(order.status) + "\">" +
            CafeUtils.escapeHtml(getStatusLabel(order.status)) +
          "</span>" +
        "</div>" +
        "<div class=\"info-grid\" aria-label=\"주문 요약\">" +
          "<div class=\"info-card\"><span>주문 상태</span><strong>" + CafeUtils.escapeHtml(getStatusLabel(order.status)) + "</strong></div>" +
          "<div class=\"info-card\"><span>총 수량</span><strong>" + itemCount + "개</strong></div>" +
          "<div class=\"info-card\"><span>결제 금액</span><strong>" + CafeUtils.formatPrice(order.total) + "</strong></div>" +
        "</div>" +
        "<div class=\"items-panel\">" +
          "<div class=\"panel-heading\">" +
            "<h2>주문 메뉴</h2>" +
            "<p>" + order.items.length + "개 메뉴</p>" +
          "</div>" +
          "<ul class=\"order-items\">" + renderItems(order.items) + "</ul>" +
        "</div>" +
        "<div class=\"total-panel\" aria-label=\"결제 요약\">" +
          "<div class=\"total-row\"><span>메뉴 금액</span><strong>" + CafeUtils.formatPrice(subtotal) + "</strong></div>" +
          "<div class=\"total-row\"><span>할인/포인트</span><strong>0원</strong></div>" +
          "<div class=\"total-row final\"><span>총 결제 금액</span><strong>" + CafeUtils.formatPrice(order.total) + "</strong></div>" +
        "</div>" +
        "<div class=\"detail-actions\">" +
          "<a class=\"btn btn-outline\" href=\"list\">목록</a>" +
          "<button class=\"btn btn-danger\" type=\"button\" id=\"cancelButton\"" +
            (canCancel(order) ? "" : " disabled") + ">주문 취소</button>" +
        "</div>" +
      "</div>";

    document.getElementById("cancelButton").addEventListener("click", async function () {
      if (!canCancel(order)) return;
      if (!confirm("이 주문을 취소할까요?")) return;

      var updatedOrder = await CafeData.cancelOrder(order.id);
      if (updatedOrder) {
        showToast("주문이 취소되었습니다.");
        renderDetail(updatedOrder);
      }
    });
  }

  updateCartCount();

  var order = await CafeData.getOrderById(orderId);
  if (order) {
    renderDetail(order);
  } else {
    renderNotFound();
  }
})();
