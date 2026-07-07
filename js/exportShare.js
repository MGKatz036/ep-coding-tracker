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
    window.EPT.db.getActiveSessions().then(sessions => {
      if (!sessions.length) { alert("No sessions to export yet."); return; }
      const blob = new Blob([buildCsv(sessions)], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ep-coding-log-" + new Date().toISOString().slice(0, 10) + ".csv";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  // ---- Share Sheet / clipboard text summaries (for pasting into Apple Notes) ----

  function fmtMoney(n) {
    return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // procedure labels without their trailing "(+93657)" / "(93462)" code hints
  function procNames(lineItems) {
    return [...new Set(lineItems.map(li =>
      li.procedure_label.replace(/\s*\(\+?\d+\w*\)\s*$/, "")
    ))].join(" + ");
  }

  // "93657 ×2" style aggregation of identical code+modifier lines
  function aggCodes(lineItems) {
    const m = new Map();
    for (const li of lineItems) {
      const key = li.cpt_code + (li.modifiers.length ? "-" + li.modifiers.join("-") : "");
      m.set(key, (m.get(key) || 0) + 1);
    }
    return [...m.entries()].map(([k, n]) => k + (n > 1 ? " ×" + n : ""));
  }

  function sessionText(s) {
    const d = new Date(s.session_datetime).toLocaleDateString(undefined,
      { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    const wrvu = s.lineItems.reduce((t, li) => t + li.wrvu, 0);
    const rev = s.lineItems.reduce((t, li) => t + li.revenue_snapshot, 0);
    return d + " — " + procNames(s.lineItems) + "\n" +
      aggCodes(s.lineItems).join(", ") + "\n" +
      wrvu.toFixed(2) + " wRVU · " + fmtMoney(rev);
  }

  function rangeText(sessions, label) {
    const sorted = sessions.slice().sort((a, b) => a.session_datetime.localeCompare(b.session_datetime));
    let wrvu = 0, rev = 0;
    const lines = sorted.map(s => {
      const sw = s.lineItems.reduce((t, li) => t + li.wrvu, 0);
      wrvu += sw;
      rev += s.lineItems.reduce((t, li) => t + li.revenue_snapshot, 0);
      const d = new Date(s.session_datetime).toLocaleDateString(undefined,
        { weekday: "short", month: "short", day: "numeric" });
      return "• " + d + ": " + procNames(s.lineItems) + " — " + aggCodes(s.lineItems).join(", ") + " — " + sw.toFixed(2) + " wRVU";
    });
    return "EP Procedures — " + label + "\n" + lines.join("\n") + "\n" +
      "Total: " + sorted.length + " session" + (sorted.length === 1 ? "" : "s") +
      " · " + wrvu.toFixed(2) + " wRVU · " + fmtMoney(rev);
  }

  // iOS/Safari: opens the system Share Sheet (Notes, Messages, Mail…).
  // Elsewhere: copies to clipboard. Returns which path was used.
  // Must be called directly from a click handler (no awaits before it).
  function shareText(text) {
    if (navigator.share) {
      navigator.share({ text }).catch(() => {}); // user cancelling the sheet is fine
      return "shared";
    }
    try { navigator.clipboard.writeText(text); } catch (e) {}
    return "copied";
  }

  window.EPT.exportShare = {
    init() {
      document.getElementById("exportCsvBtn").addEventListener("click", download);
    },
    sessionText, rangeText, shareText
  };
})();
