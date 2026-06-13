(function () {
  const list = document.getElementById("employee-order-list");
  const meta = document.getElementById("employee-order-meta");
  const backendBaseUrl = window.location && window.location.protocol !== "file:" && window.location.origin ? window.location.origin : "http://localhost:3001";

  function normalizeStatus(status) {
    const value = String(status || "Placed").trim().toLowerCase();
    if (value === "approved") {
      return "Approved";
    }
    if (value === "preparing") {
      return "Preparing";
    }
    if (value === "out for delivery") {
      return "Out for Delivery";
    }
    if (value === "delivered") {
      return "Delivered";
    }
    if (value === "cancelled" || value === "canceled") {
      return "Cancelled";
    }
    return "Placed";
  }

  function isActiveOrder(order) {
    const status = normalizeStatus(order.trackingStatus || order.status);
    return status !== "Delivered" && status !== "Cancelled";
  }

  function stepClass(order, stage) {
    const current = normalizeStatus(order.trackingStatus || order.status || "Placed");
    const steps = ["Placed", "Approved", "Preparing", "Out for Delivery", "Delivered"];
    const currentIndex = steps.indexOf(current);
    const stageIndex = steps.indexOf(stage);

    if (currentIndex >= stageIndex) {
      return "step done";
    }

    return current === stage ? "step active" : "step";
  }

  function renderOrders(orders) {
    list.innerHTML = orders.length ? orders.map((order) => `
      <div class="tracking-item">
        <div class="tracking-row">
          <h3>${order.id}</h3>
          <span class="status-badge">${normalizeStatus(order.trackingStatus || order.status)}</span>
        </div>
        <div class="subtle">${order.title}</div>
        <div class="subtle">Customer: ${order.customer || order.email || "Unknown"}</div>
        <div class="subtle">Distance ${Number(order.deliveryDistanceKm || 0).toFixed(1)} km • ETA ${Number(order.etaMinutes || 0)} mins</div>
        <div class="step-track">
          <div class="${stepClass(order, "Placed")}"><span class="step-dot"></span>Order Placed</div>
          <div class="${stepClass(order, "Approved")}"><span class="step-dot"></span>Approved</div>
          <div class="${stepClass(order, "Preparing")}"><span class="step-dot"></span>Preparing</div>
          <div class="${stepClass(order, "Out for Delivery")}"><span class="step-dot"></span>Out for Delivery</div>
          <div class="${stepClass(order, "Delivered")}"><span class="step-dot"></span>Delivered</div>
        </div>
        <div class="toolbar-row" style="margin-top:12px; flex-wrap: wrap;">
          <button class="action-btn" type="button" data-status-order="${order.id}" data-status-value="Approved">Mark Approved</button>
          <button class="action-btn" type="button" data-status-order="${order.id}" data-status-value="Preparing">Mark Preparing</button>
          <button class="action-btn" type="button" data-status-order="${order.id}" data-status-value="Out for Delivery">Mark Out for Delivery</button>
          <button class="action-btn" type="button" data-status-order="${order.id}" data-status-value="Delivered">Mark Delivered</button>
        </div>
      </div>
    `).join("") : '<div class="empty-state">No live customer orders yet.</div>';
  }

  function renderMeta(orders, notifications) {
    const latest = orders[0];
    meta.innerHTML = latest ? `
      <div class="mini-card"><div>Order ID</div><span class="value">${latest.id}</span></div>
      <div class="mini-card"><div>Status</div><span class="value">${normalizeStatus(latest.trackingStatus || latest.status)}</span></div>
      <div class="mini-card"><div>Delivery ETA</div><span class="value">${Number(latest.etaMinutes || 0)} mins</span></div>
      <div class="mini-card"><div>Live notifications</div><span class="value">${notifications.length}</span></div>
    ` : '<div class="mini-card"><div>Status</div><span class="value">Waiting for orders</span></div>';
  }

  function refresh() {
    window.fetch(backendBaseUrl + "/api/orders")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const ledger = Array.isArray(data && data.ledger) ? data.ledger : [];
        const notifications = Array.isArray(data && data.notifications) ? data.notifications : [];
        const currentOrders = ledger.filter(isActiveOrder);

        renderOrders(currentOrders);
        renderMeta(currentOrders, notifications.filter((item) => item.kind === "customer-order" || item.kind === "attendance"));
      })
      .catch(() => {
        list.innerHTML = '<div class="empty-state">No live customer orders yet.</div>';
        meta.innerHTML = '<div class="mini-card"><div>Status</div><span class="value">Waiting for orders</span></div>';
      });
  }

  function updateOrderStatus(orderId, trackingStatus) {
    return window.fetch(backendBaseUrl + "/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: orderId, trackingStatus: trackingStatus }),
    });
  }

  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-status-order]");
    if (!button) {
      return;
    }

    const orderId = button.getAttribute("data-status-order");
    const trackingStatus = button.getAttribute("data-status-value");
    updateOrderStatus(orderId, trackingStatus).then(refresh).catch(refresh);
  });

  window.addEventListener("guramrit-orders-updated", refresh);
  refresh();
})();
