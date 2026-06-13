const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const port = Number(process.env.PORT || 3001);
const defaultDb = {
  settings: {
    restaurantName: 'Guramrit Restro & Cafe',
    contactEmail: '',
    contactPhone: '',
    location: '',
    currency: 'INR',
  },
  accounts: [],
  menu: [],
  employees: [],
  attendance: [],
  managerApprovals: {},
  customerStates: {},
  notifications: [],
};

const dataFileCandidates = [
  path.join(__dirname, 'data', 'db.json'),
  path.join(__dirname, '..', 'data', 'db.json'),
  path.join(process.cwd(), 'data', 'db.json'),
  path.join(process.cwd(), 'backend', 'data', 'db.json'),
];

function resolveDataFile() {
  return dataFileCandidates.find((candidate) => fs.existsSync(candidate)) || dataFileCandidates[0];
}

function ensureDbFile() {
  const filePath = resolveDataFile();
  const folderPath = path.dirname(filePath);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultDb, null, 2));
  }

  return filePath;
}

function readDb() {
  const dataFile = ensureDbFile();
  let db;

  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    db = JSON.parse(raw);
  } catch {
    db = JSON.parse(JSON.stringify(defaultDb));
    fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
  }

  db.accounts = Array.isArray(db.accounts) ? db.accounts : [];
  const originalMenu = Array.isArray(db.menu) ? db.menu : [];
  db.menu = originalMenu.map(normalizeMenuItem);
  db.employees = Array.isArray(db.employees) ? db.employees : [];
  db.attendance = Array.isArray(db.attendance) ? db.attendance : [];
  db.managerApprovals = db.managerApprovals && typeof db.managerApprovals === 'object' ? db.managerApprovals : {};
  db.customerStates = db.customerStates && typeof db.customerStates === 'object' ? db.customerStates : {};
  db.notifications = Array.isArray(db.notifications) ? db.notifications : [];
  db.settings = db.settings && typeof db.settings === 'object' ? db.settings : {};

  return db;
}

function writeDb(db) {
  const dataFile = ensureDbFile();
  fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
}

function send(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  send(res, 404, { error: 'Not Found' });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function normalizeMenuItem(item) {
  const title = String(item.title || item.name || 'Untitled Item').trim();
  const seededIds = new Set(['paneer-wrap', 'biryani', 'momo', 'thali', 'lassi', 'gulab-jamun']);
  const shouldRegenerateImage = seededIds.has(String(item.id || '').trim().toLowerCase());
  return {
    id: item.id || ('item-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36)),
    title,
    category: item.category || 'General',
    price: Number(item.price) || 0,
    rating: Number(item.rating) || 4.5,
    description: item.description || '',
    accent: item.accent || '#ff7a00',
    highlight: item.highlight || 'Fresh pick',
    emoji: item.emoji || '🍽️',
    imageData: shouldRegenerateImage
      ? buildFallbackImageData(title, item.accent || '#ff7a00', item.emoji || '🍽️')
      : (item.imageData || item.imageUrl || buildFallbackImageData(title, item.accent || '#ff7a00', item.emoji || '🍽️')),
    featured: Boolean(item.featured),
    popular: Boolean(item.popular),
  };
}

function buildFallbackImageData(title, accent, emoji) {
  const safeTitle = String(title || 'Food')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const artwork = buildDishArtwork(title, emoji);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-label="${safeTitle}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.96" />
          <stop offset="100%" stop-color="#fff3ea" stop-opacity="1" />
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="32" fill="url(#bg)" />
      <circle cx="252" cy="66" r="38" fill="rgba(255,255,255,0.18)" />
      <circle cx="64" cy="256" r="52" fill="rgba(255,255,255,0.16)" />
      <rect x="28" y="26" width="118" height="30" rx="15" fill="rgba(255,255,255,0.85)" />
      <text x="87" y="47" text-anchor="middle" font-size="16" font-family="Segoe UI, Arial, sans-serif" fill="#8f1111" font-weight="700">Guramrit</text>
      <circle cx="160" cy="166" r="74" fill="rgba(255,255,255,0.55)" />
      <circle cx="160" cy="166" r="58" fill="rgba(255,255,255,0.92)" />
      ${artwork}
      <text x="160" y="260" text-anchor="middle" font-size="22" font-family="Segoe UI, Arial, sans-serif" fill="#2b1410" font-weight="700">${safeTitle}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildDishArtwork(title, fallbackEmoji) {
  const lowerTitle = String(title || '').toLowerCase();
  if (lowerTitle.includes('wrap')) {
    return `
      <g transform="translate(160 166)">
        <path d="M-62 10c18-28 38-42 62-42s44 14 62 42l-18 28H-44Z" fill="#f2c89b" />
        <path d="M-48 2c15-20 31-30 48-30s33 10 48 30l-14 18H-34Z" fill="#ffd49f" />
        <path d="M-40 -6c12-12 25-18 40-18s28 6 40 18" fill="none" stroke="#7ebf57" stroke-width="8" stroke-linecap="round" />
        <path d="M-42 10c15-8 30-12 42-12s27 4 42 12" fill="none" stroke="#d34b34" stroke-width="8" stroke-linecap="round" />
        <circle cx="0" cy="-10" r="11" fill="#f6e6b4" />
      </g>`;
  }

  if (lowerTitle.includes('biryani') || lowerTitle.includes('rice')) {
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

  if (lowerTitle.includes('momo') || lowerTitle.includes('dumpling')) {
    return `
      <g transform="translate(160 166)">
        <path d="M-52 16c8-14 20-22 36-22s28 8 36 22c-10 10-22 15-36 15s-26-5-36-15Z" fill="#f1d4b8" />
        <path d="M-6 16c8-14 20-22 36-22s28 8 36 22c-10 10-22 15-36 15S4 26-6 16Z" fill="#f6deca" />
        <path d="M-24 -3c8-14 20-22 36-22s28 8 36 22c-10 10-22 15-36 15S-14 7-24 -3Z" fill="#edd0af" />
        <path d="M-56 34h112" stroke="#c95a2b" stroke-width="8" stroke-linecap="round" />
      </g>`;
  }

  if (lowerTitle.includes('thali') || lowerTitle.includes('platter')) {
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

  if (lowerTitle.includes('lassi') || lowerTitle.includes('drink')) {
    return `
      <g transform="translate(160 166)">
        <path d="M-24 -36h48l-8 82h-32Z" fill="#fff6f0" stroke="#d86c2f" stroke-width="8" />
        <path d="M-4 -50 14 -74" stroke="#fff" stroke-width="8" stroke-linecap="round" />
        <circle cx="20" cy="-58" r="10" fill="#fff" opacity="0.8" />
        <path d="M-18 6h36" stroke="#ff8a1c" stroke-width="8" stroke-linecap="round" />
      </g>`;
  }

  if (lowerTitle.includes('gulab') || lowerTitle.includes('dessert')) {
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

function normalizeEmployee(employee) {
  return {
    id: employee.id || ('emp-' + String(employee.name || 'employee').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36)),
    name: String(employee.name || '').trim(),
    email: String(employee.email || '').trim(),
    role: String(employee.role || '').trim(),
    status: employee.status || 'Active',
    phone: employee.phone || '',
  };
}

function normalizeAttendanceRecord(record) {
  return record && typeof record === 'object' ? record : {};
}

function normalizeAccount(account) {
  return {
    role: account.role,
    name: String(account.name || '').trim(),
    email: String(account.email || '').trim().toLowerCase(),
    password: String(account.password || ''),
  };
}

function readCustomerState(db, email) {
  return db.customerStates[email] || { cart: [], orders: [] };
}

function writeCustomerState(db, email, state) {
  db.customerStates[email] = state;
}

function estimateDistanceKm(address) {
  const text = String(address || '').trim();
  if (!text) {
    return 4.2;
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1.8, Math.min(12, Number((2.5 + wordCount * 0.8).toFixed(1))));
}

function estimateEtaMinutes(distanceKm) {
  return Math.max(15, Math.round(distanceKm * 6 + 12));
}

function addNotification(db, notification) {
  db.notifications.unshift(notification);
  db.notifications = db.notifications.slice(0, 100);
}

function attendanceFingerprint(record) {
  return [
    String(record.employee || ""),
    String(record.timestamp || ""),
    String(record.gps || ""),
    String(record.location || ""),
  ].join("|");
}

function getCustomerSummaries(db) {
  return Object.entries(db.customerStates).map(([email, state]) => {
    const orders = Array.isArray(state.orders) ? state.orders : [];
    return {
      email,
      orderCount: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
      lastOrder: orders[0] ? orders[0].title : 'No orders yet',
    };
  }).sort((left, right) => right.orderCount - left.orderCount);
}

function getOrderLedger(db) {
  const ledger = [];
  for (const [email, state] of Object.entries(db.customerStates)) {
    const orders = Array.isArray(state.orders) ? state.orders : [];
    for (const order of orders) {
      ledger.push({
        customer: email,
        id: order.id,
        title: order.title,
        total: Number(order.total || 0),
        status: order.status || 'Placed',
        trackingStatus: order.trackingStatus || order.status || 'Placed',
        approval: db.managerApprovals[order.id] || 'Pending Approval',
        date: order.date || 'Today',
      });
    }
  }
  return ledger.sort((left, right) => right.total - left.total);
}

async function handleApiRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const db = readDb();

  try {
    if (url.pathname === '/api/health') {
      send(res, 200, { ok: true, name: db.settings.restaurantName });
      return;
    }

    if (url.pathname === '/api/bootstrap') {
      send(res, 200, db);
      return;
    }

    if (url.pathname === '/api/auth/register' && req.method === 'POST') {
      const body = await parseBody(req);
      const account = normalizeAccount(body);
      if (!account.role || !account.email || !account.password) {
        send(res, 400, { error: 'Role, email, and password are required.' });
        return;
      }

      if (db.accounts.some((entry) => entry.email === account.email && entry.role === account.role)) {
        send(res, 409, { error: 'Account already exists for this role.' });
        return;
      }

      db.accounts.push(account);
      writeDb(db);
      send(res, 200, { role: account.role, name: account.name, email: account.email });
      return;
    }

    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseBody(req);
      const account = normalizeAccount(body);
      const match = db.accounts.find((entry) => entry.email === account.email && entry.role === account.role && entry.password === account.password);

      if (!match) {
        send(res, 401, { error: 'Invalid credentials or account not found.' });
        return;
      }

      send(res, 200, { role: match.role, name: match.name, email: match.email });
      return;
    }

    if (url.pathname === '/api/menu') {
      if (req.method === 'GET') {
        send(res, 200, db.menu);
        return;
      }

      if (req.method === 'PUT') {
        const body = await parseBody(req);
        const items = Array.isArray(body) ? body : Array.isArray(body.items) ? body.items : [];
        db.menu = items.map(normalizeMenuItem);
        writeDb(db);
        send(res, 200, db.menu);
        return;
      }

      if (req.method === 'POST') {
        const body = await parseBody(req);
        const item = normalizeMenuItem(body);
        const index = db.menu.findIndex((entry) => entry.id === item.id);
        if (index >= 0) {
          db.menu[index] = item;
        } else {
          db.menu.push(item);
        }
        writeDb(db);
        send(res, 200, db.menu);
        return;
      }

      if (req.method === 'DELETE') {
        const id = url.searchParams.get('id');
        db.menu = db.menu.filter((entry) => entry.id !== id);
        writeDb(db);
        send(res, 200, db.menu);
        return;
      }
    }

    if (url.pathname === '/api/employees') {
      if (req.method === 'GET') {
        send(res, 200, db.employees);
        return;
      }

      if (req.method === 'PUT') {
        const body = await parseBody(req);
        const employees = Array.isArray(body) ? body : Array.isArray(body.employees) ? body.employees : [];
        db.employees = employees.map(normalizeEmployee);
        writeDb(db);
        send(res, 200, db.employees);
        return;
      }

      if (req.method === 'POST') {
        const body = await parseBody(req);
        const employee = normalizeEmployee(body);
        const index = db.employees.findIndex((entry) => entry.id === employee.id);
        if (index >= 0) {
          db.employees[index] = employee;
        } else {
          db.employees.push(employee);
        }
        writeDb(db);
        send(res, 200, db.employees);
        return;
      }

      if (req.method === 'DELETE') {
        const id = url.searchParams.get('id');
        db.employees = db.employees.filter((entry) => entry.id !== id);
        writeDb(db);
        send(res, 200, db.employees);
        return;
      }
    }

    if (url.pathname === '/api/settings') {
      if (req.method === 'GET') {
        send(res, 200, db.settings);
        return;
      }

      if (req.method === 'PUT') {
        const body = await parseBody(req);
        db.settings = Object.assign({}, db.settings, body);
        writeDb(db);
        send(res, 200, db.settings);
        return;
      }
    }

    if (url.pathname === '/api/attendance') {
      if (req.method === 'GET') {
        send(res, 200, db.attendance);
        return;
      }

      if (req.method === 'PUT') {
        const body = await parseBody(req);
        const records = Array.isArray(body) ? body : Array.isArray(body.records) ? body.records : [];
        db.attendance = records.map(normalizeAttendanceRecord);
        writeDb(db);
        send(res, 200, db.attendance);
        return;
      }

      if (req.method === 'POST') {
        const body = await parseBody(req);
        const record = normalizeAttendanceRecord(body);
        db.attendance.unshift(record);
        writeDb(db);
        send(res, 200, db.attendance);
        return;
      }
    }

    if (url.pathname === '/api/orders') {
      if (req.method === 'GET') {
        send(res, 200, {
          summaries: getCustomerSummaries(db),
          ledger: getOrderLedger(db),
          approvals: db.managerApprovals,
          notifications: db.notifications.filter((item) => item.kind === 'customer-order'),
        });
        return;
      }

      if (req.method === 'PUT') {
        const body = await parseBody(req);
        if (body.email && body.state && typeof body.state === 'object') {
          writeCustomerState(db, body.email, body.state);
          writeDb(db);
          send(res, 200, body.state);
          return;
        }

        send(res, 400, { error: 'Email and state are required.' });
        return;
      }

      if (req.method === 'POST') {
        const body = await parseBody(req);
        const { email, order } = body;
        const state = readCustomerState(db, email);
        const trackedOrder = Object.assign({}, order, {
          deliveryDistanceKm: Number(order.deliveryDistanceKm || estimateDistanceKm(order.deliveryAddress)),
          etaMinutes: Number(order.etaMinutes || estimateEtaMinutes(order.deliveryDistanceKm || estimateDistanceKm(order.deliveryAddress))),
          trackingStatus: order.trackingStatus || 'Placed',
          createdAt: order.createdAt || new Date().toISOString(),
        });
        state.orders = [trackedOrder].concat(state.orders || []);
        state.cart = [];
        writeCustomerState(db, email, state);
        addNotification(db, {
          id: trackedOrder.id + '-notice',
          kind: 'customer-order',
          title: 'New customer order',
          message: `${email} placed ${trackedOrder.title || 'an order'} for delivery in about ${trackedOrder.etaMinutes} mins.`,
          orderId: trackedOrder.id,
          email,
          status: trackedOrder.trackingStatus,
          etaMinutes: trackedOrder.etaMinutes,
          deliveryDistanceKm: trackedOrder.deliveryDistanceKm,
          createdAt: new Date().toISOString(),
        });
        writeDb(db);
        send(res, 200, state);
        return;
      }

      if (req.method === 'PATCH') {
        const body = await parseBody(req);
        if (body.orderId && body.status) {
          db.managerApprovals[body.orderId] = body.status;
          writeDb(db);
          send(res, 200, { orderId: body.orderId, status: body.status });
          return;
        }

        if (body.orderId && body.trackingStatus) {
          let updatedOrder = null;
          Object.keys(db.customerStates).forEach((email) => {
            const state = db.customerStates[email];
            if (!state || !Array.isArray(state.orders)) {
              return;
            }

            state.orders = state.orders.map((order) => {
              if (order.id !== body.orderId) {
                return order;
              }

              updatedOrder = Object.assign({}, order, {
                trackingStatus: body.trackingStatus,
                status: body.trackingStatus,
              });
              return updatedOrder;
            });
          });

          if (updatedOrder) {
            writeDb(db);
            send(res, 200, { orderId: body.orderId, trackingStatus: body.trackingStatus });
            return;
          }
        }
      }
    }

    notFound(res);
  } catch (error) {
    send(res, 400, { error: error.message || 'Bad Request' });
  }
}

function start(customPort = port) {
  const server = http.createServer(handleApiRequest);
  server.listen(customPort, () => {
    console.log(`Guramrit Restro & Cafe backend running on http://localhost:${customPort}`);
  });
  return server;
}

if (require.main === module) {
  start();
}

module.exports = {
  handleApiRequest,
  start,
};
