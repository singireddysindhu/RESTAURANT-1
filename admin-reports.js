(function () {
  const store = window.guramritAdminStore;
  const metrics = store.getMetrics();
  const orders = store.getOrderLedger();

  const byId = (id) => document.getElementById(id);
  const revenueText = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(metrics.revenue || 0);

  byId("report-orders").textContent = String(metrics.orders);
  byId("report-approved").textContent = String(metrics.approved);
  byId("report-customers").textContent = String(metrics.customers);
  byId("report-revenue").textContent = revenueText;
  byId("report-approval-rate").textContent = metrics.orders ? Math.round((metrics.approved / metrics.orders) * 100) + "%" : "0%";
  byId("report-top-customer").textContent = store.getCustomerSummaries()[0] ? store.getCustomerSummaries()[0].email : "None";
  byId("report-top-order").textContent = orders[0] ? orders[0].title : "None";

  const ledger = document.getElementById("report-ledger");
  ledger.innerHTML = orders.length ? orders.map((order) => `
    <article class="report-card">
      <div class="row"><h3>${order.title}</h3><span class="tile-badge">${order.approval}</span></div>
      <p>${order.customer} • ${order.id} • ${order.date}</p>
      <p>₹${order.total} • ${order.status}</p>
    </article>
  `).join("") : '<div class="empty-state">No order data available yet.</div>';
})();

