(function () {
  const store = window.guramritMenuStore;
  if (!store) {
    return;
  }

  const form = document.getElementById("menu-form");
  const resetFormButton = document.getElementById("reset-form");
  const resetMenuButton = document.getElementById("reset-menu");
  const menuList = document.getElementById("menu-list");
  const statusLine = document.getElementById("admin-status");

  const fields = {
    id: document.getElementById("item-id"),
    title: document.getElementById("item-title"),
    category: document.getElementById("item-category"),
    price: document.getElementById("item-price"),
    rating: document.getElementById("item-rating"),
    emoji: document.getElementById("item-emoji"),
    accent: document.getElementById("item-accent"),
    highlight: document.getElementById("item-highlight"),
    image: document.getElementById("item-image"),
    imagePreview: document.getElementById("item-image-preview"),
    imageStatus: document.getElementById("item-image-status"),
    description: document.getElementById("item-description"),
    featured: document.getElementById("item-featured"),
    popular: document.getElementById("item-popular"),
  };

  let editingId = "";
  let selectedImageData = "";

  function money(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function setStatus(message) {
    if (statusLine) {
      statusLine.textContent = message;
    }
  }

  function setImagePreview(src, label) {
    if (fields.imagePreview) {
      fields.imagePreview.src = src || "";
      fields.imagePreview.style.display = src ? "block" : "none";
    }

    if (fields.imageStatus) {
      fields.imageStatus.textContent = label || "No image selected. Upload a food photo to store it with the menu item.";
    }
  }

  function clearForm() {
    editingId = "";
    form.reset();
    fields.id.value = "";
    fields.accent.value = "#ff7a00";
    fields.featured.checked = false;
    fields.popular.checked = false;
    setStatus("Ready to add a new item.");
  }

  function fillForm(item) {
    editingId = item.id;
    fields.id.value = item.id;
    fields.title.value = item.title;
    fields.category.value = item.category;
    fields.price.value = item.price;
    fields.rating.value = item.rating;
    fields.emoji.value = item.emoji || "🍽️";
    fields.accent.value = item.accent || "#ff7a00";
    fields.highlight.value = item.highlight || "Fresh pick";
    selectedImageData = item.imageData || item.imageUrl || "";
    setImagePreview(selectedImageData, selectedImageData ? "Current food image loaded for editing." : "No image selected. Upload a food photo to store it with the menu item.");
    fields.description.value = item.description || "";
    fields.featured.checked = Boolean(item.featured);
    fields.popular.checked = Boolean(item.popular);
    setStatus(`Editing ${item.title}.`);
  }

  function buildItemFromForm() {
    return {
      id: fields.id.value || editingId,
      title: fields.title.value.trim(),
      category: fields.category.value.trim(),
      price: Number(fields.price.value),
      rating: Number(fields.rating.value),
      emoji: fields.emoji.value.trim() || "🍽️",
      accent: fields.accent.value,
      highlight: fields.highlight.value.trim() || "Fresh pick",
      imageData: selectedImageData,
      description: fields.description.value.trim(),
      featured: fields.featured.checked,
      popular: fields.popular.checked,
    };
  }

  function render() {
    const items = store.readMenu();
    if (!menuList) {
      return;
    }

    menuList.innerHTML = items
      .map((item) => {
        const badges = [item.featured ? "Featured" : null, item.popular ? "Popular" : null].filter(Boolean);
        return `
          <article class="menu-row">
            <div class="menu-row-top">
              <div class="menu-row-title">
                <h3>${item.title}</h3>
                <p>${item.category} • ${money(item.price)} • ${item.rating.toFixed(1)}★</p>
              </div>
              <div class="menu-actions">
                <button class="ghost-btn" data-action="edit" data-id="${item.id}" type="button">Edit</button>
                <button class="ghost-btn" data-action="delete" data-id="${item.id}" type="button">Delete</button>
              </div>
            </div>
            <div class="menu-image-row">
              <img class="menu-thumb" src="${item.imageData || item.imageUrl || item.accent}" alt="${item.title}" />
            </div>
            <div class="menu-meta">${item.description}</div>
            <div class="menu-badges">
              <span class="menu-badge">${item.emoji || "🍽️"}</span>
              <span class="menu-badge">${item.highlight || "Fresh pick"}</span>
              ${badges.map((badge) => `<span class="menu-badge">${badge}</span>`).join("")}
            </div>
          </article>
        `;
      })
      .join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const item = buildItemFromForm();

    if (!item.title || !item.category || !item.price || !item.rating) {
      setStatus("Please fill Name, Category, Price, and Rating.");
      return;
    }

    const saved = store.upsertItem(item);
    setStatus(`${item.title} saved. Customers will see the update immediately.`);
    render();
    clearForm();
    if (saved && saved.length) {
      // keep latest list in sync in case another tab is open
      window.dispatchEvent(new Event("guramrit-menu-updated"));
    }
  });

  resetFormButton.addEventListener("click", clearForm);
  resetMenuButton.addEventListener("click", () => {
    store.resetMenu();
    render();
    clearForm();
    setStatus("Menu reset to default items.");
  });

  fields.image.addEventListener("change", () => {
    const file = fields.image.files && fields.image.files[0];
    if (!file) {
      selectedImageData = "";
      setImagePreview("", "No image selected. Upload a food photo to store it with the menu item.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      selectedImageData = String(reader.result || "");
      setImagePreview(selectedImageData, file.name + " selected.");
    };
    reader.readAsDataURL(file);
  });

  menuList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const id = button.getAttribute("data-id");
    const action = button.getAttribute("data-action");
    const item = store.readMenu().find((entry) => entry.id === id);
    if (!item) {
      return;
    }

    if (action === "edit") {
      fillForm(item);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (action === "delete") {
      if (window.confirm(`Delete ${item.title}?`)) {
        store.removeItem(id);
        render();
        clearForm();
        setStatus(`${item.title} deleted.`);
      }
    }
  });

  store.subscribe(() => {
    render();
  });

  window.addEventListener("guramrit-menu-updated", render);
  window.addEventListener("storage", render);

  render();
  clearForm();
})();



