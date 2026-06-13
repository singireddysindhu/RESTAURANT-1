(function () {
  const orderStore = window.guramritOrderStore;
  const list = document.getElementById("employee-notification-list");
  const summary = document.getElementById("employee-notification-summary");

  function render() {
    const notifications = orderStore.getNotifications().slice(0, 6);
    list.innerHTML = notifications.length ? notifications.map((item) => `
      <div class="activity-item">
        <h3>${item.title}</h3>
        <p>${item.message}</p>
      </div>
    `).join("") : '<div class="activity-item"><h3>No notifications yet</h3><p>New customer orders will appear here automatically.</p></div>';

    const urgent = notifications.filter((item) => item.kind === "customer-order").length;
    const attendance = notifications.filter((item) => item.kind === "attendance").length;
    summary.innerHTML = `
      <div class="mini-card"><div>Urgent</div><span class="value">${urgent}</span></div>
      <div class="mini-card"><div>Attendance</div><span class="value">${attendance}</span></div>
      <div class="mini-card"><div>Total</div><span class="value">${notifications.length}</span></div>
    `;
  }

  window.addEventListener("guramrit-orders-updated", render);
  render();
})();
