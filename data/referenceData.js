// EP Coding Tracker — CPT / wRVU reference data
// Ablation/EPS codes updated from the 2023 Biosense Webster/Avania physician
// coding webinar (2023 MPFS, CMS-1771-F). Device implant/check codes remain
// best-effort estimates. The app shows a warning banner until "verified" is
// true — ask Claude to verify all values against the CURRENT CMS MPFS.
// Descriptors are paraphrased (not verbatim AMA descriptor text).
//
// Bundling fields (drive the auto-gray-out logic in the Log screen):
//   group:        only ONE procedure per group may be in a session
//                 (e.g. one primary ablation package per case)
//   disabledWith: procedure ids that BUNDLE this code — grayed out with a
//                 note when any of them is in the current session
//   requires:     procedure ids, at least one of which must be in the
//                 session before this can be added (e.g. 93657 needs 93656)
//   maxUnits:     how many times the code may be reported per case (default 1)

window.EPT = window.EPT || {};

window.EPT.REFERENCE_META = {
  last_updated: "2026-07-05",
  verified: false,
  source: "Ablation/EPS codes: 2023 MPFS values + bundling rules from 2023 Biosense/Avania coding webinar (CMS-1771-F). Leadless PM Cat III codes from Abbott Aveir reimbursement slide (2024): no CMS wRVU, placeholders at 0.00 pending comp-plan values. Device codes: unverified estimates. Full CMS verification pass still pending."
};

window.EPT.REFERENCE_DATA = [
  {
    category: "EP Studies & Ablations",
    procedures: [
      { id: "svt_abl", label: "SVT Ablation + EPS", group: "primary_ablation",
        codes: [{ cpt: "93653", label: "Comprehensive EPS w/ atrial ablation (incl. LA pace/record, 3-D mapping)", wrvu: 15.0, modifiers: [] }] },
      { id: "af_abl", label: "AF Ablation (PVI) + EPS", group: "primary_ablation",
        codes: [{ cpt: "93656", label: "Comprehensive EPS w/ PVI for AF (incl. TSP, LA pace/record, 3-D mapping, ICE)", wrvu: 17.0, modifiers: [] }] },
      { id: "vt_abl", label: "VT Ablation + EPS", group: "primary_ablation",
        codes: [{ cpt: "93654", label: "Comprehensive EPS w/ ventricular ablation (incl. 3-D mapping, LA/LV pace/record)", wrvu: 18.1, modifiers: [] }] },
      { id: "avn_abl", label: "AV Node Ablation",
        codes: [{ cpt: "93650", label: "AV node ablation", wrvu: 10.24, modifiers: [] }] },
      { id: "eps_ind", label: "EPS w/ induction", disabledWith: ["svt_abl", "af_abl", "vt_abl"],
        codes: [{ cpt: "93620", label: "Comprehensive EP study w/ induction", wrvu: 11.3, modifiers: ["26"] }] },
      { id: "eps_noind", label: "EPS w/out induction", disabledWith: ["svt_abl", "af_abl", "vt_abl"],
        codes: [{ cpt: "93619", label: "EP study w/o induction", wrvu: 7.3, modifiers: ["26"] }] },
      { id: "eps_ltd", label: "EPS — limited study", disabledWith: ["svt_abl", "af_abl", "vt_abl"],
        codes: [{ cpt: "93620", label: "Limited EP study", wrvu: 11.3, modifiers: ["26", "52"] }] }
    ]
  },
  {
    category: "Ablation / EPS Add-on Codes",
    procedures: [
      { id: "addl_nonaf", label: "Add'l ablation, non-AF arrhythmia (+93655)", maxUnits: 2,
        codes: [{ cpt: "93655", label: "Add'l discrete arrhythmia mechanism ablation", wrvu: 5.5, modifiers: [] }] },
      { id: "addl_af", label: "Add'l AF ablation beyond PVI (+93657)", maxUnits: 2, requires: ["af_abl"],
        codes: [{ cpt: "93657", label: "Add'l left/right atrial ablation for AF", wrvu: 5.5, modifiers: [] }] },
      { id: "infusion", label: "Drug infusion & induction (+93623)",
        codes: [{ cpt: "93623", label: "Programmed stim after IV drug infusion (pre-ablation/diagnostic)", wrvu: 0.98, modifiers: ["26"] }] },
      { id: "la_pace", label: "LA pace & record (+93621)", disabledWith: ["svt_abl", "af_abl", "vt_abl"],
        codes: [{ cpt: "93621", label: "Left atrial pacing/recording", wrvu: 2.1, modifiers: ["26"] }] },
      { id: "lv_pace", label: "LV pace & record (+93622)", disabledWith: ["vt_abl"],
        codes: [{ cpt: "93622", label: "Left ventricular pacing/recording", wrvu: 2.5, modifiers: ["26"] }] },
      { id: "map_2d", label: "2-D mapping (+93609)", disabledWith: ["svt_abl", "af_abl", "vt_abl"],
        codes: [{ cpt: "93609", label: "Intraventricular/atrial 2-D mapping", wrvu: 5.0, modifiers: ["26"] }] },
      { id: "map_3d", label: "3-D mapping (+93613)", disabledWith: ["svt_abl", "af_abl", "vt_abl"],
        codes: [{ cpt: "93613", label: "Intracardiac 3-D electroanatomic mapping", wrvu: 5.23, modifiers: [] }] },
      { id: "ice", label: "Intracardiac echo / ICE (+93662)", disabledWith: ["af_abl"],
        codes: [{ cpt: "93662", label: "Intracardiac echocardiography", wrvu: 1.44, modifiers: ["26"] }] },
      { id: "transseptal", label: "Transseptal puncture (93462)", disabledWith: ["af_abl"],
        codes: [{ cpt: "93462", label: "Left heart access via transseptal puncture", wrvu: 3.73, modifiers: [] }] },
      { id: "his_rec", label: "His bundle recording (93600)", disabledWith: ["svt_abl", "af_abl", "vt_abl", "eps_ind", "eps_noind", "eps_ltd"],
        codes: [{ cpt: "93600", label: "Bundle of His recording", wrvu: 2.12, modifiers: ["26"] }] },
      { id: "fu_eps", label: "F/U EP study to test therapy (93624)",
        codes: [{ cpt: "93624", label: "Follow-up EP study", wrvu: 3.0, modifiers: ["26"] }] }
    ]
  },
  {
    category: "Peri-Procedural Device Reprogramming",
    procedures: [
      { id: "icd_reprog", label: "ICD reprogram, peri-procedural (pre + post)", disabledWith: ["vt_abl", "af_abl"],
        codes: [
          { cpt: "93287", label: "ICD peri-procedural programming (pre)", wrvu: 0.45, modifiers: ["26"] },
          { cpt: "93287", label: "ICD peri-procedural programming (post)", wrvu: 0.45, modifiers: ["26", "76"] }
        ] },
      { id: "pm_reprog", label: "PM reprogram, peri-procedural (pre + post)", disabledWith: ["vt_abl", "af_abl"],
        codes: [
          { cpt: "93286", label: "PM peri-procedural programming (pre)", wrvu: 0.3, modifiers: ["26"] },
          { cpt: "93286", label: "PM peri-procedural programming (post)", wrvu: 0.3, modifiers: ["26", "76"] }
        ] }
    ]
  },
  {
    category: "New Pacemaker Implants",
    procedures: [
      { id: "pm_dual", label: "Dual chamber PM system", codes: [{ cpt: "33208", label: "PM implant, dual chamber", wrvu: 8.2, modifiers: [] }] },
      { id: "pm_biv", label: "Bi-V PM system (CRT-P)", codes: [
        { cpt: "33208", label: "PM implant, dual chamber", wrvu: 8.2, modifiers: [] },
        { cpt: "33225", label: "LV lead insertion at time of implant", wrvu: 7.8, modifiers: [] }
      ] },
      { id: "pm_rv", label: "Single chamber PM (RV)", codes: [{ cpt: "33207", label: "PM implant, single chamber ventricular", wrvu: 7.4, modifiers: [] }] },
      { id: "pm_ra", label: "Single chamber PM (RA)", codes: [{ cpt: "33206", label: "PM implant, single chamber atrial", wrvu: 7.4, modifiers: [] }] }
    ]
  },
  {
    category: "Leadless Pacemakers (Aveir / Micra)",
    // Category III "T-codes" have NO CMS-assigned wRVU (carrier-priced).
    // Values below follow the Abbott Aveir physician crosswalk guides
    // (MAT-2404119 v2.0 AR, MAT-2311126 v4.0 DR), using 2025 MPFS values
    // (CMS-1807-F) for the crosswalked Category I codes; where two units
    // apply, the second is discounted 50% per Medicare (×1.5 total).
    // 0795T uses the user's own comp-plan value (12.8) rather than the
    // 33274×1.5 crosswalk (11.7). Adjust any of these to match your plan.
    procedures: [
      { id: "llpm_vr", label: "Leadless PM — VR implant/replacement (RV)", codes: [{ cpt: "33274", label: "Leadless PM insertion or replacement, RV (2025 MPFS)", wrvu: 7.8, modifiers: [] }] },
      { id: "llpm_ar", label: "Leadless PM — AR implant (RA, single chamber)", codes: [{ cpt: "0823T", label: "Single chamber leadless PM insertion, RA (Cat III; crosswalk 33274)", wrvu: 7.8, modifiers: [] }] },
      { id: "llpm_dr", label: "Leadless PM — DR implant (complete dual system)", codes: [{ cpt: "0795T", label: "Dual-chamber leadless PM system insertion, RA + RV (Cat III; comp-plan value)", wrvu: 12.8, modifiers: [] }] },
      { id: "llpm_dr_ra", label: "Leadless PM — DR, RA component only (upgrade)", codes: [{ cpt: "0796T", label: "Dual-chamber leadless PM, RA component insertion (Cat III; crosswalk 33274)", wrvu: 7.8, modifiers: [] }] },
      { id: "llpm_dr_rv", label: "Leadless PM — DR, RV component only", codes: [{ cpt: "0797T", label: "Dual-chamber leadless PM, RV component insertion (Cat III; crosswalk 33274)", wrvu: 7.8, modifiers: [] }] },
      { id: "llpm_rem_rv", label: "Leadless PM removal — RV (single chamber)", codes: [{ cpt: "33275", label: "Transcatheter leadless PM removal, RV (2025 MPFS)", wrvu: 8.59, modifiers: [] }] },
      { id: "llpm_rem_dual", label: "Leadless PM removal — dual system", codes: [{ cpt: "0798T", label: "Dual-chamber leadless PM system removal (Cat III; crosswalk 33275 ×1.5)", wrvu: 12.88, modifiers: [] }] },
      { id: "llpm_rem_ra_comp", label: "Leadless PM removal — RA component", codes: [{ cpt: "0799T", label: "Dual-chamber leadless PM, RA component removal (Cat III; crosswalk 33275)", wrvu: 8.59, modifiers: [] }] },
      { id: "llpm_rem_rv_comp", label: "Leadless PM removal — RV component", codes: [{ cpt: "0800T", label: "Dual-chamber leadless PM, RV component removal (Cat III; crosswalk 33275)", wrvu: 8.59, modifiers: [] }] },
      { id: "llpm_rem_ar", label: "Leadless PM removal — AR (single chamber)", codes: [{ cpt: "0824T", label: "Single chamber leadless PM removal, RA (Cat III; crosswalk 33275)", wrvu: 8.59, modifiers: [] }] },
      { id: "llpm_rr_dual", label: "Leadless PM removal & replacement — dual system", codes: [{ cpt: "0801T", label: "Dual-chamber leadless PM removal & replacement, RA + RV (Cat III; crosswalk 33274×1.5 + 33275×1.5)", wrvu: 24.58, modifiers: [] }] },
      { id: "llpm_rr_ra", label: "Leadless PM removal & replacement — RA component", codes: [{ cpt: "0802T", label: "Dual-chamber leadless PM removal & replacement, RA component (Cat III; crosswalk 33274 + 33275)", wrvu: 16.39, modifiers: [] }] },
      { id: "llpm_rr_rv", label: "Leadless PM removal & replacement — RV component", codes: [{ cpt: "0803T", label: "Dual-chamber leadless PM removal & replacement, RV component (Cat III; crosswalk 33274 + 33275)", wrvu: 16.39, modifiers: [] }] },
      { id: "llpm_rr_ar", label: "Leadless PM removal & replacement — AR (single chamber)", codes: [{ cpt: "0825T", label: "Single chamber leadless PM removal & replacement, RA (Cat III; crosswalk 33274 per AR guide)", wrvu: 7.8, modifiers: [] }] },
      { id: "llpm_prog_single", label: "Leadless PM programming eval — single chamber", codes: [{ cpt: "0826T", label: "Programming eval, single-chamber leadless PM (Cat III; crosswalk 93279)", wrvu: 0.65, modifiers: [] }] },
      { id: "llpm_prog_dual", label: "Leadless PM programming eval — dual chamber", codes: [{ cpt: "0804T", label: "Programming eval, dual-chamber leadless PM (Cat III; crosswalk 93279 ×1.5)", wrvu: 0.98, modifiers: [] }] }
    ]
  },
  {
    category: "Pacemaker Generator Changes / Upgrades",
    procedures: [
      { id: "pmgen_single", label: "Single chamber gen change", codes: [{ cpt: "33227", label: "PM generator change, single", wrvu: 5.0, modifiers: [] }] },
      { id: "pmgen_dual", label: "Dual chamber gen change", codes: [{ cpt: "33228", label: "PM generator change, dual", wrvu: 5.55, modifiers: [] }] },
      { id: "pmgen_biv", label: "Bi-V gen change (RA, RV, & LV)", codes: [{ cpt: "33229", label: "PM generator change, multi-lead", wrvu: 6.05, modifiers: [] }] },
      { id: "pm_s2d", label: "Upgrade single → dual PM", codes: [{ cpt: "33214", label: "Upgrade single to dual chamber PM", wrvu: 8.0, modifiers: [] }] },
      { id: "pm_lead_repos", label: "RA or RV lead reposition", codes: [{ cpt: "33215", label: "Reposition RA/RV electrode", wrvu: 5.0, modifiers: [] }] },
      { id: "lv_lead_repos", label: "LV lead reposition", codes: [{ cpt: "33226", label: "Reposition LV (CS) electrode", wrvu: 7.0, modifiers: [] }] },
      { id: "new_lead", label: "New RA or RV lead (not at gen implant)", codes: [{ cpt: "33216", label: "Insert single transvenous electrode", wrvu: 6.0, modifiers: [] }] },
      { id: "new_lv_lead", label: "New LV lead — no generator", codes: [{ cpt: "33224", label: "Add LV lead to existing system", wrvu: 8.0, modifiers: [] }] },
      { id: "pocket_reloc", label: "Pocket relocation", codes: [{ cpt: "33222", label: "PM pocket revision/relocation", wrvu: 5.0, modifiers: [] }] }
    ]
  },
  {
    category: "New Defibrillator Implants",
    procedures: [
      { id: "icd_new", label: "Single or dual chamber ICD", codes: [{ cpt: "33249", label: "ICD implant w/ lead(s)", wrvu: 13.0, modifiers: [] }] },
      { id: "icd_biv", label: "Bi-V ICD (CRT-D)", codes: [
        { cpt: "33249", label: "ICD implant w/ lead(s)", wrvu: 13.0, modifiers: [] },
        { cpt: "33225", label: "LV lead insertion at time of implant", wrvu: 7.8, modifiers: [] }
      ] },
      { id: "sicd_new", label: "Subcutaneous ICD + DFT evaluation", codes: [
        { cpt: "33270", label: "S-ICD implant w/ electrode", wrvu: 12.85, modifiers: [] }
      ] },
      { id: "dft", label: "DFT testing at implant (+93641)", codes: [{ cpt: "93641", label: "Defibrillation threshold evaluation", wrvu: 4.0, modifiers: ["26"] }] }
    ]
  },
  {
    category: "Defibrillator Generator Changes / Upgrades",
    procedures: [
      { id: "icdgen_single", label: "Single chamber ICD gen change", codes: [{ cpt: "33262", label: "ICD generator change, single", wrvu: 5.5, modifiers: [] }] },
      { id: "icdgen_dual", label: "Dual chamber ICD gen change", codes: [{ cpt: "33263", label: "ICD generator change, dual", wrvu: 6.0, modifiers: [] }] },
      { id: "icdgen_biv", label: "Bi-V ICD gen change (RA, RV, & LV)", codes: [{ cpt: "33264", label: "ICD generator change, multi-lead", wrvu: 6.5, modifiers: [] }] },
      { id: "icd_upgrade_biv", label: "ICD → Bi-V upgrade (gen change + LV lead)", codes: [
        { cpt: "33264", label: "ICD generator change, multi-lead", wrvu: 6.5, modifiers: [] },
        { cpt: "33225", label: "LV lead insertion", wrvu: 7.8, modifiers: [] }
      ] },
      { id: "icd_new_lead", label: "New RA or RV lead — no generator", codes: [{ cpt: "33216", label: "Insert single transvenous electrode", wrvu: 6.0, modifiers: [] }] },
      { id: "icd_remove_gen", label: "Remove ICD generator only", codes: [{ cpt: "33241", label: "ICD generator removal", wrvu: 4.5, modifiers: [] }] }
    ]
  },
  {
    category: "Loop Recorders & Other Procedures",
    procedures: [
      { id: "ilr_implant", label: "Implantable loop recorder — insert", codes: [{ cpt: "33285", label: "ILR insertion", wrvu: 1.53, modifiers: [] }] },
      { id: "ilr_remove", label: "Implantable loop recorder — removal", codes: [{ cpt: "33286", label: "ILR removal", wrvu: 1.3, modifiers: [] }] },
      { id: "laao", label: "LAA occlusion (Watchman) — 33340", codes: [{ cpt: "33340", label: "Percutaneous LAA closure w/ implant (incl. fluoro, TSP, angiography)", wrvu: 14.0, modifiers: [] }] },
      { id: "cv_ext", label: "Cardioversion — elective external", codes: [{ cpt: "92960", label: "External electrical cardioversion (use -59 if pre-study, native arrhythmia)", wrvu: 2.0, modifiers: ["59"] }] },
      { id: "cv_int", label: "Cardioversion — elective internal", disabledWith: ["svt_abl", "af_abl", "vt_abl", "avn_abl", "eps_ind", "eps_noind", "eps_ltd"],
        codes: [{ cpt: "92961", label: "Internal electrical cardioversion", wrvu: 4.0, modifiers: [] }] },
      { id: "tilt", label: "Tilt table study", codes: [{ cpt: "93660", label: "Tilt table evaluation", wrvu: 1.9, modifiers: ["26"] }] },
      { id: "temp_pm", label: "Temporary pacemaker — single chamber", codes: [{ cpt: "33210", label: "Temporary transvenous pacing electrode", wrvu: 2.5, modifiers: [] }] },
      { id: "mod_sed", label: "Moderate sedation (99152)", codes: [{ cpt: "99152", label: "Moderate sedation, initial 15 min", wrvu: 0.25, modifiers: [] }] },
      { id: "pericardio", label: "Pericardiocentesis w/ imaging", codes: [
        { cpt: "33010", label: "Pericardiocentesis", wrvu: 4.3, modifiers: [] },
        { cpt: "76930", label: "Ultrasound guidance for pericardiocentesis", wrvu: 0.67, modifiers: ["26"] }
      ] }
    ]
  },
  {
    category: "Device Checks (in person)",
    procedures: [
      { id: "pm_eval_s", label: "PM evaluation — single chamber", codes: [{ cpt: "93279", label: "PM programming eval, single", wrvu: 0.65, modifiers: ["26"] }] },
      { id: "pm_eval_d", label: "PM evaluation — dual chamber", codes: [{ cpt: "93280", label: "PM programming eval, dual", wrvu: 0.77, modifiers: ["26"] }] },
      { id: "pm_eval_biv", label: "PM evaluation — Bi-V", codes: [{ cpt: "93281", label: "PM programming eval, multi-lead", wrvu: 0.85, modifiers: ["26"] }] },
      { id: "pm_interr", label: "PM interrogation", codes: [{ cpt: "93288", label: "PM interrogation eval", wrvu: 0.43, modifiers: ["26"] }] },
      { id: "icd_eval_s", label: "ICD evaluation — single chamber", codes: [{ cpt: "93282", label: "ICD programming eval, single", wrvu: 0.85, modifiers: ["26"] }] },
      { id: "icd_eval_d", label: "ICD evaluation — dual chamber", codes: [{ cpt: "93283", label: "ICD programming eval, dual", wrvu: 1.15, modifiers: ["26"] }] },
      { id: "icd_eval_biv", label: "ICD evaluation — Bi-V", codes: [{ cpt: "93284", label: "ICD programming eval, multi-lead", wrvu: 1.25, modifiers: ["26"] }] },
      { id: "icd_interr", label: "ICD interrogation", codes: [{ cpt: "93289", label: "ICD interrogation eval", wrvu: 0.75, modifiers: ["26"] }] },
      { id: "sicd_eval", label: "Sub-Q ICD evaluation", codes: [{ cpt: "93260", label: "S-ICD programming eval", wrvu: 0.85, modifiers: ["26"] }] },
      { id: "sicd_interr", label: "Sub-Q ICD interrogation", codes: [{ cpt: "93261", label: "S-ICD interrogation eval", wrvu: 0.68, modifiers: ["26"] }] }
    ]
  }
];

// Modifier legend shown in the UI when suggesting modifiers.
window.EPT.MODIFIER_LEGEND = {
  "26": "Professional component only",
  "52": "Reduced services",
  "76": "Repeat procedure, same physician, same day",
  "59": "Distinct procedural service (e.g. pre-study cardioversion of native arrhythmia)",
  "53": "Discontinued procedure",
  "KX": "Medicare coverage criteria met (documentation on file)",
  "SC": "Medically necessary service"
};
