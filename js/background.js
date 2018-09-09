chrome.tabs.onUpdated.addListener(function
    (tabId, changeInfo, tab) {
        if (changeInfo.url !== undefined)
            setIcon(changeInfo.url);
    }
);

chrome.tabs.onActivated.addListener(function() {
    chrome.tabs.getSelected(null,function(tab) {
        setIcon(tab.url);
    });
});

function setIcon(url) {
    if (url.match('https://nhentai.net/g/[0-9]*/[/0-9a-z]*'))
        chrome.browserAction.setIcon({path: "Icon.png"});
    else
        chrome.browserAction.setIcon({path: "Icon-grey.png"});
}

function download(json, path, errorCb) {
    let mediaId = json.media_id;
    for (let page in json.images.pages)
    {
        let format = (json.images.pages[page].t === 'j') ? ('.jpg') : ('.png');
        let filename = '/' + (parseInt(page) + 1) + format;
        chrome.downloads.download({
            url: 'https://i.nhentai.net/galleries/' + mediaId + filename,
            filename: './' + path + filename
        }, function(downloadId) {
            if (downloadId === undefined) {
                errorCb(chrome.runtime.lastError);
            }
        });
    }
}