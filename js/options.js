chrome.storage.sync.get({
    useZip: "zip"
}, function(elems) {
    var select = document.getElementById('useZip');
    for (var i, j = 0; i = select.options[j]; j++) {
        if (i.value == elems.useZip) {
            select.selectedIndex = j;
            break;
        }
    }
});

useZip.addEventListener('change', function() {
    chrome.storage.sync.set({
        useZip: this.options[this.selectedIndex].value
    });
});