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

var progressFunction;
var doujinshiName;
var currProgress = 100;

function updateProgress(progress) {
    progressFunction = progress;
    progressFunction(currProgress, doujinshiName);
}

function goBack() {
    currProgress = -1;
}

function isDownloadFinished() {
    return (currProgress === 100);
}

function download(json, path, errorCb, progress, name) {
    progressFunction = progress;
    doujinshiName = name;
    let currName = name;
    let totalNumber = json.images.pages.length;
    let downloaded = 0;
    let mediaId = json.media_id;
    let zip = new JSZip();
    zip.folder(path);
    currProgress = 0;
    chrome.storage.sync.get({
        useZip: true
    }, function(elems) {
        for (let page in json.images.pages)
        {
            let format = (json.images.pages[page].t === 'j') ? ('.jpg') : ('.png');
            let filename = (parseInt(page) + 1) + format;
            if (elems.useZip) {
                fetch('https://i.nhentai.net/galleries/' + mediaId + '/' + filename)
                .then(function(response) {
                    if (response.status === 200) {
                        return (response.blob());
                    } else {
                        throw new Error("Failed to fetch doujinshi page (status " + response.status + "), if the error persist please report it.");
                    }
                })
                .then(function(blob) {
                    let reader = new FileReader();
                    reader.addEventListener("loadend", function() {
                        zip.file(path + '/' + filename, reader.result);
                        if (currProgress !== -1 && doujinshiName === currName) {
                            downloaded++;
                            currProgress = downloaded * 100 / totalNumber;
                            progressFunction(currProgress, doujinshiName);
                        }
                        if (downloaded === totalNumber)
                        {
                            zip.generateAsync({type:"blob"})
                            .then(function(content) {
                                saveAs(content, path + ".zip");
                            });
                        }
                    });
                    reader.readAsArrayBuffer(blob);
                })
                .catch((error) => {
                    currProgress = 100;
                    errorCb(error);
                });
            } else { // We don't need to update progress here because it go too fast anyway (since it just need to launch download)
                let filename = '/' + (parseInt(page) + 1) + format;
                chrome.downloads.download({
                    url: 'https://i.nhentai.net/galleries/' + mediaId + filename,
                    filename: './' + path + filename
                }, function(downloadId) {
                    if (downloadId === undefined) {
                        currProgress = 100;
                        errorCb("Failed to download doujinshi page (" + chrome.runtime.lastError + "), if the error persist please report it.");
                    }
                });
            }
        }
        currProgress = 100;
        progressFunction(100, doujinshiName);
    });
}