/* ── Joka Hotel · shared frontend ── */

/* ════ i18n ════ */
const LANG = {
  en: {
    dashboard:'Dashboard', pos:'Point of Sale', kitchen:'Kitchen',
    inventory:'Inventory', admin:'Admin Panel', logout:'Logout',
    revenue:'Revenue', orders:'Orders', weekly:'Weekly', monthly:'Monthly',
    yearly:'Yearly', total:'Total', addItem:'Add Item', save:'Save',
    cancel:'Cancel', confirm:'Confirm', delete:'Delete', search:'Search',
    loading:'Loading…', noData:'No data', error:'Error',
    welcome:'Welcome back', signIn:'Sign In', username:'Username',
    password:'Password', role:'Role', name:'Name', status:'Status',
    date:'Date', amount:'Amount', table:'Table', note:'Note',
    category:'Category', price:'Price', qty:'Quantity', unit:'Unit',
    minStock:'Min Stock', costPerUnit:'Cost/Unit',
    pending:'Pending', completed:'Completed', ready:'Ready',
    food:'Food', bar:'Bar', allCategories:'All',
    newOrder:'New Order', placeOrder:'Place Order', clearCart:'Clear Cart',
    orderTotal:'Order Total', tableNumber:'Table #', orderNote:'Note',
    markReady:'Mark Ready', markComplete:'Complete',
    exportExcel:'Export Excel', exportJSON:'Export JSON', exportCSV:'Export CSV',
    addUser:'Add User', manageUsers:'Manage Users', auditLog:'Audit Log',
    totalRevenue:'Total Revenue', lowStock:'Low Stock', stockOk:'In Stock',
    menuManagement:'Menu', addMenuItem:'Add Item',
    cashierPerformance:'Cashier Performance', revenueChart:'Revenue Chart',
    guestMenu:'Guest Menu', ourMenu:'Our Menu',
    orderSuccess:'Order placed!', loginFailed:'Invalid credentials',
    accessDenied:'Access denied', confirmDelete:'Delete this item?',
    itemAdded:'Added to cart', orderCompleted:'Order completed',
    kitchenReady:'Marked as ready', userCreated:'User created',
    userDeleted:'User deleted', inventoryUpdated:'Inventory updated',
    menuItemAdded:'Menu item added', cashier:'Cashier', guest:'Guest',
    removeItem:'Remove Stock',
    chef:'Chef',
  },
  am: {
    dashboard:'ዳሽቦርድ', pos:'የሽያጭ ቦታ', kitchen:'ኩሽና',
    inventory:'መጋዘን', admin:'አስተዳዳሪ', logout:'ውጣ',
    revenue:'ገቢ', orders:'ትዕዛዞች', weekly:'ሳምንታዊ', monthly:'ወርሃዊ',
    yearly:'ዓመታዊ', total:'ጠቅላላ', addItem:'ዕቃ ጨምር', save:'አስቀምጥ',
    cancel:'ሰርዝ', confirm:'አረጋግጥ', delete:'ሰርዝ', search:'ፈልግ',
    loading:'በመጫን ላይ…', noData:'ምንም ውሂብ የለም', error:'ስህተት',
    welcome:'እንኳን ደህና መጡ', signIn:'ግባ', username:'የተጠቃሚ ስም',
    password:'የይለፍ ቃል', role:'ሚና', name:'ስም', status:'ሁኔታ',
    date:'ቀን', amount:'መጠን', table:'ጠረጴዛ', note:'ማስታወሻ',
    category:'ምድብ', price:'ዋጋ', qty:'ብዛት', unit:'ክፍል',
    minStock:'ዝቅተኛ ክምችት', costPerUnit:'ዋጋ/ክፍል',
    pending:'በመጠባበቅ', completed:'ተጠናቋል', ready:'ዝግጁ',
    food:'ምግብ', bar:'መጠጥ', allCategories:'ሁሉም',
    newOrder:'አዲስ ትዕዛዝ', placeOrder:'ትዕዛዝ ላክ', clearCart:'ጋሪ አጽዳ',
    orderTotal:'ጠቅላላ ዋጋ', tableNumber:'ጠረጴዛ ቁጥር', orderNote:'ማስታወሻ',
    markReady:'ዝግጁ ምልክት', markComplete:'ተጠናቋል',
    exportExcel:'ኤክሴል አውርድ', exportJSON:'JSON አውርድ', exportCSV:'CSV አውርድ',
    addUser:'ተጠቃሚ ጨምር', manageUsers:'ተጠቃሚዎች', auditLog:'ኦዲት',
    totalRevenue:'ጠቅላላ ገቢ', lowStock:'ዝቅተኛ ክምችት', stockOk:'ክምችት አለ',
    menuManagement:'ምናሌ', addMenuItem:'ዕቃ ጨምር',
    cashierPerformance:'የካሸር አፈጻጸም', revenueChart:'የገቢ ቻርት',
    guestMenu:'የእንግዳ ምናሌ', ourMenu:'ምናሌያችን',
    orderSuccess:'ትዕዛዙ ተልኳል!', loginFailed:'የተሳሳተ ምስክርነት',
    accessDenied:'ፈቃድ የለዎትም', confirmDelete:'ይህን ለመሰረዝ እርግጠኛ ነዎት?',
    itemAdded:'ወደ ጋሪ ተጨምሯል', orderCompleted:'ትዕዛዙ ተጠናቋል',
    kitchenReady:'ዝግጁ ሆኗል', userCreated:'ተጠቃሚ ተፈጥሯል',
    userDeleted:'ተጠቃሚ ተሰርዟል', inventoryUpdated:'መጋዘን ተዘምኗል',
    menuItemAdded:'ዕቃ ተጨምሯል', cashier:'ካሸር', guest:'እንግዳ',
    removeItem:'ዕቃ አስወግድ', chef:'ሼፍ',
  }
};

let currentLang = localStorage.getItem('lang') || 'am';
const t = k => (LANG[currentLang]||LANG.en)[k] || (LANG.en)[k] || k;

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.documentElement.lang = lang;
}

/* ════ Auth ════ */
const Auth = {
  token:    ()  => localStorage.getItem('joka_token'),
  user:     ()  => { try { return JSON.parse(localStorage.getItem('joka_user')); } catch { return null; } },
  loggedIn: ()  => !!localStorage.getItem('joka_token'),
  save:     (token, user) => {
    // clear any old keys from previous versions
    ['token','role','username','user'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('joka_token', token);
    localStorage.setItem('joka_user', JSON.stringify(user));
  },
  logout:   ()  => {
    ['joka_token','joka_user','token','role','username','user'].forEach(k => localStorage.removeItem(k));
    location.href = 'index.html';
  },
  require:  (roles) => {
    const u = Auth.user();
    if (!u || !Auth.token()) { location.href = 'index.html'; return false; }
    if (roles && !roles.includes(u.role)) { location.href = roleHome(u.role); return false; }
    return true;
  }
};

function roleHome(role) {
  return role === 'admin'   ? 'dashboard.html'
       : role === 'cashier' ? 'pos.html'
       : role === 'kitchen' ? 'kitchen.html'
       : role === 'chef'    ? 'kitchen.html'
       : 'index.html';
}

/* ════ API ════ */
async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  const tok = Auth.token();
  if (tok) opts.headers['Authorization'] = 'Bearer ' + tok;
  if (body !== undefined) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(url, opts);
    if (res.status === 401) { Auth.logout(); return null; }
    return res;
  } catch (e) {
    toast('Network error: ' + e.message, 'error');
    return null;
  }
}

/* ════ Toast ════ */
function toast(msg, type = 'info') {
  let c = document.getElementById('toast-container');
  if (!c) { c = Object.assign(document.createElement('div'), { id: 'toast-container' }); document.body.appendChild(c); }
  const el = Object.assign(document.createElement('div'), { className: `toast ${type}`, textContent: msg });
  c.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

/* ════ Modal ════ */
const openModal  = id => document.getElementById(id)?.classList.add('open');
const closeModal = id => document.getElementById(id)?.classList.remove('open');

/* ════ Sidebar ════ */
function buildSidebar(active) {
  const u = Auth.user();
  if (!u) return;
  const el = document.getElementById('sidebar');
  if (!el) return;

  const nav = {
    admin:   [['dashboard','📊','dashboard.html'],['pos','🛒','pos.html'],['kitchen','🍳','kitchen.html'],['inventory','📦','inventory.html'],['admin','⚙️','admin.html']],
    cashier: [['pos','🛒','pos.html'],['kitchen','🍳','kitchen.html']],
    kitchen: [['kitchen','🍳','kitchen.html']],
    chef:    [['kitchen','👨‍🍳','kitchen.html'],['inventory','📦','inventory.html']]
  };

  el.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-mark">J</div>
      <h2>Joka Hotel</h2>
      <span>${t(u.role)}</span>
    </div>
    <nav class="sidebar-nav">
      ${(nav[u.role]||[]).map(([page,icon,href]) => `
        <a href="${href}" class="nav-item ${active===page?'active':''}">
          <span class="icon">${icon}</span>
          <span data-i18n="${page}">${t(page)}</span>
        </a>`).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar">${(u.name||u.username)[0].toUpperCase()}</div>
        <div><div class="name">${u.name||u.username}</div><div class="role">${t(u.role)}</div></div>
      </div>
      <button class="btn btn-ghost btn-full btn-sm" onclick="Auth.logout()">🚪 <span data-i18n="logout">${t('logout')}</span></button>
    </div>`;
}

/* ════ Topbar ════ */
function buildTopbar(titleKey) {
  const el = document.getElementById('topbar');
  if (!el) return;
  el.innerHTML = `
    <h1 data-i18n="${titleKey}">${t(titleKey)}</h1>
    <div class="topbar-right">
      <div class="lang-toggle">
        <button class="lang-btn ${currentLang==='am'?'active':''}" data-lang="am" onclick="setLang('am')">አማ</button>
        <button class="lang-btn ${currentLang==='en'?'active':''}" data-lang="en" onclick="setLang('en')">EN</button>
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => setLang(currentLang));
