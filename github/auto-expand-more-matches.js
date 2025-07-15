setTimeout(()=>
[...document.querySelectorAll('a')].filter(e => e.innerText.match(/^Show \d+ more matches$/)).forEach(e => e.click())
, 400);