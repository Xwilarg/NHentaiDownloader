chrome.storage.sync.get({
    useZip: "zip",
    displayName: "pretty",
    displayCheckbox: true
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

    displayCheckbox.checked = elems.displayCheckbox;
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

displayCheckbox.addEventListener('change', function() {
    chrome.storage.sync.set({
        displayCheckbox: displayCheckbox.checked
    });
})