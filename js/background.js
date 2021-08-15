var Parsing = ParsingApi;

chrome.tabs.onUpdated.addListener(function
    (_, changeInfo, _) {
        if (changeInfo.url !== undefined)
            setIcon(changeInfo.url);
    }
);

chrome.tabs.onActivated.addListener(function() {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        setIcon(tabs[0].url);
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
let names = [];

function updateProgress(progress) {
    progressFunction = progress;
    progressFunction(currProgress, doujinshiName, false);
}

function goBack() {
    currProgress = -1;
}

function isDownloadFinished() {
    return (currProgress === 100 || currProgress === -1);
}

function downloadDoujinshi(jsonTmp, path, errorCb, progress, name) {
    let zip = new JSZip();
    zip.folder(path);
    let json;
    if (typeof browser !== "undefined") { // Firefox
        json = JSON.parse(JSON.stringify(jsonTmp));
    } else {
        json = jsonTmp;
    }
    download(json, path, errorCb, progress, name, zip, true, 1, 1);
}

async function downloadDoujinshiInternalAsync(zip, length, allDoujinshis, path, errorCb, progress, i, allKeys, callbackEnd) {
    let key = allKeys[i];

    const resp = await fetch(Parsing.GetUrl(key));
    if (resp.ok)
    {
        const json = JSON.parse(Parsing.GetJson(await resp.text()));
        chrome.storage.sync.get({
            downloadName: "{pretty}",
            duplicateBehaviour: "remove",
            replaceSpaces: true
        }, function(elems) {
            let title = getDownloadName(elems.downloadName, json.title.pretty === "" ?
                json.title.english.replace(/\[[^\]]+\]/g, '').replace(/\([^\)]+\)/g, '') : json.title.pretty,
                json.title.english, json.title.japanese, key, json.tags);
            if (elems.duplicateBehaviour == "remove") {
                let c = 2;
                let tmp = title;
                while (names.includes(tmp)) {
                    tmp = title + " (" + c + ")";
                    c++;
                }
                title = tmp;
                names.push(title);
            }
            zip.folder(cleanName(title, elems.replaceSpaces));
            download(json, cleanName(title, elems.replaceSpaces), errorCb, progress, allDoujinshis[key], zip, length === i + 1, i + 1, length, path, function() {
                downloadDoujinshiInternalAsync(zip, length, allDoujinshis, path, errorCb, progress, i + 1, allKeys, callbackEnd);
            }, callbackEnd);
        });
    }
    else
    {
        errorCb("Can't download " + key + " (Code " + resp.status + ": " + resp.statusText + ").");
    }
}

var pagesArr;
var curr;
var basePath;
var tranAllDoujinshis;
var tranErrorCb;
var tranProgress;
var tranUrl;
function downloadAllPages(allDoujinshis, currTmp, pagesArrTmp, path, errorCb, progress, url) {
    pagesArr = pagesArrTmp;
    curr = currTmp;
    basePath = path;
    // There is probably a better way to do that
    tranAllDoujinshis = allDoujinshis;
    tranErrorCb = errorCb;
    tranProgress = progress;
    tranUrl = url;
    if (pagesArr.includes(curr)) {
        pagesArr.splice(pagesArr.indexOf(curr), 1);
        downloadAllDoujinshis(allDoujinshis, basePath + " (" + curr + ")" , errorCb, progress, downloadAllPagesTransition);
    } else {
        downloadAllPagesTransition();
    }
}

function downloadAllPagesTransition() {
    downloadAllPagesInternal(tranAllDoujinshis, basePath, tranErrorCb, tranProgress, tranUrl, downloadAllPagesTransition);
}

async function downloadAllPagesInternalAsync(allDoujinshis, path, errorCb, progress, url, callbackEnd) {
    if (pagesArr.length == 0) { // We are done parsing everything
        return;
    }
    curr = pagesArr[0];
    pagesArr.splice(0, 1);
    let m = /page=([0-9]+)/.exec(url)
    if (m !== null) {
        url = url.replace(m[0], "page=" + curr);
    } else if (url.includes("?")) {
        url += "&page=" + curr
    } else {
        url += "?page=" + curr
    }
    const resp = await fetch(url);
    if (resp.ok)
    {
        const text = await resp.text();
        allDoujinshis = {};
        let matchs = /<a href="\/g\/([0-9]+)\/".+<div class="caption">([^<]+)((<br>)+<input [^>]+>[^<]+<br>[^<]+<br>[^<]+)?<\/div>/g
        let match;
        let pageHtml = text.replace(/<\/a>/g, '\n');
        chrome.storage.sync.get({
            downloadName: "{pretty}"
        }, function(elems) {
            do {
                match = matchs.exec(pageHtml);
                if (match !== null) {
                    let tmpName;
                    if (elems.downloadName === "{pretty}") {
                        tmpName = match[2].replace(/\[[^\]]+\]/g, "").replace(/\([^\)]+\)/g, "").replace(/\{[^\}]+\}/g, "").trim();
                    } else {
                        tmpName = match[2].trim();
                    }
                    allDoujinshis[match[1]] = tmpName;
                }
            } while (match);
            downloadAllDoujinshis(allDoujinshis, path + " (" + curr + ")", errorCb, progress, callbackEnd);
        });
    }
}

function downloadAllDoujinshis(allDoujinshis, path, errorCb, progress, callbackEnd = null) {
    let zip = new JSZip();
    names = [];
    let length = Object.keys(allDoujinshis).length;
    downloadDoujinshiInternalAsync(zip, length, allDoujinshis, path, errorCb, progress, 0, Object.keys(allDoujinshis), callbackEnd);
}

function getNumberWithZeros(nb) {
    if (nb < 10) return '00' + nb;
    else if (nb < 100) return '0' + nb;
    return nb;
}

async function downloadPageInternalAsync(json, path, errorCb, zip, downloadAtEnd, saveName, currName, totalNumber, downloaded, mediaId, next, curr, max, callbackEnd) {
    let useZip;
    chrome.storage.sync.get({
        useZip: "zip"
    }, function(elems) {
        useZip = elems.useZip;
    });

    let page = json.images.pages[downloaded];
    let format;
    if (page.t === "j") format = '.jpg';
    else if (page.t === "p") format = '.png';
    else format = '.gif';
    let filenameParsing = (parseInt(downloaded) + 1) + format; // Name for parsing
    let filename = getNumberWithZeros(parseInt(downloaded) + 1) + format; // Final file name
    if (useZip !== "raw") {
        const resp = await fetch('https://i.nhentai.net/galleries/' + mediaId + '/' + filenameParsing);
        if (resp.ok)
        {
            let reader = new FileReader();
            reader.addEventListener("loadend", function() {
                zip.file(path + '/' + filename, reader.result);
                if (currProgress == -1) {
                    return;
                }
                if (doujinshiName === currName) {
                    downloaded++;
                    let each = 50 / max;
                    let maxTmp = curr * each;
                    let minTmp = (curr - 1) * each;
                    let diff = maxTmp - minTmp;
                    currProgress = (downloaded * diff / totalNumber) + minTmp;
                    try {
                        progressFunction(currProgress, doujinshiName + '/' + filename, false);
                    } catch (e) { } // Dead object
                }
                if (downloaded === totalNumber)
                {
                    if (downloadAtEnd) {
                        zip.generateAsync({type: "blob"}, function updateCallback(elem) {
                            try {
                                progressFunction(50 + (elem.percent / 2), elem.currentFile == null ? saveName : elem.currentFile, true);
                            } catch (e) { } // Dead object
                        })
                        .then(function(content) {
                            currProgress = 100;
                            if (useZip == "zip")
                                saveAs(content, saveName + ".zip");
                            else
                                saveAs(content, saveName + ".cbz");
                            try {
                                progressFunction(-1, null, true);
                            } catch (e) { } // Dead object
                            if (callbackEnd != null) {
                                callbackEnd();
                            }
                        });
                    } else if (next !== undefined) {
                        next();
                    }
                } else {
                    downloadPageInternalAsync(json, path, errorCb, zip, downloadAtEnd, saveName, currName, totalNumber, downloaded, mediaId, next, curr, max, callbackEnd);
                }
            });
            reader.readAsArrayBuffer(await resp.blob());
        }
        else
        {
            currProgress = 100;
            errorCb("Failed to fetch doujinshi page (status " + resp.status + ": " + resp.statusText + "), if the error persist please report it.");
        }
    } else { // We don't need to update progress here because it go too fast anyway (since it just need to launch download)
        chrome.downloads.download({
            url: 'https://i.nhentai.net/galleries/' + mediaId + '/' + filenameParsing,
            filename: './' + path + filename
        }, function(downloadId) {
            if (downloadId === undefined) {
                currProgress = 100;
                errorCb("Failed to download doujinshi page (" + chrome.runtime.lastError + "), if the error persist please report it.");
            }
        });
        downloaded++;
        if (downloaded !== totalNumber) {
            await downloadPageInternalAsync(json, path, errorCb, zip, downloadAtEnd, saveName, currName, totalNumber, downloaded, mediaId, next, curr, max);
        } else if (!downloadAtEnd && next !== undefined) {
            next();
        }
    }
}

function download(json, path, errorCb, progress, name, zip, downloadAtEnd, curr, max, saveName = path, next = undefined, callbackEnd = null) {
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
        if (elems.useZip === "raw") {
            currProgress = 100;
            try {
                progressFunction(currProgress, doujinshiName, false);
            } catch (e) { } // Dead object
        }
    });
    downloadPageInternalAsync(json, path, errorCb, zip, downloadAtEnd, saveName, currName, totalNumber, downloaded, mediaId, next, curr, max, callbackEnd);
}