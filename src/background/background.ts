import ApiParsing from "../parsing/ApiParsing";
import Downloader from "./Downloader";
import { utils } from "../utils/utils";
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
    let parsing = new ApiParsing();

    export function isDownloadFinished(): boolean {
        return currentDownloader == null || currentDownloader.isDone();
    }

    export function downloadDoujinshi(jsonTmp: any, path: string, errorCallback: Function, progressCallback: Function, name: string) {
        let zip = new JSZip();
        currentDownloader = new Downloader(jsonTmp, path, errorCallback, progressCallback, name, zip, path);
        currentDownloader.startAsync();
    }

    export function downloadAllDoujinshis(allDoujinshis: Record<string, string>, finalName: string, errorCallback: Function, progressCallback: Function) {
        downloadAllDoujinshisAsync(allDoujinshis, finalName, errorCallback, progressCallback);
    }

    async function downloadAllDoujinshisAsync(allDoujinshis: Record<string, string>, finalName: string, errorCallback: Function, progressCallback: Function) {
        let downloadName: string = "";
        let duplicateBehaviour: string = "";
        let replaceSpaces: boolean = false;
        await new Promise((resolve, _reject) => {
            resolve(
                chrome.storage.sync.get({
                    downloadName: "{pretty}",
                    duplicateBehaviour: "remove",
                    replaceSpaces: true
                }, function(elems) {
                    downloadName = elems.downloadName;
                    duplicateBehaviour = elems.duplicateBehaviour;
                    replaceSpaces = elems.replaceSpaces;
                })
            );
        });
        let zip = new JSZip();
        let names: Array<string> = [];
        let length = Object.keys(allDoujinshis).length;
        let allKeys = Object.keys(allDoujinshis);

        for (let i = 0; i < length; i++) {
            let key = allKeys[i];
            const resp = await fetch(parsing.GetUrl(key));
            if (resp.ok)
            {
                const json = await parsing.GetJsonAsync(resp);

                let title = utils.getDownloadName(downloadName, json.title.pretty === "" ?
                    json.title.english.replace(/\[[^\]]+\]/g, '').replace(/\([^\)]+\)/g, '') : json.title.pretty,
                    json.title.english, json.title.japanese, key, json.tags);
                if (duplicateBehaviour == "remove") {
                    let c = 2;
                    let tmp = title;
                    while (names.includes(tmp)) {
                        tmp = title + " (" + c + ")";
                        c++;
                    }
                    title = tmp;
                    names.push(title);
                }
                currentDownloader = new Downloader(json, utils.cleanName(title, replaceSpaces), errorCallback, progressCallback, allDoujinshis[key], zip, i == length - 1 ? finalName : null);
                await currentDownloader.startAsync();
            }
            else
            {
                errorCallback("Can't download " + key + " (Code " + resp.status + ": " + resp.statusText + ").");
            }
        }
    }

    export function goBack() { // TODO: Doesn't work
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
window.downloadAllDoujinshis = background.downloadAllDoujinshis;
// @ts-ignore
window.goBack = background.goBack;
// @ts-ignore
window.updateProgress = background.updateProgress;