chrome.storage.sync.get({
    useZip: "zip",
    downloadName: "{pretty}",
    displayCheckbox: true,
    duplicateBehaviour: "rename",
    darkMode: false,
    replaceSpaces: true
}, function(elems) {
    let select = document.getElementById('useZip');
    for (var i, j = 0; i = select.options[j]; j++) {
        if (i.value == elems.useZip) {
            select.selectedIndex = j;
            break;
        }
    }
    replaceSpaces.checked = elems.replaceSpaces;

    downloadName.value = elems.downloadName;

    displayCheckbox.checked = elems.displayCheckbox;

    select = document.getElementById('duplicateBehaviour');
    for (var i, j = 0; i = select.options[j]; j++) {
        if (i.value == elems.duplicateBehaviour) {
            select.selectedIndex = j;
            break;
        }
    }

    darkMode.checked = elems.darkMode;
});

useZip.addEventListener('change', function() {
    chrome.storage.sync.set({
        useZip: this.options[this.selectedIndex].value
    });
});

downloadName.addEventListener('change', function() {
    if (this.value.trim().length !== 0) {
        chrome.storage.sync.set({
            downloadName: this.value
        });
    }
});

replaceSpaces.addEventListener('change', function() {
    chrome.storage.sync.set({
        replaceSpaces: this.checked
    });
});

displayCheckbox.addEventListener('change', function() {
    chrome.storage.sync.set({
        displayCheckbox: this.checked
    });
});

duplicateBehaviour.addEventListener('change', function() {
    chrome.storage.sync.set({
        duplicateBehaviour: this.options[this.selectedIndex].value
    });
});

darkMode.addEventListener('change', function() {
    chrome.storage.sync.set({
        darkMode: this.checked
    });
});