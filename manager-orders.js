(function () {
  const orderStore = window.guramritOrderStore;
  const list = document.getElementById("manager-order-list");

  function render() {
    const orders = orderStore.getMergedOrders();
    list.innerHTML = orders.length ? orders.map((order) => {
      const approved = order.approval.status === "Approved";
      const canStart = approved;
      return `
        <article class="order-card">
          <div class="order-row">
            <h3>${order.id}</h3>
            <span class="status-badge">${order.approval.status}</span>
          </div>
          <div class="subtle">${order.title}</div>
          <div class="subtle">Customer status: ${order.status}</div>
          <div class="subtle">Distance: ${Number(order.deliveryDistanceKm || 0).toFixed(1)} km • ETA: ${Number(order.etaMinutes || 0)} mins</div>
          <div class="quick-actions">
            <button class="action-btn" data-approve-order="${order.id}">${approved ? 'Unapprove' : 'Approve'}</button>
            <button class="ghost-btn" type="button" ${canStart ? '' : 'disabled'}>Send to Employees</button>
          </div>
        </article>`;
    }).join("") : `<div class="empty-state">No customer orders are waiting for approval.</div>`;
  }

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-approve-order]");
    if (!button) return;
    const orderId = button.getAttribute("data-approve-order");
    const status = orderStore.getApproval(orderId).status === "Approved" ? "Pending Approval" : "Approved";
    orderStore.setApproval(orderId, status);
    render();
  });

  window.addEventListener("guramrit-orders-updated", render);
  render();
})();


