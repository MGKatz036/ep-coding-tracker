// historyView.js — session-grouped history with date-range filters and totals.

window.EPT = window.EPT || {};

(function () {
  let currentRange = "today";
  let lastFiltered = [];   // sessions currently shown (cached so Share works synchronously)
  const el = id => document.getElementById(id);

  function rangeLabel() {
    const now = new Date();
    const fmt = (d, o) => d.toLocaleDateString(undefined, o || { month: "short", day: "numeric", year: "numeric" });
    switch (currentRange) {
      case "today": return fmt(now, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
      case "week": {
        const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        s.setDate(s.getDate() - s.getDay());
        return "Week of " + fmt(s);
      }
      case "month": return now.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      case "custom": {
        const sv = el("rangeStart").value, ev = el("rangeEnd").value;
        return (sv || "…") + " to " + (ev || "…");
      }
      default: return "All time";
    }
  }

  function rangeBounds() {
    const now = new Date();
    const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    switch (currentRange) {
      case "today": {
        const s = startOfDay(now);
        return [s, new Date(s.getTime() + 86400000)];
      }
      case "week": {
        const s = startOfDay(now);
        s.setDate(s.getDate() - s.getDay()); // Sunday start
        return [s, new Date(s.getTime() + 7 * 86400000)];
      }
      case "month": {
        return [new Date(now.getFullYear(), now.getMonth(), 1),
                new Date(now.getFullYear(), now.getMonth() + 1, 1)];
      }
      case "custom": {
        const sv = el("rangeStart").value, ev = el("rangeEnd").value;
        const s = sv ? new Date(sv + "T00:00:00") : new Date(0);
        const e = ev ? new Date(new Date(ev + "T00:00:00").getTime() + 86400000) : new Date(8640000000000000);
        return [s, e];
      }
      default: return [new Date(0), new Date(8640000000000000)];
    }
  }

  function refresh() {
    window.EPT.db.getActiveSessions().then(sessions => {
      const [start, end] = rangeBounds();
      const filtered = sessions
        .filter(s => {
          const d = new Date(s.session_datetime);
          return d >= start && d < end;
        })
        .sort((a, b) => b.session_datetime.localeCompare(a.session_datetime));
      lastFiltered = filtered;

      // Totals
      let wrvu = 0, revenue = 0;
      filtered.forEach(s => s.lineItems.forEach(li => {
        wrvu += li.wrvu;
        revenue += li.revenue_snapshot;
      }));
      el("historyTotals").innerHTML = `
        <div><span class="big">${filtered.length}</span><span class="lbl">Sessions</span></div>
        <div><span class="big">${wrvu.toFixed(2)}</span><span class="lbl">wRVUs</span></div>
        <div><span class="big rev">$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><span class="lbl">Revenue</span></div>`;

      // Session list
      const list = el("historyList");
      list.innerHTML = "";
      if (filtered.length === 0) {
        list.innerHTML = `<div class="empty-note">No sessions in this range.</div>`;
        return;
      }
      filtered.forEach(s => {
        const sWrvu = s.lineItems.reduce((t, li) => t + li.wrvu, 0);
        const sRev = s.lineItems.reduce((t, li) => t + li.revenue_snapshot, 0);
        const card = document.createElement("div");
        card.className = "session-card";
        const dateLabel = new Date(s.session_datetime).toLocaleDateString(undefined,
          { weekday: "short", month: "short", day: "numeric", year: "numeric" });
        card.innerHTML = `
          <div class="session-head">
            <span class="date">${dateLabel}</span>
            <span class="tot">${sWrvu.toFixed(2)} wRVU · $${sRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          ${s.lineItems.map(li => `
            <div class="session-line">
              <span><span class="code">${li.cpt_code}${li.modifiers.length ? "-" + li.modifiers.join("-") : ""}</span> ${li.code_label}</span>
              <span>${li.wrvu.toFixed(2)}</span>
            </div>`).join("")}
          <div class="session-actions">
            <button class="session-share">📤 Share</button>
            <button class="session-del">Delete session</button>
          </div>`;
        card.querySelector(".session-share").addEventListener("click", ev => {
          const mode = window.EPT.exportShare.shareText(window.EPT.exportShare.sessionText(s));
          if (mode === "copied") {
            ev.target.textContent = "✓ Copied";
            setTimeout(() => (ev.target.textContent = "📤 Share"), 1500);
          }
        });
        card.querySelector(".session-del").addEventListener("click", () => {
          if (confirm("Delete this session? It will also be removed from your Google Sheet and other devices on the next sync.")) {
            window.EPT.db.markDeleted(s.session_id).then(() => {
              refresh();
              window.EPT.sync && window.EPT.sync.syncPending(); // push the deletion now if online
            });
          }
        });
        list.appendChild(card);
      });
    });
  }

  window.EPT.historyView = {
    init() {
      // [data-range] only — Share and Sync-down share the .filter-btn style but are not filters
      document.querySelectorAll(".filter-btn[data-range]").forEach(btn => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          currentRange = btn.dataset.range;
          el("customRange").classList.toggle("hidden", currentRange !== "custom");
          refresh();
        });
      });
      el("rangeStart").addEventListener("change", refresh);
      el("rangeEnd").addEventListener("change", refresh);
      el("shareRangeBtn").addEventListener("click", ev => {
        if (!lastFiltered.length) { ev.target.textContent = "Nothing to share"; setTimeout(() => (ev.target.textContent = "📤 Share"), 1500); return; }
        const mode = window.EPT.exportShare.shareText(window.EPT.exportShare.rangeText(lastFiltered, rangeLabel()));
        if (mode === "copied") {
          ev.target.textContent = "✓ Copied";
          setTimeout(() => (ev.target.textContent = "📤 Share"), 1500);
        }
      });
      el("pullBtn").addEventListener("click", async () => {
        el("pullBtn").textContent = "⟳ Syncing…";
        try {
          // token FIRST, while the tap still counts as a user gesture (popup allowed)
          await window.EPT.auth.getToken();
          await window.EPT.sync.syncPending();
          const added = await window.EPT.sync.pullAndMerge();
          el("pullBtn").textContent = added ? `✓ ${added} pulled` : "✓ Up to date";
        } catch (e) {
          el("pullBtn").textContent = "Sync failed";
          console.warn(e);
        }
        refresh();
        setTimeout(() => (el("pullBtn").textContent = "⟳ Sync down"), 2500);
      });
      refresh();
    },
    refresh
  };
})();
