let isFocused = true;
let savedElement;

function doUpdate() {
    if (!isFocused) return;
    [...document.querySelectorAll(`table[aria-readonly="true"] tr[role="row"] td[role="gridcell"] :is(span[aria-label^="Sun, "],span[aria-label^="Mon, "],span[aria-label^="Tue, "],span[aria-label^="Wed, "],span[aria-label^="Thu, "],span[aria-label^="Fri, "],span[aria-label^="Sat, "])`)].forEach(e => {
        savedElement = e;
        let ee = e.querySelector("span");
        if (ee && ee.innerHTML.match(/^\d/)) {
            ee.innerText = e.title;
        }
    });
}
    function periodicUpdate() {
    if (!isFocused || (savedElement?.isConnected && savedElement?.offsetHeight)) return;
    doUpdate();
}

setInterval(periodicUpdate, 2000);

document.addEventListener("click", ()=>setTimeout(doUpdate, 150));
window.addEventListener("focus", ()=>{isFocused=true; doUpdate();});
window.addEventListener("blur", ()=>isFocused=false);
