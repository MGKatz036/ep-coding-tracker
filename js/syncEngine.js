// syncEngine.js — flushes locally saved (pending) sessions to Google Sheets
// and keeps the header badge honest. Local saves NEVER wait on this: the
// session is already safe in IndexedDB before sync is attempted.

window.EPT = window.EPT || {};

(function () {
  let syncing = false;

  function rowsForSession(s) {
    return s.lineItems.map(li => [
      s.session_id, s.session_datetime, li.line_item_id, li.category,
      li.procedure_label, li.cpt_code, li.modifiers.join(" "), li.wrvu,
      li.wrvu_rate_snapshot, li.revenue_snapshot, s.entry_device, s.created_at
    ]);
  }

  function configured() {
    return window.EPT.auth.isConfigured() && window.EPT.sheets.isConfigured();
  }

  async function updateBadge() {
    const badge = document.getElementById("syncBadge");
    if (!configured()) { badge.classList.add("hidden"); return; }
    const pending = await window.EPT.db.getPendingSessions();
    badge.classList.remove("hidden");
    badge.textContent = pending.length ? pending.length + " pending sync" : "Synced ✓";
  }

  async function syncPending() {
    if (syncing || !configured()) { updateBadge(); return; }
    syncing = true;
    try {
      const pending = await window.EPT.db.getPendingSessions();
      if (pending.length) {
        const rows = pending.flatMap(rowsForSession);
        await window.EPT.sheets.appendRows(rows);
        for (const s of pending) await window.EPT.db.markSynced(s.session_id);
      }
    } catch (e) {
      // stays pending; will retry on next save, reconnect, or manual connect
      console.warn("Sync failed (entries stay safely pending):", e.message);
    } finally {
      syncing = false;
      updateBadge();
    }
  }

  window.EPT.sync = { syncPending, updateBadge };
  window.addEventListener("online", () => syncPending());
})();
