// app.js — entry point: tab navigation + module initialization.

window.EPT = window.EPT || {};

(function () {
  function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
        document.getElementById(btn.dataset.view).classList.remove("hidden");
        if (btn.dataset.view === "historyView") window.EPT.historyView.refresh();
      });
    });
  }

  // Brief "Saved ✓" flash on the save button after a session is stored.
  window.EPT.flashSaved = function () {
    const btn = document.getElementById("saveBtn");
    const orig = btn.textContent;
    btn.textContent = "Saved ✓";
    btn.disabled = true;
    setTimeout(() => { btn.textContent = orig; btn.disabled = false; }, 1200);
  };

  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    window.EPT.sessionForm.init();
    window.EPT.historyView.init();
    window.EPT.settingsView.init();
    window.EPT.exportShare.init();
    window.EPT.sync.updateBadge();
  });
})();
