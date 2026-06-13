(() => {
  const redirectAfterMs = 3000;
  const targetPage = "role-selection.html";
  const authKey = "guramrit-auth";
  const dashboardByRole = {
    customer: "customer-dashboard.html",
    employee: "employee-dashboard.html",
    manager: "manager-dashboard.html",
    admin: "admin-dashboard.html",
  };

  const auth = (() => {
    try {
      return JSON.parse(window.localStorage.getItem(authKey) || "null");
    } catch {
      return null;
    }
  })();

  const destination = auth && auth.loggedIn && dashboardByRole[auth.role]
    ? dashboardByRole[auth.role]
    : targetPage;

  window.setTimeout(() => {
    window.location.replace(destination);
  }, redirectAfterMs);
})();



