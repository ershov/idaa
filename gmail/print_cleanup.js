if (location.href.match(/[&?]view=pt/)) {
  document.querySelector("table td:last-child").insertAdjacentHTML("beforeBegin", `<td><button id=tidyup>Clean Up</button></td>`);
  tidyup.onclick = ()=> {
    [...document.querySelectorAll(`
body > div.bodycontainer > table,
font[color="#888888"],
font[color="#550055"],
div[data-smartmail="gmail_signature"],
.gmail_quote > .gmail_quote,
.recipient
`)].forEach(e => e.remove());

    // Remove all after hidden quote
    document.querySelectorAll(`div[style="padding:5 0"]`).forEach(e => {
      while (e.nextSibling) e.nextSibling.remove();
      e.remove();
    });

    // Remove everything after "--"
    [...(function*(){
      let next, it = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT);
      while (next = it.nextNode()) yield next;
    })()].
      filter(e => e.data === "-- ").
      forEach(e => {
        while (e.nextSibling) e.nextSibling.remove(); e.remove();
      });

    [...(function*(){
      let next, it = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT);
      while (next = it.nextNode()) yield next;
    })()].
      filter(e => e.data.indexOf("To view this discussion on the web visit") != -1).
      forEach(e => {
        e.nextSibling.remove();
        e.nextSibling.remove();
        e.remove();
      });
  };
}

