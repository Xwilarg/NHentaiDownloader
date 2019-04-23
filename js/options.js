document.getElementById("useRaw").addEventListener('change', function() {
    chrome.storage.sync.set({
        useRaw: this.checked
    })
})