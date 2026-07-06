// exportShare.js — CSV download of all sessions (one row per CPT line item).

window.EPT = window.EPT || {};

(function () {
  function csvEscape(v) {
    v = String(v == null ? "" : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function buildCsv(sessions) {
    const header = ["session_date", "category", "procedure", "cpt_code", "modifiers", "wrvu", "rate_per_wrvu", "revenue"];
    const rows = [header.join(",")];
    sessions
      .slice()
      .sort((a, b) => a.session_datetime.localeCompare(b.session_datetime))
      .forEach(s => s.lineItems.forEach(li => {
        rows.push([
          s.session_datetime.slice(0, 10),
          li.category,
          li.procedure_label,
          li.cpt_code + (li.modifiers.length ? "-" + li.modifiers.join("-") : ""),
          li.modifiers.join(" "),
          li.wrvu.toFixed(2),
          li.wrvu_rate_snapshot.toFixed(2),
          li.revenue_snapshot.toFixed(2)
        ].map(csvEscape).join(","));
      }));
    return rows.join("\n");
  }

  function download() {
    window.EPT.db.getAllSessions().then(sessions => {
      if (!sessions.length) { alert("No sessions to export yet."); return; }
      const blob = new Blob([buildCsv(sessions)], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ep-coding-log-" + new Date().toISOString().slice(0, 10) + ".csv";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  window.EPT.exportShare = {
    init() {
      document.getElementById("exportCsvBtn").addEventListener("click", download);
    }
  };
})();
