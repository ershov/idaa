// @script Add hotkeys

function MouseEv(type, element) {
  let ev = new MouseEvent(type, {
    altKey: false,
    bubbles: true,
    button: 0,
    buttons: 0,
    cancelBubble: false,
    cancelable: true,
    clientX: 595,
    clientY: 264,
    composed: true,
    ctrlKey: false,
    currentTarget: null,
    defaultPrevented: true,
    detail: 1,
    eventPhase: 0,
    fromElement: null,
    isTrusted: true,
    kI: 0,
    layerX: 250,
    layerY: 19,
    metaKey: false,
    movementX: 0,
    movementY: 0,
    now: 4190267.433,
    offsetX: 251,
    offsetY: 20,
    pageX: 595,
    pageY: 264,
    path: [...(function*(e){do { yield e; } while (e = e.parentNode);})(element)],
    relatedTarget: null,
    returnValue: false,
    screenX: 595,
    screenY: 399,
    shiftKey: false,
    srcElement: element,
    target: element,
    timeStamp: 4190250.480000017,
    toElement: element,
    type: type,
    view: window,
    which: 1,
    x: 595,
    y: 264,
  });
  Object.defineProperty(ev, 'target', {value: element, enumerable: true});
  Object.defineProperty(ev, 'currentTarget', {value: element, enumerable: true});
  Object.defineProperty(ev, 'relatedTarget', {value: element, enumerable: true});
  Object.defineProperty(ev, 'toElement', {value: element, enumerable: true});
  Object.defineProperty(ev, 'fromElement', {value: element, enumerable: true});
  Object.defineProperty(ev, 'srcElement', {value: element, enumerable: true});
  Object.defineProperty(ev, 'path', {value: [...(function*(e){do { yield e; } while (e = e.parentNode);})(element)], enumerable: true});
  return ev;
}

function click(e) {
  ["mousedown", "click", "mouseup"].forEach(t => e.dispatchEvent(MouseEv(t, e)));
}

var keys = {
  Digit1: "drawingButton",
  Digit2: "eraserButton",
  Digit3: "selectorButton",
  Digit4: "stickyNoteButton",
  Digit5: "imageButton",
  Digit6: "shapeButton",
  Digit7: "textBoxButton",
  Digit8: "laserButton",

  KeyP: "drawingButton",
  KeyB: "drawingButton",
  KeyE: "eraserButton",
  KeyH: "selectorButton",
  KeyN: "stickyNoteButton",
  KeyI: "imageButton",
  KeyS: "shapeButton",
  KeyT: "textBoxButton",
  KeyL: "laserButton",
};

var rkeys = Object.entries(keys)
  .map(([k,v]) => [k.replace(/^Key|Digit/, "").toLowerCase(),v])
  .reduce((a, [k,v]) => ((a[v]=a[v] ? [...a[v], k] : [k]), a), {});



/* Add keybord handlers */
[document, document.querySelector(`iframe.docs-texteventtarget-iframe`).contentWindow.document].forEach(d => {
  d.addEventListener("keypress", ev => {
    if (["INPUT", "LABEL", "SELECT", "TEXTAREA", "BUTTON", "FIELDSET", "LEGEND", "DATALIST", "OUTPUT", "OPTION", "OPTGROUP", ].includes(document.activeElement.tagName)) return;
    let id = keys[ev.code];
    if (!id) return;
    click(document.getElementById(id));
    ev.preventDefault();
  });
});

/* Add shortcut notes */
document.head.insertAdjacentHTML("beforeEnd", `<style id="hotkey">
.hotkey {
  position: absolute;
  left: -2px;
  top: -3px;
  color: #0008;
  z-index: 1000;
  text-shadow:
     0.5px  0.5px 1px white,
    -0.5px  0.5px 1px white,
     0.5px -0.5px 1px white,
    -0.5px -0.5px 1px white;
  font-size: 90%;
}
div[aria-pressed="true"] .hotkey {
  color: #000;
}
</style>`);
Object.entries(rkeys).forEach(mapping => {
  let [id, keys] = mapping;
  keys = keys.join("&nbsp; ");
  document.getElementById(id).insertAdjacentHTML("afterBegin",
    `<div class=hotkey title="${id.replace(/Button$/, "")} shortcuts: ${keys}">${keys}</div>`);
});

/* Hotkey autohide */
//document.head.insertAdjacentHTML("beforeEnd", `<style id="hotkeyautohide">
//.hotkey {
//  display: none;
//}
//.jam-vertical-toolbar:hover .hotkey {
//  display: block;
//}
//</style>`);

/* Hotkeys in tooltips */
document.head.insertAdjacentHTML("beforeEnd", `<style id="tooltip-hotkey">
.tooltip-hotkey {
  font-size: 85%;
  opacity: 60%;
}
</style>`);
var tooltip_t = 0;
var toolbar = document.getElementById("jam-vertical-toolbar");
var observer = new MutationObserver(()=>{
  observer.takeRecords();
  clearTimeout(tooltip_t);
  tooltip_t = setTimeout(OnTooltipDisplay, 800);
});
observer.observe(toolbar, {attributes: true});
var observer2;
function OnTooltipDisplay() {
  if (!toolbar.hasAttribute("aria-activedescendant")) return;
  let id = toolbar.getAttribute("aria-activedescendant");
  let keys = rkeys[id];
  if (!keys) return;
  let tooltip = document.querySelector(".jam-vertical-toolbar-tooltip[role=tooltip]:not(.jfk-tooltip-hide) > .jfk-tooltip-contentId");
  if (!tooltip) return;
  tooltip.insertAdjacentHTML("beforeEnd", "<BR><span class=tooltip-hotkey>Hotkeys: "+keys.map(k => `"${k}"`).join(" or ")+"</span>");
  if (!observer2) {
    observer2 = new MutationObserver(()=>{
      OnTooltipDisplay();
      observer2.takeRecords();
    });
    observer2.observe(tooltip, {attributes: true, subtree: true, childList: true, characterData: true});

    observer.disconnect();
    observer = undefined;
  }
}
[...document.querySelectorAll(".jam-vertical-toolbar .hotkey")].forEach(e => e.removeAttribute("title"));


