var JSZip = require("jszip");

chrome.tabs.onUpdated.addListener(function
    (_tabId, changeInfo, _tab) {
        if (changeInfo.url !== undefined)
            setIcon(changeInfo.url);
    }
);

chrome.tabs.onActivated.addListener(function() {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        setIcon(tabs[0].url!);
    });
});

function setIcon(url: string) {
    if (url.startsWith("https://nhentai.net"))
        chrome.browserAction.setIcon({path: "Icon.png"});
    else
        chrome.browserAction.setIcon({path: "Icon-grey.png"});
}

function downloadDoujinshi(jsonTmp: any, path: string, errorCb: Function, progress: number, name: string) {
    let zip = new JSZip();
    zip.folder(path);
    let json;
    // @ts-ignore
    if (typeof browser !== "undefined") { // Firefox
        json = JSON.parse(JSON.stringify(jsonTmp));
    } else {
        json = jsonTmp;
    }
    download(json, path, errorCb, progress, name, zip, true, 1, 1);
}

function download(json: any, path: string, errorCb: Function, progress: number, name: string,
    zip: any, downloadAtEnd: boolean, curr: number, max: number) {
}