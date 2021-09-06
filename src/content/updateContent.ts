chrome.storage.sync.get({
    displayCheckbox: true
}, function(elems) {
    chrome.storage.local.get({
        allIds: []
    }, function(elemsLocal) {
        if (elems.displayCheckbox) {
            let r = /\/g\/([0-9]+)\//g;
            let captions = document.getElementsByClassName("caption");
            let i = 0;
            do
            {
                let match = r.exec(document.documentElement.innerHTML);
                (document.getElementById(match![1]) as HTMLInputElement).checked = elemsLocal.allIds.includes(match![1]);
                i++;
            } while (i < captions.length);
        }
    });
});