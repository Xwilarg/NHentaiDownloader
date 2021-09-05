import * as JSZip from "../../node_modules/jszip/index";

export default class Downloader
{
    constructor(jsonTmp: any, path: string, errorCallback: Function, progressCallback: Function, name: string)
    {
        this.#progressCallback = progressCallback;
        this.#errorCallback = errorCallback;
        this.#currentProgress = 0;
        this.#doujinshiName = name;
        this.#path = path;

        this.#zip = new JSZip();
        this.#zip.folder(path);
        let json;
        // @ts-ignore
        if (typeof browser !== "undefined") { // Firefox
            json = JSON.parse(JSON.stringify(jsonTmp));
        } else {
            json = jsonTmp;
        }

        this.#mediaId = json.media_id;
        this.#download(json);
    }

    #download(json: any) {
        let useZip: string;
        chrome.storage.sync.get({
            useZip: "zip"
        }, function(elems) {
            useZip = elems.useZip;
            if (useZip === "raw") {
                this.#currentProgress = 100;
                try {
                    this.#progressCallback(100, this.#doujinshiName, false);
                } catch (e) { } // Dead object
            }
            this.#downloadPageInternalAsync(json, useZip, 0);
        });
    }

    // Number to string but ensure there are always 3 digits
    #getNumberWithZeros(nb: number) {
        if (nb < 10) return '00' + nb;
        else if (nb < 100) return '0' + nb;
        return nb;
    }

    async #downloadPageInternalAsync(json: any, useZip: string, currPage: number) {
        let page = json.images.pages[currPage];
        let format;
        if (page.t === "j") format = '.jpg';
        else if (page.t === "p") format = '.png';
        else format = '.gif';
        let filenameParsing = (currPage + 1) + format; // Name for parsing
        let filename = this.#getNumberWithZeros(currPage + 1) + format; // Final file name
        if (useZip !== "raw") {
            const resp = await fetch('https://i.nhentai.net/galleries/' + this.#mediaId + '/' + filenameParsing);
            if (resp.ok)
            {
                let reader = new FileReader();
                let self = this;
                reader.addEventListener("loadend", function() {
                    self.#zip.file(self.#path + '/' + filename, reader.result as null);
                    let each = 50 / max;
                    let downloaded = currPage + 1;
                    let maxTmp = currPage * each;
                    let minTmp = (currPage - 1) * each;
                    let diff = maxTmp - minTmp;
                    currProgress = (downloaded * diff / totalNumber) + minTmp;
                    try {
                        progressFunction(currProgress, doujinshiName + '/' + filename, false);
                    } catch (e) { } // Dead object
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

    isDone(): boolean
    {
        return this.#currentProgress === 100;
    }

    #zip: JSZip; // ZIP data that will be downloaded at the end
    #path: string; // Save path
    #progressCallback: Function; // Function to call when progress is made
    #errorCallback: Function; // Function to call if an error occured
    #currentProgress: Number; // Current progress of the download
    #doujinshiName: string; // Name of the doujinshi
    #mediaId: number; // Id of the media
}