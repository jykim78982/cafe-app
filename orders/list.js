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

  var state = {
    search: "",
    status: "all",
    sort: "latest"
  };

  var cachedOrders = [];

  var searchInput = document.getElementById("searchInput");
  var statusFilter = document.getElementById("statusFilter");
  var sortSelect = document.getElementById("sortSelect");
  var ordersList = document.getElementById("ordersList");
  var emptyState = document.getElementById("emptyState");
  var resultCount = document.getElementById("resultCount");
  var cartCount = document.getElementById("cartCount");
  var totalOrders = document.getElementById("totalOrders");
  var activeOrders = document.getElementById("activeOrders");
  var totalAmount = document.getElementById("totalAmount");

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

  function updateCartCount() {
    cartCount.textContent = CafeUtils.getCartCount();
  }

  function getFilteredOrders() {
    var keyword = state.search.trim().toLowerCase();

    return cachedOrders
      .filter(function (order) {
        return state.status === "all" || order.status === state.status;
      })
      .filter(function (order) {
        if (!keyword) return true;

        return String(order.id).toLowerCase().indexOf(keyword) !== -1 ||
          order.items.some(function (item) {
            return item.name.toLowerCase().indexOf(keyword) !== -1;
          });
      })
      .sort(function (a, b) {
        if (state.sort === "amountAsc") return a.total - b.total;
        if (state.sort === "amountDesc") return b.total - a.total;

        var aTime = new Date(a.createdAt).getTime() || 0;
        var bTime = new Date(b.createdAt).getTime() || 0;
        return state.sort === "oldest" ? aTime - bTime : bTime - aTime;
      });
  }

  function renderSummary(orders) {
    var activeCount = orders.filter(function (order) {
      return order.status !== "completed" && order.status !== "cancelled";
    }).length;
    var amount = orders.reduce(function (sum, order) {
      return sum + order.total;
    }, 0);

    totalOrders.textContent = orders.length;
    activeOrders.textContent = activeCount;
    totalAmount.textContent = CafeUtils.formatPrice(amount);
  }

  function renderItems(items) {
    if (items.length === 0) {
      return "<li><span class=\"item-name\">주문 메뉴 정보 없음</span></li>";
    }

    return items.map(function (item) {
      return "" +
        "<li>" +
          "<span class=\"item-name\">" + CafeUtils.escapeHtml(item.name) + "</span>" +
          "<span class=\"item-meta\">" + item.qty + "개 · " + CafeUtils.formatPrice(item.price * item.qty) + "</span>" +
        "</li>";
    }).join("");
  }

  function renderOrder(order) {
  return "" +
    "<article class=\"order-card glass\">" +
      "<div class=\"order-top\">" +
        "<div>" +
          "<p class=\"order-id\">주문번호 " + CafeUtils.escapeHtml(order.id) + "</p>" +
          "<p class=\"order-date\">" + CafeUtils.escapeHtml(formatDate(order.createdAt)) + "</p>" +
        "</div>" +
        "<span class=\"status-chip " + getStatusClass(order.status) + "\">" +
          CafeUtils.escapeHtml(getStatusLabel(order.status)) +
        "</span>" +
      "</div>" +
      "<ul class=\"order-items\">" + renderItems(order.items) + "</ul>" +
      "<div class=\"order-footer\">" +
        "<div class=\"order-total\">" +
          "<span>결제 금액</span>" +
          "<strong>" + CafeUtils.formatPrice(order.total) + "</strong>" +
        "</div>" +
        "<span class=\"order-count\">" + order.items.length + "개 메뉴</span>" +
        "<a class=\"btn btn-outline\" href=\"detail?id=" + encodeURIComponent(order.id) + "\">상세 보기</a>" +
      "</div>" +
    "</article>";
}

  function render() {
    var filteredOrders = getFilteredOrders();

    renderSummary(cachedOrders);
    ordersList.innerHTML = filteredOrders.map(renderOrder).join("");
    emptyState.hidden = filteredOrders.length > 0;
    resultCount.textContent = filteredOrders.length + "개 표시 중";
  }

  searchInput.addEventListener("input", function (event) {
    state.search = event.target.value;
    render();
  });

  statusFilter.addEventListener("change", function (event) {
    state.status = event.target.value;
    render();
  });

  sortSelect.addEventListener("change", function (event) {
    state.sort = event.target.value;
    render();
  });

  updateCartCount();
  cachedOrders = await CafeData.getOrders();
  render();
})();
