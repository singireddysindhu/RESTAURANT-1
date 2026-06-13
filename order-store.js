(function () {
  const backendBaseUrl = window.location && window.location.protocol !== "file:" && window.location.origin ? window.location.origin : "http://localhost:3001";
  let cachedOrders = [];
  let cachedApprovals = {};
  let cachedNotifications = [];

  function getCustomerOrders(email) {
    if (!email) {
      return cachedOrders;
    }
    return cachedOrders.filter((order) => order.customer === email);
  }

  function getManagerState() {
    return { approvals: cachedApprovals };
  }

  function readNotifications() {
    return cachedNotifications;
  }

  function saveNotifications(notifications) {
    cachedNotifications = notifications;
    window.dispatchEvent(new Event("guramrit-orders-updated"));
  }

  function saveManagerState(state) {
    cachedApprovals = state.approvals || {};
    syncApprovals(state);
    window.dispatchEvent(new Event("guramrit-orders-updated"));
  }

  function hydrateOrders() {
    if (!window.fetch) {
      return;
    }

    window.fetch(backendBaseUrl + "/api/orders")
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (data) {
        if (!data) {
          return;
        }

        cachedApprovals = data.approvals || {};
        cachedOrders = Array.isArray(data.ledger) ? data.ledger : [];
        cachedNotifications = Array.isArray(data.notifications) ? data.notifications : [];
        window.dispatchEvent(new Event("guramrit-orders-updated"));
      })
      .catch(function () {});
  }

  function startOrderPolling() {
    if (!window.setInterval) {
      return;
    }

    window.setInterval(hydrateOrders, 5000);
  }

  function syncApprovals(state) {
    if (!window.fetch) {
      return;
    }

    const approvals = state.approvals || {};
    Object.keys(approvals).forEach(function (orderId) {
      window.fetch(backendBaseUrl + "/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId, status: approvals[orderId].status }),
      }).catch(function () {});
    });
  }

  function setApproval(orderId, status) {
    cachedApprovals[orderId] = status;
    syncApprovals({ approvals: cachedApprovals });
  }

  function getApproval(orderId) {
    return { status: cachedApprovals[orderId] || "Pending Approval", updatedAt: null };
  }

  function getMergedOrders(email) {
    const orders = getCustomerOrders(email);
    return orders.map((order) => Object.assign({}, order, { approval: getApproval(order.id) }));
  }

  function syncOrder(order, email) {
    if (!window.fetch) {
      return;
    }

    return window.fetch(backendBaseUrl + "/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, order: order }),
    })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function () {
        hydrateOrders();
      })
      .catch(function () {});
  }

  function getNotifications() {
    return cachedNotifications;
  }

  window.guramritOrderStore = {
    getCustomerOrders,
    getManagerState,
    saveManagerState,
    setApproval,
    getApproval,
    getMergedOrders,
    syncOrder,
    getNotifications,
  };

  hydrateOrders();
  startOrderPolling();
})();


