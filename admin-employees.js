(function () {
  const store = window.guramritAdminStore;
  const form = document.getElementById("employee-form");
  const list = document.getElementById("employee-list");
  const resetButton = document.getElementById("reset-employees");
  const fields = {
    id: document.getElementById("employee-id"),
    name: document.getElementById("employee-name"),
    email: document.getElementById("employee-email"),
    role: document.getElementById("employee-role"),
    phone: document.getElementById("employee-phone"),
    status: document.getElementById("employee-status"),
  };

  function clearForm() {
    form.reset();
    fields.id.value = "";
    fields.status.value = "Active";
  }

  function fillForm(employee) {
    fields.id.value = employee.id;
    fields.name.value = employee.name;
    fields.email.value = employee.email;
    fields.role.value = employee.role;
    fields.phone.value = employee.phone || "";
    fields.status.value = employee.status || "Active";
  }

  function render() {
    list.innerHTML = store.readEmployees().map((employee) => `
      <article class="employee-card">
        <div class="row"><h3>${employee.name}</h3><span class="tile-badge">${employee.status}</span></div>
        <p>${employee.role} • ${employee.email}</p>
        <p>${employee.phone || "No phone saved"}</p>
        <div class="toolbar-row" style="margin-top:12px;">
          <button class="ghost-btn" type="button" data-edit-employee="${employee.id}">Edit</button>
          <button class="ghost-btn" type="button" data-remove-employee="${employee.id}">Delete</button>
        </div>
      </article>
    `).join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const employee = {
      id: fields.id.value,
      name: fields.name.value.trim(),
      email: fields.email.value.trim(),
      role: fields.role.value.trim(),
      phone: fields.phone.value.trim(),
      status: fields.status.value,
    };

    if (employee.id) {
      store.saveEmployees(store.readEmployees().map((entry) => entry.id === employee.id ? employee : entry));
    } else {
      store.addEmployee(employee);
    }

    clearForm();
    render();
  });

  resetButton.addEventListener("click", () => {
    store.resetEmployees();
    clearForm();
    render();
  });

  list.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-employee]");
    const removeButton = event.target.closest("[data-remove-employee]");
    if (editButton) {
      const employee = store.readEmployees().find((entry) => entry.id === editButton.getAttribute("data-edit-employee"));
      if (employee) fillForm(employee);
    }
    if (removeButton) {
      store.removeEmployee(removeButton.getAttribute("data-remove-employee"));
      render();
    }
  });

  window.addEventListener("guramrit-admin-employees-updated", render);

  render();
})();


