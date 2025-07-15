document.addEventListener("keydown", ev =>
  ev.key==="`" &&
  (ev.ctrlKey || !["INPUT","TEXTAREA","SELECT", "OPTION"].includes(document.activeElement.tagName)) &&
  (ev.preventDefault(), document.querySelector(`[aria-label="Main drawer"]`)?.click()));
