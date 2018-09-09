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

function download(url, path) {
    if (url.match('https://nhentai.net/g/[0-9]*/[/0-9a-z]*')) {
        let id = url.replace("https://nhentai.net/g/", "").split('/')[0];
        let http = new XMLHttpRequest();
        http.open("GET", 'https://nhentai.net/api/gallery/' + id, false);
        http.send();
        if (http.status === 200) {
            let json = JSON.parse(http.responseText);
            let mediaId = json.media_id;
            for (let page in json.images.pages)
            {
                let format = (json.images.pages[page].t === 'j') ? ('.jpg') : ('.png');
                chrome.downloads.download({
                    url: 'https://i.nhentai.net/galleries/' + mediaId + '/' + (parseInt(page) + 1) + format,
                    filename: './' + path + '/' + (parseInt(page) + 1) + format
                });
            }
            return ("Your files are downloading, thanks for using NHentaiDownloader.");
        } else if (http.status === 403) {
            return ("This extension must be used on a doujinshi page in nhentai.net.");
        } else {
            return ("An unexpected error occured (Code " + http.status + ").");
        }
    }
    else
        return ("This extension must be used on a doujinshi page in nhentai.net.");
}