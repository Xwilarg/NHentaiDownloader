function getHtml(doc) {
    let html = "",
    node = doc.firstChild;
    while (node) {
        html += node.outerHTML;
        node = node.nextSibling;
    }
    return html;
}

chrome.runtime.sendMessage({
    action: "getHtml",
    source: getHtml(document)
});