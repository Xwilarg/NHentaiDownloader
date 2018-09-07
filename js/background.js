chrome.tabs.onUpdated.addListener(function
    (tabId, changeInfo, tab) {
        if (changeInfo.url === undefined)
            ;
        else if (changeInfo.url.match('https://nhentai.net/g/[0-9]*/[/0-9a-z]*'))
            chrome.browserAction.setIcon({path: "Icon.png"});
        else
            chrome.browserAction.setIcon({path: "Icon-grey.png"});
    }
);

function download() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        let url = tabs[0].url;
        if (url.match('https://nhentai.net/g/[0-9]*/[/0-9a-z]*')) {
            let id = url.replace("https://nhentai.net/g/", "").split('/')[0];
            let http = new XMLHttpRequest();
            http.onreadystatechange = function() {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        let json = JSON.parse(this.responseText);
                        let mediaId = json.media_id;
                        for (let page in json.images.pages)
                        {
                            let format = (json.images.pages[page].t === 'j') ? ('.jpg') : ('.png');
                            chrome.downloads.download({
                                url: 'https://i.nhentai.net/galleries/' + mediaId + '/' + (parseInt(page) + 1) + format
                            });
                        }
                    } else {
                        document.getElementById('action').innerHTML = "An unexpected error occured (Code " + this.status + ").";
                    }
                }
            };
            http.open("GET", 'https://nhentai.net/api/gallery/' + id, true);
            http.send();
        }
        else
            document.getElementById('action').innerHTML = "This extension must be used on a doujinshi page in nhentai.net.";
    });
    document.getElementById('action').innerHTML = "Your files are downloading, thanks for using NHentaiDownloader.";
}