import Downloader from "./Downloader";

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
}

// @ts-ignore
window.isDownloadFinished = background.isDownloadFinished;