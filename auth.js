(() => {
  const authKey = "guramrit-auth";
  const backendBaseUrl = window.location && window.location.protocol !== "file:" && window.location.origin ? window.location.origin : "http://localhost:3001";
  const dashboardByRole = {
    customer: "customer-dashboard.html",
    employee: "employee-dashboard.html",
    manager: "manager-dashboard.html",
    admin: "admin-dashboard.html",
  };

  const requestJson = (path, body) => {
    if (!window.fetch) {
      return Promise.reject(new Error("Fetch is unavailable."));
    }

    return window.fetch(backendBaseUrl + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((response) => response.json().then((data) => ({ ok: response.ok, data })));
  };

  const readAuth = () => {
    try {
      return JSON.parse(window.localStorage.getItem(authKey) || "null");
    } catch {
      return null;
    }
  };

  const writeAuth = (role, email) => {
    window.localStorage.setItem(authKey, JSON.stringify({ role, email, loggedIn: true }));
  };

  const clearAuth = () => {
    window.localStorage.removeItem(authKey);
  };

  const redirectToRoleDashboard = (role) => {
    const destination = dashboardByRole[role];
    if (destination) {
      window.location.replace(destination);
    }
  };

  const auth = readAuth();

  if (document.querySelector(".selection-shell") && auth && auth.loggedIn) {
    redirectToRoleDashboard(auth.role);
  }

  const loginShell = document.querySelector(".login-shell[data-role]");
  if (loginShell) {
    if (auth && auth.loggedIn) {
      redirectToRoleDashboard(auth.role);
      return;
    }

    const role = loginShell.dataset.role;
    const dashboard = loginShell.dataset.dashboard || dashboardByRole[role];
    const form = loginShell.querySelector("[data-login-form]");
    const registerForm = loginShell.querySelector("[data-register-form]");
    const loginStatus = loginShell.querySelector("[data-login-status]");

    const setStatus = (message, isError) => {
      if (loginStatus) {
        loginStatus.textContent = message;
        loginStatus.dataset.state = isError ? "error" : "success";
      }
    };

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const emailField = form.querySelector('[data-login-email]');
        const passwordField = form.querySelector('[data-login-password]');
        const email = emailField ? emailField.value.trim() : "";
        const password = passwordField ? passwordField.value.trim() : "";

        if (!email || !password) {
          setStatus("Please enter both email and password.", true);
          return;
        }

        requestJson("/api/auth/login", { role, email, password }).then(({ ok, data }) => {
          if (!ok) {
            setStatus(data && data.error ? data.error : "Login failed.", true);
            return;
          }

          writeAuth(role, data.email || email);
          window.location.replace(dashboard);
        }).catch(() => {
          setStatus("Unable to reach the backend. Start the backend server and try again.", true);
        });
      });
    }

    if (registerForm) {
      registerForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const nameField = registerForm.querySelector('[data-register-name]');
        const emailField = registerForm.querySelector('[data-register-email]');
        const passwordField = registerForm.querySelector('[data-register-password]');
        const name = nameField ? nameField.value.trim() : "";
        const email = emailField ? emailField.value.trim() : "";
        const password = passwordField ? passwordField.value.trim() : "";

        if (!name || !email || !password) {
          setStatus("Please complete name, email, and password to create your account.", true);
          return;
        }

        requestJson("/api/auth/register", { role, name, email, password }).then(({ ok, data }) => {
          if (!ok) {
            setStatus(data && data.error ? data.error : "Account creation failed.", true);
            return;
          }

          setStatus("Account created. Sign in with your email and password.", false);
          if (form) {
            const loginEmail = form.querySelector('[data-login-email]');
            if (loginEmail) {
              loginEmail.value = email;
            }
          }
          registerForm.reset();
        }).catch(() => {
          setStatus("Unable to reach the backend. Start the backend server and try again.", true);
        });
      });
    }
  }

  const dashboardShell = document.querySelector(".dashboard-shell[data-role]");
  if (dashboardShell) {
    if (!auth || !auth.loggedIn) {
      window.location.replace("role-selection.html");
      return;
    }

    if (auth.role !== dashboardShell.dataset.role) {
      redirectToRoleDashboard(auth.role);
      return;
    }

    const emailTarget = dashboardShell.querySelector("[data-user-email]");
    if (emailTarget) {
      emailTarget.textContent = auth.email || "guest";
    }

    const logoutButton = dashboardShell.querySelector("[data-logout]");
    if (logoutButton) {
      logoutButton.addEventListener("click", () => {
        clearAuth();
        window.location.replace("role-selection.html");
      });
    }
  }
})();

