let useZip = document.getElementById("useZip");

chrome.storage.sync.get({
    useZip: true
}, function(elems) {
    useZip.checked = elems.useZip
});

useZip.addEventListener('change', function() {
    chrome.storage.sync.set({
        useZip: this.checked
    })
});