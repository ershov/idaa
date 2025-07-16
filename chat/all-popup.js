
function IsInRosterIframe() {
  return location.href.indexOf("roster-iframe") != -1 &&
         document.querySelector(`[role=list][aria-label^="List of "] [role=list] > [role=listitem]`);
}

function ClickHandler(ev) {
  //console.log("popup: click?");
  if (WantToStop()) return;
  let e = ev.target, listitem = e.closest("[role=listitem]"), isButton = e.closest("[role=button]");
  if (!listitem || isButton) return;
  //console.log("popup: click");
  let popOutButton = listitem.querySelector(`[role=button][aria-label="Open in a pop-up"]`)
  if (!popOutButton) return;
  ev.stopPropagation();
  popOutButton.click();
}

function InstallClickHandler() {
  if (WantToStop()) return;
  [...document.querySelectorAll(`[role=list][aria-label^="List of "] [role=list]`)].forEach(e => {
    if (e.has_click_handler) return;
    e.addEventListener("mousedown", ClickHandler, true);
    e.has_click_handler = true;
  });
}

function WantToStop() {
  if (top == window) return false;
  if (window.settings["chat"].popup_embedded_only._enabled && IsEmbeddedInChat()) {
    //console.log("STOP", window);
    UninstallAll();
    return true;
  }
  return false;
}

function UninstallAll() {
  observer_timer && clearTimeout(observer_timer);
  observer_timer = 0;
  observer?.disconnect();
  observer = null;
  [...document.querySelectorAll(`[role=list][aria-label^="List of "] [role=list]`)].forEach(e => {
    e.removeEventListener("mousedown", ClickHandler, true);
    e.has_click_handler = false;
  });
}

// Can give false negative during loading time
function IsEmbeddedInChat() {
  // Not an iframe?
  //if (!top || top === window) return false;

  let ex;
  // Can read location directly?
  try {
    return top.location.href.indexOf("/mail.google.com/chat/") != -1;
  } catch (ex) {}

  return location.hash.indexOf("embed=chat") != -1;
}

var observer_timer = 0;
var observer;

function AddIframeMarkers() {
  [...document.querySelectorAll(`iframe[src*="roster-iframe"]:not([src*="embed=chat"])`)].forEach(frame => {
    let hash = frame.src.match(/#.*$/)?.[0];
    if (hash) {
      frame.src = frame.src.replace(/#.*$/, hash + "&embed=chat")
    } else {
      frame.src += "#embed=chat";
    }
  });
}

function OnChange() {
  observer_timer = 0;
  //console.log(top == window, "OnChange");
  if (top == window) {
    AddIframeMarkers();
  } else {
    InstallClickHandler();
  }
}

function InstallObserver() {
  if (window.popup_observer_installed) return;
  window.popup_observer_installed = true;
  //console.log(top == window, "InstallObserver", window);

  OnChange();
  observer = new MutationObserver(()=>{
    observer.takeRecords();
    if (WantToStop()) return;
    if (!observer_timer) observer_timer = setTimeout(OnChange, 300);
  });
  observer.observe(document.body, {attributes: false, subtree: true, childList: true, characterData: false});
}

function Run() {
  if (!window.all_popup_installed && window.settings["chat"].popup._enabled) {
    window.all_popup_installed = true;

    // Always load in top window
    if (top == window) {
      InstallObserver();
      return;
    }

    // Load only in roster iframes
    if (!IsInRosterIframe()) {
      //console.log("Not loading (1)", window);
      return;
    }

    // If using pop-out everywhere
    if (!window.settings["chat"].popup_embedded_only._enabled) {
      InstallObserver();
      return;
    }

    // Using pop-out in embedded chats only
    if (!IsEmbeddedInChat()) {
      InstallObserver();
      return;
    }
  } else {
    //console.log("popup: not loading", window);
  }
}

setTimeout(Run, 2000);

