var fileSaver = require("file-saver");
var JSZip = require("jszip");

export default class Downloader {
    constructor(jsonTmp: any, path: string, errorCallback: Function, progressCallback: Function, name: string, zip: typeof JSZip, downloadName: string | null) {
        this.progressCallback = progressCallback;
        this.#errorCallback = errorCallback;
        this.currentProgress = 0;
        this.#doujinshiName = name;
        this.path = path;
        this.#zip = zip;
        this.downloadName = downloadName;

        // @ts-ignore
        if (typeof browser !== "undefined") { // Firefox
            this.#json = JSON.parse(JSON.stringify(jsonTmp));
        } else {
            this.#json = jsonTmp;
        }

        this.#mediaId = this.#json.media_id;
    }

    updateProgress(progress: number, name: string | null, isZipping: boolean) {
        try {
            this.progressCallback(progress, name, isZipping);
        } catch (e) { } // Dead object
        this.#progressPercent = progress;
        this.#progressName = name;
        this.#progressZipping = isZipping;
    }

    updateProgressLatest(updateCallback: Function) {
        this.progressCallback = updateCallback;
        this.progressCallback(this.#progressPercent, this.#progressName, this.#progressZipping);
    }

    async startAsync() {
        let self = this;
        await new Promise((resolve, _reject) => {
            resolve(
                chrome.storage.sync.get({
                    useZip: "zip"
                }, function (elems) {
                    self.useZip = elems.useZip;
                    if (self.useZip === "raw") {
                        self.currentProgress = 100;
                        try {
                            self.updateProgress(100, this.#doujinshiName, false);
                        } catch (e) { } // Dead object
                    }
                    self.#zip.folder(self.path);
                })
            );
        });
        await self.#downloadAsync();
    }

    async #downloadAsync() {
        try {
            // Downloading
            let maxNbOfPage = this.#json.images.pages.length;
            for (let i = 0; i < maxNbOfPage; i++) {
                let nbTries = 5;
                while (true) {
                    try {
                        await this.#downloadPageInternalAsync(i, i * 100 / maxNbOfPage);
                        break;
                    }
                    catch (error: any) {
                        if (nbTries > 0) {
                            console.warn("Error while downloading " + this.#doujinshiName + "/" + (i + 1) + ": " + error + ", tries remaining: " + nbTries);
                            nbTries--;
                        }
                        else {
                            throw error;
                        }
                    }
                }
                if (this.isAwaitingAbort) {
                    throw "Download was aborted";
                }
            }

            // For multiple download, we want to skip the "zipping" part
            if (this.downloadName !== null) {
                // Zipping
                if (this.useZip !== "raw") { // Raw download doesn't need zipping
                    this.updateProgress(0, "in progress...", true);

                    let self = this;
                    await new Promise((resolve, _reject) => {
                        resolve(
                            this.#zip.generateAsync({ type: "blob" }, function (elem: any) {
                                try {
                                    self.updateProgress(elem.percent, elem.currentFile == null ? self.path : elem.currentFile, true);
                                } catch (e) { } // Dead object
                            })
                                .then(function (content: any) { // Zipping done
                                    self.currentProgress = 100;
                                    fileSaver.saveAs(content, self.downloadName + "." + self.useZip);
                                    try {
                                        self.updateProgress(100, null, true); // Notify popup that we are done
                                    } catch (e) { } // Dead object
                                })
                        );
                    });
                } else {
                    this.currentProgress = 100;
                    this.updateProgress(100, null, true); // Notify popup that we are done
                }
            }
        }
        catch (error) {
            this.currentProgress = 100;
            this.#errorCallback(error);
            throw error;
        }
    }

    // Number to string but ensure there are always 3 digits
    #getNumberWithZeros(nb: number) {
        if (nb < 10) return '00' + nb;
        else if (nb < 100) return '0' + nb;
        return nb;
    }

    // Download a page
    async #downloadPageInternalAsync(currPage: number, progress: number) {
        let page = this.#json.images.pages[currPage];
        let format;
        switch (page.t) {
            case "j":
                format = ".jpg";
                break;
            case "p":
                format = ".png";
                break;
            case "g":
                format = ".gif";
                break;
            case "w":
                format = ".webp";
                break;
            case "0": // Invalid page, probably an issue on NHentai side
                return;
            default:
                throw "Unknown page format " + page.t;
        }
        let filenameParsing = (currPage + 1) + format; // Name for parsing
        this.updateProgress(progress, this.#doujinshiName + "/" + filenameParsing, false);

        let filename = this.#getNumberWithZeros(currPage + 1) + format; // Final file name

        let imageserverID = Math.floor(Math.random() * 4) + 1; // Pick a random image server ID 1-4
        let imageserverURL = `https://i${imageserverID}.nhentai.net/galleries/`; // Image server from which to download from

        if (this.useZip !== "raw") { // ZIP (or equivalent) format
            const resp = await fetch(imageserverURL + this.#mediaId + '/' + filenameParsing);
            if (resp.ok) {
                let blob = await resp.blob();
                await new Promise((resolve, reject) => {
                    var reader = new FileReader();
                    reader.onload = () => {
                        resolve(this.#zip.file(this.path + '/' + filename, reader.result as null));
                    };
                    reader.onerror = reject;
                    reader.readAsArrayBuffer(blob);
                });
            }
            else {
                throw "Failed to fetch doujinshi page (status " + resp.status + ": " + resp.statusText + "), if the error persist please report it.";
            }
        } else { // We don't need to update progress here because it go too fast anyway (since it just need to launch download)
            let downloadId = await chrome.downloads.download({
                url: imageserverURL + this.#mediaId + '/' + filenameParsing,
                filename: this.path.replace(/[\\\\\\/:"*?<>|]/g, '') + "-" + filename
            });
            if (downloadId === undefined) {
                let error = chrome.runtime.lastError ? chrome.runtime.lastError.message : "unknown error";
                throw "Failed to download doujinshi page (" + error + "), if the error persist please report it.";
            }
        }
    }

    isDone(): boolean {
        return this.currentProgress === 100;
    }

    useZip: string; // How data must be downloaded
    #json: any; // JSON containing all data
    #zip: typeof JSZip; // ZIP data that will be downloaded at the end
    downloadName: string | null; // Name of the ZIP, null if should not download
    path: string; // Save path
    progressCallback: Function; // Function to call when progress is made
    #errorCallback: Function; // Function to call if an error occured
    currentProgress: Number; // Current progress of the download
    #doujinshiName: string; // Name of the doujinshi
    #mediaId: number; // Id of the media

    isAwaitingAbort: boolean = false;

    // Progress info
    #progressPercent: number;
    #progressName: string | null;
    #progressZipping: boolean;
}