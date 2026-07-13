(function () {
  "use strict";

  CafeUtils.mountAuthNav(document.getElementById("authLink"));
  if (!CafeUtils.requireAdmin()) return;

  var ORDERS_KEY = "cafeapp_orders";
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

  var searchInput = document.getElementById("searchInput");
  var statusFilter = document.getElementById("statusFilter");
  var sortSelect = document.getElementById("sortSelect");
  var ordersList = document.getElementById("ordersList");
  var emptyState = document.getElementById("emptyState");
  var resultCount = document.getElementById("resultCount");

  function readOrders() {
    var raw = localStorage.getItem(ORDERS_KEY);
    if (raw === null) return [];

    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeOrder) : [];
    } catch (e) {
      return [];
    }
  }

  function normalizeOrder(order, index) {
    var items = Array.isArray(order.items) ? order.items : [];
    var total = Number(order.total);

    if (!Number.isFinite(total)) {
      total = items.reduce(function (sum, item) {
        return sum + Number(item.price || 0) * Number(item.qty || item.quantity || 1);
      }, 0);
    }

    return {
      id: order.id || "order-" + (index + 1),
      customer: order.customerName || order.customer || order.name || "방문 고객",
      status: order.status || "pending",
      createdAt: order.createdAt || order.date || "",
      total: total,
      items: items.map(function (item) {
        return {
          name: item.name || "메뉴",
          qty: Number(item.qty || item.quantity || 1)
        };
      })
    };
  }

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

  function getFilteredOrders() {
    var keyword = state.search.trim().toLowerCase();

    return readOrders()
      .filter(function (order) {
        return state.status === "all" || order.status === state.status;
      })
      .filter(function (order) {
        if (!keyword) return true;

        return String(order.id).toLowerCase().indexOf(keyword) !== -1 ||
          String(order.customer).toLowerCase().indexOf(keyword) !== -1 ||
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

  function renderOrder(order) {
    return "" +
      "<a class=\"table-row\" role=\"row\" href=\"detail.html?id=" + encodeURIComponent(order.id) + "\">" +
        "<span class=\"order-id\" role=\"cell\">" + CafeUtils.escapeHtml(order.id) + "</span>" +
        "<span class=\"customer\" role=\"cell\">" + CafeUtils.escapeHtml(order.customer) + "</span>" +
        "<span class=\"status-chip " + getStatusClass(order.status) + "\" role=\"cell\">" +
          CafeUtils.escapeHtml(getStatusLabel(order.status)) +
        "</span>" +
        "<span class=\"order-total\" role=\"cell\">" + CafeUtils.formatPrice(order.total) + "</span>" +
        "<span class=\"order-date\" role=\"cell\">" + CafeUtils.escapeHtml(formatDate(order.createdAt)) + "</span>" +
      "</a>";
  }

  function render() {
    var orders = getFilteredOrders();

    ordersList.innerHTML = orders.map(renderOrder).join("");
    emptyState.hidden = orders.length > 0;
    resultCount.textContent = orders.length + "건 표시";
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

  render();
})();
