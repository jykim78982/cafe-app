(async function () {
  "use strict";

  await CafeUtils.mountAuthNav(document.getElementById("authLink"));
  if (!(await CafeUtils.requireLogin())) return;

  var STATUS_LABELS = {
    pending: "주문 대기",
    confirmed: "주문 확인",
    preparing: "제조 중",
    ready: "픽업 대기",
    completed: "완료",
    cancelled: "취소"
  };

  var cartCount = document.getElementById("cartCount");
  var cartSummary = document.getElementById("cartSummary");
  var totalOrders = document.getElementById("totalOrders");
  var activeOrders = document.getElementById("activeOrders");
  var recentList = document.getElementById("recentList");
  var emptyState = document.getElementById("emptyState");

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

  function renderRecentCard(order) {
    return "" +
      '<article class="recent-card glass">' +
        '<div class="recent-top">' +
          "<div>" +
            '<p class="recent-id">주문번호 ' + CafeUtils.escapeHtml(order.orderNo) + "</p>" +
            '<p class="recent-date">' + CafeUtils.escapeHtml(formatDate(order.createdAt)) + "</p>" +
          "</div>" +
          '<span class="status-chip ' + getStatusClass(order.status) + '">' +
            CafeUtils.escapeHtml(getStatusLabel(order.status)) +
          "</span>" +
        "</div>" +
        '<div class="recent-footer">' +
          "<span>" + order.items.length + "개 메뉴</span>" +
          "<strong>" + CafeUtils.formatPrice(order.total) + "</strong>" +
        "</div>" +
      "</article>";
  }

  async function render() {
    var orders = (await CafeData.getOrders()).sort(function (a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    var active = orders.filter(function (order) {
      return order.status !== "completed" && order.status !== "cancelled";
    });

    cartCount.textContent = CafeUtils.getCartCount();
    cartSummary.textContent = CafeUtils.getCartCount() + "개";
    totalOrders.textContent = orders.length;
    activeOrders.textContent = active.length;

    var recent = orders.slice(0, 3);
    if (recent.length === 0) {
      recentList.innerHTML = "";
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
      recentList.innerHTML = recent.map(renderRecentCard).join("");
    }
  }

  render();
})();
