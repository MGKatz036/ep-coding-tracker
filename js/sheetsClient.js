// sheetsClient.js — thin wrapper around the Google Sheets REST API using
// fetch() with a bearer token (no Google client library needed).

window.EPT = window.EPT || {};

(function () {
  const API = "https://sheets.googleapis.com/v4/spreadsheets/";
  const sheetId = () => localStorage.getItem("gs_spreadsheet_id") || (window.EPT.CONFIG && window.EPT.CONFIG.SPREADSHEET_ID) || "";

  async function call(path, opts = {}) {
    const token = await window.EPT.auth.getToken();
    const res = await fetch(API + sheetId() + path, {
      ...opts,
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        ...(opts.headers || {})
      }
    });
    if (!res.ok) throw new Error("Sheets API " + res.status + ": " + (await res.text()).slice(0, 300));
    return res.json();
  }

  // One row per CPT line item; column order matches BUILD_PLAN.md schema.
  const HEADERS = ["session_id", "session_datetime", "line_item_id", "category",
    "procedure_label", "cpt_code", "modifiers", "wrvu", "wrvu_rate_snapshot",
    "revenue_snapshot", "entry_device", "created_at"];

  window.EPT.sheets = {
    isConfigured: () => !!sheetId(),
    HEADERS,

    // Creates the SessionLog tab with headers if the spreadsheet doesn't have it yet.
    async ensureSetup() {
      const meta = await call("?fields=sheets.properties.title");
      const titles = (meta.sheets || []).map(s => s.properties.title);
      if (!titles.includes("SessionLog")) {
        await call(":batchUpdate", {
          method: "POST",
          body: JSON.stringify({ requests: [{ addSheet: { properties: { title: "SessionLog" } } }] })
        });
        await call("/values/SessionLog!A1:append?valueInputOption=RAW", {
          method: "POST",
          body: JSON.stringify({ values: [HEADERS] })
        });
      }
    },

    appendRows(rows) {
      return call("/values/SessionLog!A:L:append?valueInputOption=RAW", {
        method: "POST",
        body: JSON.stringify({ values: rows })
      });
    },

    // Full read of the log (used by the Phase 3 cross-device merge).
    fetchAllRows() {
      return call("/values/SessionLog!A2:L100000").then(r => r.values || []);
    },

    // Numeric tab id of SessionLog (needed for row deletion), cached.
    async getSessionLogGid() {
      if (this._gid !== undefined) return this._gid;
      const meta = await call("?fields=sheets.properties");
      const tab = (meta.sheets || []).find(s => s.properties.title === "SessionLog");
      this._gid = tab ? tab.properties.sheetId : null;
      return this._gid;
    },

    // Remove every row belonging to the given session_ids from the Sheet.
    // Row indices are deleted bottom-up so earlier deletions don't shift later ones.
    async deleteRowsBySessionIds(sessionIds) {
      const ids = new Set(sessionIds);
      const rows = await this.fetchAllRows();
      // data starts at sheet row 2 → array index i is 0-based grid index i+1
      const gridIndices = [];
      rows.forEach((r, i) => { if (ids.has(r[0])) gridIndices.push(i + 1); });
      if (!gridIndices.length) return 0;
      const gid = await this.getSessionLogGid();
      const requests = gridIndices.sort((a, b) => b - a).map(idx => ({
        deleteDimension: { range: { sheetId: gid, dimension: "ROWS", startIndex: idx, endIndex: idx + 1 } }
      }));
      await call(":batchUpdate", { method: "POST", body: JSON.stringify({ requests }) });
      return gridIndices.length;
    }
  };
})();
