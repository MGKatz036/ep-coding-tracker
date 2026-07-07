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
    }
  };
})();
