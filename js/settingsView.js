// settingsView.js — $/wRVU rate editor + reference data status display.

window.EPT = window.EPT || {};

(function () {
  const el = id => document.getElementById(id);

  window.EPT.settingsView = {
    init() {
      const rate = localStorage.getItem("wrvu_dollar_rate");
      if (rate) el("rateInput").value = rate;

      el("saveRateBtn").addEventListener("click", () => {
        const val = parseFloat(el("rateInput").value);
        if (isNaN(val) || val < 0) { alert("Enter a valid rate."); return; }
        localStorage.setItem("wrvu_dollar_rate", String(val));
        el("saveRateBtn").textContent = "Saved ✓";
        setTimeout(() => (el("saveRateBtn").textContent = "Save Rate"), 1500);
        window.EPT.sessionForm.refreshRateDisplay();
        window.EPT.historyView.refresh();
      });

      // Google Sheets sync configuration
      el("gsClientId").value = localStorage.getItem("gs_client_id") || "";
      el("gsSheetId").value = localStorage.getItem("gs_spreadsheet_id") || "";
      const status = el("syncStatusMsg");
      if (window.EPT.auth.isConfigured() && window.EPT.sheets.isConfigured()) {
        status.textContent = "Configured. Sessions sync to your Google Sheet on save.";
      }
      el("connectBtn").addEventListener("click", async () => {
        const cid = el("gsClientId").value.trim();
        let sid = el("gsSheetId").value.trim();
        // accept a full pasted URL and extract the ID from .../d/<ID>/...
        const m = sid.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (m) { sid = m[1]; el("gsSheetId").value = sid; }
        if (!cid || !sid) { alert("Enter both the Client ID and the Spreadsheet ID."); return; }
        localStorage.setItem("gs_client_id", cid);
        localStorage.setItem("gs_spreadsheet_id", sid);
        window.EPT.auth.resetClient();
        status.textContent = "Connecting to Google…";
        try {
          await window.EPT.auth.getToken();          // consent popup on first use
          await window.EPT.sheets.ensureSetup();      // creates SessionLog tab if needed
          await window.EPT.sync.syncPending();        // flush anything saved before connecting
          const pulled = await window.EPT.sync.pullAndMerge(); // pull other-device history
          status.textContent = "Connected ✓ — SessionLog ready" + (pulled ? `, ${pulled} session(s) pulled from Sheet.` : ".");
        } catch (err) {
          status.textContent = "Connection failed: " + err.message;
        }
        window.EPT.sync.updateBadge();
      });

      // Reference data status
      const meta = window.EPT.REFERENCE_META;
      el("refUpdated").textContent = meta.last_updated;
      el("refStatus").innerHTML = meta.verified
        ? `<span style="color:var(--green)">✓ Verified against CMS fee schedule</span>`
        : `<span style="color:var(--amber)">⚠️ Unverified estimates — verify before relying on totals</span>`;
      if (!meta.verified) el("verifyBanner").classList.remove("hidden");
    }
  };
})();
