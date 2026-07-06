// sessionForm.js — renders the procedure picker, manages the session cart,
// and saves completed sessions to IndexedDB.

window.EPT = window.EPT || {};

(function () {
  // cart line items: {line_item_id, procId, category, procedure_label, cpt, code_label, wrvu, modifiers:[]}
  let cart = [];

  const el = id => document.getElementById(id);

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function getRate() {
    return parseFloat(localStorage.getItem("wrvu_dollar_rate") || "0") || 0;
  }

  function renderCategories() {
    const container = el("categoryList");
    container.innerHTML = "";
    window.EPT.REFERENCE_DATA.forEach((cat, ci) => {
      const catDiv = document.createElement("div");
      catDiv.className = "category" + (ci === 0 ? " open" : "");

      const header = document.createElement("button");
      header.className = "category-header";
      header.innerHTML = `<span>${cat.category}</span><span class="chev">›</span>`;
      header.addEventListener("click", () => catDiv.classList.toggle("open"));
      catDiv.appendChild(header);

      const body = document.createElement("div");
      body.className = "category-body";

      cat.procedures.forEach(proc => {
        const codes = proc.codes.map(c => c.cpt + (c.modifiers.length ? "-" + c.modifiers.join("-") : "")).join(", ");
        const max = proc.maxUnits || 1;

        if (max > 1) {
          // Counter (stepper) for add-on codes reportable more than once (e.g. 93655/93657 ×2)
          const row = document.createElement("div");
          row.className = "proc-row";
          row.dataset.procId = proc.id;
          const stepper = document.createElement("div");
          stepper.className = "stepper";
          stepper.dataset.procId = proc.id;
          stepper.innerHTML = `<button class="step-btn minus" title="Remove one">−</button><span class="step-count">0</span><button class="step-btn plus" title="Add one">+</button>`;
          stepper.querySelector(".plus").addEventListener("click", () => {
            if (unitCount(proc) < max) addToCart(cat.category, proc);
          });
          stepper.querySelector(".minus").addEventListener("click", () => removeOneUnit(proc));
          row.appendChild(stepper);
          row.insertAdjacentHTML("beforeend",
            `<span class="proc-label">${proc.label}<br><span class="proc-codes">${codes} · up to ×${max}</span><span class="bundle-note"></span></span>`);
          body.appendChild(row);
          return;
        }

        const row = document.createElement("label");
        row.className = "proc-row";
        row.dataset.procId = proc.id;
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.dataset.procId = proc.id;
        cb.addEventListener("change", () => {
          if (cb.checked) addToCart(cat.category, proc);
          else removeProcFromCart(proc.id);
        });
        row.appendChild(cb);
        row.insertAdjacentHTML("beforeend",
          `<span class="proc-label">${proc.label}<br><span class="proc-codes">${codes}</span><span class="bundle-note"></span></span>`);
        body.appendChild(row);
      });

      catDiv.appendChild(body);
      container.appendChild(catDiv);
    });
  }

  function addToCart(category, proc) {
    proc.codes.forEach(code => {
      cart.push({
        line_item_id: window.EPT.uuid(),
        procId: proc.id,
        category: category,
        procedure_label: proc.label,
        cpt: code.cpt,
        code_label: code.label,
        wrvu: code.wrvu,
        modifiers: code.modifiers.slice() // suggested modifiers start toggled ON
      });
    });
    renderCart();
  }

  function removeProcFromCart(procId) {
    cart = cart.filter(item => item.procId !== procId);
    renderCart();
  }

  function unitCount(proc) {
    return cart.filter(i => i.procId === proc.id).length / proc.codes.length;
  }

  function removeOneUnit(proc) {
    // remove the most recently added unit (= one set of the procedure's codes)
    for (let n = 0; n < proc.codes.length; n++) {
      for (let i = cart.length - 1; i >= 0; i--) {
        if (cart[i].procId === proc.id) { cart.splice(i, 1); break; }
      }
    }
    renderCart();
  }

  // Bundling rules: returns a short reason string if this procedure can't
  // currently be added (bundled into a selected code, mutually exclusive
  // primary, or missing its required companion code), else null.
  function disabledReason(proc) {
    const inCart = new Set(cart.map(i => i.procId));
    if (proc.group) {
      for (const cat of window.EPT.REFERENCE_DATA)
        for (const p of cat.procedures)
          if (p.group === proc.group && p.id !== proc.id && inCart.has(p.id))
            return "only one primary ablation per case";
    }
    if (proc.disabledWith) {
      for (const id of proc.disabledWith)
        if (inCart.has(id)) {
          const other = findProc(id);
          return "included in " + (other ? other.codes[0].cpt : id);
        }
    }
    if (proc.requires && !proc.requires.some(id => inCart.has(id))) {
      const req = findProc(proc.requires[0]);
      return "requires " + (req ? req.codes[0].cpt : proc.requires[0]);
    }
    return null;
  }

  // Drop cart items that became invalid after a later selection
  // (e.g. ICE was selected first, then AF ablation which bundles it).
  function normalizeCart() {
    let changed = true;
    while (changed) {
      changed = false;
      for (const item of cart) {
        const proc = findProc(item.procId);
        if (!proc) continue;
        const others = new Set(cart.filter(i => i.procId !== item.procId).map(i => i.procId));
        const bundled = proc.disabledWith && proc.disabledWith.some(id => others.has(id));
        const missingReq = proc.requires && !proc.requires.some(id => others.has(id));
        if (bundled || missingReq) {
          cart = cart.filter(i => i.procId !== item.procId);
          changed = true;
          break;
        }
      }
    }
  }

  function updateProcControls() {
    const inCart = new Set(cart.map(i => i.procId));
    document.querySelectorAll(".proc-row[data-proc-id]").forEach(row => {
      const proc = findProc(row.dataset.procId);
      if (!proc) return;
      const reason = inCart.has(proc.id) ? null : disabledReason(proc);
      row.classList.toggle("disabled", !!reason);
      const note = row.querySelector(".bundle-note");
      if (note) note.textContent = reason ? " — " + reason : "";
      const cb = row.querySelector('input[type="checkbox"]');
      if (cb) { cb.checked = inCart.has(proc.id); cb.disabled = !!reason; }
      const st = row.querySelector(".stepper");
      if (st) {
        const count = unitCount(proc);
        st.querySelector(".step-count").textContent = count;
        st.classList.toggle("active", count > 0);
        st.querySelector(".plus").disabled = !!reason || count >= (proc.maxUnits || 1);
        st.querySelector(".minus").disabled = count === 0;
      }
    });
  }

  function removeLineItem(lineItemId) {
    const item = cart.find(i => i.line_item_id === lineItemId);
    cart = cart.filter(i => i.line_item_id !== lineItemId);
    // if no line items remain for that procedure, uncheck its box
    if (item && !cart.some(i => i.procId === item.procId)) {
      const cb = document.querySelector(`input[data-proc-id="${item.procId}"]`);
      if (cb) cb.checked = false;
    }
    renderCart();
  }

  function toggleModifier(lineItemId, mod) {
    const item = cart.find(i => i.line_item_id === lineItemId);
    if (!item) return;
    const idx = item.modifiers.indexOf(mod);
    if (idx >= 0) item.modifiers.splice(idx, 1);
    else item.modifiers.push(mod);
    renderCart();
  }

  function renderCart() {
    normalizeCart();
    updateProcControls();
    const cartDiv = el("cart");
    const itemsDiv = el("cartItems");
    if (cart.length === 0) {
      cartDiv.classList.add("hidden");
      itemsDiv.innerHTML = "";
      return;
    }
    cartDiv.classList.remove("hidden");
    itemsDiv.innerHTML = "";

    cart.forEach(item => {
      const div = document.createElement("div");
      div.className = "cart-item";
      div.innerHTML = `
        <div class="cart-item-top">
          <div>
            <span class="code">${item.cpt}${item.modifiers.length ? "-" + item.modifiers.join("-") : ""}</span>
            <div class="desc">${item.code_label}</div>
          </div>
          <span class="wrvu">${item.wrvu.toFixed(2)} wRVU</span>
          <button class="remove-btn" title="Remove">✕</button>
        </div>`;
      div.querySelector(".remove-btn").addEventListener("click", () => removeLineItem(item.line_item_id));

      // Suggested modifier chips: union of the code's default modifiers and any currently applied
      const proc = findProc(item.procId);
      const codeDef = proc ? proc.codes.find(c => c.cpt === item.cpt) : null;
      const suggested = Array.from(new Set([...(codeDef ? codeDef.modifiers : []), ...item.modifiers]));
      if (suggested.length) {
        const modRow = document.createElement("div");
        modRow.className = "mod-row";
        modRow.innerHTML = `<span class="mod-label">Modifiers:</span>`;
        suggested.forEach(mod => {
          const chip = document.createElement("button");
          chip.className = "mod-chip" + (item.modifiers.includes(mod) ? " on" : "");
          chip.textContent = "-" + mod;
          chip.title = window.EPT.MODIFIER_LEGEND[mod] || "";
          chip.addEventListener("click", () => toggleModifier(item.line_item_id, mod));
          modRow.appendChild(chip);
        });
        div.appendChild(modRow);
      }
      itemsDiv.appendChild(div);
    });

    const totalWrvu = cart.reduce((sum, i) => sum + i.wrvu, 0);
    el("cartWrvu").textContent = totalWrvu.toFixed(2);
    const rate = getRate();
    el("cartRevenue").textContent = rate > 0
      ? "$" + (totalWrvu * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "(set $/wRVU rate in Settings)";
  }

  function findProc(procId) {
    for (const cat of window.EPT.REFERENCE_DATA) {
      const p = cat.procedures.find(pr => pr.id === procId);
      if (p) return p;
    }
    return null;
  }

  function saveSession() {
    if (cart.length === 0) return;
    const rate = getRate();
    const dateVal = el("sessionDate").value || todayStr();
    const session = {
      session_id: window.EPT.uuid(),
      session_datetime: dateVal + "T" + new Date().toTimeString().slice(0, 8),
      created_at: new Date().toISOString(),
      entry_device: /iPhone|iPad/.test(navigator.userAgent) ? "iPhone" : "Mac",
      syncStatus: "pending",
      lineItems: cart.map(i => ({
        line_item_id: i.line_item_id,
        category: i.category,
        procedure_label: i.procedure_label,
        cpt_code: i.cpt,
        code_label: i.code_label,
        modifiers: i.modifiers.slice(),
        wrvu: i.wrvu,
        wrvu_rate_snapshot: rate,
        revenue_snapshot: +(i.wrvu * rate).toFixed(2)
      }))
    };
    window.EPT.db.addSession(session).then(() => {
      clearCart();
      window.EPT.flashSaved && window.EPT.flashSaved();
      window.EPT.historyView && window.EPT.historyView.refresh();
      window.EPT.sync && window.EPT.sync.syncPending(); // background; save is already safe locally
    }).catch(err => alert("Save failed: " + err));
  }

  function clearCart() {
    cart = [];
    document.querySelectorAll('#categoryList input[type="checkbox"]').forEach(cb => (cb.checked = false));
    renderCart();
  }

  window.EPT.sessionForm = {
    init() {
      el("sessionDate").value = todayStr();
      renderCategories();
      el("saveBtn").addEventListener("click", saveSession);
      el("clearBtn").addEventListener("click", clearCart);
    },
    refreshRateDisplay: renderCart
  };
})();
