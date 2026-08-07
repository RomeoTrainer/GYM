/* ============================================================
   ROMEO PT — Persistencia en Archivos Locales v1.0
   Usa File System Access API para guardar datos como archivos
   .json reales en la carpeta del proyecto. Sin instalación,
   sin internet. Los datos sobreviven borrado de caché.
   ============================================================ */

const PersistDB = (() => {
  const IDB_NAME    = 'romeo_pt_fsh';
  const IDB_STORE   = 'handles';
  const HANDLE_KEY  = 'data_dir';
  const DATA_FOLDER = 'data';

  let _dirHandle  = null;
  let _rootHandle = null;
  let _ready      = false;
  let _useFSA     = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  let _onReady    = null;
  let _onNeedPerm = null;

  function openIDB() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
      req.onsuccess = e => res(e.target.result);
      req.onerror   = e => rej(e);
    });
  }

  async function idbGet(db, key) {
    return new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = e => res(e.target.result);
      req.onerror   = e => rej(e);
    });
  }

  async function idbSet(db, key, val) {
    return new Promise((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(val, key);
      tx.oncomplete = () => res();
      tx.onerror    = e => rej(e);
    });
  }

  async function getDataDir(root) {
    return await root.getDirectoryHandle(DATA_FOLDER, { create: true });
  }

  async function readFile(name) {
    if (!_dirHandle) return null;
    try {
      const fh   = await _dirHandle.getFileHandle(name + '.json');
      const file = await fh.getFile();
      const text = await file.text();
      return JSON.parse(text);
    } catch { return null; }
  }

  async function writeFile(name, data) {
    if (!_dirHandle) return false;
    try {
      const fh       = await _dirHandle.getFileHandle(name + '.json', { create: true });
      const writable = await fh.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      return true;
    } catch (e) { console.warn('[PersistDB] writeFile error:', e); return false; }
  }

  async function verifyPermission(handle) {
    if (!handle) return false;
    try {
      const perm = await handle.queryPermission({ mode: 'readwrite' });
      return perm === 'granted';
    } catch { return false; }
  }

  async function reconnectFolder() {
    if (!_rootHandle) return false;
    try {
      const perm = await _rootHandle.requestPermission({ mode: 'readwrite' });
      if (perm === 'granted') {
        _dirHandle = await getDataDir(_rootHandle);
        _ready = true;
        if (_onReady) await _onReady(true);
        return true;
      }
    } catch (e) { console.warn('[PersistDB] reconnectFolder error:', e); }
    return false;
  }

  async function init(onReady, onNeedPerm) {
    _onReady    = onReady    || (() => {});
    _onNeedPerm = onNeedPerm || (() => {});

    if (!_useFSA) {
      console.warn('[PersistDB] File System Access API no disponible, usando localStorage.');
      _ready = true;
      _onReady(false);
      return;
    }

    try {
      const db     = await openIDB();
      const handle = await idbGet(db, HANDLE_KEY);
      if (handle) {
        _rootHandle = handle;
        const ok = await verifyPermission(handle);
        if (ok) {
          _dirHandle  = await getDataDir(handle);
          _ready = true;
          _onReady(true);
          return;
        } else {
          // Tiene una carpeta guardada pero requiere permiso (gesto de usuario)
          _onNeedPerm(true);
          return;
        }
      }
    } catch (e) { console.warn('[PersistDB] Error al restaurar handle:', e); }

    _onNeedPerm(false);
  }

  async function pickFolder() {
    if (!_useFSA) return false;
    try {
      const root = await window.showDirectoryPicker({ id: 'romeo-pt-data', mode: 'readwrite', startIn: 'documents' });
      const ok   = await verifyPermission(root);
      if (!ok) return false;
      _rootHandle = root;
      _dirHandle  = await getDataDir(root);
      const db = await openIDB();
      await idbSet(db, HANDLE_KEY, root);
      _ready = true;
      if (_onReady) _onReady(true);
      return true;
    } catch (e) { if (e.name !== 'AbortError') console.warn('[PersistDB] pickFolder error:', e); return false; }
  }

  async function get(key) {
    if (_useFSA && _dirHandle) {
      const val = await readFile(key);
      if (val !== null) return val;
    }
    
    // 1. Try IndexedDB first (no 5MB limit)
    try {
      const db = await openIDB();
      const val = await idbGet(db, key);
      if (val !== undefined && val !== null) {
        return val;
      }
    } catch (e) { console.warn('[PersistDB] IDB get error:', e); }

    // 2. Fallback to localStorage (for older data)
    try { 
      const s = localStorage.getItem(key); 
      if (s) {
        const parsed = JSON.parse(s);
        // Migrate to IDB automatically without clearing localStorage
        try { 
          const db = await openIDB(); 
          await idbSet(db, key, parsed); 
        } catch(e){}
        return parsed;
      }
      return null;
    }
    catch { return null; }
  }

  async function set(key, value) {
    if (_useFSA && _dirHandle) {
      await writeFile(key, value);
    }

    let success = false;

    // 1. Save to IndexedDB (Bypasses 5MB limit)
    try {
      const db = await openIDB();
      await idbSet(db, key, value);
      success = true;
    } catch (e) {
      console.warn('[PersistDB] IDB save failed:', e);
    }

    // 2. Try localStorage as secondary backup (silently ignore if quota exceeded)
    try { 
      localStorage.setItem(key, JSON.stringify(value)); 
      success = true; 
    } catch (e) {}

    return success;
  }

  async function migrateFromLocalStorage(keys) {
    if (!_useFSA || !_dirHandle) return;
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) { const ex = await readFile(key); if (ex === null) await writeFile(key, JSON.parse(raw)); }
      } catch {}
    }
  }

  return {
    init, pickFolder, reconnectFolder, get, set, migrateFromLocalStorage,
    isReady: () => _ready,
    usesFSA: () => _useFSA && !!_dirHandle,
    hasRootHandle: () => !!_rootHandle
  };
})();
