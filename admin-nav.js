(function () {
  const authKey = "guramrit-auth";
  const auth = (() => {
    try {
      return JSON.parse(window.localStorage.getItem(authKey) || "null");
    } catch {
      return null;
    }
  })();

  if (!auth || !auth.loggedIn || auth.role !== "admin") {
    window.location.replace("admin-login.html");
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
})();


