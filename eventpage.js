"use strict";

// chrome.storage.sync.clear(()=>console.log("sync ok")); chrome.storage.local.clear(()=>console.log("local ok"));

// Install and Update trigger

chrome.runtime.onInstalled.addListener(function (details) {
    console.log("Install: ", details);
    if (details.reason != "install" && details.reason != "update") return;
    chrome.tabs.query({'url' : urlmap.map(u => u[0]), discarded: false}, tabs => {
        console.log("Install reload tabs: ", tabs);
        tabs.forEach(tab => chrome.tabs.reload(tab.id));
    });
    if (details.reason == "install") {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    }
});

// Hotkey commands

// fn(settings, module) -> modified: bool
function ForAll(fn) {
  return () => chrome.storage.local.get( ["gmail_condensed"], res => {
    let settings = res.gmail_condensed;
    console.log("got local settings:", res.gmail_condensed);

    // Detect current "global" by current site OR current majority
    chrome.tabs.getSelected(null, tab => {
      settings ||= {};
      let module = Url2Mod(tab.url);
      if (!fn(settings, module)) return;

      chrome.storage.local.set(
          {gmail_condensed: settings, who: -1},
          ()=>console.log("saved local"));
      chrome.storage.sync.set(
          {gmail_condensed: settings, who: -1},
          ()=>console.log("saved sync"));
      changed = false;
    });
  });
}

function SwitchGlobalState(settings, module, modPeekFn) {
  let disabled;
  if (module) {
    disabled = modPeekFn(settings?.[module]) === false;
  } else {
    let disables = module_names.filter(module => modPeekFn(settings?.[module]) === false).length;
    disabled = disables > module_names.length/2;
  }
  return disabled;
}

// fn(modsettings, module) -> modified: bool
function ForCurrent(fn) {
  return () => chrome.tabs.getSelected(null, tab => {
    let module = Url2Mod(tab.url);
    if (!module) {
      console.log("Unknown site");
      return;
    }
    chrome.storage.local.get( ["gmail_condensed"], res => {
      let settings = res.gmail_condensed;
      console.log("got local settings:", res.gmail_condensed);
      settings ||= {};
      settings[module] ||= {}
      if (!fn(settings[module], module)) return;

      chrome.storage.local.set(
          {gmail_condensed: settings, who: -1},
          ()=>console.log("saved local"));
      chrome.storage.sync.set(
          {gmail_condensed: settings, who: -1},
          ()=>console.log("saved sync"));
      changed = false;
    });
  });
}

let SwitchDarkModeGlobal = ForAll((settings, module) => {
  let dark = SwitchGlobalState(settings, module, modsettings => modsettings?.dark_mode?._enabled);
  ApplyThemeToAll(settings, dark, true);
  return true;
});

let SwitchDarkModeCurrent = ForCurrent((modsettings, module) => {
  let dark = modsettings?.dark_mode?._enabled === false;
  ApplyThemeToModule(modsettings, dark, true);
  return true;
});

let SwitchEnabledGlobal = ForAll((settings, module) => {
  let disabled = SwitchGlobalState(settings, module, modsettings => modsettings?._module_enabled);
  for (module of module_names) {
    settings[module] ||= {};
    settings[module]._module_enabled = disabled;  // invert
  }
  return true;
});

let SwitchEnabledCurrent = ForCurrent((modsettings, module) => {
  let disabled = modsettings?._module_enabled === false;
  modsettings._module_enabled = disabled;  // invert
  return true;
});

chrome.commands.onCommand.addListener(command => {
  console.log(`Command "${command}" called`);
  ({
    "switch-dark-mode-global": SwitchDarkModeGlobal,
    "switch-dark-mode-current": SwitchDarkModeCurrent,
    "switch-ext-global": SwitchEnabledGlobal,
    "switch-ext-current": SwitchEnabledCurrent,
  })[command]?.();
});


// Automatically save settings to sync storage upon settings window close

var ports = {};
var changed = false;
var port_id = 0;

chrome.storage.onChanged.addListener((ch, st) => {
  if (!ch.gmail_condensed) return;
  changed = true;
});

chrome.runtime.onConnect.addListener(function(port) {
    let id = ++port_id;
    console.log("connect", id);
    ports[id] = port;
    port.onDisconnect.addListener(()=>{
        console.log("disconnect", id);
        delete ports[id];

        if (!changed) return;
        console.log("Transfering settings from local to sync");
        chrome.storage.local.get( ["gmail_condensed"], res => {
          console.log("got local settings:", res.gmail_condensed);
          chrome.storage.sync.set(
              {gmail_condensed: res.gmail_condensed, who: -1},
              ()=>console.log("saved sync"));
          changed = false;
        });
    });
});

