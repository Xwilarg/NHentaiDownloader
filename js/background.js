var Parsing = ParsingApi;

chrome.tabs.onUpdated.addListener(function
    (_, changeInfo, _) {
        if (changeInfo.url !== undefined)
            setIcon(changeInfo.url);
    }
);

chrome.tabs.onActivated.addListener(function() {
    chrome.tabs.getSelected(null, function(tab) {
        setIcon(tab.url);
    });
});

function setIcon(url) {
    if (url.startsWith("https://nhentai.net"))
        chrome.browserAction.setIcon({path: "Icon.png"});
    else
        chrome.browserAction.setIcon({path: "Icon-grey.png"});
}

var progressFunction;
var doujinshiName;
var currProgress = 100;

function updateProgress(progress, downloadAtEnd) {
    progressFunction = progress;
    progressFunction(currProgress, doujinshiName, downloadAtEnd);
}

function goBack() {
    currProgress = -1;
}

function isDownloadFinished() {
    return (currProgress === 100);
}

function downloadDoujinshi(json, path, errorCb, progress, name) {
    let zip = new JSZip();
    zip.folder(path);
    download(json, path, errorCb, progress, name, zip, true);
}

function downloadAllDoujinshis(allDoujinshis, path, errorCb, progress) {
    let zip = new JSZip();
    let length = Object.keys(allDoujinshis).length;
    let i = 0;
    for (let key in allDoujinshis) {
        i++;
        let http = new XMLHttpRequest();
        http.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    let json = JSON.parse(Parsing.GetJson(this.responseText));
                    zip.folder(cleanName(json.title.pretty));
                    download(json, cleanName(json.title.pretty), errorCb, progress, allDoujinshis[key], zip, length === i, path);
                } else {
                    errorCb("Can't download " + key + " (Code " + this.status + ").");
                    return;
                }
            }
        };
        http.open("GET", Parsing.GetUrl(key), true);
        http.send();
    }
}

function download(json, path, errorCb, progress, name, zip, downloadAtEnd, saveName = path) {
    progressFunction = progress;
    doujinshiName = name;
    let currName = name;
    let totalNumber = json.images.pages.length;
    let downloaded = 0;
    let mediaId = json.media_id;
    currProgress = 0;
    chrome.storage.sync.get({
        useZip: "zip"
    }, function(elems) {
        for (let page in json.images.pages)
        {
            let format;
            if (json.images.pages[page].t === "j") format = '.jpg';
            else if (json.images.pages[page].t === "p") format = '.png';
            else format = '.gif';
            let filename = (parseInt(page) + 1) + format;
            if (elems.useZip != "raw") {
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
                            progressFunction(currProgress, doujinshiName, downloadAtEnd);
                        }
                        if (downloaded === totalNumber && downloadAtEnd)
                        {
                            zip.generateAsync({type:"blob"})
                            .then(function(content) {
                                if (elems.useZip == "zip")
                                    saveAs(content, saveName + ".zip");
                                else
                                    saveAs(content, saveName + ".cbz");
                            });
                        }
                    });
                    reader.readAsArrayBuffer(blob);
                })
                .catch((error) => {
                    currProgress = 100;
                    errorCb(error);
                    return
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
                        return;
                    }
                });
            }
        }
        currProgress = 100;
        progressFunction(100, doujinshiName, downloadAtEnd);
    });
}