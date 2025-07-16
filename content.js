"use strict";

//console.log("content", document.readyState);

function LoadModule(module) {

console.log("Load Module", module.name);

let modsettings = {};
if (!window.settings) window.settings = {};
window.settings[module.name] = modsettings;
module.SetDefaults(modsettings);
ApplyThemeToModule(modsettings, PrefersDark(), true);

function DoStyle() {
  document.head.querySelector(`style#idaa_style__${module.name}`)?.remove();
  document.head.insertAdjacentHTML("beforeend",
      `<style id=idaa_style__${module.name} _module=${module.name}>`+module.GenStyle(modsettings)+"</style>");
  //console.log("Style applied");
}

let cur_script_id = "";

function Exec(script) {
  document.readyState === "complete" ? setTimeout(script, 1) : window.addEventListener("load", script, {once: true});
}

function DoScript(reload) {
  if (!module.has_scripts) return;
  let scripts = module.GenScriptUrls(modsettings);
  let new_script_id = scripts.join(":");
  //console.log(cur_script_id, "->", new_script_id);
  if (new_script_id === cur_script_id) { /*console.log("No script change");*/ return; }
  if (cur_script_id == "") {
    // First time applied script
    //console.log("Schedule script...");
    Exec(module.GetScript(modsettings));
    cur_script_id = new_script_id;
  } else {
    // script changed: can't override existing script
    //console.log("Script changed: will reload");
    reload && setTimeout(()=>location.reload(), 100);
  }
}

function DoStyleAndScript(reload) {
  DoStyle();
  DoScript(reload);
}

class SettingsSource {
  static NONE = 1;
  static LOCAL = 1;
  static SYNC = 2;
  static CHANGE = 3;
  static from = 0;
};

//DoStyle();

if (chrome.storage) {
  let GetSettingsFromStorage = (storage, prio, do_script) => {
    storage.get(["idaa_settings"], res => {
      //console.log(prio, "get settings:", res.idaa_settings, "last source:", SettingsSource.from);
      if (SettingsSource.from >= prio) return;  // Already applied a higher priority one
      SettingsSource.from = prio;
      if (res.idaa_settings) {
        Object.assign(modsettings, res.idaa_settings[module.name] || {});
        window.settings[module.name] = modsettings;
      }
      DoStyle();
      do_script && DoScript(false);
    });
  };
  // Try to load ASAP from local storage, then use the slower synced one
  GetSettingsFromStorage(chrome.storage.local, SettingsSource.LOCAL, false);
  GetSettingsFromStorage(chrome.storage.sync, SettingsSource.SYNC, true);

  let OnChange = (ch, st, reload) => {
    if (!ch.idaa_settings) return;  // No changes to our settings
    SettingsSource.from = SettingsSource.LOCAL;
    //console.log("Changes at ", st, " : ", ch.idaa_settings.newValue, "last source:", SettingsSource.from);
    Object.assign(modsettings, ch.idaa_settings.newValue[module.name] || {});
    window.settings[module.name] = modsettings;
    DoStyleAndScript(reload);
  };
  chrome.storage.local.onChanged.addListener((ch, st) => OnChange(ch, st, false));
  chrome.storage.sync.onChanged.addListener((ch, st) => OnChange(ch, st, true));
}

}
