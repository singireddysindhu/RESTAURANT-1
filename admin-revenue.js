(function () {
  const store = window.guramritAdminStore;
  const orders = store.getOrderLedger();
  const approvedOrders = orders.filter((order) => order.approval === "Approved");
  const pendingOrders = orders.filter((order) => order.approval !== "Approved");
  const total = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const average = orders.length ? Math.round(total / orders.length) : 0;

  const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  document.getElementById("revenue-total").textContent = currency.format(total);
  document.getElementById("revenue-average").textContent = currency.format(average);
  document.getElementById("revenue-approved").textContent = String(approvedOrders.length);
  document.getElementById("revenue-pending").textContent = String(pendingOrders.length);

  const ledger = document.getElementById("revenue-ledger");
  ledger.innerHTML = orders.length ? orders.map((order) => `
    <article class="revenue-card">
      <div class="row"><h3>${order.id}</h3><span class="tile-badge">${order.approval}</span></div>
      <p>${order.title}</p>
      <p>${order.customer} • ${currency.format(order.total)}</p>
    </article>
  `).join("") : '<div class="empty-state">No revenue data available yet.</div>';
})();

