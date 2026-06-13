(function () {
  const authKey = "guramrit-auth";
  const auth = (() => {
    try {
      return JSON.parse(window.localStorage.getItem(authKey) || "null");
    } catch {
      return null;
    }
  })();

  if (!auth || !auth.loggedIn || auth.role !== "employee") {
    window.location.replace("employee-login.html");
    return;
  }

  const emailTargets = document.querySelectorAll("[data-user-email]");
  emailTargets.forEach((target) => {
    target.textContent = auth.email || "guest";
  });

  const logoutButtons = document.querySelectorAll("[data-logout]");
  logoutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      window.localStorage.removeItem(authKey);
      window.location.replace("role-selection.html");
    });
  });
})();


