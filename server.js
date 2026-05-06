const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const XLSX    = require('xlsx');
const path    = require('path');
const fs      = require('fs');

const app     = express();
const PORT    = process.env.PORT || 3000;
const SECRET  = process.env.JWT_SECRET || 'joka2026_secret_xK9mP3qR7vN2wL5jT8';
const DB_PATH = path.join(__dirname, 'db.json');

app.use(express.json({ limit: '10kb' }));

/* ── DB helpers ── */
const readDB  = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const writeDB = d  => fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2));
const uid     = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ── Audit ── */
function log(user, action, detail) {
  try {
    const db = readDB();
    if (!Array.isArray(db.auditLog)) db.auditLog = [];
    db.auditLog.unshift({ id: uid(), user, action, detail, ts: new Date().toISOString() });
    if (db.auditLog.length > 500) db.auditLog.length = 500;
    writeDB(db);
  } catch (_) {}
}

/* ── Auth middleware ── */
// Roles: admin | cashier | kitchen | chef | guest(no token)
function auth(...roles) {
  return (req, res, next) => {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer '))
      return res.status(401).json({ ok: false, msg: 'Unauthorized' });
    try {
      const u = jwt.verify(h.slice(7), SECRET);
      if (roles.length && !roles.includes(u.role))
        return res.status(403).json({ ok: false, msg: 'Forbidden' });
      req.user = u;
      next();
    } catch {
      res.status(401).json({ ok: false, msg: 'Token invalid or expired' });
    }
  };
}

/* ══════════════════════════════════════
   LOGIN
══════════════════════════════════════ */
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password)
      return res.status(400).json({ ok: false, msg: 'Username and password required' });

    const db   = readDB();
    const user = db.users.find(u => u.username === String(username).trim());
    if (!user) {
      log(username, 'LOGIN_FAIL', 'user not found');
      return res.status(401).json({ ok: false, msg: 'Invalid username or password' });
    }
    const match = await bcrypt.compare(String(password), user.password);
    if (!match) {
      log(username, 'LOGIN_FAIL', 'wrong password');
      return res.status(401).json({ ok: false, msg: 'Invalid username or password' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      SECRET, { expiresIn: '10h' }
    );
    log(user.username, 'LOGIN', user.role);
    res.json({ ok: true, token, role: user.role, name: user.name, username: user.username });
  } catch (e) {
    console.error('Login error:', e.message);
    res.status(500).json({ ok: false, msg: 'Server error' });
  }
});

/* ══════════════════════════════════════
   MENU  (public read, admin write)
══════════════════════════════════════ */
app.get('/api/menu', (req, res) => {
  try { res.json(readDB().menuItems || []); }
  catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

app.post('/api/menu', auth('admin'), (req, res) => {
  try {
    const { name, amharicName, price, category, description } = req.body;
    if (!name || !price || !['Food', 'Bar'].includes(category))
      return res.status(400).json({ ok: false, msg: 'name, price, category required' });
    const db   = readDB();
    const item = { id: uid(), name: String(name).slice(0,100), amharicName: amharicName||'',
                   price: +price, category, description: description||'' };
    db.menuItems.push(item);
    writeDB(db);
    log(req.user.username, 'ADD_MENU', name);
    res.json({ ok: true, item });
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

app.delete('/api/menu/:id', auth('admin'), (req, res) => {
  try {
    const db  = readDB();
    const idx = db.menuItems.findIndex(m => m.id === req.params.id);
    if (idx < 0) return res.status(404).json({ ok: false, msg: 'Not found' });
    const [r] = db.menuItems.splice(idx, 1);
    writeDB(db);
    log(req.user.username, 'DEL_MENU', r.name);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

/* ══════════════════════════════════════
   ORDERS
══════════════════════════════════════ */
function buildItems(db, items) {
  const built = [];
  for (const it of items) {
    const m = db.menuItems.find(x => x.id === it.menuId);
    if (!m) return { ok: false, msg: `Unknown item: ${it.menuId}` };
    built.push({ menuId: m.id, name: m.name, amharicName: m.amharicName||'',
                 price: m.price, qty: Math.max(1, +it.qty||1), category: m.category });
  }
  return { ok: true, items: built };
}

function makeOrder(items, tableNumber, note, cashier, cashierName) {
  const total   = items.reduce((s, i) => s + i.price * i.qty, 0);
  const hasFood = items.some(i => i.category === 'Food');
  return {
    id: uid(), items, total,
    tableNumber: tableNumber ? +tableNumber : null,
    note: note ? String(note).slice(0, 200) : '',
    cashier, cashierName,
    status: 'pending',
    kitchenStatus: hasFood ? 'pending' : 'na',
    createdAt: new Date().toISOString(),
    completedAt: null
  };
}

// Staff order
app.post('/api/orders', auth('cashier', 'admin'), (req, res) => {
  try {
    const { items, tableNumber, note } = req.body || {};
    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ ok: false, msg: 'items array required' });
    const db    = readDB();
    const built = buildItems(db, items);
    if (!built.ok) return res.status(400).json({ ok: false, msg: built.msg });
    const order = makeOrder(built.items, tableNumber, note, req.user.username, req.user.name);
    db.orders.push(order);
    writeDB(db);
    log(req.user.username, 'NEW_ORDER', `${order.id} ${order.total}ETB`);
    res.json({ ok: true, order });
  } catch (e) {
    console.error('Order error:', e.message);
    res.status(500).json({ ok: false, msg: 'Server error' });
  }
});

// Guest order (no token)
app.post('/api/orders/guest', (req, res) => {
  try {
    const { items, tableNumber, note, guestName } = req.body || {};
    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ ok: false, msg: 'items array required' });
    const db    = readDB();
    const built = buildItems(db, items);
    if (!built.ok) return res.status(400).json({ ok: false, msg: built.msg });
    const name  = guestName ? String(guestName).slice(0, 60) : 'Guest';
    const order = makeOrder(built.items, tableNumber, note, 'guest', name);
    order.isGuest = true;
    db.orders.push(order);
    writeDB(db);
    log('guest', 'GUEST_ORDER', `${order.id} ${order.total}ETB table=${tableNumber||'-'}`);
    res.json({ ok: true, order });
  } catch (e) {
    console.error('Guest order error:', e.message);
    res.status(500).json({ ok: false, msg: 'Server error' });
  }
});

app.get('/api/orders', auth('admin', 'cashier'), (req, res) => {
  try {
    let list = [...readDB().orders].reverse();
    if (req.query.date)   list = list.filter(o => o.createdAt.startsWith(req.query.date));
    if (req.query.status) list = list.filter(o => o.status === req.query.status);
    res.json(list.slice(0, 300));
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

// Kitchen + Chef see pending food orders
app.get('/api/orders/pending', auth('kitchen', 'chef', 'admin', 'cashier'), (req, res) => {
  try {
    const orders = readDB().orders.filter(o =>
      o.kitchenStatus === 'pending' || o.kitchenStatus === 'ready'
    );
    res.json(orders);
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

// Chef can mark order as ready (cooking done)
app.patch('/api/orders/:id/kitchen', auth('kitchen', 'chef', 'admin'), (req, res) => {
  try {
    const db = readDB();
    const o  = db.orders.find(x => x.id === req.params.id);
    if (!o) return res.status(404).json({ ok: false, msg: 'Not found' });
    o.kitchenStatus = 'ready';
    writeDB(db);
    log(req.user.username, 'KITCHEN_READY', o.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

app.patch('/api/orders/:id/complete', auth('cashier', 'admin'), (req, res) => {
  try {
    const db = readDB();
    const o  = db.orders.find(x => x.id === req.params.id);
    if (!o) return res.status(404).json({ ok: false, msg: 'Not found' });
    o.status = 'completed';
    o.completedAt = new Date().toISOString();
    writeDB(db);
    log(req.user.username, 'ORDER_DONE', `${o.id} ${o.total}ETB`);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

/* ══════════════════════════════════════
   INVENTORY
   chef: read + remove (use ingredients)
   admin: full CRUD
══════════════════════════════════════ */
app.get('/api/inventory', auth('admin', 'cashier', 'kitchen', 'chef'), (req, res) => {
  try { res.json(readDB().inventory); }
  catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

app.post('/api/inventory', auth('admin'), (req, res) => {
  try {
    const { materialName, amharicName, quantity, unit, minThreshold, costPerUnit } = req.body;
    if (!materialName || quantity == null || !unit || minThreshold == null || costPerUnit == null)
      return res.status(400).json({ ok: false, msg: 'All fields required' });
    const db   = readDB();
    const item = { id: uid(), materialName: String(materialName).slice(0,100),
                   amharicName: amharicName||'', quantity: +quantity,
                   unit: String(unit).slice(0,20), minThreshold: +minThreshold,
                   costPerUnit: +costPerUnit, updatedAt: new Date().toISOString() };
    db.inventory.push(item);
    writeDB(db);
    log(req.user.username, 'ADD_INV', materialName);
    res.json({ ok: true, item });
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

app.post('/api/inventory/remove', auth('admin', 'kitchen', 'chef'), (req, res) => {
  try {
    const { id, amount } = req.body;
    if (!id || !amount || +amount <= 0)
      return res.status(400).json({ ok: false, msg: 'id and positive amount required' });
    const db   = readDB();
    const item = db.inventory.find(i => i.id === id);
    if (!item) return res.status(404).json({ ok: false, msg: 'Not found' });
    if (item.quantity < +amount) return res.status(400).json({ ok: false, msg: 'Insufficient stock' });
    item.quantity  = +(item.quantity - +amount).toFixed(3);
    item.updatedAt = new Date().toISOString();
    writeDB(db);
    log(req.user.username, 'REMOVE_INV', `${amount} ${item.unit} ${item.materialName}`);
    res.json({ ok: true, item });
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

app.delete('/api/inventory/:id', auth('admin'), (req, res) => {
  try {
    const db  = readDB();
    const idx = db.inventory.findIndex(i => i.id === req.params.id);
    if (idx < 0) return res.status(404).json({ ok: false, msg: 'Not found' });
    const [r] = db.inventory.splice(idx, 1);
    writeDB(db);
    log(req.user.username, 'DEL_INV', r.materialName);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

/* ══════════════════════════════════════
   REPORTS
══════════════════════════════════════ */
app.get('/api/reports/revenue', auth('admin'), (req, res) => {
  try {
    const db   = readDB();
    const done = db.orders.filter(o => o.status === 'completed');
    const now  = Date.now();
    const sum  = arr => arr.reduce((s, o) => s + (o.total||0), 0);
    const weekly  = sum(done.filter(o => now - new Date(o.createdAt) <= 7  * 864e5));
    const monthly = sum(done.filter(o => now - new Date(o.createdAt) <= 30 * 864e5));
    const yearly  = sum(done.filter(o => now - new Date(o.createdAt) <= 365* 864e5));
    const total   = sum(done);
    const daily   = {};
    done.filter(o => now - new Date(o.createdAt) <= 30 * 864e5).forEach(o => {
      const d = o.createdAt.slice(0, 10);
      daily[d] = (daily[d]||0) + o.total;
    });
    res.json({
      weekly, monthly, yearly, total, daily,
      foodRevenue: sum(done.filter(o => o.items?.some(i => i.category === 'Food'))),
      barRevenue:  sum(done.filter(o => o.items?.some(i => i.category === 'Bar'))),
      orderCount: done.length
    });
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

app.get('/api/reports/cashiers', auth('admin'), (req, res) => {
  try {
    const done = readDB().orders.filter(o => o.status === 'completed');
    const map  = {};
    done.forEach(o => {
      map[o.cashier] = map[o.cashier] || { name: o.cashierName||o.cashier, total:0, count:0 };
      map[o.cashier].total += o.total;
      map[o.cashier].count++;
    });
    res.json(Object.values(map));
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

/* ══════════════════════════════════════
   USERS
══════════════════════════════════════ */
app.get('/api/users', auth('admin'), (req, res) => {
  try {
    res.json(readDB().users.map(u => ({ id:u.id, username:u.username, role:u.role, name:u.name })));
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

app.post('/api/users', auth('admin'), async (req, res) => {
  try {
    const { username, password, role, name } = req.body;
    if (!username || !password || !role || !name)
      return res.status(400).json({ ok: false, msg: 'All fields required' });
    if (!['admin','cashier','kitchen','chef'].includes(role))
      return res.status(400).json({ ok: false, msg: 'Invalid role' });
    if (String(password).length < 6)
      return res.status(400).json({ ok: false, msg: 'Password min 6 characters' });
    const db = readDB();
    if (db.users.find(u => u.username === username))
      return res.status(409).json({ ok: false, msg: 'Username already taken' });
    const user = { id: uid(), username: String(username).slice(0,30), role,
                   name: String(name).slice(0,60), password: await bcrypt.hash(password, 10) };
    db.users.push(user);
    writeDB(db);
    log(req.user.username, 'CREATE_USER', `${username}(${role})`);
    res.json({ ok: true, user: { id:user.id, username, role, name } });
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

app.delete('/api/users/:id', auth('admin'), (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ ok: false, msg: 'Cannot delete yourself' });
    const db  = readDB();
    const idx = db.users.findIndex(u => u.id === req.params.id);
    if (idx < 0) return res.status(404).json({ ok: false, msg: 'Not found' });
    const [r] = db.users.splice(idx, 1);
    writeDB(db);
    log(req.user.username, 'DEL_USER', r.username);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

/* ══════════════════════════════════════
   AUDIT
══════════════════════════════════════ */
app.get('/api/audit', auth('admin'), (req, res) => {
  try { res.json((readDB().auditLog||[]).slice(0, 100)); }
  catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

/* ══════════════════════════════════════
   EXPORT
══════════════════════════════════════ */
app.get('/api/export/excel', auth('admin'), (req, res) => {
  try {
    const db = readDB();
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      db.orders.map(o => ({ ID:o.id, Cashier:o.cashier, Total:o.total, Status:o.status, Table:o.tableNumber||'-', Date:o.createdAt }))
    ), 'Orders');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      db.inventory.map(i => ({ Material:i.materialName, Qty:i.quantity, Unit:i.unit, Min:i.minThreshold, Cost:i.costPerUnit }))
    ), 'Inventory');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
      db.users.map(u => ({ Username:u.username, Role:u.role, Name:u.name }))
    ), 'Users');
    const buf = XLSX.write(wb, { type:'buffer', bookType:'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="joka_${Date.now()}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    log(req.user.username, 'EXPORT_EXCEL', '');
    res.send(buf);
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

app.get('/api/export/csv', auth('admin'), (req, res) => {
  try {
    const db  = readDB();
    const csv = ['ID,Cashier,Total,Status,Table,Date',
      ...db.orders.map(o => `${o.id},${o.cashier},${o.total},${o.status},${o.tableNumber||'-'},${o.createdAt}`)
    ].join('\n');
    res.setHeader('Content-Disposition', `attachment; filename="joka_orders_${Date.now()}.csv"`);
    res.setHeader('Content-Type', 'text/csv');
    log(req.user.username, 'EXPORT_CSV', '');
    res.send(csv);
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

app.get('/api/export/json', auth('admin'), (req, res) => {
  try {
    const db = readDB();
    res.setHeader('Content-Disposition', `attachment; filename="joka_${Date.now()}.json"`);
    log(req.user.username, 'EXPORT_JSON', '');
    res.json({ orders:db.orders, inventory:db.inventory, exportedAt:new Date().toISOString() });
  } catch (e) { res.status(500).json({ ok: false, msg: 'Server error' }); }
});

/* ── Static (must be last) ── */
app.use(express.static(path.join(__dirname, 'public')));

app.listen(3000, () => console.log('🚀  Joka Hotel: http://localhost:3000'));
