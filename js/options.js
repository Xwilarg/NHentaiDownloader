chrome.storage.sync.get({
    useZip: "zip",
    displayName: "pretty"
}, function(elems) {
    let select = document.getElementById('useZip');
    for (var i, j = 0; i = select.options[j]; j++) {
        if (i.value == elems.useZip) {
            select.selectedIndex = j;
            break;
        }
    }
    select = document.getElementById('displayName');
    for (var i, j = 0; i = select.options[j]; j++) {
        if (i.value == elems.displayName) {
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

displayName.addEventListener('change', function() {
    chrome.storage.sync.set({
        displayName: this.options[this.selectedIndex].value
    });
});