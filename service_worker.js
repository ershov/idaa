"use strict";

importScripts('gen_module_names.js', 'gen_urlmap.js', 'dark_mode.js');

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
            chrome.tabs.create({url: chrome.runtime.getURL('options.html')});
        }
    }
});

// Hotkey commands

// fn(settings, module) -> modified: bool
function ForAll(fn) {
  return () => chrome.storage.local.get( ["idaa_settings"], res => {
    let settings = res.idaa_settings;
    console.log("got local settings:", res.idaa_settings);

    // Detect current "global" by current site OR current majority
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      let tab = tabs[0];
      settings ||= {};
      // let module = Url2Mod(tab.url);
      // if (!fn(settings, module)) return;
      if (!Url2Mods(tab.url).filter(module => fn(settings, module)).length) return;

      chrome.storage.local.set(
          {idaa_settings: settings, who: -1},
          ()=>console.log("saved local"));
      chrome.storage.sync.set(
          {idaa_settings: settings, who: -1},
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
  return () => chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    let tab = tabs[0];
    // let module = Url2Mod(tab.url);
    // if (!module) {
    //   console.log("Unknown site");
    //   return;
    // }
    let modules = [...Url2Mod(tab.url)];
    if (!modules.length) {
      console.log("Unknown site");
      return;
    }
    chrome.storage.local.get( ["idaa_settings"], res => {
      let settings = res.idaa_settings;
      console.log("got local settings:", res.idaa_settings);
      settings ||= {};
      for (let module of modules) settings[module] ||= {};
      // if (!fn(settings[module], module)) return;
      if (!modules.filter(module => fn(settings[module], module)).length) return;

      chrome.storage.local.set(
          {idaa_settings: settings, who: -1},
          ()=>console.log("saved local"));
      chrome.storage.sync.set(
          {idaa_settings: settings, who: -1},
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
  if (!ch.idaa_settings) return;
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
        chrome.storage.local.get( ["idaa_settings"], res => {
          console.log("got local settings:", res.idaa_settings);
          chrome.storage.sync.set(
              {idaa_settings: res.idaa_settings, who: -1},
              ()=>console.log("saved sync"));
          changed = false;
        });
    });
});

