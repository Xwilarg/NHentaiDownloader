var JSZip = require("jszip");
var fileSaver = require("file-saver");

export default class Downloader
{
    constructor(jsonTmp: any, path: string, errorCallback: Function, progressCallback: Function, name: string)
    {
        this.progressCallback = progressCallback;
        this.#errorCallback = errorCallback;
        this.currentProgress = 0;
        this.#doujinshiName = name;
        this.path = path;

        this.#zip = new JSZip();
        this.#zip.folder(path);
        // @ts-ignore
        if (typeof browser !== "undefined") { // Firefox
            this.#json = JSON.parse(JSON.stringify(jsonTmp));
        } else {
            this.#json = jsonTmp;
        }

        this.#mediaId = this.#json.media_id;

        let self = this;
        chrome.storage.sync.get({
            useZip: "zip"
        }, function(elems) {
            self.#init(elems.useZip);
        });
    }

    #init(useZip: string) {
        this.useZip = useZip;
        if (this.useZip === "raw") {
            this.currentProgress = 100;
            try {
                this.progressCallback(100, this.#doujinshiName, false);
            } catch (e) { } // Dead object
        }
        this.#download();
    }

    async #download() {
        try
        {
            // Downloading
            let maxNbOfPage = this.#json.images.pages.length;
            for (let i = 0; i < maxNbOfPage; i++)
            {
                await this.#downloadPageInternalAsync(i, i * 50 / maxNbOfPage);
            }

            // Zipping
            if (this.useZip !== "raw") { // Raw download doesn't need zipping
                this.progressCallback(50, "in progress...", true);

                let self = this;
                this.#zip.generateAsync({type: "blob"}, function(elem: any) {
                    try {
                        self.progressCallback(50 + (elem.percent / 2), elem.currentFile == null ? self.path : elem.currentFile, true);
                    } catch (e) { } // Dead object
                })
                .then(function(content: any) {
                    self.currentProgress = 100;
                    if (self.useZip == "zip") {
                        fileSaver.saveAs(content, self.useZip + ".zip");
                    }
                    else {
                        fileSaver.saveAs(content, self.useZip + ".cbz");
                    }
                    try {
                        self.progressCallback(-1, null, true);
                    } catch (e) { } // Dead object
                });
            }
        }
        catch (error)
        {
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

    async #downloadPageInternalAsync(currPage: number, progress: number) {
        let page = this.#json.images.pages[currPage];
        let format;
        switch (page.t)
        {
            case "j":
                format = ".jpg";
                break;
            case "p":
                format = ".png";
                break;
            case "g":
                format = ".gif";
                break;
            default:
                throw "Unknown page format " + page.t;
        }
        let filenameParsing = (currPage + 1) + format; // Name for parsing
        this.progressCallback(progress, this.#doujinshiName + "/" + filenameParsing, false);

        let filename = this.#getNumberWithZeros(currPage + 1) + format; // Final file name

        if (this.useZip !== "raw") { // ZIP (or equivalent) format
            const resp = await fetch('https://i.nhentai.net/galleries/' + this.#mediaId + '/' + filenameParsing);
            if (resp.ok)
            {
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
            else
            {
                throw "Failed to fetch doujinshi page (status " + resp.status + ": " + resp.statusText + "), if the error persist please report it.";
            }
        } else { // We don't need to update progress here because it go too fast anyway (since it just need to launch download)
            chrome.downloads.download({
                url: 'https://i.nhentai.net/galleries/' + this.#mediaId + '/' + filenameParsing,
                filename: './' + this.path + filename
            }, function(downloadId) {
                if (downloadId === undefined) {
                    throw "Failed to download doujinshi page (" + chrome.runtime.lastError + "), if the error persist please report it.";
                }
            });
        }
    }

    isDone(): boolean
    {
        return this.currentProgress === 100;
    }

    useZip: string; // How data must be downloaded
    #json: any; // JSON containing all data
    #zip: typeof JSZip; // ZIP data that will be downloaded at the end
    path: string; // Save path
    progressCallback: Function; // Function to call when progress is made
    #errorCallback: Function; // Function to call if an error occured
    currentProgress: Number; // Current progress of the download
    #doujinshiName: string; // Name of the doujinshi
    #mediaId: number; // Id of the media
}