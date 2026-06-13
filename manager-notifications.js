(function () {
  const orderStore = window.guramritOrderStore;
  const list = document.getElementById("manager-notification-list");

  function render() {
    const notifications = orderStore.getNotifications().slice(0, 8);
    list.innerHTML = notifications.length ? notifications.map((item) => `
      <div class="notification-card">
        <h3>${item.title}</h3>
        <p>${item.message}</p>
      </div>
    `).join("") : '<div class="notification-card"><h3>No notifications yet</h3><p>Customer orders and approvals will show up here as they happen.</p></div>';
  }

  window.addEventListener("guramrit-orders-updated", render);
  render();
})();
