function AddPrintPutton() {
  let e = document.querySelector(`[aria-label="Settings"]`).parentElement.parentElement;
  let e2 = e.cloneNode();
  let button = document.createElement("button");
  button.style.border = "none";
  button.setAttribute("print-layout", "");
  button.setAttribute("title", "Conversation view / Print layout");
  let img = document.createElement("img"); img.src = "https://fonts.gstatic.com/s/i/googlematerialicons/print/v11/24px.svg";
  e2.appendChild(button);
  button.appendChild(img);
  e.insertAdjacentElement("beforeBegin", e2);
  button.onclick = () => {
    ExpandConversation();
    Print();
  };
}

function ExpandConversation() {
  document.querySelector(`div[aria-label="Expand all"]`)?.click();
}

function Print() {
  if (!document.querySelector(`c-wiz:not([style*="display: none"]) > c-wiz [role=list] > section`)) {
    alert("Go to a conversation view for a print view");
    return;
  }

  var myPolicy = trustedTypes.createPolicy('myPolicy', {createHTML: (string, sink) => string});
  function HTML(txt) { return myPolicy.createHTML(txt); }

  let w = window.open("about:blank", "_blank", "toolbar=no,scrollbars=yes,menubar=no");

  let list = document.querySelector(`c-wiz:not([style*="display: none"]) > c-wiz [role=list]`);
  let heading = list.parentElement.parentElement.querySelector("h1");

  w.document.head.insertAdjacentHTML("beforeEnd", HTML(`<base href="${location.href}">`));
  w.document.head.insertAdjacentHTML("beforeEnd", HTML(`<title>${heading.innerText}</title>`));
  window.modsettings.dark_mode._enabled && w.document.head.insertAdjacentHTML("beforeEnd", HTML(`<style>
@media screen {
html {
  filter: invert(100%) hue-rotate(180deg) !important;
  background-color: white;
}
img {
  filter: hue-rotate(-180deg) invert(100%) !important;
}
}
</style>`));
  w.document.head.insertAdjacentHTML("beforeEnd", HTML(`<style>
* {
  overscroll-behavior: none;
}
body {
  font-family: Roboto, sans-serif;
  font-size: ${window?.modsettings?.print_layout?.font_size || 14}px;
}
</style>`));

  w.document.body.insertAdjacentHTML("beforeEnd", HTML(`<a href="${location.href}">${location.href}</a>`));
  w.document.body.append(heading.cloneNode(true));

  let e = list.cloneNode(true);
  // Remove "to"
  [...e.querySelectorAll("section[role=listitem] > div > div > div > div > div > span")].forEach(e => e.remove());
  // Remove per-message buttons
  [...e.querySelectorAll(`div[role=button][aria-label="Reply all"]`)].forEach(e => { e.previousSibling.remove(); e.nextSibling.remove(); e.remove(); });
  // Remove replies and signatures
  [...e.querySelectorAll("section[role=listitem] > * > * > * > * > html-blob:first-of-type")].forEach(e => {while (e.nextSibling) e.nextSibling.remove();});
  [...e.querySelectorAll("[data-smartmail=gmail_signature]")].forEach(e => {
    // Avoid removing all of it in case there is nothing else. Don't leave empty message.
    let blob = e.closest("html-blob");
    blob && blob.innerText.replace(/[\r\n\t ]/g, "") !== e.innerText.replace(/[\r\n\t ]/g, "") && e.remove();
  });

  let style = `
/* Author avatar on the left */
.${e.querySelector("section > div > div").classList[0]} {
  display: flex;
}
/* Author name inline */
.${e.querySelector("section h3").classList[0]} {
  display: inline;
}
/* Name and date in line */
.${e.querySelector("section h3").parentElement.parentElement.classList[0]} {
  display: flex;
  justify-content: space-between;  /* Date sticks to the right */
}
/* Date sticks to the right */
.${e.querySelector("section > div > div").children[1].classList[0]} {
  flex-grow: 1;
}
/* Hide "short date" */
.${e.querySelector("section h3").parentElement.nextElementSibling.children[1].classList[0]} {
  display: none;
}
/* Space before date */
.${e.querySelector("section h3").parentElement.nextElementSibling.children[0].classList[0]} {
  margin-left: 1em;
}
/* Messages separator */
section {
  border-bottom: 1px solid #e8eaed;
  padding: 0.5em 0.3em;
}
`;

  w.document.head.insertAdjacentHTML("beforeEnd", HTML(`<style>${style}</style>`));

  w.document.body.append(e);
}

AddPrintPutton();

