import AParsing from "../parsing/AParsing";
import {utils} from "../utils/utils";
import { message } from "./message"

export default class Popup
{
    constructor(parsing: AParsing) {
        this.#parsing = parsing;
    }

    async updatePreview(newUrl: string) {
        this.#url = newUrl;
        let match = /https:\/\/nhentai.net\/g\/([0-9]+)\/([/0-9a-z]+)?/.exec(this.#url)
        if (match !== null) {
            await this.#doujinshiPreviewAsync(match[1]);
        } else if (this.#url.startsWith("https://nhentai.net")) {
            // TODO
        } else {
            document.getElementById('action')!.innerHTML =  message.invalidPage();
        }
    }

    // Update progress bar on the preview popup
    updateProgress(progress: number, doujinshiName: string, isZipping: boolean) {
        if (isZipping && progress == -1) { // File is being downloaded
            document.getElementById('action')!.innerHTML = message.downloadDone();
        } else { // Download done
            document.getElementById('action')!.innerHTML = message.downloadProgress(isZipping ? "Zipping" : "Downloading", doujinshiName, progress);
        }

        let updatePreview = this.updatePreview;
        let url = this.#url;
        document.getElementById('buttonBack')!.addEventListener('click', function()
        {
            (chrome.extension.getBackgroundPage() as any).goBack();
            updatePreview(url);
        });
    }

    // Display popup for a doujinshi
    async #doujinshiPreviewAsync(id: string) {
        const resp = await fetch(this.#parsing.GetUrl(id));
        if (resp.status == 403) {
            document.getElementById('action')!.innerHTML = message.invalidPage();
        } else if (!resp.ok) {
            document.getElementById('action')!.innerHTML = message.errorOther(resp.status, resp.statusText);
        } else {
            let json = await this.#parsing.GetJsonAsync(resp);
            chrome.storage.sync.get({
                useZip: "zip",
                downloadName: "{pretty}",
                replaceSpaces: true
            }, function(elems) {
                let extension = "";
                if (elems.useZip == "zip")
                    extension = ".zip";
                else if (elems.useZip == "cbz")
                    extension = ".cbz";

                let title = utils.getDownloadName(elems.downloadName, json.title.pretty === "" ?
                    json.title.english.replace(/\[[^\]]+\]/g, '').replace(/\([^\)]+\)/g, '') : json.title.pretty,
                    json.title.english, json.title.japanese, id, json.tags);
                document.getElementById('action')!.innerHTML = message.downloadInfo(title, json.images.pages.length, extension);
                (document.getElementById('path') as HTMLInputElement).value = utils.cleanName(title, elems.replaceSpaces);

                let self = this;
                document.getElementById('button')!.addEventListener('click', function()
                {
                    (chrome.extension.getBackgroundPage() as any).downloadDoujinshi(json, (document.getElementById('path') as HTMLInputElement).value, function(error: string) {
                        document.getElementById('action')!.innerHTML = message.errorDownload(error);
                    }, self.updateProgress, title);
                    self.updateProgress(0, title, false);
                });
            });
        }
    }

    #saveIdInLocalStorage(id: number, allIds: Array<number>, checked: boolean) {
        if (checked) {
            allIds.push(id);
        } else {
            let index = allIds.indexOf(id);
            if (index !== -1) {
                allIds.splice(index, 1);
            }
        }
        return allIds;
    }

    #parseDownloadAll(maxPage: number) : Array<number> | string {
        let pages: Array<number> = []
        let pageText = (document.getElementById('downloadInput') as HTMLInputElement).value;
        pageText.split(',').forEach(function(e: string) {
            let elem = e.trim();
            let dash = elem.split('-');
            if (dash.length > 1) { // There is a dash in the number (ex: 1-5)
                let lower = dash[0].trim();
                let upper = dash[1].trim();
                let lowerNb = parseInt(lower);
                let upperNb = parseInt(upper);
                if (lower !== '' + lowerNb || upper !== '' + upperNb) {
                    return message.invalidSyntax();
                }
                if (lowerNb < 0 || upperNb < 0 || lowerNb > maxPage || upperNb > maxPage) {
                    return message.invalidPageNumber(maxPage);
                }
                if (upperNb <= lowerNb) {
                    return message.invalidBounds();
                }
                for (let i = lowerNb; i <= upperNb; i++) {
                    if (!pages.includes(i)) pages.push(i);
                }
            }
            else
            {
                let pageNb = parseInt(elem);
                if (elem !== '' + pageNb) {
                    return message.invalidSyntax();
                }
                if (pageNb < 0 || pageNb > maxPage) {
                    return message.invalidPageNumber(maxPage);
                }
                if (!pages.includes(pageNb)) pages.push(pageNb);
            }
        });
        return pages;
    }

    #url: string;
    #parsing: AParsing
}