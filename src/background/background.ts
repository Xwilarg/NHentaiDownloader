import Downloader from "./Downloader";
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

module background
{
    let currentDownloader: Downloader | null = null;

    export function isDownloadFinished(): boolean {
        return currentDownloader == null || currentDownloader.isDone();
    }

    export function downloadDoujinshi(jsonTmp: any, path: string, errorCallback: Function, progressCallback: Function, name: string) {
        let zip = new JSZip();
        currentDownloader = new Downloader(jsonTmp, path, errorCallback, progressCallback, name, zip, true);
        currentDownloader.startAsync();
    }

    export function goBack() {
        currentDownloader = null;
    }

    export function updateProgress(updateCallback: Function) {
        if (!isDownloadFinished())
        {
            currentDownloader!.updateProgressLatest(updateCallback);
        }
    }
}

// @ts-ignore
window.isDownloadFinished = background.isDownloadFinished;
// @ts-ignore
window.downloadDoujinshi = background.downloadDoujinshi;
// @ts-ignore
window.goBack = background.goBack;
// @ts-ignore
window.updateProgress = background.updateProgress;