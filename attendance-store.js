(function () {
  const attendanceKey = "guramrit-attendance-records";
  const firebaseConfigKey = "guramrit-firebase-config";
  const backendBaseUrl = window.location && window.location.protocol !== "file:" && window.location.origin ? window.location.origin : "http://localhost:3001";

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

  function getFirebaseConfig() {
    return readJson(firebaseConfigKey, null);
  }

  function readAttendance() {
    return readJson(attendanceKey, []);
  }

  function saveAttendance(records) {
    writeJson(attendanceKey, records);
    window.dispatchEvent(new Event("guramrit-attendance-updated"));
    syncAttendance(records);
  }

  function hydrateAttendance() {
    if (!window.fetch) {
      return;
    }

    window.fetch(backendBaseUrl + "/api/bootstrap")
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.attendance)) {
          return;
        }

        writeJson(attendanceKey, data.attendance);
        window.dispatchEvent(new Event("guramrit-attendance-updated"));
      })
      .catch(function () {});
  }

  function syncAttendance(records) {
    if (!window.fetch) {
      return;
    }

    window.fetch(backendBaseUrl + "/api/attendance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(records),
    }).catch(function () {});
  }

  function addRecord(record) {
    const next = [record].concat(readAttendance());
    saveAttendance(next);
    return next;
  }

  window.guramritAttendanceStore = {
    getFirebaseConfig,
    readAttendance,
    saveAttendance,
    addRecord,
  };

  hydrateAttendance();
})();


