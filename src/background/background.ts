import AParsing from "../parsing/AParsing";
import ApiParsing from "../parsing/ApiParsing";
import HtmlParsing from "../parsing/HtmlParsing";
import Downloader from "./Downloader";
import { utils } from "../utils/utils";
var JSZip = require("jszip");

chrome.tabs.onUpdated.addListener(function
    (_tabId, changeInfo, _tab) {
    if (changeInfo.url !== undefined)
        setIcon(changeInfo.url);
}
);

chrome.tabs.onActivated.addListener(function () {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        setIcon(tabs[0].url!);
    });
});

function setIcon(url: string) {
    if (url.startsWith("https://nhentai.net"))
        chrome.action.setIcon({ path: "\\Icon.png" });
    else
        chrome.action.setIcon({ path: "\\Icon-grey.png" });
}

module background {
    let currentDownloader: Downloader | null = null;
    let parsing: AParsing;
    chrome.storage.sync.get({
        htmlParsing: false
    }, function (elems) {
        if (elems.htmlParsing) {
            parsing = new HtmlParsing();
        } else {
            parsing = new ApiParsing();
        }
    });

    export function isDownloadFinished(): boolean {
        return currentDownloader == null || currentDownloader.isDone();
    }

    export function downloadDoujinshi(jsonTmp: any, path: string, errorCallback: Function, progressCallback: Function, name: string) {
        let zip = new JSZip();
        currentDownloader = new Downloader(jsonTmp, path, errorCallback, progressCallback, name, zip, path);
        currentDownloader.startAsync();
    }

    export function downloadAllDoujinshis(allDoujinshis: Record<string, string>, finalName: string, errorCallback: Function, progressCallback: Function) {
        let zip = new JSZip();
        downloadAllDoujinshisAsync(zip, allDoujinshis, finalName, errorCallback, progressCallback, true);
    }

    async function downloadAllDoujinshisAsync(
        zip: typeof JSZip,
        allDoujinshis: Record<string, string>,
        finalName: string,
        errorCallback: Function,
        progressCallback: Function,
        downloadAtEnd: boolean
    ) {
        let downloadName: string = "";
        let duplicateBehaviour: string = "";
        let replaceSpaces: boolean = false;
        let downloadSeparately: boolean = false;
        await new Promise((resolve, _reject) => {
            resolve(
                chrome.storage.sync.get({
                    downloadName: "{pretty}",
                    duplicateBehaviour: "remove",
                    replaceSpaces: true,
                    downloadSeparately: false
                }, function (elems) {
                    downloadName = elems.downloadName;
                    duplicateBehaviour = elems.duplicateBehaviour;
                    replaceSpaces = elems.replaceSpaces;
                    downloadSeparately = elems.downloadSeparately;
                })
            );
        });
        let names: Array<string> = [];
        let length = Object.keys(allDoujinshis).length;
        let allKeys = Object.keys(allDoujinshis);

        for (let i = 0; i < length; i++) {
            let key = allKeys[i];
            const resp = await fetch(parsing.GetUrl(key));
            if (resp.ok) {
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
                let zipName = null;
                if (downloadSeparately) {
                    zipName = title;
                } else if (downloadAtEnd && i == length - 1) {
                    zipName = finalName;
                }
                currentDownloader = new Downloader(json, utils.cleanName(title, replaceSpaces), errorCallback, progressCallback, allDoujinshis[key],
                    downloadSeparately ? new JSZip() : zip, // If we download separately, we make sure to not reuse the previous ZIP
                    zipName);
                // We download the ZIP file in the following cases:
                // downloadSeparately is true (set in extension options)
                // OR downloadAtEnd is true (can be false if downloading many pages) AND we are at the doujin of the current list

                await currentDownloader.startAsync();
            }
            else {
                errorCallback("Can't download " + key + " (Code " + resp.status + ": " + resp.statusText + ").");
            }
        }
    }

    export function downloadAllPages(allDoujinshis: Record<string, string>, pagesArr: Array<number>, path: string, errorCallback: Function, progressCallback: Function, url: string) {
        downloadAllPagesAsync(allDoujinshis, pagesArr, path, errorCallback, progressCallback, url);
    }

    async function downloadAllPagesAsync(
        allDoujinshis: Record<string, string>,
        pagesArr: Array<number>,
        path: string,
        errorCallback: Function,
        progressCallback: Function,
        url: string
    ) {
        let downloadName: string = "";
        await new Promise((resolve, _reject) => {
            resolve(
                chrome.storage.sync.get({
                    downloadName: "{pretty}"
                }, function (elems) {
                    downloadName = elems.downloadName;
                })
            );
        });

        let zip = new JSZip();
        for (let i = 0; i < pagesArr.length; i++) {
            let curr = pagesArr[i];
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
            if (resp.ok) {
                const text = await resp.text();
                allDoujinshis = {};
                let matchs = /<a href="\/g\/([0-9]+)\/".+<div class="caption">([^<]+)((<br>)+<input [^>]+>[^<]+<br>[^<]+<br>[^<]+)?<\/div>/g
                let match;
                let pageHtml = text.replace(/<\/a>/g, '\n');
                do {
                    match = matchs.exec(pageHtml);
                    if (match !== null) {
                        let tmpName;
                        if (downloadName === "{pretty}") {
                            tmpName = match[2].replace(/\[[^\]]+\]/g, "").replace(/\([^\)]+\)/g, "").replace(/\{[^\}]+\}/g, "").trim();
                        } else {
                            tmpName = match[2].trim();
                        }
                        allDoujinshis[match[1]] = tmpName;
                    }
                } while (match);
                await downloadAllDoujinshisAsync(zip, allDoujinshis, path + " (" + curr + ")", errorCallback, progressCallback, i == pagesArr.length - 1);
            }
        }
    }

    export function goBack() {
        if (!isDownloadFinished()) {
            currentDownloader!.isAwaitingAbort = true;
            currentDownloader!.currentProgress = 100;
        }
        currentDownloader = null;
    }

    export function updateProgress(updateCallback: Function) {
        if (!isDownloadFinished()) {
            currentDownloader!.updateProgressLatest(updateCallback);
        }
    }
}

export const isDownloadFinished = background.isDownloadFinished;
export const downloadDoujinshi = background.downloadDoujinshi;
export const downloadAllDoujinshis = background.downloadAllDoujinshis;
export const goBack = background.goBack;
export const updateProgress = background.updateProgress;
export const downloadAllPages = background.downloadAllPages;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "downloadDoujinshi") {
        downloadDoujinshi(request.json, request.path, function (error: string) {
            chrome.runtime.sendMessage({ action: "downloadError", error: error.toString() });
        }, function (progress: number, doujinshiName: string, isZipping: boolean) {
            chrome.runtime.sendMessage({ action: "updateProgress", progress: progress, doujinshiName: doujinshiName, isZipping: isZipping });
        }, request.name);
    } else if (request.action === "downloadAllDoujinshis") {
        downloadAllDoujinshis(request.allDoujinshis, request.finalName, function (error: string) {
            chrome.runtime.sendMessage({ action: "downloadError", error: error.toString() });
        }, function (progress: number, doujinshiName: string, isZipping: boolean) {
            chrome.runtime.sendMessage({ action: "updateProgress", progress: progress, doujinshiName: doujinshiName, isZipping: isZipping });
        });
    } else if (request.action === "downloadAllPages") {
        downloadAllPages(request.allDoujinshis, request.pagesArr, request.path, function (error: string) {
            chrome.runtime.sendMessage({ action: "downloadError", error: error.toString() });
        }, function (progress: number, doujinshiName: string, isZipping: boolean) {
            chrome.runtime.sendMessage({ action: "updateProgress", progress: progress, doujinshiName: doujinshiName, isZipping: isZipping });
        }, request.url);
    } else if (request.action === "goBack") {
        goBack();
    } else if (request.action === "checkDownload") {
        sendResponse({ isDownloadFinished: isDownloadFinished() });
        if (!isDownloadFinished()) {
            updateProgress(function (progress: number, doujinshiName: string, isZipping: boolean) {
                chrome.runtime.sendMessage({ action: "updateProgress", progress: progress, doujinshiName: doujinshiName, isZipping: isZipping });
            });
        }
    }
});