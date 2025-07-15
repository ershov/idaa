setTimeout(()=>[...document.querySelectorAll('a[href$="/files"], a[href*="/commits/"')].forEach(e => {
  if (e.href.includes("w=1")) return;
  let ch = e.href.includes("?") ? "&" : "?";
  e.setAttribute("href", `${e.getAttribute("href")}${ch}w=1`);
})
, 1000);