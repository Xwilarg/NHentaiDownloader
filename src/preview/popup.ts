import AParsing from "../parsing/AParsing";
import { utils } from "../utils/utils";
import { message } from "./message"

// Add message listener for progress updates and error messages
chrome.runtime.onMessage.addListener(function(request) {
    if (request.action === "updateProgress") {
        Popup.getInstance().updateProgress(request.progress, request.doujinshiName, request.isZipping);
    } else if (request.action === "downloadError") {
        document.getElementById('action')!.innerHTML = 'An error occured while downloading the doujinshi: <b>' + request.error + '</b>';
    }
    return true;
});

export default class Popup
{
    //#region "singleton"
    static getInstance(): Popup {
        if (Popup.#instance === null) {
            Popup.#instance = new Popup();
        }
        return Popup.#instance;
    }

    static #instance: Popup | null = null
    //#endregion "singleton"

    // Update progress bar on the preview popup
    updateProgress(progress: number, doujinshiName: string, isZipping: boolean) {
        if (isZipping && progress == 100) { // File is being downloaded
            document.getElementById('action')!.innerHTML = message.downloadDone();
            // Add event listener after updating the HTML content
            setTimeout(() => {
                const buttonBack = document.getElementById('buttonBack');
                if (buttonBack) {
                    buttonBack.addEventListener('click', function() {
                        let popup = Popup.getInstance();
                        // Use message passing instead of direct background page access for Firefox private mode compatibility
                        chrome.runtime.sendMessage({ action: "goBack" }, function() {
                            popup.updatePreviewAsync(popup.url);
                        });
                    });
                }
            }, 0);
        } else { // Download in progress
            document.getElementById('action')!.innerHTML = message.downloadProgress(isZipping ? "Zipping" : "Downloading", doujinshiName, progress);
            // Add event listener after updating the HTML content
            setTimeout(() => {
                const buttonBack = document.getElementById('buttonBack');
                if (buttonBack) {
                    buttonBack.addEventListener('click', function() {
                        let popup = Popup.getInstance();
                        // Use message passing instead of direct background page access for Firefox private mode compatibility
                        chrome.runtime.sendMessage({ action: "goBack" }, function() {
                            popup.updatePreviewAsync(popup.url);
                        });
                    });
                }
            }, 0);
        }
    }

    // #region "single download"
    async updatePreviewAsync(newUrl: string) {
        let self = Popup.getInstance();
        self.url = newUrl;
        let match = /https:\/\/nhentai.net\/g\/([0-9]+)\/([/0-9a-z]+)?/.exec(self.url)
        if (match !== null) {
            await self.#doujinshiPreviewAsync(match[1]);
        } else if (self.url.startsWith("https://nhentai.net")) {
            // @ts-ignore
            chrome.tabs.executeScript(null, {
                file: "js/getHtml.js" // Get the HTML of the page
            });
        } else {
            document.getElementById('action')!.innerHTML =  message.invalidPage();
        }
    }

    // Display popup for a doujinshi
    async #doujinshiPreviewAsync(id: string) {
        const resp = await fetch(this.parsing!.GetUrl(id));
        if (resp.status == 403) {
            document.getElementById('action')!.innerHTML = message.invalidPage();
        } else if (!resp.ok) {
            document.getElementById('action')!.innerHTML = message.errorOther(resp.status, resp.statusText);
        } else {
            let json = await this.parsing!.GetJsonAsync(resp);
            let self = this;
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

                // Add event listener after updating the HTML content
                setTimeout(() => {
                    const button = document.getElementById('button');
                    if (button) {
                        button.addEventListener('click', function() {
                            // Use message passing instead of direct background page access for Firefox private mode compatibility
                            chrome.runtime.sendMessage({
                                action: "downloadDoujinshi",
                                json: json,
                                path: (document.getElementById('path') as HTMLInputElement).value,
                                name: title
                            });
                            self.updateProgress(0, title, false);
                        });
                    }
                }, 0);
            });
        }
    }
    //#endregion "single download"

    //#region "multiple download"
    updatePreviewAll(sourceHtml: string, downloadName: string, useZip: string, replaceSpaces: boolean) {
        let self = Popup.getInstance();

        // Get doujins on the page
        let matchs = /<a href="\/g\/([0-9]+)\/".+<div class="caption">([^<]+)((<br>)+<input [^>]+>[^<]+<br>[^<]+<br>[^<]+)?<\/div>/g
        let match;
        let finalHtml = "";
        let allIds: Array<string> = [];
        let i = 0;
        let pageHtml = sourceHtml.replace(/<\/a>/g, '\n');
        do {
            match = matchs.exec(pageHtml);
            if (match !== null) {
                let isChecked = false;
                if (match[4] !== undefined ) {
                    // For each doujin, we check if our custom checkbox is ticked
                    var testMatch = pageHtml.match('<input id="' + match[1] + '" type="checkbox"( value="(true|false)")?>');
                    try {
                        isChecked = testMatch![2] === "true";
                    } catch (_) {
                        isChecked = false;
                    }
                }
                let tmpName;
                if (downloadName === "{pretty}") {
                    tmpName = match[2].replace(/\[[^\]]+\]/g, "").replace(/\([^\)]+\)/g, "").replace(/\{[^\}]+\}/g, "").trim();
                } else {
                    tmpName = match[2].trim();
                }
                // Then we add a checkbox on the extension (preticked or not depending of previous result)
                finalHtml += '<input id="' + match[1] + '" name="' + tmpName + '" type="checkbox" ' + (isChecked ? "checked" : "") + '/>' + tmpName + '<br/>';
                allIds.push(match[1]);
                i++;
            }
        } while (match);
        if (finalHtml === "") {
            document.getElementById('action')!.innerHTML = message.invalidPage();
            return;
        }

        // Use URL for default download name
        let parts = self.url.split('/')
        let name;
        if (parts[parts.length - 1] === "" || parts[parts.length - 1].startsWith("?page=")) name = parts[parts.length - 2];
        else name = parts[parts.length - 1];
        name = name.replace("q=", ""); // Artifact when doing a search

        // Appends the extension (none is raw download)
        let extension = "";
        if (useZip != "raw")
        {
            extension = "." + useZip;
        }

        // Add the HTML
        let nbDownload = 0;
        let currPage = 0;
        let maxPage = 0;
        let html =  '<h3>' + i + ' doujinshi' + (i > 1 ? 's' : '') + ' found</h3>' + finalHtml
        + '<input type="button" id="invert" value="Invert all"/><input type="button" id="remove" value="Clear all"/><br/><br/><input type="button" id="button" value="Download"/>';
        let lastMatch = /page=([0-9]+)" class="last">/.exec(pageHtml) // Get the number of pages
        if (lastMatch !== null) {
            currPage = parseInt(/page=([0-9]+)" class="page current">/.exec(pageHtml)![1]);
            maxPage = parseInt(lastMatch[1]);
            nbDownload = maxPage - currPage + 1;
            html += '<br/><input type="button" id="buttonAll" value="Download all (' + nbDownload + ' pages)"/><br/><input type="text" id="downloadInput"/><input type="button" id="buttonHelp" value="?"/>';
        }
        html += '<br/><br/>Downloads/<input type="text" id="path"/>' + extension;
        document.getElementById('action')!.innerHTML = html;
        (document.getElementById('path') as HTMLInputElement).value = utils.cleanName(name, replaceSpaces);
        if (lastMatch !== null) {
            (document.getElementById('downloadInput') as HTMLInputElement).value = currPage + "-" + maxPage;
            document.getElementById('buttonHelp')!.addEventListener('click', function() {
                alert("Input the pages you want to download for the \"Download all\" feature\nWrite your pages separated by comma ',', you can also write range of number by separating them by a dash '-'\n"
                + "Example: 2,4,6-10 will download the pages 2, 4 and 6 to 10 (included)");
            });
        }

        // Invert all checkbox - add event listener after updating the HTML content
        setTimeout(() => {
            const invertButton = document.getElementById('invert');
            if (invertButton) {
                invertButton.addEventListener('click', function() {
                    let storageAllIds;
                    chrome.storage.local.get({
                        allIds: []
                    }, function(elemsLocal) {
                        // Iterate on all checkboxs and reverse the value
                        storageAllIds = elemsLocal.allIds;
                        for (let i = 0; i < allIds.length; i++) {
                            let id = allIds[i];
                            let elem = (document.getElementById(id) as HTMLInputElement);
                            elem.checked = !elem.checked;
                            storageAllIds = self.#saveIdInLocalStorage(id, storageAllIds, elem.checked);
                        }
                        chrome.storage.local.set({
                            allIds: storageAllIds
                        });
                        // @ts-ignore
                        chrome.tabs.executeScript(null, {
                            file: "js/updateContent.js" // Update the checkboxs of the page
                        });
                    });
                });
            }
        }, 0);

        // Clear all checkboxs - add event listener after updating the HTML content
        setTimeout(() => {
            const removeButton = document.getElementById('remove');
            if (removeButton) {
                removeButton.addEventListener('click', function() {
                    // Just uncheck everything and empty local storage
                    allIds.forEach(function(id) {
                        (document.getElementById(id) as HTMLInputElement).checked = false;
                    });
                    chrome.storage.local.set({
                        allIds: []
                    });
                    // @ts-ignore
                    chrome.tabs.executeScript(null, {
                        file: "js/updateContent.js" // Update the checkboxs of the page
                    });
                });
            }
        }, 0);

        // Download button - add event listener after updating the HTML content
        setTimeout(() => {
            const downloadButton = document.getElementById('button');
            if (downloadButton) {
                downloadButton.addEventListener('click', function() {
                    let allDoujinshis : Record<string, string> = {};
                    allIds.forEach(function(id) {
                        let elem = document.getElementById(id) as HTMLInputElement;
                        if (elem && elem.checked) {
                            allDoujinshis[id] = elem.name;
                        }
                    });
                    if (Object.keys(allDoujinshis).length > 0) { // There is at least one element selected, we launch download
                        const pathElement = document.getElementById('path') as HTMLInputElement;
                        if (pathElement) {
                            let finalName = pathElement.value;
                            // Use message passing instead of direct background page access for Firefox private mode compatibility
                            chrome.runtime.sendMessage({
                                action: "downloadAllDoujinshis",
                                allDoujinshis: allDoujinshis,
                                finalName: finalName
                            });
                            self.updateProgress(0, finalName, false);
                        }
                    } else {
                        document.getElementById('action')!.innerHTML = "You must select at least one element to download.";
                    }
                });
            }
        }, 0);

        if (nbDownload > 0) {
            // User input saying how many pages he wants to download - add event listener after updating the HTML content
            setTimeout(() => {
                const downloadInput = document.getElementById('downloadInput');
                if (downloadInput) {
                    downloadInput.addEventListener('change', function() {
                        let pages = self.#parseDownloadAll(maxPage);
                        if (pages.length !== 0) {
                            const buttonAll = document.getElementById("buttonAll") as HTMLInputElement;
                            if (buttonAll) {
                                buttonAll.value = 'Download all (' + pages.length + ' pages)';
                            }
                        }
                    });
                }
            }, 0);

            // Download many pages at once - add event listener after updating the HTML content
            setTimeout(() => {
                const buttonAll = document.getElementById('buttonAll');
                if (buttonAll) {
                    buttonAll.addEventListener('click', function() {
                        let allDoujinshis : Record<string, string> = {};
                        allIds.forEach(function(id) {
                            let elem = (document.getElementById(id) as HTMLInputElement);
                            if (elem) {
                                allDoujinshis[id] = elem.name;
                            }
                        });
                        let pages = self.#parseDownloadAll(maxPage);
                        if (typeof pages === "string") {
                            alert(pages);
                            const downloadInput = document.getElementById('downloadInput') as HTMLInputElement;
                            if (downloadInput) {
                                downloadInput.value = currPage + "-" + nbDownload;
                            }
                        } else {
                            let choice = confirm("You are going to download " + pages.length + " pages of doujinshi. Are you sure you want to continue?");
                            if (choice) {
                                const pathElement = document.getElementById('path') as HTMLInputElement;
                                if (pathElement) {
                                    let finalName = pathElement.value;
                                    // Use message passing instead of direct background page access for Firefox private mode compatibility
                                    chrome.runtime.sendMessage({
                                        action: "downloadAllPages",
                                        allDoujinshis: allDoujinshis,
                                        pages: pages,
                                        finalName: finalName,
                                        url: self.url
                                    });
                                    self.updateProgress(0, finalName, false);
                                }
                            }
                        }
                    });
                }
            }, 0);
        }

        // We listen to all checkboxs on the page - add event listeners after updating the HTML content
        setTimeout(() => {
            allIds.forEach(function(id) {
                const checkbox = document.getElementById(id) as HTMLInputElement;
                if (checkbox) {
                    checkbox.addEventListener('change', function() {
                        let checked = this.checked;
                        chrome.storage.local.get({
                            allIds: []
                        }, function(elemsLocal) { // Add the ids in local storage so we can easily find them back from anywhere (even if page is reloaded etc)
                            chrome.storage.local.set({
                                allIds: self.#saveIdInLocalStorage(id, elemsLocal.allIds, checked)
                            });
                        });
                        // @ts-ignore
                        chrome.tabs.executeScript(null, {
                            file: "js/updateContent.js" // Update the checkboxs of the page
                        });
                    });

                    chrome.storage.local.get({
                        allIds: []
                    }, function(elemsLocal) {
                        if (elemsLocal.allIds.includes(id)) {
                            checkbox.checked = true;
                        }
                    });
                }
            });
        }, 0);
    }

    #saveIdInLocalStorage(id: string, allIds: Array<string>, checked: boolean) {
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
    //#endregion "multiple download"

    url: string;
    parsing: AParsing | null = null
}