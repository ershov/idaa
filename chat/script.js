//// @script All sorts of chats are in one list

if (!window.chatloaded) {

console.log("Chat enhancement code in", window, document);

function SortAll() {
  console.log("SortAll");

  // Mark "pinned" stuff
  [...[...document.querySelectorAll(`[role=list][aria-label="List of Rooms and Direct Messages"] [role=heading]`)].filter(e => e.innerText.match(/^Pinned$/i))[0].parentNode.childNodes].forEach(e => e.setAttribute("pinned", ""));

  // Main list element
  let mainList = [...document.querySelectorAll(`[role=list][aria-label="List of Rooms and Direct Messages"] [role=heading]:not([pinned])`)].filter(e => e.innerText.match(/^CHAT$/i))[0].parentNode.querySelector("[role=list]");

  // Do sort
  let sorted = [...document.querySelectorAll(`[role=list][aria-label="List of Rooms and Direct Messages"] [role=list]:not([pinned]) > [role=listitem]`)]
    .map(e => [parseInt(e.querySelector("[data-absolute-timestamp]").getAttribute("data-absolute-timestamp")), e])
    .sort((a,b) => b[0]-a[0])
    .map(a => a[1]);

  // Order changed?
  if (mainList.childNodes.length === sorted.length &&
    sorted.every((e, i) => e.isSameNode(mainList.childNodes[i]))) {
    console.log("Already sorted");
    return;
  }

  // .forEach(e => mainList.appendChild(e));
  console.log("Sorting");
  mainList.append(...sorted);

  [...document.querySelectorAll(`[role=list][aria-label="List of Rooms and Direct Messages"] [role=heading]:not([pinned]) > [role=button]`)]
    .forEach(e => e.style.display === "none" || (e.style.display="none"));

  Flush();
}

var t = 0;

function SortAllOnUpdate() {
  t = 0;
  SortAll();
}

function OnDomChanged() {
  console.log("OnDomChanged");
  if (t) clearTimeout(t);
  t = setTimeout(SortAllOnUpdate, 1000);
}

var observers = [];

function AddObserver(e) {
  let o = new MutationObserver(OnDomChanged);
  o.observe(e, {
    subtree: false,
    childList: true,
    attributes:false,
    characterData: true,
  });
  observers.push(o);
}
function Unobserve() {
  observers.forEach(o => o.disconnect());
  o = [];
}
function Flush() {
  observers.forEach(o => o.takeRecords());
}

var backButtonSvg;
function ReplaceBackButton() {
  let e = document.querySelector("div[role=button][aria-label=Back] svg");
  if (!e) return;

  let innerHTML = `<path d="M0 0h24v24H0z" fill="none"></path><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>`;
  if (e.innerHTML === innerHTML) return;

  e.innerHTML = innerHTML;
  if (!e.isSameNode(backButtonSvg)) {
    new MutationObserver(ReplaceBackButton)
      .observe(e,
        {
          subtree: false,
          childList: true,
          attributes: false,
          characterData: true,
        });
    backButtonSvg = e;
  }
}

function ObserveReplaceBackButton() {
  new MutationObserver(ReplaceBackButton)
    .observe(document.querySelector(`[role=banner][aria-label="Chat: Top Navigation"] > :last-child > [jsname]`),
      {
        subtree: false,
        childList: true,
        attributes: false,
        characterData: true,
      });
}

function Run() {
  SortAll();
  [...document.querySelectorAll(`[role=list][aria-label="List of Rooms and Direct Messages"] [role=list]:not([pinned])`)].forEach(e => AddObserver(e));
  ObserveReplaceBackButton();
  ReplaceBackButton();
}

console.log(document.readyState);

//document.readyState === "complete" ?
document.readyState !== "loading" ?
  Run() :
  window.addEventListener("load", Run);
console.log(document.readyState);

document.addEventListener("DOMContentLoaded", e => console.log("DOMContentLoaded", e))

console.log("Chat enhancement code out", window, document);
window.chatloaded = true;
}
