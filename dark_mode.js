
function PrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function ApplyThemeToAll(settings, dark, override = false) {
  for (module of module_names) {
    if (!settings[module]) {
      if (!override) continue;
      settings[module] = {};
    }
    ApplyThemeToModule(settings[module], dark, override);
  }
}

function ApplyThemeToModule(modsettings, dark, override) {
  if (!override && modsettings?.dark_mode?.hasOwnProperty("_enabled")) return;
  modsettings.dark_mode ||= {};
  modsettings.dark_mode._enabled = dark;
}

