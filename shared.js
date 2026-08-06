/* ============================================================
   ROMEO PERSONAL TRAINER — Shared JS v2.0
   ============================================================ */

// Auto-limpieza forzada de Service Worker viejo en celulares para cargar v80
(async function autoPurgeOldSWOnMobile() {
  const CURRENT_VER = 'v80_clean';
  if (localStorage.getItem('romeo_sw_purge_ver') !== CURRENT_VER) {
    localStorage.setItem('romeo_sw_purge_ver', CURRENT_VER);
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (let r of regs) {
          await r.unregister();
        }
      }
    } catch(e) {}
    window.location.reload();
  }
})();

// ===================== DATABASE =====================
let DB = {
  usuarios:  [],
  rutinas:   [],
  progresos: [],
  sesiones:  [],
  packs:     [],
};

// ── Claves que se persisten en archivo ──
const DB_KEYS = [
  'romeo_db', 'gym_active_user', 'romeo_current_active_user_id',
  'romeo_recetas_custom', 'romeo_cats_custom',
  'romeo_custom_exercises', 'romeo_custom_groups'
];

// ===================== SUPABASE CLOUD SYNC 24/7 =====================
const DEFAULT_SUPABASE_URL = 'https://dtpgfcsolapzudlcgsol.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_RJdwK2VdnTLeqq3s0hwysQ_6v1_xqXK';

const SupabaseSync = (() => {
  function getConfig() {
    return {
      url: (localStorage.getItem('romeo_supabase_url') || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, ''),
      key: (localStorage.getItem('romeo_supabase_key') || DEFAULT_SUPABASE_KEY).trim()
    };
  }

  function setConfig(url, key) {
    localStorage.setItem('romeo_supabase_url', (url || '').trim().replace(/\/+$/, ''));
    localStorage.setItem('romeo_supabase_key', (key || '').trim());
    updateDotStatus();
  }

  function isConfigured() {
    const { url, key } = getConfig();
    return Boolean(url && key);
  }

  function getHeaders() {
    const { key } = getConfig();
    return {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`
    };
  }

  async function fetchCloudData() {
    if (!isConfigured()) return null;
    const { url } = getConfig();
    try {
      const resp = await fetch(`${url}/rest/v1/romeo_store?id=eq.romeo_db&select=*`, {
        method: 'GET',
        headers: getHeaders()
      });
      if (!resp.ok) {
        console.warn('[SupabaseSync] fetch error:', resp.status, resp.statusText);
        return null;
      }
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0 && data[0].content) {
        return {
          content: data[0].content,
          updated_at: data[0].updated_at
        };
      }
      return null;
    } catch (e) {
      console.warn('[SupabaseSync] fetchCloudData failed:', e);
      return null;
    }
  }

  async function saveCloudData(dbContent) {
    if (!isConfigured()) return false;
    const { url } = getConfig();
    try {
      const payload = [{
        id: 'romeo_db',
        content: dbContent,
        updated_at: new Date().toISOString()
      }];
      const resp = await fetch(`${url}/rest/v1/romeo_store`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        updateDotStatus(true);
        return true;
      } else {
        console.warn('[SupabaseSync] saveCloudData status:', resp.status, await resp.text());
        updateDotStatus(false);
        return false;
      }
    } catch (e) {
      console.warn('[SupabaseSync] saveCloudData error:', e);
      updateDotStatus(false);
      return false;
    }
  }

  async function sync() {
    if (!isConfigured()) return;
    const cloud = await fetchCloudData();
    if (cloud && cloud.content && typeof cloud.content === 'object') {
      const cloudDB = cloud.content;
      const cloudUsers = Array.isArray(cloudDB.usuarios) ? cloudDB.usuarios.length : 0;
      const localUsers = Array.isArray(DB.usuarios) ? DB.usuarios.length : 0;

      if (cloudUsers > localUsers) {
        // Cloud has more data -> update local
        DB.usuarios = cloudDB.usuarios || [];
        DB.rutinas = cloudDB.rutinas || [];
        DB.progresos = cloudDB.progresos || [];
        DB.sesiones = cloudDB.sesiones || [];
        DB.packs = cloudDB.packs || [];
        try { localStorage.setItem('romeo_db', JSON.stringify(DB)); } catch(e){}
        await PersistDB.set('romeo_db', DB);
        window.dispatchEvent(new Event('romeo_db_loaded'));
      } else if (localUsers > cloudUsers || (localUsers > 0 && cloudUsers === 0)) {
        // Local has more data -> upload local DB to Supabase
        await saveCloudData(DB);
      }
    } else {
      // If cloud table is empty but we have local DB, auto upload local DB
      if (DB && (DB.usuarios.length > 0 || DB.rutinas.length > 0)) {
        await saveCloudData(DB);
      }
    }
    updateDotStatus(true);
  }

  function updateDotStatus(online = isConfigured()) {
    const dot = document.getElementById('supabase-status-dot');
    if (dot) {
      dot.style.background = isConfigured() ? (online ? '#00E5A0' : '#FF7043') : '#777';
    }
  }

  return {
    getConfig,
    setConfig,
    isConfigured,
    fetchCloudData,
    saveCloudData,
    sync,
    updateDotStatus
  };
})();

function loadDB() {
  try {
    const s = localStorage.getItem('romeo_db');
    if (s) {
      const parsed = JSON.parse(s);
      if (parsed && typeof parsed === 'object') {
        DB.usuarios = parsed.usuarios || [];
        DB.rutinas = parsed.rutinas || [];
        DB.progresos = parsed.progresos || [];
        DB.sesiones = parsed.sesiones || [];
        DB.packs = parsed.packs || [];
      }
    }
  } catch(e) {}
  try {
    if (!DB.usuarios.length && !DB.rutinas.length) {
      const old = localStorage.getItem('gymproDB');
      if (old) {
        const o = JSON.parse(old);
        DB.usuarios = o.usuarios || [];
        DB.rutinas = o.rutinas || [];
        DB.progresos = o.progresos || [];
        DB.sesiones = o.sesiones || [];
        DB.packs = o.packs || [];
      }
    }
  } catch(e) {}
  if (!DB.sesiones) DB.sesiones = [];
  if (!DB.packs) DB.packs = [];

  // Async sync with Supabase Cloud 24/7
  if (typeof SupabaseSync !== 'undefined' && SupabaseSync.isConfigured()) {
    setTimeout(() => { SupabaseSync.sync(); }, 300);
  }
}
loadDB();

async function saveDB() {
  try {
    localStorage.setItem('romeo_db', JSON.stringify(DB));
  } catch(e) {
    console.warn('[saveDB] LocalStorage save warning:', e);
  }
  await PersistDB.set('romeo_db', DB);
  window.dispatchEvent(new Event('romeo_db_loaded'));

  if (typeof SupabaseSync !== 'undefined' && SupabaseSync.isConfigured()) {
    SupabaseSync.saveCloudData(DB);
  }
}

function getDB() { return DB; }

function getActiveUser() {
  try {
    const s = localStorage.getItem('gym_active_user');
    if (s) { const u = JSON.parse(s); const dbUser = DB.usuarios.find(x => x.id === u.id); if (dbUser) return dbUser; }
  } catch(e) {}
  try {
    const uid = localStorage.getItem('romeo_current_active_user_id');
    if (uid) { const dbUser = DB.usuarios.find(x => x.id === uid); if (dbUser) return dbUser; }
  } catch(e) {}
  return DB.usuarios[0] || null;
}

async function setActiveUser(u) {
  localStorage.setItem('gym_active_user', JSON.stringify(u));
  await PersistDB.set('gym_active_user', u);
}

// ===================== UTILITIES =====================
function getFotoInicial(uObj, angle) {
  if (!uObj) return '';
  if (angle === 'Frente') return uObj.fotoIniFrente || uObj.fotoFrente || uObj.foto || uObj.avatar || '';
  if (angle === 'Perfil') return uObj.fotoIniPerfil || uObj.fotoPerfil || '';
  if (angle === 'Espalda') return uObj.fotoIniEspalda || uObj.fotoEspalda || '';
  return '';
}

function getFotoFinal(uObj, angle) {
  if (!uObj) return '';
  if (angle === 'Frente') return uObj.fotoFinFrente || uObj.fotoFin || uObj.fotoIniFrente || uObj.fotoFrente || uObj.foto || uObj.avatar || '';
  if (angle === 'Perfil') return uObj.fotoFinPerfil || uObj.fotoIniPerfil || uObj.fotoPerfil || '';
  if (angle === 'Espalda') return uObj.fotoFinEspalda || uObj.fotoIniEspalda || uObj.fotoEspalda || '';
  return '';
}
let _id = Date.now();
function genId() { return (++_id).toString(36); }

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3200);
}

function confirmModal(options) {
  return new Promise((resolve) => {
    const existing = document.getElementById('custom-confirm-modal');
    if (existing) existing.remove();

    const title = options.title || '¿Estás seguro?';
    const message = options.message || '';
    const confirmText = options.confirmText || 'Aceptar';
    const cancelText = options.cancelText || 'Cancelar';
    const isDanger = options.isDanger || false;

    const overlay = document.createElement('div');
    overlay.id = 'custom-confirm-modal';
    overlay.className = 'modal-overlay active';
    overlay.style.cssText = 'display:flex; align-items:center; justify-content:center; z-index:10000; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px);';

    overlay.innerHTML = `
      <div class="modal" style="max-width:420px; width:90vw; padding:24px; text-align:center; border-radius:18px; background:linear-gradient(135deg, #1c1c1c, #242424); border:1px solid rgba(255,255,255,0.12); box-shadow:0 16px 48px rgba(0,0,0,0.8);">
        <div style="font-size:38px; margin-bottom:12px;">${isDanger ? '🗑️' : '⚡'}</div>
        <h3 style="margin:0 0 8px; font-size:18px; color:#fff; font-weight:700;">${title}</h3>
        <p style="margin:0 0 24px; font-size:13px; color:#aaa; line-height:1.5;">${message}</p>
        <div style="display:flex; gap:12px; justify-content:center;">
          <button id="confirm-modal-cancel" class="btn-secondary" style="flex:1; padding:10px 16px; font-size:13px; border-radius:10px; cursor:pointer;">${cancelText}</button>
          <button id="confirm-modal-ok" class="btn-primary" style="flex:1; padding:10px 16px; font-size:13px; border-radius:10px; font-weight:700; cursor:pointer; ${isDanger ? 'background:linear-gradient(135deg,#FF3366,#CC0033);' : 'background:linear-gradient(135deg,#FF3CAC,#784BA0);'}">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cleanup = () => { overlay.remove(); };

    document.getElementById('confirm-modal-cancel').onclick = () => {
      cleanup();
      if (options.onCancel) options.onCancel();
      resolve(false);
    };

    document.getElementById('confirm-modal-ok').onclick = () => {
      cleanup();
      if (options.onConfirm) options.onConfirm();
      resolve(true);
    };
  });
}

function formatDate(d) {
  if (!d) return '—';
  try {
    const dStr = String(d).trim();
    const dateObj = new Date(dStr.includes('T') ? dStr : dStr + 'T00:00:00');
    if (isNaN(dateObj.getTime())) return '—';
    return dateObj.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
  } catch(e) {
    return '—';
  }
}

function avatarClass(name) {
  const c = ['av-0','av-1','av-2','av-3','av-4','av-5'];
  let code = 0; for (let ch of name) code += ch.charCodeAt(0);
  return c[code % c.length];
}

function initials(name) { return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); }

function badgeClass(nivel) {
  return { Principiante:'badge-green', Intermedio:'badge-blue', Avanzado:'badge-pink' }[nivel] || 'badge-green';
}

function bmi(peso, est) {
  if (!peso || !est) return '—';
  return (peso / ((est/100)**2)).toFixed(1);
}

function bmiCategory(b) {
  const v = parseFloat(b);
  if (isNaN(v)) return '';
  if (v < 18.5) return 'Bajo peso';
  if (v < 25)   return 'Normal';
  if (v < 30)   return 'Sobrepeso';
  return 'Obesidad';
}

// ===================== COMPUTED STATS =====================
function calcRevenue() {
  return (DB.usuarios || []).reduce((sum, u) => sum + (parseFloat(u.tarifa) || 0), 0);
}

function calcCompletitudPromedio() {
  if (!DB.usuarios || !DB.usuarios.length) return 0;
  const total = DB.usuarios.reduce((sum, u) => sum + calcCompletitudUsuario(u.id), 0);
  return Math.round(total / DB.usuarios.length);
}

function calcCompletitudUsuario(uid) {
  const sesiones = (DB.sesiones || []).filter(s => s && s.usuarioId === uid);
  if (!sesiones.length) return 0;
  const completadas = sesiones.filter(s => s.estado === 'completada').length;
  return Math.round((completadas / sesiones.length) * 100);
}

function sesionesHoy() {
  const hoy = new Date().toISOString().split('T')[0];
  return (DB.sesiones || []).filter(s => s && s.fecha === hoy).sort((a,b) => (a.hora || '').localeCompare(b.hora || ''));
}

function volumenSemanal() {
  const weeks = [];
  for (let i = 3; i >= 0; i--) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - (i * 7 + 6));
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    endOfWeek.setHours(23,59,59,999);

    const label = `Sem ${4-i}`;
    
    let vol = 0;
    const completedInWeek = (DB.sesiones || []).filter(s => {
      if (!s || s.estado !== 'completada' || !s.fecha) return false;
      const d = new Date(s.fecha + 'T12:00:00');
      return d >= startOfWeek && d <= endOfWeek;
    });

    if (completedInWeek.length > 0) {
      vol = completedInWeek.reduce((sum, s) => sum + (parseFloat(s.volumenKg) || 0), 0);
    } else {
      vol = (DB.rutinas || []).reduce((sum, r) => {
        if (!r || !Array.isArray(r.ejercicios)) return sum;
        return sum + r.ejercicios.reduce((s2, ej) => {
          if (!ej) return s2;
          const seriesStr = typeof ej.series === 'string' ? ej.series : '';
          const sets = parseInt(seriesStr.split('×')[0]) || parseInt(seriesStr.split('x')[0]) || 3;
          const reps = parseInt(seriesStr.split('×')[1]) || parseInt(seriesStr.split('x')[1]) || 10;
          const peso = parseFloat(ej.peso) || 0;
          return s2 + sets * reps * peso;
        }, 0);
      }, 0);
    }
    weeks.push({ label, vol: Math.round(vol) });
  }
  return weeks;
}

function descargarBackup() {
  try {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(DB, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `romeo_pt_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('📥 Respaldo descargado con éxito', 'success');
  } catch(e) {
    showToast('⚠️ Error al generar el respaldo', 'error');
  }
}

function cargarBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed && typeof parsed === 'object') {
        DB.usuarios = Array.isArray(parsed.usuarios) ? parsed.usuarios : DB.usuarios;
        DB.rutinas = Array.isArray(parsed.rutinas) ? parsed.rutinas : DB.rutinas;
        DB.progresos = Array.isArray(parsed.progresos) ? parsed.progresos : DB.progresos;
        DB.sesiones = Array.isArray(parsed.sesiones) ? parsed.sesiones : DB.sesiones;
        DB.packs = Array.isArray(parsed.packs) ? parsed.packs : DB.packs;
        await saveDB();
        showToast('📤 Respaldo restaurado correctamente. Recargando...', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showToast('⚠️ Archivo de respaldo no válido', 'error');
      }
    } catch(err) {
      showToast('⚠️ Error al leer el archivo JSON', 'error');
    }
  };
  reader.readAsText(file);
}

// ===================== SIDEBAR =====================
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (sb) sb.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  const sb = document.getElementById('sidebar');
  const btn = document.querySelector('.menu-toggle');
  if (sb && window.innerWidth <= 1024 && !sb.contains(e.target) && btn && !btn.contains(e.target)) {
    sb.classList.remove('open');
  }
});

function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('active'); document.body.style.overflow = 'hidden'; }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { 
    el.classList.remove('active'); 
    el.style.display = ''; 
    document.body.style.overflow = ''; 
  }
}

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
});

function buildSidebar(activePage) {
  const pages = [
    { id:'dashboard',     href:'index.html',          label:'Dashboard',    icon:`<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>` },
    { id:'usuarios',      href:'usuarios.html',        label:'Clientes',     icon:`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>` },
    { id:'rutinas',       href:'rutinas.html',         label:'Rutinas',      icon:`<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` },
    { id:'entrenamiento', href:'entrenamiento.html',   label:'Entrenamiento',icon:`<polyline points="13 2 13 9 20 9"/><path d="M20 9L13 2"/><path d="M4 16h16"/>` },
    { id:'progreso',      href:'progreso.html',        label:'Progreso',     icon:`<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>` },
    { id:'recetas',       href:'recetas.html',         label:'Nutrición',    icon:`<path d="M12 2a10 10 0 1 0 10 10H12V2z"/>` },
    { id:'macros',        href:'macros.html',          label:'Macros',       icon:`<circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10H12z"/>` },
    { id:'creditos',      href:'creditos.html',        label:'Acerca de',    icon:`<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>` },
  ];

  const badges = {
    dashboard: '',
    usuarios: DB.usuarios.length > 0 ? `<span style="margin-left:auto;background:rgba(255,60,172,0.15);color:#FF3CAC;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">${DB.usuarios.length}</span>` : '',
    entrenamiento: sesionesHoy().length > 0 ? `<span style="margin-left:auto;background:rgba(0,229,160,0.15);color:#00E5A0;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">${sesionesHoy().length}</span>` : '',
  };

  return `
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <img src="1.jpeg" alt="Romeo Personal Trainer" class="sidebar-logo-img" />
    </div>
    <nav class="sidebar-nav">
      ${pages.map(p => `
        <a href="${p.href}" class="nav-item ${activePage === p.id ? 'active' : ''}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${p.icon}</svg>
          <span>${p.label}</span>
          ${badges[p.id] || ''}
        </a>`).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="avatar-sm">R</div>
        <div>
          <div class="sidebar-username">Romeo</div>
          <div class="sidebar-role">Personal Trainer</div>
        </div>
      </div>
    </div>
  </aside>`;
}

function buildTopbar(title, actionsHtml = '') {
  const activeUser = getActiveUser();
  const optionsHtml = DB.usuarios.map(u => `
    <option value="${u.id}" ${activeUser && activeUser.id === u.id ? 'selected' : ''}>
      ${u.nombre}
    </option>
  `).join('');

  const clientSelector = DB.usuarios.length > 0 ? `
    <div class="topbar-client-selector">
      <label for="global-client-select">👤 Cliente:</label>
      <select id="global-client-select" onchange="handleGlobalClientChange(this.value)">
        ${optionsHtml}
      </select>
    </div>
  ` : '';

  const cloudStatusDot = typeof SupabaseSync !== 'undefined' && SupabaseSync.isConfigured() ? '#00E5A0' : '#777';

  return `
  <header class="topbar">
    <button class="menu-toggle" onclick="toggleSidebar()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <div class="topbar-title">${title}</div>
    <div style="display:flex; align-items:center; gap:8px; margin-left:auto;">
      ${clientSelector}
      <button type="button" onclick="exportDatabaseJSON()" class="btn-ghost" style="padding:6px 10px; font-size:12px; border:1px solid var(--border); border-radius:8px; display:flex; align-items:center; gap:4px;" title="Descargar Copia de Seguridad JSON">
        📦 Backup
      </button>
      <button type="button" onclick="abrirModalSupabase()" class="btn-ghost" style="padding:6px 10px; font-size:12px; border:1px solid var(--border); border-radius:8px; display:flex; align-items:center; gap:5px;" title="Base de Datos 24/7 en la Nube Supabase">
        ☁️ Nube <span id="supabase-status-dot" style="width:8px;height:8px;border-radius:50%;background:${cloudStatusDot};display:inline-block;"></span>
      </button>
      <button type="button" onclick="forzarActualizacionPWA()" class="btn-ghost" style="padding:6px 10px; font-size:12px; border:1px solid var(--border); border-radius:8px; display:flex; align-items:center; gap:4px;" title="Forzar actualización de PWA en celulares/tablets">
        ⚡ Actualizar
      </button>
      <div class="topbar-actions">${actionsHtml}</div>
    </div>
  </header>`;
}

function buildBottomNav(activePage = 'dashboard') {
  const pages = [
    { id:'dashboard',     href:'index.html',           label:'Inicio',       icon:`<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>` },
    { id:'usuarios',      href:'usuarios.html',        label:'Clientes',     icon:`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>` },
    { id:'rutinas',       href:'rutinas.html',         label:'Rutinas',      icon:`<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>` },
    { id:'entrenamiento', href:'entrenamiento.html',   label:'Entrenar',     icon:`<polyline points="13 2 13 9 20 9"/><path d="M20 9L13 2"/><path d="M4 16h16"/>` },
    { id:'progreso',      href:'progreso.html',        label:'Progreso',     icon:`<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>` },
    { id:'creditos',      href:'creditos.html',        label:'Sistema',      icon:`<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>` },
  ];

  return `
  <nav class="bottom-nav">
    ${pages.map(p => `
      <a href="${p.href}" class="bottom-nav-item ${activePage === p.id ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${p.icon}</svg>
        <span>${p.label}</span>
      </a>
    `).join('')}
  </nav>`;
}

function exportDatabaseJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(DB, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `romeo_pt_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  if (typeof showToast === 'function') showToast('📦 Copia de seguridad exportada en JSON', 'success');
}

function importDatabaseJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      if (!importedData || typeof importedData !== 'object') {
        throw new Error('Formato JSON inválido');
      }

      if (importedData.usuarios && Array.isArray(importedData.usuarios)) DB.usuarios = importedData.usuarios;
      if (importedData.rutinas && Array.isArray(importedData.rutinas)) DB.rutinas = importedData.rutinas;
      if (importedData.progresos && Array.isArray(importedData.progresos)) DB.progresos = importedData.progresos;
      if (importedData.sesiones && Array.isArray(importedData.sesiones)) DB.sesiones = importedData.sesiones;
      if (importedData.packs && Array.isArray(importedData.packs)) DB.packs = importedData.packs;

      try { localStorage.setItem('romeo_db', JSON.stringify(DB)); } catch(err){}

      if (typeof SupabaseSync !== 'undefined' && SupabaseSync.isConfigured()) {
        try {
          await SupabaseSync.syncAll();
        } catch(syncErr) {}
      }

      window.dispatchEvent(new Event('romeo_db_loaded'));
      if (typeof showToast === 'function') showToast('✅ Copia de seguridad restaurada exitosamente', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 600);

    } catch (err) {
      alert('Error al leer el archivo de backup: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function abrirModalBackupDB() {
  let modal = document.getElementById('modal-backup-db');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'modal-backup-db';
  modal.className = 'modal-overlay active';
  modal.style.zIndex = '10000';
  modal.innerHTML = `
    <div class="modal" style="max-width:480px; width:92%; background:var(--bg-card); border:1px solid var(--border); border-radius:18px; padding:24px; color:#fff;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h3 style="margin:0; font-size:16px; font-weight:800;">📦 Copia de Seguridad & Datos</h3>
        <button onclick="document.getElementById('modal-backup-db').remove()" style="background:none; border:none; color:var(--text-muted); font-size:20px; cursor:pointer;">&times;</button>
      </div>
      <div style="font-size:12px; color:var(--text-muted); line-height:1.5; margin-bottom:16px;">
        Exporta una copia completa de tus datos o restáurala desde un archivo JSON descargado previamente.
      </div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <button class="btn-primary" onclick="exportDatabaseJSON()" style="width:100%; justify-content:center; padding:12px;">
          📥 Descargar Copia JSON (Exportar)
        </button>
        <label class="btn-secondary" style="width:100%; display:flex; justify-content:center; align-items:center; padding:12px; cursor:pointer; margin:0;">
          📤 Restaurar / Importar Archivo JSON
          <input type="file" accept=".json" onchange="importDatabaseJSON(event)" style="display:none;" />
        </label>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

// ===================== SUPABASE MODAL & UI FUNCTIONS =====================
function abrirModalSupabase() {
  let modal = document.getElementById('modal-supabase-config');
  if (modal) modal.remove();

  const cfg = SupabaseSync.getConfig();
  const isOk = SupabaseSync.isConfigured();

  modal = document.createElement('div');
  modal.id = 'modal-supabase-config';
  modal.className = 'modal-overlay active';
  modal.style.zIndex = '10000';
  modal.innerHTML = `
    <div class="modal modal-lg" style="max-width:680px; width:92%; background:#0c0f17; border:2px solid #3ECF8E; border-radius:18px; color:#FFF; padding:24px; box-shadow:0 25px 70px rgba(0,0,0,0.95); overflow-y:auto; max-height:90vh;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid rgba(62,207,142,0.25); padding-bottom:12px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:26px;">☁️</span>
          <div>
            <h3 style="margin:0; font-size:17px; color:#3ECF8E; font-weight:900; letter-spacing:0.5px;">BASE DE DATOS EN LA NUBE 24/7 (SUPABASE)</h3>
            <span style="font-size:11px; color:#AAA;">Tus datos nunca se pierden y se sincronizan en cualquier celular/tablet/PC</span>
          </div>
        </div>
        <button type="button" onclick="closeModal('modal-supabase-config')" class="btn-secondary" style="padding:6px 12px; font-size:12px;">✕ Cerrar</button>
      </div>

      <div style="margin-bottom:18px; background:rgba(62,207,142,0.06); border:1px solid rgba(62,207,142,0.2); border-radius:10px; padding:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:12px; font-weight:700; color:#FFF;">Estado de la Conexión Nube:</span>
          <span class="badge ${isOk ? 'badge-green' : 'badge-orange'}" style="font-size:11px; padding:4px 10px;">${isOk ? '🟢 Conectado 24/7' : '🔴 Sin Configurar'}</span>
        </div>
        <p style="margin:0; font-size:11px; color:#BBB; line-height:1.4;">
          Al guardar tu URL y Key anon de Supabase, la aplicación sincronizará automáticamente todos los datos en la nube sin necesidad de tener tu computadora encendida.
        </p>
      </div>

      <div class="form-grid" style="grid-template-columns:1fr; gap:14px; margin-bottom:20px;">
        <div class="form-group" style="padding:0;">
          <label style="color:#3ECF8E; font-weight:800; font-size:12px;">1. Project URL de Supabase *</label>
          <input type="text" id="sb-input-url" value="${cfg.url}" placeholder="https://xxxxxxxx.supabase.co" style="background:#161b26; border:1px solid rgba(255,255,255,0.15); color:#FFF; font-family:monospace; font-size:12px;" />
        </div>

        <div class="form-group" style="padding:0;">
          <label style="color:#3ECF8E; font-weight:800; font-size:12px;">2. Anon Public API Key *</label>
          <input type="text" id="sb-input-key" value="${cfg.key}" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." style="background:#161b26; border:1px solid rgba(255,255,255,0.15); color:#FFF; font-family:monospace; font-size:11px;" />
        </div>
      </div>

      <!-- SQL instructions accordion/panel -->
      <details style="margin-bottom:20px; background:#121620; border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:12px;">
        <summary style="font-size:12px; font-weight:800; color:#FFD700; cursor:pointer;">📖 Instrucciones: Crear la tabla en Supabase (Solo 1 vez)</summary>
        <div style="margin-top:10px; font-size:11px; color:#CCC; line-height:1.5;">
          1. Ve a tu panel de <a href="https://supabase.com/dashboard" target="_blank" style="color:#3ECF8E; text-decoration:underline;">Supabase Dashboard</a>.<br/>
          2. Entra a <strong>SQL Editor</strong> en el menú lateral.<br/>
          3. Pega y ejecuta el siguiente código SQL:
          <pre style="background:#000; color:#00E5A0; padding:10px; border-radius:6px; overflow-x:auto; font-size:11px; margin-top:8px; user-select:all;">create table if not exists public.romeo_store (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz default now()
);
alter table public.romeo_store enable row level security;
create policy "Acceso Publico" on public.romeo_store for all using (true) with check (true);</pre>
        </div>
      </details>

      <div style="display:flex; flex-direction:column; gap:10px;">
        <button type="button" onclick="guardarConfigSupabase()" class="btn-primary" style="background:linear-gradient(135deg, #3ECF8E, #00A86B); color:#000; font-weight:900; padding:12px; border:none; border-radius:10px; font-size:13px; cursor:pointer;">
          ⚡ Probar Conexión y Guardar
        </button>

        <div style="display:flex; gap:10px; margin-top:4px;">
          <button type="button" onclick="subirDatosSupabase()" class="btn-secondary" style="flex:1; padding:10px; font-size:12px; border-color:rgba(62,207,142,0.4); color:#3ECF8E;">
            ⬆️ Subir Datos Locales a la Nube
          </button>
          <button type="button" onclick="descargarDatosSupabase()" class="btn-secondary" style="flex:1; padding:10px; font-size:12px; border-color:rgba(255,215,0,0.4); color:#FFD700;">
            ⬇️ Descargar Datos de la Nube
          </button>
        </div>

        ${isOk ? `<button type="button" onclick="desconectarSupabase()" class="btn-ghost btn-danger" style="margin-top:8px; padding:8px; font-size:11px;">🗑️ Desconectar Nube Supabase</button>` : ''}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function guardarConfigSupabase() {
  const url = document.getElementById('sb-input-url').value.trim();
  const key = document.getElementById('sb-input-key').value.trim();

  if (!url || !key) {
    showToast('Ingresa la URL y la Key de Supabase', 'error');
    return;
  }

  SupabaseSync.setConfig(url, key);
  showToast('⚡ Probando conexión con Supabase...', 'info');

  const ok = await SupabaseSync.saveCloudData(DB);
  if (ok) {
    showToast('✅ ¡Conectado con éxito a Supabase 24/7!', 'success');
    closeModal('modal-supabase-config');
  } else {
    showToast('⚠️ No se pudo conectar a la tabla "romeo_store". Revisa el SQL de las instrucciones.', 'error');
  }
}

async function subirDatosSupabase() {
  if (!SupabaseSync.isConfigured()) { showToast('Configura Supabase primero', 'error'); return; }
  showToast('⬆️ Subiendo datos a Supabase...', 'info');
  const ok = await SupabaseSync.saveCloudData(DB);
  if (ok) showToast('✅ Datos locales subidos a la nube Supabase', 'success');
  else showToast('⚠️ Error al subir datos a Supabase', 'error');
}

async function descargarDatosSupabase() {
  if (!SupabaseSync.isConfigured()) { showToast('Configura Supabase primero', 'error'); return; }
  showToast('⬇️ Consultando Supabase...', 'info');
  const cloud = await SupabaseSync.fetchCloudData();
  if (cloud && cloud.content) {
    DB.usuarios = cloud.content.usuarios || [];
    DB.rutinas = cloud.content.rutinas || [];
    DB.progresos = cloud.content.progresos || [];
    DB.sesiones = cloud.content.sesiones || [];
    DB.packs = cloud.content.packs || [];
    await saveDB();
    showToast('✅ Datos descargados de la nube Supabase', 'success');
    closeModal('modal-supabase-config');
  } else {
    showToast('⚠️ No se encontraron datos en la nube Supabase', 'error');
  }
}

function desconectarSupabase() {
  localStorage.removeItem('romeo_supabase_url');
  localStorage.removeItem('romeo_supabase_key');
  SupabaseSync.updateDotStatus(false);
  showToast('Nube Supabase desconectada', 'info');
  closeModal('modal-supabase-config');
}

function handleGlobalClientChange(uid) {
  const u = DB.usuarios.find(x => x.id === uid);
  if (u) {
    localStorage.setItem('gym_active_user', JSON.stringify(u));
    // Sincronizar selectores locales en páginas
    const localSel = document.getElementById('sel-usuario');
    if (localSel) {
      localSel.value = uid;
      if (typeof onUsuarioChange === 'function') {
        onUsuarioChange();
      }
    }
    // Disparar eventos
    window.dispatchEvent(new Event('gym_active_user_changed'));
    window.dispatchEvent(new Event('gym_diario_actualizado'));
    showToast(`Cliente activo: ${u.nombre}`, 'info');
    // Si no estamos en una página con selector local, recargar para actualizar widgets
    if (!localSel) {
      setTimeout(() => window.location.reload(), 400);
    }
  }
}

function buildToast() { return `<div class="toast" id="toast"></div>`; }

// ===================== RECETAS DATA =====================
const RECETAS = [
  { id:1,  nombre:'Bowl de Arroz con Pollo',         categoria:'proteina',      emoji:'🍗', desc:'Arroz integral, pechuga de pollo, brócoli y aguacate. Perfecto post-entreno.',       proteina:'45g', carbs:'55g', grasas:'12g', kcal:'510', tag:'Alta Proteína' },
  { id:2,  nombre:'Batido de Proteína Banana',       categoria:'proteina',      emoji:'🍌', desc:'Banana, proteína en polvo, leche de almendras y mantequilla de maní.',               proteina:'30g', carbs:'40g', grasas:'8g',  kcal:'350', tag:'Alta Proteína' },
  { id:3,  nombre:'Avena Pre-Entreno',               categoria:'carbohidratos', emoji:'🥣', desc:'Avena con frutas, miel y nueces. Energía perfecta para tu sesión.',                  proteina:'12g', carbs:'65g', grasas:'10g', kcal:'400', tag:'Pre-Entreno' },
  { id:4,  nombre:'Tostadas con Huevo y Aguacate',  categoria:'carbohidratos', emoji:'🍳', desc:'Pan integral, huevos revueltos y aguacate. Ideal antes de entrenar.',                 proteina:'20g', carbs:'35g', grasas:'18g', kcal:'380', tag:'Pre-Entreno' },
  { id:5,  nombre:'Salmón con Vegetales al Vapor',  categoria:'recuperacion',  emoji:'🐟', desc:'Filete de salmón con espinacas y camote. Rico en Omega-3 para recuperación.',        proteina:'38g', carbs:'30g', grasas:'20g', kcal:'460', tag:'Recuperación' },
  { id:6,  nombre:'Batido Verde Recuperador',       categoria:'recuperacion',  emoji:'💚', desc:'Espinaca, piña, jengibre, proteína y leche de coco. Anti-inflamatorio.',             proteina:'25g', carbs:'35g', grasas:'7g',  kcal:'300', tag:'Recuperación' },
  { id:7,  nombre:'Huevos Duros con Almendras',     categoria:'snack',         emoji:'🥚', desc:'Snack perfecto entre comidas. 2 huevos duros y almendras tostadas sin sal.',         proteina:'18g', carbs:'6g',  grasas:'20g', kcal:'270', tag:'Snack' },
  { id:8,  nombre:'Yogur Griego con Berries',       categoria:'snack',         emoji:'🫐', desc:'Yogur griego natural con arándanos, fresas y granola artesanal.',                    proteina:'18g', carbs:'28g', grasas:'4g',  kcal:'220', tag:'Snack' },
  { id:9,  nombre:'Ensalada de Atún y Garbanzos',  categoria:'proteina',      emoji:'🥗', desc:'Atún, garbanzos, tomate, pepino, limón y aceite de oliva extra virgen.',             proteina:'35g', carbs:'32g', grasas:'8g',  kcal:'340', tag:'Alta Proteína' },
  { id:10, nombre:'Pasta Integral con Pavo',        categoria:'carbohidratos', emoji:'🍝', desc:'Pasta integral con carne molida de pavo y salsa de tomate casera.',                  proteina:'32g', carbs:'60g', grasas:'10g', kcal:'460', tag:'Pre-Entreno' },
  { id:11, nombre:'Caldo de Res con Verduras',      categoria:'recuperacion',  emoji:'🍲', desc:'Caldo rico en colágeno. Ideal para articulaciones y músculos tras el entreno.',      proteina:'28g', carbs:'18g', grasas:'9g',  kcal:'270', tag:'Recuperación' },
  { id:12, nombre:'Manzana con Mantequilla de Maní',categoria:'snack',         emoji:'🍎', desc:'Manzana con mantequilla de maní natural. Energía sostenida entre comidas.',          proteina:'8g',  carbs:'30g', grasas:'14g', kcal:'270', tag:'Snack' },
  { id:13, nombre:'Batido Proteico de Chocolate y Maní', categoria:'batidos',      emoji:'🥤', desc:'Proteína de chocolate, mantequilla de maní, banana y chía. Ideal para ganar masa.', proteina:'35g', carbs:'45g', grasas:'15g', kcal:'450', tag:'Batidos' },
  { id:14, nombre:'Batido Verde Antioxidante',         categoria:'batidos',      emoji:'🥬', desc:'Espinaca, manzana verde, piña, jengibre y agua de coco. Depurativo y vitamínico.',  proteina:'3g',  carbs:'35g', grasas:'1g',  kcal:'160', tag:'Batidos' },
  { id:15, nombre:'Batido Energético de Avena y Fresa', categoria:'batidos',      emoji:'🍓', desc:'Avena en hojuelas, fresas frescas, leche descremada y un toque de miel natural.',    proteina:'10g', carbs:'52g', grasas:'4g',  kcal:'280', tag:'Batidos' },
  { id:16, nombre:'Batido de Arándanos y Yogur Griego', categoria:'batidos',      emoji:'🫐', desc:'Arándanos antioxidantes, yogur griego descremado y linaza para digestión óptima.', proteina:'18g', carbs:'26g', grasas:'5g',  kcal:'220', tag:'Batidos' },
  { id:17, nombre:'Batido Keto de Aguacate y Coco',    categoria:'batidos',      emoji:'🥑', desc:'Aguacate, leche de coco, espinaca y stevia. Alto en grasas saludables y bajo en carbos.', proteina:'8g',  carbs:'12g', grasas:'28g', kcal:'330', tag:'Batidos' },
  { id:18, nombre:'Batido Saciante de Manzana y Canela', categoria:'batidos',      emoji:'🍎', desc:'Manzana, avena, yogur griego, canela y nuez moscada. Controla la ansiedad.',        proteina:'6g',  carbs:'38g', grasas:'5g',  kcal:'210', tag:'Batidos' },
  { id:19, nombre:'Batido Tropical de Piña y Mango',   categoria:'batidos',      emoji:'🍍', desc:'Piña, mango, jugo de naranja y yogur natural. Aporte de vitamina C y energía.',     proteina:'4g',  carbs:'48g', grasas:'1g',  kcal:'200', tag:'Batidos' },
  { id:20, nombre:'Batido Quemagrasas de Toronja',     categoria:'batidos',      emoji:'🍊', desc:'Toronja, jengibre, apio y piña. Acelera el metabolismo y la quema calórica.',       proteina:'2g',  carbs:'28g', grasas:'0g',  kcal:'120', tag:'Batidos' },
  { id:21, nombre:'Batido de Proteína Moca y Café',    categoria:'batidos',      emoji:'☕', desc:'Café expreso, scoop de proteína de chocolate y leche de almendras. Activador pre-entreno.', proteina:'28g', carbs:'30g', grasas:'6g',  kcal:'280', tag:'Batidos' },
  { id:22, nombre:'Batido Recuperador de Sandía',      categoria:'batidos',      emoji:'🍉', desc:'Sandía, menta y agua de coco. Ideal para hidratación extrema post-entrenamiento.',  proteina:'3g',  carbs:'24g', grasas:'1g',  kcal:'110', tag:'Batidos' },
  { id:23, nombre:'Batido de Avena, Almendras y Miel', categoria:'batidos',      emoji:'🌾', desc:'Avena, mantequilla de almendras, leche descremada y miel. Excelente snack saciante.', proteina:'9g',  carbs:'48g', grasas:'12g', kcal:'320', tag:'Batidos' },
  { id:24, nombre:'Batido de Espinacas y Kiwi',        categoria:'batidos',      emoji:'🥝', desc:'Espinacas, kiwi, manzana verde y semillas de chía. Altamente depurativo.',          proteina:'4g',  carbs:'32g', grasas:'1g',  kcal:'150', tag:'Batidos' },
  { id:25, nombre:'Batido Proteico de Vainilla y Nueces', categoria:'batidos',     emoji:'🥜', desc:'Proteína de vainilla, nueces picadas, plátano y leche descremada. Fuerza muscular.', proteina:'30g', carbs:'34g', grasas:'14g', kcal:'380', tag:'Batidos' },
  { id:26, nombre:'Batido de Dátiles y Avena',         categoria:'batidos',      emoji:'🌴', desc:'Dátiles, avena en hojuelas, leche de almendras y canela. Dulzor natural energético.', proteina:'6g',  carbs:'58g', grasas:'4g',  kcal:'290', tag:'Batidos' },
  { id:27, nombre:'Batido Detox de Apio y Pepino',     categoria:'batidos',      emoji:'🥒', desc:'Apio, pepino, limón, manzana y agua. Bajo en calorías y muy diurético.',             proteina:'2g',  carbs:'18g', grasas:'0g',  kcal:'80',  tag:'Batidos' },
  { id:28, nombre:'Batido de Papaya y Linaza',         categoria:'batidos',      emoji:'🥭', desc:'Papaya, semillas de linaza y yogur natural. Excelente para la salud digestiva.',    proteina:'5g',  carbs:'36g', grasas:'6g',  kcal:'210', tag:'Batidos' },
  { id:29, nombre:'Batido de Zanahoria y Naranja',     categoria:'batidos',      emoji:'🥕', desc:'Zanahoria, naranja, jengibre y agua de coco. Fortalece el sistema inmune.',          proteina:'3g',  carbs:'34g', grasas:'1g',  kcal:'150', tag:'Batidos' },
  { id:30, nombre:'Batido de Melón y Limón',           categoria:'batidos',      emoji:'🍈', desc:'Melón dulce, zumo de limón y agua de coco. Altamente hidratante y refrescante.',     proteina:'2g',  carbs:'22g', grasas:'0g',  kcal:'90',  tag:'Batidos' },
  { id:31, nombre:'Batido Proteico de Fresa y Requesón', categoria:'batidos',     emoji:'🍧', desc:'Fresas, requesón bajo en grasa, leche y stevia. Cremosidad alta en proteína.',       proteina:'26g', carbs:'28g', grasas:'5g',  kcal:'260', tag:'Batidos' },
  { id:32, nombre:'Batido Superverde de Espirulina',   categoria:'batidos',      emoji:'🧪', desc:'Espirulina, espinaca, plátano y leche vegetal. Superalimento energizante.',          proteina:'8g',  carbs:'22g', grasas:'2g',  kcal:'130', tag:'Batidos' },
  { id:33, nombre:'Batido de Coco y Almendras',        categoria:'batidos',      emoji:'🥥', desc:'Leche de coco, almendras enteras, proteína de vainilla y hielo. Delicia cremosa.',   proteina:'7g',  carbs:'24g', grasas:'16g', kcal:'270', tag:'Batidos' },
  { id:34, nombre:'Batido de Melocotón y Yogur',       categoria:'batidos',      emoji:'🍑', desc:'Melocotón en rodajas, yogur griego natural, leche y un toque de vainilla.',         proteina:'12g', carbs:'38g', grasas:'3g',  kcal:'220', tag:'Batidos' },
  { id:35, nombre:'Batido de Té Verde y Limón',        categoria:'batidos',      emoji:'🍵', desc:'Té verde frío, zumo de limón, menta y una cdta de miel. Antioxidante quemagrasa.',   proteina:'2g',  carbs:'16g', grasas:'0g',  kcal:'70',  tag:'Batidos' },
  { id:36, nombre:'Batido de Chía y Frutos Rojos',     categoria:'batidos',      emoji:'🍒', desc:'Semillas de chía, frutos rojos variados, leche de avena y estevia.',                 proteina:'8g',  carbs:'32g', grasas:'8g',  kcal:'230', tag:'Batidos' },
  { id:37, nombre:'Batido Termogénico de Té Matcha',   categoria:'batidos',      emoji:'🍵', desc:'Matcha, plátano, espinaca y leche de almendras. Energía sostenida y enfoque.',        proteina:'6g',  carbs:'20g', grasas:'3g',  kcal:'130', tag:'Batidos' },
  { id:38, nombre:'Batido Hidratante de Pepino y Menta', categoria:'batidos',     emoji:'🥤', desc:'Pepino, menta fresca, limón y agua de coco. Refrescante e hidratante.',              proteina:'2g',  carbs:'14g', grasas:'0g',  kcal:'60',  tag:'Batidos' },
  { id:39, nombre:'Batido Proteico Vegano de Arveja',  categoria:'batidos',      emoji:'🌱', desc:'Proteína de arveja aislada, leche de soja, plátano y cacao puro.',                  proteina:'25g', carbs:'22g', grasas:'4g',  kcal:'220', tag:'Batidos' },
  { id:40, nombre:'Batido de Calabaza y Especias',     categoria:'batidos',      emoji:'🎃', desc:'Puré de calabaza, avena, leche de almendras, canela y nuez moscada.',                proteina:'8g',  carbs:'42g', grasas:'6g',  kcal:'250', tag:'Batidos' },
  { id:41, nombre:'Batido Nutritivo de Higos y Nueces', categoria:'batidos',      emoji:'🍇', desc:'Higos frescos, nueces picadas, yogur natural y leche. Alto en fibra y potasio.',     proteina:'8g',  carbs:'48g', grasas:'12g', kcal:'310', tag:'Batidos' },
  { id:42, nombre:'Batido de Avena y Cacao',           categoria:'batidos',      emoji:'🍫', desc:'Avena, cacao en polvo sin azúcar, leche descremada y edulcorante natural.',          proteina:'10g', carbs:'46g', grasas:'6g',  kcal:'270', tag:'Batidos' }
];

function getCatGradient(cat) {
  return { proteina:'linear-gradient(135deg,#FF3CAC,#784BA0)', carbohidratos:'linear-gradient(135deg,#FF7043,#FFD600)', recuperacion:'linear-gradient(135deg,#00E5A0,#00A8FF)', snack:'linear-gradient(135deg,#FF4E8A,#FF7043)', batidos:'linear-gradient(135deg,#784BA0,#2B86C5)' }[cat] || 'linear-gradient(135deg,#FF3CAC,#2B86C5)';
}

// ===================== MOTIVATIONAL QUOTES =====================
const QUOTES = [
  { text: "El único mal entrenamiento es el que no hiciste.", author: "Desconocido" },
  { text: "No cuentes los días, haz que los días cuenten.", author: "Muhammad Ali" },
  { text: "Tu cuerpo puede hacerlo. Es tu mente la que tienes que convencer.", author: "Desconocido" },
  { text: "El dolor que sientes hoy es la fuerza que sentirás mañana.", author: "Arnold Schwarzenegger" },
  { text: "La disciplina es el puente entre metas y logros.", author: "Jim Rohn" },
  { text: "Cada rep te hace más fuerte. Cada sesión te cambia.", author: "Romeo PT" },
  { text: "El éxito empieza antes de entrar al gimnasio.", author: "Desconocido" },
  { text: "Entrena duro, come limpio, descansa bien. Repite.", author: "Romeo PT" },
];

function getQuoteOfDay() {
  const d = new Date().getDate();
  return QUOTES[d % QUOTES.length];
}

// ===================== IMAGE UTILITIES & WEBCAM =====================
function compressImage(file, maxWidth, maxHeight, quality, callback) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
      } else {
        if (h > maxHeight) { w = Math.round((w * maxHeight) / h); h = maxHeight; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', quality));
    };
  };
}

let webcamStream = null;

function openWebcamModal(onCapture) {
  // Remover modal existente si lo hay
  closeWebcamModal();

  const modal = document.createElement('div');
  modal.id = 'webcam-modal-container';
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal webcam-modal">
      <div class="modal-header">
        <h2>Tomar Foto</h2>
        <button class="modal-close" onclick="closeWebcamModal()">✕</button>
      </div>
      <div class="webcam-preview-container">
        <video id="webcam-video" autoplay playsinline></video>
        <div class="webcam-overlay-guide">Alinea al cliente</div>
      </div>
      <div class="modal-footer" style="justify-content: space-between;">
        <button type="button" class="btn-secondary" id="webcam-switch-btn" style="display:none; padding: 8px 12px; font-size: 13px;">🔄 Girar Cámara</button>
        <div style="display:flex; gap: 8px; margin-left: auto;">
          <button type="button" class="btn-secondary" onclick="closeWebcamModal()">Cancelar</button>
          <button type="button" class="btn-primary" id="webcam-capture-btn">📸 Capturar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const video = document.getElementById('webcam-video');
  const captureBtn = document.getElementById('webcam-capture-btn');
  const switchBtn = document.getElementById('webcam-switch-btn');

  let currentFacingMode = 'environment';
  let devices = [];

  async function startStream(facingMode) {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
    }
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };
      webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = webcamStream;
    } catch (err) {
      console.error("Error al iniciar webcam, reintentando con valores por defecto...", err);
      try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = webcamStream;
      } catch (err2) {
        showToast("No se pudo acceder a la cámara", "error");
        closeWebcamModal();
      }
    }
  }

  // Detectar múltiples cámaras
  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    navigator.mediaDevices.enumerateDevices().then(devs => {
      devices = devs.filter(d => d.kind === 'videoinput');
      if (devices.length > 1) {
        switchBtn.style.display = 'block';
      }
    });
  }

  switchBtn.onclick = () => {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    startStream(currentFacingMode);
  };

  captureBtn.onclick = () => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6); // Comprimir en JPEG calidad 0.6
    onCapture(dataUrl);
    closeWebcamModal();
  };

  startStream(currentFacingMode);
}

function closeWebcamModal() {
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcamStream = null;
  }
  const modal = document.getElementById('webcam-modal-container');
  if (modal) modal.remove();
}

/* ============================================================
   SELECCIÓN DE ORIGEN DE FOTOGRAFÍA (CÁMARA VS GALERÍA / DISPOSITIVO)
   ============================================================ */
function seleccionarOrigenFoto(onCamera, onGallery) {
  closeOrigenFotoModal();

  const modal = document.createElement('div');
  modal.id = 'origen-foto-modal-container';
  modal.className = 'modal-overlay active';
  modal.style.zIndex = '10000';
  modal.innerHTML = `
    <div class="modal" style="max-width: 380px; width: 92%; background: #121620; border: 1.5px solid var(--border); border-radius: 16px; padding: 22px; text-align: center; color: #fff; box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
      <div style="font-size: 16px; font-weight: 900; color: #FFF; margin-bottom: 6px; letter-spacing: 0.5px;">📷 ORIGEN DE LA FOTOGRAFÍA</div>
      <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.4;">Elige cómo deseas cargar la foto del cliente:</div>
      
      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
        <button type="button" id="btn-foto-camera" class="btn-primary" style="padding: 14px; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; background: linear-gradient(135deg, #FF3CAC, #784BA0); border: none; border-radius: 10px; color: white; cursor: pointer; box-shadow: 0 4px 15px rgba(255, 60, 172, 0.35);">
          <span style="font-size: 20px;">📸</span> Tomar Foto con Cámara
        </button>

        <button type="button" id="btn-foto-gallery" class="btn-secondary" style="padding: 14px; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; background: rgba(255, 255, 255, 0.07); border: 1.5px solid rgba(255, 255, 255, 0.2); border-radius: 10px; color: white; cursor: pointer;">
          <span style="font-size: 20px;">🖼️</span> Elegir de Galería / Archivo
        </button>
      </div>

      <button type="button" onclick="closeOrigenFotoModal()" class="btn-ghost" style="width: 100%; padding: 8px; font-size: 12px; color: var(--text-muted); font-weight: 700; cursor: pointer;">
        Cancelar
      </button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btn-foto-camera').onclick = () => {
    closeOrigenFotoModal();
    if (onCamera) onCamera();
  };

  document.getElementById('btn-foto-gallery').onclick = () => {
    closeOrigenFotoModal();
    if (onGallery) onGallery();
  };
}

function closeOrigenFotoModal() {
  const existing = document.getElementById('origen-foto-modal-container');
  if (existing) existing.remove();
}

// ===================== REGISTRO DIARIO DE CONSUMO & METAS =====================
function getHoyKey() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  return `gym_diario_consumo_${yyyy}-${mm}-${dd}`;
}

function getMacrosConsumidosHoy() {
  const u = getActiveUser();
  if (!u) return { kcal: 0, proteina: 0, carbs: 0, grasas: 0 };
  const key = getHoyKey() + '_' + u.id;
  const data = localStorage.getItem(key);
  if (!data) return { kcal: 0, proteina: 0, carbs: 0, grasas: 0 };
  try { return JSON.parse(data); } catch(e) { return { kcal: 0, proteina: 0, carbs: 0, grasas: 0 }; }
}

async function registrarConsumoReceta(kcal, proteina, carbs, grasas) {
  const u = getActiveUser();
  if (!u) return;
  const key = getHoyKey() + '_' + u.id;
  const actual = getMacrosConsumidosHoy();
  actual.kcal     += parseInt(kcal)     || 0;
  actual.proteina += parseInt(proteina) || 0;
  actual.carbs    += parseInt(carbs)    || 0;
  actual.grasas   += parseInt(grasas)   || 0;
  localStorage.setItem(key, JSON.stringify(actual));
  await PersistDB.set(key, actual);
  window.dispatchEvent(new Event('gym_diario_actualizado'));
}

async function actualizarMacrosUsuarioActivo(kcal, prot, carbs, grasas) {
  const u = getActiveUser();
  if (!u) return;
  u.macroKcal  = parseInt(kcal)   || 2000;
  u.macroProt  = parseInt(prot)   || 150;
  u.macroCarbs = parseInt(carbs)  || 200;
  u.macroGrasas= parseInt(grasas) || 70;
  const db = getDB();
  const idx = db.usuarios.findIndex(user => user.id === u.id);
  if (idx !== -1) { db.usuarios[idx] = u; await saveDB(); }
  localStorage.setItem('gym_active_user', JSON.stringify(u));
  await PersistDB.set('gym_active_user', u);
  showToast('Objetivo de macros guardado en tu perfil', 'success');
}

function mergeCollections(targetArr, sourceArr, idKey = 'id') {
  if (!Array.isArray(sourceArr)) return targetArr || [];
  if (!Array.isArray(targetArr)) return [...sourceArr];

  const map = new Map();
  for (const item of sourceArr) {
    if (item && item[idKey]) {
      map.set(item[idKey], item);
    }
  }
  for (const item of targetArr) {
    if (item && item[idKey]) {
      const existing = map.get(item[idKey]);
      if (existing) {
        map.set(item[idKey], { ...existing, ...item });
      } else {
        map.set(item[idKey], item);
      }
    }
  }
  return Array.from(map.values());
}

// ── Init ───────────────────────────────────────────────────
loadDB();

// Inicializar persistencia en archivos / IndexedDB
async function initPersist() {
  await PersistDB.init(
    async (usesFSA) => {
      hidePersistBanner();

      // Sincronizar y restaurar todas las claves principales de DB_KEYS desde IndexedDB/Archivos
      for (const key of DB_KEYS) {
        try {
          const stored = await PersistDB.get(key);
          if (stored !== null && stored !== undefined) {
            if (key === 'romeo_db' && typeof stored === 'object') {
              DB.usuarios = mergeCollections(DB.usuarios, stored.usuarios);
              DB.rutinas = mergeCollections(DB.rutinas, stored.rutinas);
              DB.progresos = mergeCollections(DB.progresos, stored.progresos);
              DB.sesiones = mergeCollections(DB.sesiones, stored.sesiones);
              DB.packs = mergeCollections(DB.packs, stored.packs);

              try { localStorage.setItem('romeo_db', JSON.stringify(DB)); } catch(e){}
              window.dispatchEvent(new Event('romeo_db_loaded'));
            } else {
              try { 
                const valStr = typeof stored === 'string' ? stored : JSON.stringify(stored);
                localStorage.setItem(key, valStr); 
              } catch(e){}
            }
          }
        } catch(e) {
          console.warn(`[initPersist] Error cargando ${key}:`, e);
        }
      }

      if (usesFSA) {
        await PersistDB.migrateFromLocalStorage(DB_KEYS);
        showPersistStatus(true);
      }
    },
    (hasExistingHandle) => {
      // Banner desactivado para evitar avisos emergentes innecesarios en móviles/web
      // showPersistBanner(hasExistingHandle);
    }
  );
}

function showPersistBanner(hasExistingHandle = false) {
  if (document.getElementById('persist-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'persist-banner';
  
  const title = hasExistingHandle ? 'Reconectar carpeta guardada' : 'Conectar carpeta de datos';
  const desc = hasExistingHandle 
    ? 'Ya vinculaste una carpeta previamente. Haz clic en Permitir para reconectarla.' 
    : 'Elige la carpeta del proyecto para que los datos se guarden aunque se borre el caché.';
  const btnText = hasExistingHandle ? '⚡ Permitir acceso' : '📂 Elegir carpeta';

  banner.innerHTML = `
    <div style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:9999;
      background:linear-gradient(135deg,#1c1c1c,#222);border:1px solid rgba(255,60,172,0.4);
      border-radius:14px;padding:16px 22px;display:flex;align-items:center;gap:14px;
      box-shadow:0 8px 32px rgba(0,0,0,0.6);max-width:92vw;">
      <span style="font-size:28px;">💾</span>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:3px;">${title}</div>
        <div style="font-size:11px;color:#9A9A9A;line-height:1.4;">${desc}</div>
      </div>
      <button id="persist-action-btn" style="background:linear-gradient(135deg,#FF3CAC,#784BA0);
        border:none;border-radius:10px;color:#fff;font-size:12px;font-weight:700;
        padding:10px 16px;cursor:pointer;white-space:nowrap;font-family:inherit;">
        ${btnText}
      </button>
      <button id="persist-skip-btn" style="background:none;border:1px solid rgba(255,255,255,0.1);
        border-radius:10px;color:#9A9A9A;font-size:11px;padding:10px 12px;
        cursor:pointer;white-space:nowrap;font-family:inherit;">Ahora no</button>
    </div>`;
  document.body.appendChild(banner);

  document.getElementById('persist-action-btn').onclick = async () => {
    if (hasExistingHandle) {
      const ok = await PersistDB.reconnectFolder();
      if (ok) {
        hidePersistBanner();
        showToast('✅ Carpeta reconectada exitosamente', 'success');
      } else {
        // Fallback a selector si falla la reconexión
        const okPick = await PersistDB.pickFolder();
        if (okPick) hidePersistBanner();
      }
    } else {
      const ok = await PersistDB.pickFolder();
      if (ok) hidePersistBanner();
      else showToast('No se eligió ninguna carpeta', 'error');
    }
  };
  document.getElementById('persist-skip-btn').onclick = () => hidePersistBanner();
}

function hidePersistBanner() {
  const b = document.getElementById('persist-banner');
  if (b) b.remove();
}

function showPersistStatus(ok) {
  // Pequeño indicador verde en la barra lateral
  const el = document.querySelector('.sidebar-role');
  if (el && ok) {
    el.innerHTML = 'Personal Trainer &nbsp;<span title="Datos guardados en archivo" style="color:#00E5A0;font-size:10px;">● archivo</span>';
  }
}

// Lanzar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPersist);
} else {
  setTimeout(initPersist, 100);
}

// Sincronizar la base de datos en tiempo real entre pestañas abiertas
window.addEventListener('storage', (e) => {
  if (e.key === 'romeo_db') {
    loadDB();
    window.dispatchEvent(new Event('romeo_db_loaded'));
  }
});

function descargarBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(DB));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "romeo_backup_" + new Date().toISOString().split('T')[0] + ".json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

function cargarBackup(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!confirm("⚠️ ADVERTENCIA: Restaurar un archivo de respaldo reemplazará TODOS tus datos actuales. ¿Estás seguro de que quieres continuar?")) {
    event.target.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data && data.usuarios && data.rutinas) {
        DB = data;
        await saveDB();
        showToast('✅ Copia de seguridad restaurada. Recargando...', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast('❌ El archivo no parece ser un respaldo válido', 'error');
      }
    } catch(err) {
      showToast('❌ Error leyendo el archivo JSON', 'error');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ============================================================
// PWA: Registro de Service Worker, Modal de Actualización & Modo Offline
// ============================================================
const CURRENT_APP_VERSION = 'v71';
let _waitingWorker = null;
let _userTriggeredUpdate = false;

// Auto-invalidación si cambió la versión instalada en este dispositivo
(async function checkAutoUpdatePWA() {
  try {
    const lastVer = localStorage.getItem('romeo_last_app_version');
    if (lastVer && lastVer !== CURRENT_APP_VERSION) {
      localStorage.setItem('romeo_last_app_version', CURRENT_APP_VERSION);
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (let r of regs) { await r.unregister(); }
      }
      const cleanUrl = window.location.pathname + '?v=' + Date.now();
      window.location.replace(cleanUrl);
    } else {
      localStorage.setItem('romeo_last_app_version', CURRENT_APP_VERSION);
    }
  } catch(e) {}
})();

async function forzarActualizacionPWA() {
  _userTriggeredUpdate = true;
  showToast('⚡ Limpiando caché y forzando actualización en celular/tablet...', 'info');
  try {
    localStorage.setItem('romeo_last_app_version', CURRENT_APP_VERSION);
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (let r of regs) {
        await r.unregister();
      }
    }
  } catch(e) {
    console.warn(e);
  }
  setTimeout(() => {
    const cleanUrl = window.location.pathname + '?v=' + Date.now();
    window.location.replace(cleanUrl);
  }, 350);
}

function mostrarModalActualizacionApp(worker) {
  _waitingWorker = worker;
  let modal = document.getElementById('modal-actualizacion-pwa');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-actualizacion-pwa';
    modal.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); max-width:440px; width:calc(100% - 32px); background:#0c0f17; border:2px solid #00E5A0; border-radius:18px; padding:18px; box-shadow:0 20px 60px rgba(0,0,0,0.95); z-index:9999999; color:#FFF; font-family:"Sora", sans-serif; box-sizing:border-box;';
    modal.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
        <div style="background:rgba(0,229,160,0.2); border:1.5px solid #00E5A0; width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0;">⚡</div>
        <div>
          <div style="font-size:14px; font-weight:900; color:#00E5A0; letter-spacing:0.5px;">¡NUEVA VERSIÓN DISPONIBLE! (${CURRENT_APP_VERSION})</div>
          <div style="font-size:11px; color:#CCC; margin-top:2px; line-height:1.3;">Optimizaciones y correcciones instaladas.</div>
        </div>
      </div>
      <div style="display:flex; gap:10px;">
        <button type="button" onclick="aplicarActualizacionApp()" class="btn-primary" style="flex:1; background:linear-gradient(135deg,#00E5A0,#00A86B); color:#000; font-weight:900; padding:12px; border:none; border-radius:10px; cursor:pointer; font-size:13px; box-shadow:0 4px 15px rgba(0,229,160,0.4); display:flex; align-items:center; justify-content:center; gap:6px;">
          ⚡ Actualizar Ahora
        </button>
        <button type="button" onclick="cerrarModalActualizacionApp()" class="btn-secondary" style="padding:12px 14px; font-size:12px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#AAA; border-radius:10px; cursor:pointer;">
          Cerrar
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'block';
}

function cerrarModalActualizacionApp() {
  const modal = document.getElementById('modal-actualizacion-pwa');
  if (modal) modal.style.display = 'none';
}

function aplicarActualizacionApp() {
  _userTriggeredUpdate = true;
  if (_waitingWorker) {
    _waitingWorker.postMessage('SKIP_WAITING');
  }
  forzarActualizacionPWA();
}

// Dynamic manifest & PWA Service Worker (skips file:// to avoid Chrome CORS error)
if (window.location.protocol !== 'file:') {
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = 'manifest.json';
    document.head.appendChild(link);
  }
}

if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    // updateViaCache: 'none' evita que el navegador guarde sw.js en caché HTTP
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then(reg => {
        console.log('[PWA] Service Worker activo y listo', reg);
        reg.update();

        // Mostrar modal de actualización si hay un worker en espera
        if (reg.waiting) {
          reg.waiting.postMessage('SKIP_WAITING');
        }

        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                installingWorker.postMessage('SKIP_WAITING');
              }
            };
          }
        };

        // Recomprobar actualizaciones al enfocar o volver a abrir la PWA en celular/tablet
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            reg.update();
          }
        });

        window.addEventListener('focus', () => {
          reg.update();
        });
      })
      .catch(err => console.warn('[PWA] Error al registrar Service Worker', err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallPwaBtn();
});

function showInstallPwaBtn() {
  const sidebar = document.querySelector('.sidebar-footer');
  if (sidebar && !document.getElementById('pwa-install-btn')) {
    const btn = document.createElement('button');
    btn.id = 'pwa-install-btn';
    btn.className = 'btn-primary';
    btn.style.cssText = 'width:100%; margin-top:8px; font-size:12px; padding:8px 10px; display:flex; align-items:center; justify-content:center; gap:6px; background:linear-gradient(135deg,#00E5A0,#00A86B); color:#000; font-weight:700; border:none; border-radius:8px; cursor:pointer;';
    btn.innerHTML = '📲 Instalar App';
    btn.onclick = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          btn.remove();
        }
        deferredPrompt = null;
      }
    };
    sidebar.appendChild(btn);
  }
}
