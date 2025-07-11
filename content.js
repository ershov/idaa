"use strict";

//console.log("content", document.readyState);

window.modsettings = {};
module.SetDefaults(window.modsettings);
ApplyThemeToModule(window.modsettings, PrefersDark(), true);

function DoStyle() {
  document.head.querySelector("style#gmail_condensed")?.remove();
  document.head.insertAdjacentHTML("beforeend",
      `<style id=gmail_condensed _module=${module.name}>`+module.GenStyle(window.modsettings)+"</style>");
  //console.log("Style applied");
}

var cur_script_id = "";

function Exec(script) {
  document.readyState === "complete" ? setTimeout(script, 1) : window.addEventListener("load", script, {once: true});
}

function DoScript(reload) {
  if (!module.has_scripts) return;
  let scripts = module.GenScriptUrls(window.modsettings);
  let new_script_id = scripts.join(":");
  //console.log(cur_script_id, "->", new_script_id);
  if (new_script_id === cur_script_id) { /*console.log("No script change");*/ return; }
  if (cur_script_id == "") {
    // First time applied script
    //console.log("Schedule script...");
    Exec(module.GetScript(window.modsettings));
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
    storage.get(["gmail_condensed"], res => {
      //console.log(prio, "get settings:", res.gmail_condensed, "last source:", SettingsSource.from);
      if (SettingsSource.from >= prio) return;  // Already applied a higher priority one
      SettingsSource.from = prio;
      if (res.gmail_condensed) {
        Object.assign(window.modsettings, res.gmail_condensed[module.name] || {});
      }
      DoStyle();
      do_script && DoScript(false);
    });
  };
  // Try to load ASAP from local storage, then use the slower synced one
  GetSettingsFromStorage(chrome.storage.local, SettingsSource.LOCAL, false);
  GetSettingsFromStorage(chrome.storage.sync, SettingsSource.SYNC, true);

  let OnChange = (ch, st, reload) => {
    if (!ch.gmail_condensed) return;  // No changes to our settings
    SettingsSource.from = SettingsSource.LOCAL;
    //console.log("Changes at ", st, " : ", ch.gmail_condensed.newValue, "last source:", SettingsSource.from);
    Object.assign(window.modsettings, ch.gmail_condensed.newValue[module.name] || {});
    DoStyleAndScript(reload);
  };
  chrome.storage.local.onChanged.addListener((ch, st) => OnChange(ch, st, false));
  chrome.storage.sync.onChanged.addListener((ch, st) => OnChange(ch, st, true));
}

