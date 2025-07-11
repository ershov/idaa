// chrome.storage.sync.clear(()=>console.log("sync ok")); chrome.storage.local.clear(()=>console.log("local ok"));
window.settings = {};
for (let module of modules) {
  //console.log(module.name);
  window.settings[module.name] = {};
  document.write(`
  <li class="tab">
    <input type="radio" name="tabs" id="${module.name}_tab" _module=${module.name}/>
    <label for="${module.name}_tab"><input type=checkbox checked id="${module.name}_enable_ext" name="module_enable_ext" _module=${module.name}> ${module.name}</label>
    <div class="tab-content">
      <form action="#" id=${module.name}_form autocomplete=off _module=${module.name}>
        <fieldset>
          <legend><input type=checkbox checked name=module_enable id=${module.name}_module_enable _module=${module.name}>Enable ${module.name}</legend>
          <h3>Settings for ${module.name}</h3>
${module.descr ? `<p><center>${module.descr}</center></p>` : ""}
          <ul>
            <input type=checkbox id=${module.name}_all checked name=module_check_master class=master_checkbox _master _for="form#${module.name}_form input[type=checkbox][_section_id]">
${module.GenSettingsUi(window.settings[module.name])}
          </ul>
        </fieldset>
      </form>
    </div>
  </li>
`);
}
