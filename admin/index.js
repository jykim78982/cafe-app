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
  var STATUS_ORDER = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

  var totalOrders = document.getElementById("totalOrders");
  var totalSales = document.getElementById("totalSales");
  var pendingOrders = document.getElementById("pendingOrders");
  var activeOrders = document.getElementById("activeOrders");
  var menuCount = document.getElementById("menuCount");
  var soldOutCount = document.getElementById("soldOutCount");
  var statusList = document.getElementById("statusList");
  var orderStatusMeta = document.getElementById("orderStatusMeta");
  var recentList = document.getElementById("recentList");
  var recentMeta = document.getElementById("recentMeta");
  var emptyOrders = document.getElementById("emptyOrders");

  function formatDate(value) {
    var date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return "날짜 없음";

    return date.toLocaleString("ko-KR", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getStatusLabel(status) {
    return STATUS_LABELS[status] || status;
  }

  function isActiveOrder(order) {
    return order.status !== "completed" && order.status !== "cancelled";
  }

  function renderSummary(orders, menus) {
    var sales = orders.reduce(function (sum, order) {
      return order.status === "cancelled" ? sum : sum + order.total;
    }, 0);
    var pendingCount = orders.filter(function (order) {
      return order.status === "pending";
    }).length;
    var activeCount = orders.filter(isActiveOrder).length;
    var soldOutMenus = menus.filter(function (menu) {
      return menu.soldOut;
    }).length;

    totalOrders.textContent = orders.length;
    totalSales.textContent = CafeUtils.formatPrice(sales);
    pendingOrders.textContent = pendingCount;
    activeOrders.textContent = activeCount;
    menuCount.textContent = menus.length;
    soldOutCount.textContent = soldOutMenus;
  }

  function renderStatus(orders) {
    var counts = STATUS_ORDER.reduce(function (acc, status) {
      acc[status] = 0;
      return acc;
    }, {});

    orders.forEach(function (order) {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });

    statusList.innerHTML = STATUS_ORDER.map(function (status) {
      var count = counts[status] || 0;
      var percent = orders.length ? Math.round((count / orders.length) * 100) : 0;

      return "" +
        "<div class=\"status-row\">" +
          "<span class=\"status-label\">" + CafeUtils.escapeHtml(getStatusLabel(status)) + "</span>" +
          "<span class=\"status-track\"><span class=\"status-fill\" style=\"width:" + percent + "%\"></span></span>" +
          "<span class=\"status-count\">" + count + "</span>" +
        "</div>";
    }).join("");

    orderStatusMeta.textContent = orders.length + "개 주문";
  }

  function renderRecent(orders) {
    var recentOrders = orders.slice().sort(function (a, b) {
      var aTime = new Date(a.createdAt).getTime() || 0;
      var bTime = new Date(b.createdAt).getTime() || 0;
      return bTime - aTime;
    }).slice(0, 5);

    recentList.innerHTML = recentOrders.map(function (order) {
      var itemText = order.items.length
        ? order.items.map(function (item) { return item.name + " " + item.qty + "개"; }).join(", ")
        : "주문 메뉴 정보 없음";

      return "" +
        "<article class=\"recent-row\">" +
          "<div>" +
            "<div class=\"recent-id\">주문번호 " + CafeUtils.escapeHtml(order.orderNo) + "</div>" +
            "<p class=\"recent-date\">" + CafeUtils.escapeHtml(formatDate(order.createdAt)) + "</p>" +
            "<p class=\"recent-items\">" + CafeUtils.escapeHtml(itemText) + "</p>" +
            "<span class=\"status-chip status-" + CafeUtils.escapeHtml(order.status) + "\">" +
              CafeUtils.escapeHtml(getStatusLabel(order.status)) +
            "</span>" +
          "</div>" +
          "<strong class=\"recent-total\">" + CafeUtils.formatPrice(order.total) + "</strong>" +
        "</article>";
    }).join("");

    emptyOrders.hidden = recentOrders.length > 0;
    recentMeta.textContent = recentOrders.length + "건 표시";
  }

  async function render() {
    var orders = await CafeData.getOrders();
    var menus = await CafeData.getMenus();

    renderSummary(orders, menus);
    renderStatus(orders);
    renderRecent(orders);
  }

  render();
})();
