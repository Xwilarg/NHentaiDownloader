(async () => {
    let tmpIds: Array<string> = [];

    let elemsLocal = await chrome.storage.local.get({
        allIds: [],
        lastUrl: ""
    });

    if (elemsLocal.lastUrl != location.href) {
        await chrome.storage.local.set({
            allIds: [],
            lastUrl: location.href
        });
    }

    // Add checkbox on pages that have multiple doujins so we can tick them here and then download everything
    // TODO: going on another doujin page and coming back will let the checked box on the page even if they aren't on the extension
    let elems = await chrome.storage.sync.get({
        displayCheckbox: true
    });

    if (elems.displayCheckbox) {
        elemsLocal = await chrome.storage.local.get({
            allIds: []
        });

        // Find and place the popups
        let r = /\/g\/([0-9]+)\//g;
        let captions = document.getElementsByClassName("caption");
        let i = 0;
        do {
            let match = r.exec(document.documentElement.innerHTML);
            tmpIds.push(match![1]);
            captions[i].innerHTML += '<br/><br/><input id="' + match![1] + '" type="checkbox" ' + (elemsLocal.allIds.includes(match![1]) ? "checked" : "") + '> NHentai Downloader:<br/>Add to downloads<br/>&nbsp;';
            i++;
        } while (i < captions.length);

        // Foreach popups we listen for change
        for (let i = 0; i < tmpIds.length; i++) {
            let id = tmpIds[i];
            document.getElementById(id)!.addEventListener('change', async function () {
                let innerElemsLocal = await chrome.storage.local.get({
                    allIds: []
                });

                let storageAllIds = innerElemsLocal.allIds;
                if ((document.getElementById(id) as HTMLInputElement).checked) {
                    storageAllIds.push(id);
                } else {
                    let index = storageAllIds.indexOf(id);
                    if (index !== -1) {
                        storageAllIds.splice(index, 1);
                    }
                }
                await chrome.storage.local.set({
                    allIds: storageAllIds
                });
            });
        }
    }
})();