"use strict";

// TODO: Watch for JSON.stringify(window.settings).length to fit into 8KB limit

var me = Math.floor(Math.random()*1000000000);

function SaveSync() {
  //console.log("Save settings sync");
  chrome?.storage?.sync?.set(
    {gmail_condensed: window.settings, who: ++me},
    ()=>console.log("saved sync"));
}

function SaveLocal() {
  //console.log("Save settings local", new Error().stack, window.settings);
  chrome?.storage?.local?.set(
    {gmail_condensed: window.settings, who: ++me},
    ()=>console.log("saved local"));
}

function set_master_state(root, sel, ...masters) {
  let has_checked = [...root.querySelectorAll(sel)].some(c => c.checked);
  let has_unchecked = [...root.querySelectorAll(sel)].some(c => !c.checked);
  let has_indeterminate = [...root.querySelectorAll(sel)].some(c => c.indeterminate);
  let indeterminate = has_indeterminate || (has_unchecked && has_checked);
  masters.forEach(e => { e.checked = !has_unchecked; e.indeterminate = indeterminate});
}

// Init master switches

function SetAllMasterStates(master_ids, exclude_ids = []) {
  // Find recursively all masters of masters and fix their state
  master_ids = new Set(master_ids);
  while (1) {
    let master_ids2 = new Set([
      ...master_ids,
      ...[...master_ids].map(id => document.getElementById(id)._masters || []).flat(1)
    ]);
    if (master_ids.size == master_ids2.size) break;
    master_ids = master_ids2;
  }
  exclude_ids.forEach(id => master_ids.delete(id));
  master_ids.forEach(id => set_master_state(document, document.getElementById(id).getAttribute("_for"), document.getElementById(id)));
}

function BulkCheck(checked, sel) {
  let elems = [...document.querySelectorAll(sel)];
  //let masters = new Set(elems.map(e => e._masters).flat(1));
  let masters = new Set();
  let forms = new Set();
  elems.forEach(e => {
    if (e.checked != checked) {
      e.checked = checked;
      e._masters.forEach(m => masters.add(m));
      if (e.form) forms.add(e.form);
    }
  });
  if (forms.size) {
    for (let form of forms) {
      let module = form.getAttribute("_module");
      modules_map[module].ImportSettingsFromForm(form, window.settings[module]);
      SetModuleEnabled(module, form.elements.module_enable.checked);
    }
    SaveLocal();
  }
  return masters;
}

function FixAllMasters() {
  SetAllMasterStates([...document.querySelectorAll("[_master][_for]")].map(master => master.id));
}

[...document.querySelectorAll("[_master][_for]")].forEach(master => {
  let sel = master.getAttribute("_for");
  [...document.querySelectorAll(sel)].forEach(e => {
    e.addEventListener("change", ev => set_master_state(document, sel, master));
    e._masters = [...(e._masters || []), master.id];
  });
  master.addEventListener("change", ev => {
    SetAllMasterStates(BulkCheck(ev.target.checked, sel), [ev.target.id]);
  });
  set_master_state(document, sel, master);
});

function SetModuleEnabled(module, checked) {
  document.querySelector(`#${module}_enable_ext`).checked = document.querySelector(`#${module}_module_enable`).checked = checked;
  document.querySelector(`#${module}_form`).style.filter = checked ? "" : "grayscale(1) opacity(0.5)";
  window.settings[module]["_module_enabled"] = checked;
  set_master_state(document, "input[name=module_enable],input[name=module_enable_ext]", document.getElementById("module_enable_ext_master"));
}

// Module enable/disable
[...document.querySelectorAll("input[name=module_enable_ext],input[name=module_enable]")].forEach(e => e.addEventListener("change", ev => {
  let e = ev.target;
  let module = e.getAttribute("_module");
  SetModuleEnabled(module, e.checked);
  document.querySelector(`#${module}_tab`).checked = true;
  SaveLocal();
}));

// Uses 'this' and 'event'
function event_on_form_change(ev, form) {
  ev = ev || event;
  let e = ev.target;
  form = form || this || e.form;
  let module = form.getAttribute("_module");
  let section = e.getAttribute("_section_id");
  let setting = e.getAttribute("_setting_id");
  if (e.getAttribute("_byval")) {
    window.settings[module][e.name] = e.type == "checkbox" ? !!e.checked : e.value;
    return;
  }
  if (section == null || setting == null) return;
  if (e.type == "checkbox") {
    window.settings[module][section][setting] = e.checked;
  } else {
    window.settings[module][section][setting] = on_value_change(e.value,
      parseInt(e.getAttribute("_default")),
      form.elements[`${module}_${section}_${setting}_val`],
      form.elements[`${module}_${section}_${setting}_range`]);
  }
}

function on_value_change(val, def, elem, range) {
  if (isNaN(val = parseInt(val))) val = def;
  if (val >= parseInt(range.max)) range.max = Math.ceil(val*1.5);
  range.value = elem.value = val;
  return val;
}

[...document.forms].forEach(form => {
  form.addEventListener("change", event_on_form_change);
  if (form.querySelectorAll("input[type=checkbox][_setting_id]").length == 1) {
    let ul = form.querySelector("ul");
    ul.style.display = "none";
    [...form.querySelectorAll("label")].forEach(e => ul.insertAdjacentHTML("beforeBegin", e.innerHTML));
  }
});
[...document.forms].forEach(form => form.addEventListener("change", ev => !ev.target.hasAttribute("_master") && SaveLocal()));

ApplyThemeToAll(window.settings, PrefersDark(), true);
ApplySettingsToAllForms(window.settings);
FixAllMasters();

// Handle links

chrome.tabs && [...document.querySelectorAll("a")].forEach(e => e.onclick = ev => {
    ev.preventDefault();
    chrome.tabs.create({url:e.href});
  });

// Settings storage

function ApplySettingsToAllForms(settings) {
  for (let module of modules) {
    let form = document.querySelector(`#${module.name}_form`);
    module.ApplySettingsToForm(window.settings[module.name], form);

    let module_enable_ext = document.querySelector(`#${module.name}_enable_ext`);
    let checked = window.settings[module.name]?._module_enabled !== false;
    SetModuleEnabled(module.name, checked);
  }
  FixAllMasters();
}

chrome?.storage?.sync.get( ["gmail_condensed"], res => {
  console.log("get settings:", res.gmail_condensed);
  if (!res.gmail_condensed) return;
  ApplySettingsToAllForms(Object.assign(window.settings, res.gmail_condensed));
});

chrome?.storage?.onChanged.addListener((ch, st) => {
  if (!ch.gmail_condensed) return;
  if (ch.who && ch.who.newValue == me) {
    console.log("Ignore changes by myself");
    return;
  }
  console.log("Changes at", st, " : ", ch.gmail_condensed.newValue);
  ApplySettingsToAllForms(Object.assign(window.settings, ch.gmail_condensed.newValue));
});

all_apply.addEventListener("click", SaveSync);

all_reset.addEventListener("click", () => {
  setTimeout(()=>{
    for (let module of modules) {
      let form = document.querySelector(`#${module.name}_form`);
      module.SetDefaults(window.settings[module.name]);
      SetModuleEnabled(module.name, true);
    }
    ApplyThemeToAll(window.settings, PrefersDark(), true);
    ApplySettingsToAllForms(window.settings);
    SaveLocal();
  }, 1);
});

all_load.addEventListener("click", function () {
  chrome?.storage?.sync.get( ["gmail_condensed"], res => {
    console.log("get settings:", res.gmail_condensed);
    if (!res.gmail_condensed) return;
    ApplySettingsToAllForms(Object.assign(window.settings, res.gmail_condensed));
    SaveLocal();
  });
});

// Automatic save settings by background page upon window close

var port = chrome?.runtime?.connect({});

// Select the tab for the current site

chrome?.tabs?.query({active: true, currentWindow: true}, tabs => {
  let tab = tabs[0];
  if (tab) {
    let module = Url2Mod(tab.url);
    if (module) window[`${module}_tab`]?.click();
  }
});

