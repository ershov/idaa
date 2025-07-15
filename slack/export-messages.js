setTimeout(() => {
let observer = null;
let button = null;
let msgmap = {};

function onButtonClick() {
  if (observer) {
    //console.log("*** stop");
    observer.disconnect();
    observer = null;
    button.innerHTML = "💾";

    //let txt = Object.entries(msgmap).map(([k, v]) => [Number(k), v]).sort().map(([k, v]) => v).join("\n\n");
    //console.log("***", txt);

    let html = Object.entries(msgmap).map(([k, v]) => [Number(k), v]).sort().map(([k, v]) => v).join("<hr>");
    let w = window.open("about:blank");
    let display = () => {
      w.document.head.innerHTML = `<style>
.c-emoji__small { width: 16px; height: 16px; }
.c-emoji--inline.c-emoji__medium img { width: 22px; height: 22px; }
button.c-avatar { padding: 0; border: none; }
.c-mrkdwn__br { height: 8px; display: block; }
.c-pillow_file {
 background: #EEE; border: 1px solid #888; border-radius: 12px; padding: 12px; display: flex; flex-direction: column;
}
.c-mrkdwn__broadcast--mention { color: #660; background: #ffA; }
.p-file_thumbnail__container { display: none; }
.c-message_kit__gutter__left { display: contents; }
.c-message_kit__gutter__left * { display: inline-block; }
.c-message_kit__gutter__right { display: contents; }
</style>`;
      w.document.body.innerHTML = html;
      w.document.querySelectorAll('svg, .c-custom_status, .c-message__reply_bar_description, .c-message__reply_bar_arrow, [data-qa="add_reaction_button"], .offscreen').forEach(e => e.remove());
      w.document.querySelectorAll('[data-qa="timestamp_label"]').forEach(e => e.innerText = new Date(parseFloat(e.parentNode.getAttribute("data-ts"))*1000.));
    };
    display();
    w.document.addEventListener("readystatechange", ()=>{
      if (w.document.readyState !== "complete") return;
      display();
    })
    return;
  }

  function onRecord(ee) {
    if (ee.getAttribute("role") !== "listitem" || !ee.hasAttribute("data-item-key")) return;
    let ts = ee.getAttribute("data-item-key");
    if (Number.isNaN(parseFloat(ts))) return;
    //msgmap[ee.hasAttribute("data-item-key")] = ee.textContent;
    //msgmap[ee.hasAttribute("data-item-key")] = ee.innerText;
    msgmap[ts] = ee.outerHTML;
  }
  function updateRecords(records) {
    for (let n of records) onRecord(n);
    button.innerHTML = `${Object.keys(msgmap).length} ✅`;
  }

  let e =
    document.querySelector('[role].p-view_contents--secondary [role="presentation"].c-scrollbar__child [role="list"]') ||
    document.querySelector('[role].p-view_contents--primary [role="presentation"].c-scrollbar__child [role="list"]');
  if (!e) return;

  observer = new MutationObserver((records, observer) => {
    for (let r of records) updateRecords(r.addedNodes);
  });

  msgmap = {};
  updateRecords(e.childNodes);
  observer.observe(e, {childList: true});
}

function addButton() {
  //if (document.querySelector("#export-button")) return;
  document.querySelector("#export-button")?.remove();
  button = document.createElement("button");
  button.setAttribute("id", "export-button");
  button.style.color = "#fff";
  button.innerHTML = "💾";
  button.addEventListener("click", onButtonClick);
  document.querySelector('[role="toolbar"][data-qa="top-nav"]').appendChild(button);
}

addButton();
}, 3000);
