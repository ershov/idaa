
function ClickHandler(ev) {
  //console.log("link: click 1");
  let e = ev.target;
  let a = e?.closest(`a[href]`);
  if (!a) return;  // not a link
  //console.log("link: click 2");
  let is_open_in_chat = e.tagName === "SPAN" && e.innerHTML === "Open in chat";
  if (is_open_in_chat) return;  // specifically clicked on "Open in chat" button
  //console.log("link: click 3");
  let new_tab_button = a.querySelector(`[role=application][aria-label="Open in new tab"]`);
  if (!new_tab_button) return;  // this "a" doesn't have a "New tab" button
  //console.log("link: click 4");
  ev.stopPropagation();
  new_tab_button.click();
}

function InstallClickHandler() {
  if (document.has_links_click_handler) return;
  document.addEventListener("mousedown", ClickHandler, true);
  document.has_links_click_handler = true;
}

InstallClickHandler();

