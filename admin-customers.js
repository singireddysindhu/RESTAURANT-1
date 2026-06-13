(function () {
  const store = window.guramritAdminStore;
  const customerList = document.getElementById("customer-list");
  const orderList = document.getElementById("customer-order-list");

  function render() {
    const customers = store.getCustomerSummaries();
    const orders = store.getOrderLedger();

    customerList.innerHTML = customers.length ? customers.map((customer) => `
      <article class="customer-card">
        <h3>${customer.email}</h3>
        <p>${customer.orderCount} orders • ₹${customer.totalSpent}</p>
        <p>${customer.lastOrder}</p>
      </article>
    `).join("") : '<div class="empty-state">No customer data available yet.</div>';

    orderList.innerHTML = orders.length ? orders.map((order) => `
      <article class="report-card">
        <div class="row"><h3>${order.id}</h3><span class="tile-badge">${order.approval}</span></div>
        <p>${order.title}</p>
        <p>${order.customer} • ${order.status} • ₹${order.total}</p>
      </article>
    `).join("") : '<div class="empty-state">No saved orders yet.</div>';
  }

  render();
})();

