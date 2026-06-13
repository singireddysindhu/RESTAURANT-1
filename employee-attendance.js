(function () {
  const authKey = "guramrit-auth";
  const attendanceStore = window.guramritAttendanceStore;

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

  const video = document.getElementById("camera-preview");
  const canvas = document.getElementById("photo-canvas");
  const openButton = document.getElementById("open-camera");
  const captureButton = document.getElementById("capture-photo");
  const locationButton = document.getElementById("get-location");
  const saveButton = document.getElementById("save-attendance");
  const refreshButton = document.getElementById("refresh-history");
  const statusNote = document.getElementById("status-note");
  const firebaseStatus = document.getElementById("firebase-status");
  const timeField = document.getElementById("attendance-time");
  const locationField = document.getElementById("attendance-location");
  const mapBox = document.getElementById("map-box");
  const historyList = document.getElementById("attendance-history");

  const attendanceSite = (() => {
    try {
      return JSON.parse(window.localStorage.getItem("guramrit-attendance-site") || "null");
    } catch {
      return null;
    }
  })();

  let stream = null;
  let capturedImage = "";
  let gpsText = "";
  let capturedLocation = null;

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function haversineMeters(fromLat, fromLng, toLat, toLng) {
    const earthRadius = 6371000;
    const toRadians = (value) => (value * Math.PI) / 180;
    const deltaLat = toRadians(toLat - fromLat);
    const deltaLng = toRadians(toLng - fromLng);
    const startLat = toRadians(fromLat);
    const endLat = toRadians(toLat);
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
      + Math.cos(startLat) * Math.cos(endLat)
      * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function getAllowedRadiusMeters() {
    const radius = toNumber(attendanceSite && attendanceSite.radiusMeters);
    return radius && radius > 0 ? radius : 100;
  }

  function getSiteLocation() {
    const latitude = toNumber(attendanceSite && attendanceSite.latitude);
    const longitude = toNumber(attendanceSite && attendanceSite.longitude);
    if (latitude === null || longitude === null) {
      return null;
    }
    return { latitude, longitude };
  }

  function withinAllowedZone() {
    if (!capturedLocation) {
      return {
        allowed: false,
        reason: "Capture GPS first so the app can verify your location.",
      };
    }

    const site = getSiteLocation();
    if (site) {
      const distanceMeters = haversineMeters(capturedLocation.latitude, capturedLocation.longitude, site.latitude, site.longitude);
      const allowed = distanceMeters <= getAllowedRadiusMeters();
      return {
        allowed,
        distanceMeters,
        reason: allowed
          ? `Inside allowed radius (${Math.round(distanceMeters)} m).`
          : `Outside allowed radius (${Math.round(distanceMeters)} m away; limit is ${getAllowedRadiusMeters()} m).`,
      };
    }

    const accuracyMeters = Number(capturedLocation.accuracy || 0);
    const allowed = accuracyMeters > 0 && accuracyMeters <= getAllowedRadiusMeters();
    return {
      allowed,
      accuracyMeters,
      reason: allowed
        ? `GPS accuracy is within ${getAllowedRadiusMeters()} m.`
        : `GPS accuracy is ${Math.round(accuracyMeters || 0)} m, which is outside the allowed ${getAllowedRadiusMeters()} m radius.`,
    };
  }

  function setStatus(message) {
    statusNote.textContent = message;
  }

  function nowTimestamp() {
    return new Date().toLocaleString();
  }

  async function openCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      video.srcObject = stream;
      setStatus("Camera opened successfully. Capture a photo when ready.");
      timeField.value = nowTimestamp();
    } catch (error) {
      setStatus("Unable to open the camera. Please allow camera permission or use a supported device.");
    }
  }

  function capturePhoto() {
    if (!stream) {
      setStatus("Open the camera first.");
      return;
    }

    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    capturedImage = canvas.toDataURL("image/jpeg", 0.86);
    setStatus("Photo captured. Now collect GPS and save attendance.");
  }

  function getLocation() {
    if (!navigator.geolocation) {
      setStatus("GPS is not available on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = Number(position.coords.accuracy || 0);
        const lat = latitude.toFixed(6);
        const lng = longitude.toFixed(6);
        gpsText = `${lat}, ${lng}`;
        capturedLocation = { latitude, longitude, accuracy };
        locationField.value = `Latitude: ${lat}\nLongitude: ${lng}`;
        const site = getSiteLocation();
        if (site) {
          const distanceMeters = haversineMeters(latitude, longitude, site.latitude, site.longitude);
          mapBox.textContent = `${Math.round(distanceMeters)} m from restaurant center. Allowed radius: ${getAllowedRadiusMeters()} m.`;
        } else {
          mapBox.textContent = `GPS captured: ${gpsText}. Accuracy: ${Math.round(accuracy)} m.`;
        }
        timeField.value = nowTimestamp();
        setStatus("GPS location captured. Verify the distance before saving attendance.");
      },
      () => {
        setStatus("Could not read GPS location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function renderHistory() {
    const records = attendanceStore.readAttendance();
    historyList.innerHTML = records.length
      ? records.map((record) => `
        <article class="history-item">
          <div class="history-row"><strong>${record.timestamp}</strong><span class="status-badge">Saved</span></div>
          <div>Employee: ${record.employee}</div>
          <div>Location: ${record.location || 'Not captured'}</div>
          <div>Radius check: ${record.radiusCheck || 'Not recorded'}</div>
          <div>Firebase: ${record.firebaseSynced ? 'Synced' : 'Local save'}</div>
        </article>
      `).join("")
      : `<div class="empty-state">No attendance records yet.</div>`;
  }

  function saveAttendance() {
    const timestamp = timeField.value || nowTimestamp();
    const location = locationField.value.trim();
    const radiusCheck = withinAllowedZone();

    if (!radiusCheck.allowed) {
      setStatus(radiusCheck.reason);
      if (firebaseStatus) {
        firebaseStatus.textContent = radiusCheck.reason;
      }
      return;
    }

    const record = {
      employee: auth.email || "guest",
      timestamp,
      location,
      photo: capturedImage,
      gps: gpsText,
      radiusCheck: radiusCheck.reason,
      firebaseSynced: false,
    };

    const config = attendanceStore.getFirebaseConfig();
    if (config && config.projectId) {
      record.firebaseSynced = true;
      firebaseStatus.textContent = "Attendance stored locally and flagged for Firebase sync. Add your Firebase config to enable live cloud writes.";
    } else {
      firebaseStatus.textContent = "Saved locally. Provide Firebase config in local storage key guramrit-firebase-config to enable cloud sync.";
    }

    attendanceStore.addRecord(record);
    renderHistory();
    setStatus("Attendance saved within the allowed radius.");
  }

  openButton.addEventListener("click", openCamera);
  captureButton.addEventListener("click", capturePhoto);
  locationButton.addEventListener("click", getLocation);
  saveButton.addEventListener("click", saveAttendance);
  refreshButton.addEventListener("click", renderHistory);

  window.addEventListener("guramrit-attendance-updated", renderHistory);

  renderHistory();
  timeField.value = nowTimestamp();
})();


