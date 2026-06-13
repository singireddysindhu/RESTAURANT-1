(function () {
  const employeeKey = "guramrit-admin-employees";
  const settingsKey = "guramrit-admin-settings";
  const backendBaseUrl = window.location && window.location.protocol !== "file:" && window.location.origin ? window.location.origin : "http://localhost:3001";

  const defaultEmployees = [];

  const defaultSettings = {
    restaurantName: "Guramrit Restro & Cafe",
    contactEmail: "",
    contactPhone: "",
    location: "",
    currency: "INR",
    attendanceLatitude: "",
    attendanceLongitude: "",
    attendanceRadiusMeters: 100,
  };

  let cachedCustomerSummaries = [];
  let cachedOrderLedger = [];

  function readJson(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function clone(items) {
    return items.map((item) => ({ ...item }));
  }

  function readEmployees() {
    const saved = readJson(employeeKey, null);
    return Array.isArray(saved) ? saved : clone(defaultEmployees);
  }

  function saveEmployees(items) {
    const next = items.map((item) => ({
      id: item.id || generateId(item.name),
      name: item.name.trim(),
      email: item.email.trim(),
      role: item.role.trim(),
      status: item.status || "Active",
      phone: item.phone || "",
    }));
    writeJson(employeeKey, next);
    window.dispatchEvent(new Event("guramrit-admin-employees-updated"));
    syncEmployees(next);
    return next;
  }

  function hydrateAdminData() {
    if (!window.fetch) {
      return;
    }

    window.fetch(backendBaseUrl + "/api/bootstrap")
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (data) {
        if (!data) {
          return;
        }

        if (Array.isArray(data.employees)) {
          writeJson(employeeKey, data.employees.map(function (item) {
            return {
              id: item.id || generateId(item.name),
              name: item.name || "",
              email: item.email || "",
              role: item.role || "",
              status: item.status || "Active",
              phone: item.phone || "",
            };
          }));
          window.dispatchEvent(new Event("guramrit-admin-employees-updated"));
        }

        if (data.settings && typeof data.settings === "object") {
          writeJson(settingsKey, Object.assign({}, defaultSettings, data.settings));
          window.dispatchEvent(new Event("guramrit-admin-settings-updated"));
        }
      })
      .catch(function () {});
  }

  function syncEmployees(items) {
    if (!window.fetch) {
      return;
    }

    window.fetch(backendBaseUrl + "/api/employees", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    }).catch(function () {});
  }

  function addEmployee(employee) {
    return saveEmployees(readEmployees().concat([employee]));
  }

  function removeEmployee(id) {
    return saveEmployees(readEmployees().filter((employee) => employee.id !== id));
  }

  function resetEmployees() {
    return saveEmployees([]);
  }

  function readSettings() {
    const saved = readJson(settingsKey, null);
    return Object.assign({}, defaultSettings, saved || {});
  }

  function saveSettings(settings) {
    const next = Object.assign({}, readSettings(), settings);
    writeJson(settingsKey, next);
    writeJson("guramrit-attendance-site", {
      latitude: next.attendanceLatitude,
      longitude: next.attendanceLongitude,
      radiusMeters: next.attendanceRadiusMeters,
    });
    window.dispatchEvent(new Event("guramrit-admin-settings-updated"));
    syncSettings(next);
    return next;
  }

  function syncSettings(settings) {
    if (!window.fetch) {
      return;
    }

    window.fetch(backendBaseUrl + "/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    }).catch(function () {});
  }

  function getCustomerSummaries() {
    return cachedCustomerSummaries.slice();
  }

  function getOrderLedger() {
    return cachedOrderLedger.slice();
  }

  function getMetrics() {
    const orders = getOrderLedger();
    const customers = getCustomerSummaries();
    const revenue = orders.reduce((sum, order) => sum + order.total, 0);
    const approved = orders.filter((order) => order.approval === "Approved").length;

    return {
      customers: customers.length,
      orders: orders.length,
      approved,
      revenue,
    };
  }

  function generateId(seed) {
    return (
      "entry-" +
      String(seed || "item")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      "-" +
      Date.now().toString(36)
    );
  }

  window.guramritAdminStore = {
    readEmployees,
    saveEmployees,
    addEmployee,
    removeEmployee,
    resetEmployees,
    readSettings,
    saveSettings,
    getCustomerSummaries,
    getOrderLedger,
    getMetrics,
    defaultEmployees: clone(defaultEmployees),
    defaultSettings: Object.assign({}, defaultSettings),
  };

  hydrateAdminData();
  hydrateOrderData();
  startAdminPolling();
  startOrderPolling();
})();


