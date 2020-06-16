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
                captions[i].innerHTML += '<br/><br/><input type="checkbox" ' + (elemsLocal.allIds.includes(match[1]) ? "checked" : "") + '> NHentai Downloader:<br/>Add to downloads<br/>&nbsp;';
                i++;
            } while (i < captions.length);
        }
    });
});