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
    const deleted = await window.EPT.db.getDeletedSessions();
    const n = pending.length + deleted.length;
    badge.classList.remove("hidden");
    badge.textContent = n ? n + " pending sync" : "Synced ✓";
  }

  async function syncPending() {
    if (syncing || !configured()) { updateBadge(); return; }
    syncing = true;
    try {
      const pending = await window.EPT.db.getPendingSessions();
      if (pending.length) {
        // Dedupe guard: never re-append line items the Sheet already has
        // (protects against a lost success response double-logging revenue).
        const existing = new Set((await window.EPT.sheets.fetchAllRows()).map(r => r[2]));
        const rows = pending.flatMap(rowsForSession).filter(r => !existing.has(r[2]));
        if (rows.length) await window.EPT.sheets.appendRows(rows);
        for (const s of pending) await window.EPT.db.markSynced(s.session_id);
      }
      // Push deletions: remove tombstoned sessions' rows from the Sheet,
      // then purge the local tombstones.
      const deleted = await window.EPT.db.getDeletedSessions();
      if (deleted.length) {
        await window.EPT.sheets.deleteRowsBySessionIds(deleted.map(s => s.session_id));
        for (const s of deleted) await window.EPT.db.deleteSession(s.session_id);
      }
    } catch (e) {
      // stays pending; will retry on next save, reconnect, or manual connect
      console.warn("Sync failed (entries stay safely pending):", e.message);
    } finally {
      syncing = false;
      updateBadge();
    }
  }

  // Cross-device merge: pull every row from the Sheet and locally store any
  // session this device hasn't seen (keyed by session_id — entries made on
  // other devices, or before this device was set up).
  async function pullAndMerge() {
    if (!configured()) return 0;
    const rows = await window.EPT.sheets.fetchAllRows();
    const locals = await window.EPT.db.getAllSessions();
    const local = new Set(locals.map(s => s.session_id));
    const sheetIds = new Set(rows.map(r => r[0]).filter(Boolean));

    // Propagate deletions made on other devices: a locally *synced* session
    // that no longer exists in the Sheet was deleted elsewhere — remove it.
    // (Pending sessions are untouched: they simply haven't uploaded yet.)
    for (const s of locals) {
      if (s.syncStatus === "synced" && !sheetIds.has(s.session_id)) {
        await window.EPT.db.deleteSession(s.session_id);
      }
    }

    const bySession = new Map();
    for (const r of rows) {
      const [sid, sdt, liid, cat, plabel, cpt, mods, wrvu, rate, rev, device, created] = r;
      if (!sid || local.has(sid)) continue; // includes tombstones — never resurrect a deleted session
      if (!bySession.has(sid)) {
        bySession.set(sid, {
          session_id: sid, session_datetime: sdt, created_at: created || sdt,
          entry_device: device || "", syncStatus: "synced", lineItems: []
        });
      }
      bySession.get(sid).lineItems.push({
        line_item_id: liid, category: cat || "", procedure_label: plabel || "",
        cpt_code: String(cpt || ""), code_label: plabel || "",
        modifiers: mods ? String(mods).split(/\s+/).filter(Boolean) : [],
        wrvu: parseFloat(wrvu) || 0,
        wrvu_rate_snapshot: parseFloat(rate) || 0,
        revenue_snapshot: parseFloat(rev) || 0
      });
    }
    for (const s of bySession.values()) await window.EPT.db.addSession(s);
    updateBadge();
    return bySession.size;
  }

  window.EPT.sync = { syncPending, pullAndMerge, updateBadge };
  window.addEventListener("online", () => syncPending());
})();
