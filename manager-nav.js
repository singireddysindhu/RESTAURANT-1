(function () {
  const authKey = "guramrit-auth";
  const orderStore = window.guramritOrderStore;
  const auth = (() => {
    try { return JSON.parse(window.localStorage.getItem(authKey) || "null"); } catch { return null; }
  })();

  if (!auth || !auth.loggedIn || auth.role !== "manager") {
    window.location.replace("manager-login.html");
    return;
  }

  document.querySelectorAll("[data-user-email]").forEach((target) => {
    target.textContent = auth.email || "guest";
  });

  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      window.localStorage.removeItem(authKey);
      window.location.replace("role-selection.html");
    });
  });

  const approvalButtons = document.querySelectorAll("[data-approve-order]");
  approvalButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.getAttribute("data-approve-order");
      const approved = orderStore.getApproval(orderId).status === "Approved" ? "Pending Approval" : "Approved";
      orderStore.setApproval(orderId, approved);
      window.location.reload();
    });
  });
})();


