// db.js — IndexedDB wrapper. One object store: "sessions".
// Each record = one full session (encounter) with its line items,
// tagged with syncStatus for the Phase 3 Google Sheets sync engine.

window.EPT = window.EPT || {};

(function () {
  const DB_NAME = "ep-coding-tracker";
  const DB_VERSION = 1;
  const STORE = "sessions";
  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "session_id" });
          store.createIndex("session_datetime", "session_datetime");
          store.createIndex("syncStatus", "syncStatus");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function tx(mode, fn) {
    return openDb().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const store = t.objectStore(STORE);
      const result = fn(store);
      t.oncomplete = () => resolve(result && result.result !== undefined ? result.result : undefined);
      t.onerror = () => reject(t.error);
    }));
  }

  window.EPT.db = {
    addSession(session) {
      return tx("readwrite", store => store.put(session));
    },
    getAllSessions() {
      return openDb().then(db => new Promise((resolve, reject) => {
        const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      }));
    },
    deleteSession(sessionId) {
      return tx("readwrite", store => store.delete(sessionId));
    },
    getPendingSessions() {
      return window.EPT.db.getAllSessions()
        .then(all => all.filter(s => s.syncStatus === "pending"));
    },
    markSynced(sessionId) {
      return openDb().then(db => new Promise((resolve, reject) => {
        const store = db.transaction(STORE, "readwrite").objectStore(STORE);
        const req = store.get(sessionId);
        req.onsuccess = () => {
          const s = req.result;
          if (!s) return resolve();
          s.syncStatus = "synced";
          store.put(s);
          resolve();
        };
        req.onerror = () => reject(req.error);
      }));
    }
  };

  // Simple UUID (crypto.randomUUID has broad modern support; fallback just in case)
  window.EPT.uuid = function () {
    return (crypto.randomUUID)
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        });
  };
})();
