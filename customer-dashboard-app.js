(function () {
  const h = React.createElement;
  const {
    HashRouter,
    Routes,
    Route,
    NavLink,
    Navigate,
    Outlet,
    useNavigate,
  } = ReactRouterDOM;
  const { useEffect, useMemo, useState, useContext, createContext } = React;

  const authKey = "guramrit-auth";
  const storagePrefix = "guramrit-customer-state:";
  const backendBaseUrl = window.location && window.location.protocol !== "file:" && window.location.origin ? window.location.origin : "http://localhost:3001";
  const dashboardByRole = {
    customer: "customer-dashboard.html",
    employee: "employee-dashboard.html",
    manager: "manager-dashboard.html",
    admin: "admin-dashboard.html",
  };

  const menuCatalog = [
    { id: "paneer-wrap", emoji: "🌯", title: "Paneer Wrap", category: "Lunch", price: 220, description: "Grilled paneer, fresh greens, and tangy mint sauce.", accent: "#ff7a00", highlight: "Chef special" },
    { id: "biryani", emoji: "🍛", title: "Veg Biryani", category: "Rice Bowl", price: 260, description: "Aromatic rice layered with vegetables and chef spices.", accent: "#c61f1f", highlight: "Most loved" },
    { id: "momo", emoji: "🥟", title: "Steamed Momos", category: "Snacks", price: 180, description: "Soft dumplings served with a fiery house dip.", accent: "#ffb347", highlight: "Popular" },
    { id: "thali", emoji: "🍱", title: "Royal Thali", category: "Dinner", price: 340, description: "A complete spread with curry, rice, bread, and dessert.", accent: "#ff5c46", highlight: "Best seller" },
    { id: "lassi", emoji: "🥤", title: "Sweet Lassi", category: "Drinks", price: 95, description: "Chilled yogurt drink with cardamom and saffron notes.", accent: "#ff8a1c", highlight: "Cool refreshment" },
    { id: "gulab-jamun", emoji: "🍮", title: "Gulab Jamun", category: "Dessert", price: 110, description: "Warm syrup-soaked dessert to finish on a sweet note.", accent: "#ff4d2d", highlight: "Sweet finish" },
  ];

  const specialOffers = [
    { id: "combo-1", title: "Lunch Combo", description: "Wrap + drink + dessert at a bundled price.", price: 359, offer: "Save 15%", accent: "#ff7a00" },
    { id: "combo-2", title: "Family Dinner Box", description: "Royal Thali for two with a sweet dessert add-on.", price: 599, offer: "Save 20%", accent: "#c61f1f" },
  ];

  const initialOrders = [];

  function readJson(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function readAuth() {
    return readJson(authKey, null);
  }

  function writeAuth(auth) {
    window.localStorage.setItem(authKey, JSON.stringify(auth));
  }

  function clearAuth() {
    window.localStorage.removeItem(authKey);
  }

  function getStateKey(email) {
    return storagePrefix + (email || "guest");
  }

  function getInitialState(email) {
    return readJson(getStateKey(email), {
      cart: [],
      orders: initialOrders,
    });
  }

  function saveState(email, state) {
    window.localStorage.setItem(getStateKey(email), JSON.stringify(state));
    if (window.fetch && email) {
        window.fetch(backendBaseUrl + "/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, state: state }),
      }).catch(function () {});
    }
  }

  function readAddresses(email) {
    return readJson(getStateKey(email) + ":addresses", []);
  }

  function saveAddresses(email, addresses) {
    window.localStorage.setItem(getStateKey(email) + ":addresses", JSON.stringify(addresses));
  }

  function money(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function foodImage(title, accent, emoji) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-label="${title}">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${accent}" stop-opacity="0.95" />
            <stop offset="100%" stop-color="#fff3ea" stop-opacity="1" />
          </linearGradient>
        </defs>
        <rect width="320" height="320" rx="32" fill="url(#bg)" />
        <circle cx="250" cy="60" r="38" fill="rgba(255,255,255,0.18)" />
        <circle cx="58" cy="258" r="52" fill="rgba(255,255,255,0.16)" />
        <rect x="28" y="26" width="118" height="30" rx="15" fill="rgba(255,255,255,0.85)" />
        <text x="87" y="47" text-anchor="middle" font-size="16" font-family="Segoe UI, Arial, sans-serif" fill="#8f1111" font-weight="700">Guramrit</text>
        <circle cx="160" cy="166" r="74" fill="rgba(255,255,255,0.55)" />
        <circle cx="160" cy="166" r="58" fill="rgba(255,255,255,0.92)" />
        ${buildDishArtwork(title, emoji)}
        <text x="160" y="260" text-anchor="middle" font-size="22" font-family="Segoe UI, Arial, sans-serif" fill="#2b1410" font-weight="700">${title}</text>
      </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function buildDishArtwork(title, fallbackEmoji) {
    const lowerTitle = String(title || "").toLowerCase();
    if (lowerTitle.includes("wrap")) {
      return `
        <g transform="translate(160 166)">
          <path d="M-62 10c18-28 38-42 62-42s44 14 62 42l-18 28H-44Z" fill="#f2c89b" />
          <path d="M-48 2c15-20 31-30 48-30s33 10 48 30l-14 18H-34Z" fill="#ffd49f" />
          <path d="M-40 -6c12-12 25-18 40-18s28 6 40 18" fill="none" stroke="#7ebf57" stroke-width="8" stroke-linecap="round" />
          <path d="M-42 10c15-8 30-12 42-12s27 4 42 12" fill="none" stroke="#d34b34" stroke-width="8" stroke-linecap="round" />
          <circle cx="0" cy="-10" r="11" fill="#f6e6b4" />
        </g>`;
    }

    if (lowerTitle.includes("biryani") || lowerTitle.includes("rice")) {
      return `
        <g transform="translate(160 166)">
          <ellipse cx="0" cy="22" rx="64" ry="18" fill="#9d4f2e" />
          <path d="M-56 18c8-34 28-52 56-52s48 18 56 52c-16 12-35 18-56 18s-40-6-56-18Z" fill="#f4d39a" />
          <path d="M-44 10c10-18 24-28 44-28s34 10 44 28" fill="none" stroke="#e57f2d" stroke-width="10" stroke-linecap="round" />
          <path d="M-24 -24c4-8 6-13 8-20" stroke="#fff" stroke-width="4" stroke-linecap="round" />
          <path d="M0 -27c4-8 6-13 8-20" stroke="#fff" stroke-width="4" stroke-linecap="round" />
          <path d="M24 -24c4-8 6-13 8-20" stroke="#fff" stroke-width="4" stroke-linecap="round" />
        </g>`;
    }

    if (lowerTitle.includes("momo") || lowerTitle.includes("dumpling")) {
      return `
        <g transform="translate(160 166)">
          <path d="M-52 16c8-14 20-22 36-22s28 8 36 22c-10 10-22 15-36 15s-26-5-36-15Z" fill="#f1d4b8" />
          <path d="M-6 16c8-14 20-22 36-22s28 8 36 22c-10 10-22 15-36 15S4 26-6 16Z" fill="#f6deca" />
          <path d="M-24 -3c8-14 20-22 36-22s28 8 36 22c-10 10-22 15-36 15S-14 7-24 -3Z" fill="#edd0af" />
          <path d="M-56 34h112" stroke="#c95a2b" stroke-width="8" stroke-linecap="round" />
        </g>`;
    }

    if (lowerTitle.includes("thali") || lowerTitle.includes("platter")) {
      return `
        <g transform="translate(160 166)">
          <circle cx="0" cy="10" r="58" fill="#f4d9a8" stroke="#8c4d1f" stroke-width="8" />
          <circle cx="0" cy="10" r="38" fill="#fff6de" />
          <circle cx="-28" cy="-8" r="12" fill="#d34b34" />
          <circle cx="0" cy="-18" r="12" fill="#4c8f3a" />
          <circle cx="28" cy="-8" r="12" fill="#e7b24a" />
          <path d="M-40 28h80" stroke="#8c4d1f" stroke-width="8" stroke-linecap="round" />
        </g>`;
    }

    if (lowerTitle.includes("lassi") || lowerTitle.includes("drink")) {
      return `
        <g transform="translate(160 166)">
          <path d="M-24 -36h48l-8 82h-32Z" fill="#fff6f0" stroke="#d86c2f" stroke-width="8" />
          <path d="M-4 -50 14 -74" stroke="#fff" stroke-width="8" stroke-linecap="round" />
          <circle cx="20" cy="-58" r="10" fill="#fff" opacity="0.8" />
          <path d="M-18 6h36" stroke="#ff8a1c" stroke-width="8" stroke-linecap="round" />
        </g>`;
    }

    if (lowerTitle.includes("gulab") || lowerTitle.includes("dessert")) {
      return `
        <g transform="translate(160 166)">
          <ellipse cx="0" cy="22" rx="58" ry="14" fill="#d37a2a" />
          <path d="M-40 14c6-24 23-36 40-36s34 12 40 36c-12 10-26 15-40 15s-28-5-40-15Z" fill="#f0b05d" />
          <circle cx="-18" cy="-2" r="14" fill="#d34b34" />
          <circle cx="18" cy="-2" r="14" fill="#d34b34" />
        </g>`;
    }

    return `
      <text x="160" y="178" text-anchor="middle" font-size="94" font-family="Segoe UI Emoji, Apple Color Emoji, sans-serif">${fallbackEmoji}</text>`;
  }

  function estimateDistanceKm(address) {
    const text = String(address || "").trim();
    if (!text) {
      return 4.2;
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return Math.max(1.8, Math.min(12, Number((2.5 + wordCount * 0.8).toFixed(1))));
  }

  function estimateEtaMinutes(distanceKm) {
    return Math.max(15, Math.round(distanceKm * 6 + 12));
  }

  function normalizeOrderStatus(status) {
    const value = String(status || "Placed").trim().toLowerCase();
    if (value === "delivered") {
      return "Delivered";
    }
    if (value === "approved") {
      return "Approved";
    }
    if (value === "preparing") {
      return "Preparing";
    }
    if (value === "out for delivery") {
      return "Out for Delivery";
    }
    if (value === "pending approval") {
      return "Placed";
    }
    if (value === "cancelled" || value === "canceled") {
      return "Cancelled";
    }
    return "Placed";
  }

  function useCustomerSession() {
    const [auth, setAuth] = useState(() => readAuth());
    useEffect(() => {
      const handleStorage = () => setAuth(readAuth());
      window.addEventListener("storage", handleStorage);
      return () => window.removeEventListener("storage", handleStorage);
    }, []);
    return { auth, setAuth };
  }

  const CustomerStateContext = createContext(null);

  function CustomerProvider(props) {
    const { auth } = useContext(SessionContext);
    const storageKey = getStateKey(auth && auth.email);
    const [state, setState] = useState(() => getInitialState(auth && auth.email));

    useEffect(() => {
      setState(getInitialState(auth && auth.email));
    }, [storageKey]);

    useEffect(() => {
      if (!window.fetch || !auth || !auth.email) {
        return;
      }

      window.fetch(backendBaseUrl + "/api/bootstrap")
        .then(function (response) {
          return response.ok ? response.json() : null;
        })
        .then(function (data) {
          if (!data || !data.customerStates || !data.customerStates[auth.email]) {
            return;
          }

          setState(data.customerStates[auth.email]);
        })
        .catch(function () {});
    }, [auth && auth.email]);

    useEffect(() => {
      saveState(auth && auth.email, state);
    }, [storageKey, state]);

    const actions = useMemo(() => {
      return {
        addToCart(item) {
          setState((current) => {
            const existing = current.cart.find((entry) => entry.id === item.id);
            const nextCart = existing
              ? current.cart.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry)
              : current.cart.concat([{ ...item, quantity: 1 }]);

            return { ...current, cart: nextCart };
          });
        },
        removeFromCart(itemId) {
          setState((current) => ({
            ...current,
            cart: current.cart
              .map((entry) => entry.id === itemId ? { ...entry, quantity: entry.quantity - 1 } : entry)
              .filter((entry) => entry.quantity > 0),
          }));
        },
        setDeliveryAddress(address) {
          setState((current) => ({ ...current, deliveryAddress: address }));
        },
        placeOrder(deliveryAddressInput) {
          let placedOrder = null;
          setState((current) => {
            if (!current.cart.length) {
              return current;
            }

            const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
            const total = current.cart.reduce((sum, entry) => sum + entry.price * entry.quantity, 0);
            const deliveryAddress = String(deliveryAddressInput || current.deliveryAddress || "").trim();
            const deliveryDistanceKm = estimateDistanceKm(deliveryAddress);
            const etaMinutes = estimateEtaMinutes(deliveryDistanceKm);
            const placed = {
              id: orderId,
              title: current.cart.map((entry) => entry.title).join(", "),
              imageData: current.cart[0] ? (current.cart[0].imageData || current.cart[0].imageUrl || "") : "",
              items: current.cart.map((entry) => Object.assign({}, entry)),
              status: "Placed",
              total,
              date: "Just now",
              deliveryDistanceKm,
              etaMinutes,
              trackingStatus: "Placed",
              deliveryAddress,
              createdAt: new Date().toISOString(),
            };
            placedOrder = placed;

            return {
              cart: [],
              orders: [placed].concat(current.orders),
            };
          });

          if (placedOrder && window.guramritOrderStore && auth && auth.email) {
            window.guramritOrderStore.syncOrder(placedOrder, auth.email);
          }
        },
        clearCart() {
          setState((current) => ({ ...current, cart: [] }));
        },
        logout() {
          clearAuth();
          window.location.replace("customer-login.html");
        },
      };
    }, [auth && auth.email]);

    const value = useMemo(() => ({
      auth,
      state,
      ...actions,
      cartCount: state.cart.reduce((sum, entry) => sum + entry.quantity, 0),
      cartTotal: state.cart.reduce((sum, entry) => sum + entry.price * entry.quantity, 0),
      orderCount: state.orders.length,
    }), [auth, state, actions]);

    return h(CustomerStateContext.Provider, { value }, props.children);
  }

  function SessionProvider(props) {
    const session = useCustomerSession();
    return h(SessionContext.Provider, { value: session }, props.children);
  }

  const SessionContext = createContext(null);

  function useSession() {
    return useContext(SessionContext);
  }

  function useCustomerState() {
    return useContext(CustomerStateContext);
  }

  function useMenuItems() {
    const [items, setItems] = useState(function () {
      return window.guramritMenuStore ? window.guramritMenuStore.readMenu() : menuCatalog;
    });

    useEffect(function () {
      if (!window.guramritMenuStore) {
        return;
      }

      const unsubscribe = window.guramritMenuStore.subscribe(function (nextItems) {
        setItems(nextItems);
      });

      return unsubscribe;
    }, []);

    return items;
  }

  function AuthGate(props) {
    const { auth } = useSession();
    useEffect(() => {
      if (!auth || !auth.loggedIn) {
        window.location.replace("customer-login.html");
        return;
      }

      if (auth.role !== "customer") {
        const destination = dashboardByRole[auth.role] || "role-selection.html";
        window.location.replace(destination);
      }
    }, [auth]);

    if (!auth || !auth.loggedIn || auth.role !== "customer") {
      return h("main", { className: "app-shell" }, h("div", { className: "surface hero-panel" }, "Redirecting to your login page..."));
    }

    return props.children;
  }

  function AppLayout() {
    const { auth } = useSession();
    const { cartCount, logout } = useCustomerState();
    const displayName = auth && auth.email ? auth.email.split("@")[0] : "guest";
    return h(
      "div",
      { className: "app-shell" },
      h(
        "header",
        { className: "topbar" },
        h(
          "a",
          { className: "brand-link", href: "role-selection.html" },
          h(
            "div",
            { className: "brand-copy" },
            h("strong", null, "Guramrit"),
            h("span", null, "Customer Dashboard")
          )
        ),
        h(
          "div",
          { className: "session-pill" },
          auth && auth.email ? "Signed in as " + auth.email : "Signed in"
        )
      ),
      h(
        "section",
        { className: "welcome-strip surface" },
        h("p", { className: "eyebrow" }, "Welcome back"),
        h("h2", null, "Welcome back, ", displayName, "."),
        h(
          "p",
          null,
          "Your cart, orders, and profile stay available as you move between separate customer pages."
        )
      ),
      h(
        "main",
        { className: "surface" },
        h(Outlet, null)
      ),
      h(
        "nav",
        { className: "bottom-nav", "aria-label": "Customer navigation" },
        navItem("/menu", "📋", "Menu"),
        navItem("/cart", "🛒", "Cart", cartCount),
        navItem("/orders", "📦", "Orders"),
        navItem("/profile", "👤", "Profile")
      )
    );

    function navItem(path, icon, label, badge) {
      return h(
        NavLink,
        { to: path, className: navClass },
        h("span", { className: "icon", "aria-hidden": true }, icon),
        h(
          "span",
          { className: "nav-label" },
          h("span", { className: "label" }, label),
          badge ? h("span", { className: "badge" }, badge) : null
        )
      );
    }

    function navClass(routeState) {
      return routeState.isActive ? "nav-item active" : "nav-item";
    }
  }

  function HomePage() {
    const { cartCount, cartTotal, orderCount } = useCustomerState();
    return h(
      "section",
      { className: "hero-panel" },
      h(
        "div",
        { className: "hero-stats" },
        stat("Cart items", cartCount, "Everything you add in Menu is preserved in Cart."),
        stat("Order total", money(cartTotal || 0), "Checkout will create a fresh order entry."),
        stat("Recent orders", orderCount, "Past orders remain visible as you move around.")
      ),
      h(
        "div",
        { className: "page-actions" },
        h(NavLink, { to: "/menu", className: "primary-btn" }, "Browse Menu"),
        h(NavLink, { to: "/cart", className: "ghost-btn" }, "View Cart")
      )
    );
  }

  function MenuPage() {
    const { state, addToCart } = useCustomerState();
    const menuItems = useMenuItems();
    const [search, setSearch] = useState("");

    const query = search.trim().toLowerCase();

    function matchesSearch(item) {
      if (!query) {
        return true;
      }

      return item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.highlight && item.highlight.toLowerCase().includes(query));
    }

    const filteredCatalog = menuItems.filter(matchesSearch);
    const featured = menuItems.filter((item) => item.featured && matchesSearch(item)).slice(0, 3);
    const popular = menuItems.filter((item) => item.popular && matchesSearch(item)).slice(0, 3);
    const allOffers = menuItems.length >= 2
      ? [
          { id: "combo-1", title: `${menuItems[0].title} Combo`, description: `${menuItems[0].title} + drink + dessert at a bundled price.`, price: Math.round(menuItems[0].price * 1.65), offer: "Save 15%", accent: menuItems[0].accent },
          { id: "combo-2", title: "Family Dinner Box", description: `${menuItems[3] ? menuItems[3].title : "Dinner favorite"} for two with a sweet dessert add-on.`, price: Math.round((menuItems[3] ? menuItems[3].price : 340) * 1.75), offer: "Save 20%", accent: menuItems[3] ? menuItems[3].accent : "#c61f1f" },
        ]
      : [];

    const offers = !query
      ? allOffers
      : allOffers.filter(function (offer) {
          const text = `${offer.title} ${offer.description} ${offer.offer}`.toLowerCase();
          return text.includes(query);
        });

    function addOfferToCart(offer) {
      addToCart({
        id: offer.id,
        title: offer.title,
        category: "Offer",
        price: offer.price,
        description: offer.description,
        accent: offer.accent,
        highlight: offer.offer,
        emoji: "🎁",
      });
    }

    return h(
      "section",
      { className: "menu-page" },
      h(
        "section",
        { className: "restaurant-banner" },
        h(
          "div",
          { className: "restaurant-banner-copy" },
          h("div", { className: "section-badge" }, "Restaurant banner"),
          h("h1", null, "Guramrit kitchen, crafted for fast cravings"),
          h(
            "p",
            null,
            "Search the menu, explore categories, and discover featured dishes, popular picks, and special offers in one smooth experience."
          )
        ),
        h(
          "div",
          { className: "restaurant-banner-art" },
          h("div", { className: "banner-chip" }, "Fresh ingredients"),
          h("div", { className: "banner-chip banner-chip-alt" }, "Hot and ready"),
          h("div", { className: "banner-plate" }, "🍽️")
        )
      ),
      h(
        "div",
        { className: "menu-toolbar" },
        h(
          "label",
          { className: "search-bar" },
          h("span", { className: "search-icon", "aria-hidden": true }, "🔎"),
          h("input", {
            type: "search",
            value: search,
            onChange: function (event) { setSearch(event.target.value); },
            placeholder: "Search dishes, drinks, or desserts",
            "aria-label": "Search menu",
          })
        )
      ),
      h(
        "section",
        { className: "menu-section" },
        h("div", { className: "section-header" }, h("div", { className: "section-badge" }, "Featured dishes"), h("h2", null, "Chef picks with personality")),
        h(
          "div",
          { className: "food-grid feature-grid" },
          featured.map((item) => renderFoodCard(item, addToCart, state, true))
        )
      ),
      h(
        "section",
        { className: "menu-section" },
        h("div", { className: "section-header" }, h("div", { className: "section-badge" }, "Popular items"), h("h2", null, "Loved by regulars")),
        h(
          "div",
          { className: "food-grid popular-grid" },
          popular.map((item) => renderFoodCard(item, addToCart, state, false))
        )
      ),
      h(
        "section",
        { className: "menu-section offers-section" },
        h("div", { className: "section-header" }, h("div", { className: "section-badge" }, "Special offers"), h("h2", null, "Bundle more, save more")),
        h(
          "div",
          { className: "offer-grid" },
          offers.map((offer) =>
            h(
              "article",
              { key: offer.id, className: "offer-card" },
              h("div", { className: "offer-flag" }, offer.offer),
              h("h3", null, offer.title),
              h("p", null, offer.description),
              h("div", { className: "offer-footer" }, h("strong", null, money(offer.price)), h("button", { type: "button", className: "primary-btn", onClick: function () { addOfferToCart(offer); } }, "Grab Offer"))
            )
          )
        )
      ),
      h(
        "section",
        { className: "menu-section" },
        h("div", { className: "section-header" }, h("div", { className: "section-badge" }, "All dishes"), h("h2", null, filteredCatalog.length ? filteredCatalog.length + " results" : "No matches")),
        filteredCatalog.length
          ? h(
              "div",
              { className: "food-grid all-grid" },
              filteredCatalog.map((item) => renderFoodCard(item, addToCart, state, false))
            )
          : h("div", { className: "empty-state" }, "No dishes match your search or category. Try a different filter.")
      )
    );
  }

  function renderFoodCard(item, addToCart, state, featured) {
    const inCart = state.cart.find((entry) => entry.id === item.id);
    return h(
      "article",
      { key: item.id, className: featured ? "food-card feature-card" : "food-card" },
      h(
        "div",
        { className: "food-image-wrap" },
        h("img", {
          className: "food-image",
          src: item.imageData || item.imageUrl || foodImage(item.title, item.accent, item.emoji),
          alt: item.title,
        }),
        h("div", { className: "food-tag" }, item.highlight)
      ),
      h(
        "div",
        { className: "food-copy" },
        h("div", { className: "tile-badge" }, item.category),
        h("h3", null, item.title),
        h("div", { className: "rating-row" }, "★", h("span", null, item.rating.toFixed(1)), h("small", null, "rating")),
        h("p", null, item.description),
        h(
          "div",
          { className: "price-row" },
          h("strong", null, money(item.price)),
          h(
            "button",
            {
              className: "primary-btn",
              onClick: function () {
                addToCart(item);
              },
              type: "button",
            },
            inCart ? "Add Another" : "Add to Cart"
          )
        )
      )
    );
  }

  function CartPage() {
    const { auth } = useSession();
    const { state, cartTotal, addToCart, removeFromCart, placeOrder, setDeliveryAddress } = useCustomerState();
    const menuItems = useMenuItems();
    const navigate = useNavigate();
    const emailKey = auth && auth.email;
    const hasItems = state.cart.length > 0;
    const [savedAddresses, setSavedAddresses] = useState(function () {
      return emailKey ? readAddresses(emailKey) : [];
    });
    const [customerName, setCustomerName] = useState(auth && auth.email ? auth.email.split("@")[0] : "");
    const [customerEmail, setCustomerEmail] = useState(auth && auth.email ? auth.email : "");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [selectedAddress, setSelectedAddress] = useState("");

    useEffect(function () {
      if (emailKey) {
        setSavedAddresses(readAddresses(emailKey));
      }
    }, [emailKey]);

    const liveCart = state.cart.map(function (entry) {
      const liveItem = menuItems.find(function (item) {
        return item.id === entry.id;
      }) || entry;

      return Object.assign({}, liveItem, { id: entry.id, quantity: entry.quantity });
    });

    const activeAddress = selectedAddress || customerAddress;

    function persistAddress() {
      if (!emailKey || !customerAddress.trim()) {
        return;
      }

      const nextAddress = customerAddress.trim();
      const nextAddresses = Array.from(new Set([nextAddress].concat(savedAddresses)));
      setSavedAddresses(nextAddresses);
      saveAddresses(emailKey, nextAddresses);
      setSelectedAddress(nextAddress);
    }

    function confirmOrder() {
      if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !activeAddress.trim()) {
        window.alert("Please complete Name, Email, Phone Number, and Address before confirming.");
        return;
      }

      const finalAddress = activeAddress.trim();
      persistAddress();
      if (typeof setDeliveryAddress === "function") {
        setDeliveryAddress(finalAddress);
      }
      placeOrder(finalAddress);
      navigate("/orders");
    }

    return h(
      "section",
      { className: "content-card" },
      h(
        "div",
        { className: "page-header" },
        h(
          "div",
          null,
          h("div", { className: "section-badge" }, "Cart"),
          h("h2", null, "Your current selection"),
          h("p", null, "This cart stays intact as you move between dashboard pages.")
        )
      ),
      hasItems
        ? h(
            "div",
            { className: "cart-layout" },
            h(
              "div",
              { className: "cart-list" },
              liveCart.map(function (item) {
                return h(
                  "article",
                  { key: item.id, className: "cart-item" },
                  h(
                    "div",
                    { className: "cart-item-media" },
                    h("img", {
                      className: "cart-item-image",
                      src: item.imageData || item.imageUrl || foodImage(item.title, item.accent, item.emoji),
                      alt: item.title,
                    })
                  ),
                  h("div", { className: "cart-row" }, h("h3", null, item.title), h("strong", null, money(item.price * item.quantity))),
                  h("p", null, item.description),
                  h(
                    "div",
                    { className: "cart-row" },
                    h(
                      "div",
                      { className: "qty-controls" },
                      h("button", { type: "button", className: "qty-btn", onClick: function () { removeFromCart(item.id); } }, "-"),
                      h("span", null, item.quantity),
                      h("button", { type: "button", className: "qty-btn", onClick: function () { addToCart(item); } }, "+")
                    ),
                    h("span", { className: "tile-badge" }, item.category)
                  )
                );
              })
            ),
            h(
              "div",
              { className: "checkout-card" },
              h("div", { className: "section-badge" }, "Checkout"),
              h("h3", null, "Confirm your order"),
              h("p", null, "Add your details once. Save addresses for faster checkouts later."),
              h(
                "div",
                { className: "checkout-grid" },
                fieldInput("Name", customerName, setCustomerName, "text", "Your name"),
                fieldInput("Email", customerEmail, setCustomerEmail, "email", "you@example.com"),
                fieldInput("Phone Number", customerPhone, setCustomerPhone, "tel", "9876543210"),
                h(
                  "label",
                  { className: "checkout-field checkout-field-full" },
                  h("span", null, "Address"),
                  h("textarea", {
                    rows: 4,
                    value: customerAddress,
                    placeholder: "Flat no, street, area, landmark",
                    onChange: function (event) { setCustomerAddress(event.target.value); },
                  })
                )
              ),
              h(
                "div",
                { className: "saved-addresses" },
                h("div", { className: "checkout-subtitle" }, "Saved addresses"),
                savedAddresses.length
                  ? savedAddresses.map(function (address) {
                      return h(
                        "button",
                        {
                          key: address,
                          type: "button",
                          className: selectedAddress === address ? "address-chip active" : "address-chip",
                          onClick: function () {
                            setSelectedAddress(address);
                            setCustomerAddress(address);
                          },
                        },
                        address
                      );
                    })
                  : h("p", { className: "empty-mini" }, "No saved addresses yet.")
              ),
              h(
                "div",
                { className: "checkout-summary" },
                h("div", null, h("span", null, "Total"), h("strong", null, money(cartTotal))),
                h("div", null, h("span", null, "Deliver to"), h("strong", null, activeAddress ? activeAddress.slice(0, 26) + (activeAddress.length > 26 ? "..." : "") : "Add address"))
              ),
              h(
                "button",
                {
                  type: "button",
                  className: "primary-btn confirm-order-btn",
                  onClick: confirmOrder,
                },
                "Confirm Order"
              )
            )
          )
        : h(
            "div",
            { className: "empty-state" },
            "Your cart is empty. Open Menu to add items and keep navigating without losing state."
          )
    );
  }

  function fieldInput(label, value, setter, type, placeholder) {
    return h(
      "label",
      { className: "checkout-field" },
      h("span", null, label),
      h("input", {
        type: type,
        value: value,
        placeholder: placeholder,
        onChange: function (event) { setter(event.target.value); },
      })
    );
  }

  function OrdersPage() {
    const { state } = useCustomerState();
    const activeOrders = state.orders.filter((order) => {
      const normalized = normalizeOrderStatus(order.trackingStatus || order.status);
      return normalized !== "Delivered" && normalized !== "Cancelled";
    });

    function getOrderImage(order) {
      if (order.imageData || order.imageUrl) {
        return order.imageData || order.imageUrl;
      }

      if (Array.isArray(order.items) && order.items.length) {
        const firstItem = order.items[0];
        return firstItem.imageData || firstItem.imageUrl || foodImage(firstItem.title, firstItem.accent, firstItem.emoji);
      }

      return foodImage(order.title, "#ff7a00", "🍽️");
    }

    function trackingSteps(status) {
      const currentStatus = normalizeOrderStatus(status);
      const steps = ["Placed", "Approved", "Preparing", "Out for Delivery", "Delivered"];
      const activeIndex = steps.indexOf(currentStatus);
      return steps.map(function (step, index) {
        const done = activeIndex >= index;
        const active = activeIndex === index;
        return h(
          "div",
          { key: step, className: active ? "track-step active" : done ? "track-step done" : "track-step" },
          h("span", { className: "track-dot" }),
          h("span", null, step)
        );
      });
    }

    return h(
      "section",
      { className: "content-card" },
      h(
        "div",
        { className: "page-header" },
        h(
          "div",
          null,
          h("div", { className: "section-badge" }, "Orders"),
          h("h2", null, "Current orders"),
          h("p", null, "Only active orders appear here. Delivered orders move to your profile history.")
        )
      ),
      h(
        "div",
        { className: "orders-list" },
        activeOrders.length ? activeOrders.map((order) =>
          h(
            "article",
            { key: order.id, className: "order-card" },
            h(
              "div",
              { className: "order-head" },
              h(
                "div",
                { className: "order-image-wrap" },
                h("img", { className: "order-image", src: getOrderImage(order), alt: order.title })
              ),
              h(
                "div",
                { className: "order-head-copy" },
                h("h3", null, order.title),
                h("span", { className: "tile-badge" }, normalizeOrderStatus(order.trackingStatus || order.status)),
                h("p", null, order.id + " • " + order.date)
              )
            ),
            h("div", { className: "order-details" }, h("span", null, "Distance: " + Number(order.deliveryDistanceKm || 0).toFixed(1) + " km"), h("span", null, "ETA: " + Number(order.etaMinutes || 0) + " mins")),
            h(
              "div",
              { className: "order-tracking" },
              h("div", { className: "checkout-subtitle" }, "Track order"),
              h("div", { className: "track-list" }, trackingSteps(order.trackingStatus || order.status))
            ),
            h("div", { className: "price-row" }, h("span", null, "Total"), h("strong", null, money(order.total)))
          )
        ) : h("div", { className: "empty-state" }, "No active orders right now. When you place a new order, it will appear here.")
      )
    );
  }

  function ProfilePage() {
    const { auth } = useSession();
    const { logout, state } = useCustomerState();
    const historyOrders = state.orders.slice();
    return h(
      "section",
      { className: "content-card" },
      h(
        "div",
        { className: "page-header" },
        h(
          "div",
          null,
          h("div", { className: "section-badge" }, "Profile"),
          h("h2", null, "Your account"),
          h("p", null, "This page keeps the active session visible until you manually log out.")
        )
      ),
      h(
        "div",
        { className: "profile-list" },
        h(
          "article",
          { className: "profile-card" },
          h("div", { className: "profile-row" }, h("h3", null, auth && auth.email ? auth.email : "Guest account"), h("span", { className: "tile-badge" }, "Active")),
          h("p", null, "Your Guramrit customer session remains active across navigation and reloads until logout."),
          h("div", { className: "page-actions" }, h("button", { className: "logout-btn", type: "button", onClick: logout }, "Logout"), h(NavLink, { to: "/menu", className: "ghost-btn" }, "Back to Menu"))
        ),
        h(
          "article",
          { className: "profile-card" },
          h("div", { className: "section-badge" }, "Order history"),
          h("h3", null, "Past orders"),
          historyOrders.length
            ? h(
                "div",
                { className: "tracking-list" },
                historyOrders.map((order) =>
                  h(
                    "div",
                    { key: order.id, className: "timeline-order" },
                    h("div", { className: "tracking-row" }, h("strong", null, order.title), h("span", { className: "tile-badge" }, normalizeOrderStatus(order.trackingStatus || order.status))),
                    h("p", null, order.id + " • " + order.date),
                    h("div", { className: "subtle" }, "Total " + money(order.total))
                  )
                )
              )
            : h("div", { className: "empty-state" }, "No past orders yet. Once you place an order, it will appear here.")
        )
      )
    );
  }

  function stat(label, value, description) {
    return h(
      "article",
      { className: "stat-card" },
      h("span", { className: "label" }, label),
      h("strong", null, value),
      h("span", null, description)
    );
  }

  function AppRouter() {
    return h(
      HashRouter,
      null,
      h(
        Routes,
        null,
        h(Route, { path: "/", element: h(Navigate, { to: "/menu", replace: true }) }),
        h(
          Route,
          { element: h(AppLayout) },
          h(Route, { path: "/menu", element: h(MenuPage) }),
          h(Route, { path: "/cart", element: h(CartPage) }),
          h(Route, { path: "/orders", element: h(OrdersPage) }),
          h(Route, { path: "/profile", element: h(ProfilePage) }),
          h(Route, { path: "*", element: h(Navigate, { to: "/menu", replace: true }) })
        )
      )
    );
  }

  function App() {
    return h(
      SessionProvider,
      null,
      h(
        AuthGate,
        null,
        h(CustomerProvider, null, h(AppRouter))
      )
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();


