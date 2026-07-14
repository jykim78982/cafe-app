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

  var STATUS_COLORS = {
    pending: "#1a1a18",
    confirmed: "#1a1a18",
    preparing: "#2f9e44",
    ready: "#2f9e44",
    completed: "#8a8a86",
    cancelled: "#c0392b"
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

  function getFilteredOrders() {
    var keyword = state.search.trim().toLowerCase();

    return cachedOrders
      .filter(function (order) {
        return state.status === "all" || order.status === state.status;
      })
      .filter(function (order) {
        if (!keyword) return true;

        return String(order.orderNo).toLowerCase().indexOf(keyword) !== -1 ||
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

  function renderStatusOptions(current) {
    return Object.keys(STATUS_LABELS).filter(function (value) {
      return value !== "cancelled";
    }).map(function (value) {
      return "<option value=\"" + value + "\"" +
        " style=\"background-color:" + STATUS_COLORS[value] + ";color:#fff;text-align:left;\"" +
        (value === current ? " selected" : "") + ">" +
        CafeUtils.escapeHtml(STATUS_LABELS[value]) + "</option>";
    }).join("");
  }

  function renderOrder(order) {
    return "" +
      "<div class=\"table-row\" role=\"row\" data-id=\"" + CafeUtils.escapeHtml(order.id) + "\">" +
        "<span class=\"order-id\" role=\"cell\">" + CafeUtils.escapeHtml(order.orderNo) + "</span>" +
        "<span class=\"customer\" role=\"cell\">" + CafeUtils.escapeHtml(order.customerName || "방문 고객") + "</span>" +
        "<span class=\"status-chip " + getStatusClass(order.status) + "\" role=\"cell\">" +
          CafeUtils.escapeHtml(getStatusLabel(order.status)) +
        "</span>" +
        "<span class=\"order-total\" role=\"cell\">" + CafeUtils.formatPrice(order.total) + "</span>" +
        "<span class=\"order-date\" role=\"cell\">" + CafeUtils.escapeHtml(formatDate(order.createdAt)) + "</span>" +
        "<span class=\"actions-cell\" role=\"cell\">" +
          "<select class=\"status-select\" data-id=\"" + CafeUtils.escapeHtml(order.id) + "\"" +
            (order.status === "cancelled" ? " disabled" : "") + ">" +
            renderStatusOptions(order.status) +
          "</select>" +
          "<button type=\"button\" class=\"btn btn-danger cancel-btn\" data-id=\"" + CafeUtils.escapeHtml(order.id) + "\"" +
            (canCancel(order) ? "" : " disabled") + ">취소</button>" +
        "</span>" +
      "</div>";
  }

  function render() {
    var orders = getFilteredOrders();

    ordersList.innerHTML = orders.map(renderOrder).join("");
    emptyState.hidden = orders.length > 0;
    resultCount.textContent = orders.length + "건 표시";
  }

  async function applyStatusChange(id, status) {
    var updated = await CafeData.updateOrderStatus(id, status);
    if (updated) {
      var order = cachedOrders.find(function (o) { return o.id === id; });
      if (order) {
        order.status = updated.status;
        order.updatedAt = updated.updatedAt;
      }
    }
    render();
  }

  ordersList.addEventListener("click", function (event) {
    var cancelBtn = event.target.closest(".cancel-btn");
    if (cancelBtn) {
      if (cancelBtn.disabled) return;
      if (confirm("이 주문을 취소할까요?")) {
        applyStatusChange(cancelBtn.dataset.id, "cancelled");
      }
      return;
    }

    if (event.target.closest("select, button")) return;
    var row = event.target.closest("[data-id]");
    if (!row) return;
    location.href = "detail?id=" + encodeURIComponent(row.dataset.id);
  });

  ordersList.addEventListener("change", function (event) {
    var select = event.target.closest(".status-select");
    if (!select) return;
    applyStatusChange(select.dataset.id, select.value);
  });

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

  cachedOrders = await CafeData.getOrders();
  render();
})();
