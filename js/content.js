let tmpIds = [];

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
                tmpIds.push(match[1]);
                captions[i].innerHTML += '<br/><br/><input id="' + match[1] + '" type="checkbox" ' + (elemsLocal.allIds.includes(match[1]) ? "checked" : "") + '> NHentai Downloader:<br/>Add to downloads<br/>&nbsp;';
                i++;
            } while (i < captions.length);

            for (let i = 0; i < tmpIds.length; i++) {
                let id = tmpIds[i];
                document.getElementById(id).addEventListener('change', function() {
                    chrome.storage.local.get({
                        allIds: []
                    }, function(elemsLocal) {
                        storageAllIds = elemsLocal.allIds;
                        if (document.getElementById(id).checked) {
                            storageAllIds.push(id);
                        } else {
                            let index = storageAllIds.indexOf(id);
                            if (index !== -1) {
                                storageAllIds.splice(index, 1);
                            }
                        }
                        chrome.storage.local.set({
                            allIds: storageAllIds
                        });
                    });
                });
            }
        }
    });
});