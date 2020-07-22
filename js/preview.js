// Set to ParsingApi to use API else set to ParsingHtml to scrap HTML, if you change this value also change it in background.js
var Parsing = ParsingApi;

function updateProgress(progress, doujinshiName, isZipping) {
    if (isZipping && progress == -1) {document.getElementById('action').innerHTML = 'Your file was downloaded, thanks for using NHentai Downloader.' +
    '<br/><br/><input type="button" id="buttonBack" value="Go Back"/>';
    document.getElementById('buttonBack').addEventListener('click', function()
    {
        chrome.extension.getBackgroundPage().goBack();
        updatePreview(currUrl);
    });
    } else {
        document.getElementById('action').innerHTML = (isZipping ? "Zipping" : "Downloading") + ' ' + doujinshiName + ', please wait...<br/><progress max="100" id="progressBar" value="' + progress + '"></progress>' +
        '<br/><br/><input type="button" id="buttonBack" value="Cancel"/>';
        document.getElementById('buttonBack').addEventListener('click', function()
        {
            chrome.extension.getBackgroundPage().goBack();
            updatePreview(currUrl);
        });
    }
}

var currUrl;

// Display popup for a doujinshi
function doujinshiPreview(id) {
    let http = new XMLHttpRequest();
    http.onreadystatechange = function() {
        if (this.readyState === 4) {
            if (this.status === 200) {
                let json = JSON.parse(Parsing.GetJson(this.responseText));
                chrome.storage.sync.get({
                    useZip: "zip",
                    displayName: "pretty"
                }, function(elems) {
                    let extension = "";
                    if (elems.useZip == "zip")
                        extension = ".zip";
                    else if (elems.useZip == "cbz")
                        extension = ".cbz";
                    let title;
                    if (elems.displayName === "pretty") {
                        if (json.title.pretty === "") {
                            title = json.title.english.replace(/\[[^\]]+\]/g, '').replace(/\([^\)]+\)/g, '');
                        } else {
                            title = json.title.pretty;
                        }
                    } else if (elems.displayName === "english") {
                        title = json.title.english;
                    } else if (elems.displayName === "japanese") {
                        title = json.title.japanese;
                    } else {
                        title = "NHentai " + id
                    }
                    document.getElementById('action').innerHTML = '<h3 id="center">' + title + '</h3><div id="center">(' + json.images.pages.length + ' pages)' +
                    '</div><br/><input type="button" id="button" value="Download"/><br/><br/>Downloads/<input type="text" id="path"/>' + extension;
                    document.getElementById('path').value = cleanName(title);
                    document.getElementById('button').addEventListener('click', function()
                    {
                        chrome.extension.getBackgroundPage().downloadDoujinshi(json, document.getElementById('path').value, function(error) {
                            document.getElementById('action').innerHTML = 'An error occured while downloading the doujinshi: <b>' + error + '</b>';
                        }, updateProgress, title);
                        updateProgress(0, title, false);
                    });
                });
            } else if (this.status === 403) {
                document.getElementById('action').innerHTML = "This extension must be used on a page containing doujinshi(s) in nhentai.net.";
            } else {
                document.getElementById('action').innerHTML = "An unexpected error occured (Code " + this.status + ").";
            }
        }
    };
    http.open("GET", Parsing.GetUrl(id), true);
    http.send();
}

function SaveIdInLocalStorage(id, allIds, checked) {
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

let isError = null;

function parseDownloadAll(maxPage) {
    let pages = []
    let pageText = document.getElementById('downloadInput').value;
    pageText.split(',').forEach(function(e) {
        let elem = e.trim();
        let dash = elem.split('-');
        if (dash.length > 1) { // There is a dash in the number (ex: 1-5)
            let lower = dash[0].trim();
            let upper = dash[1].trim();
            let lowerNb = parseInt(lower);
            let upperNb = parseInt(upper);
            if (lower !== '' + lowerNb || upper !== '' + upperNb) {
                isError = "Invalid page syntax, each number must be separated by a comma ',' or a dash '-'";
                pages = [];
                return;
            }
            if (lowerNb < 0 || upperNb < 0 || lowerNb > maxPage || upperNb > maxPage) {
                isError = "Page number must be between 0 and " + maxPage;
                pages = [];
                return;
            }
            if (upperNb <= lowerNb) {
                isError = "Upper limit must be strictly bigger than lower limit"
                pages = [];
                return;
            }
            if (!pages.includes(lowerNb)) pages.push(lowerNb);
            if (!pages.includes(upperNb)) pages.push(upperNb);
        }
        else
        {
            let pageNb = parseInt(elem);
            if (elem !== '' + pageNb) {
                isError = "Invalid page syntax, each number must be separated by a comma ',' or a dash '-'";
                pages = [];
                return;
            }
            if (pageNb < 0 || pageNb > maxPage) {
                isError = "Page number must be between 0 and " + maxPage;
                pages = [];
                return;
            }
            if (!pages.includes(pageNb)) pages.push(pageNb);
        }
    });
    return pages;
}

// Display popup for many doujinshis
chrome.runtime.onMessage.addListener(function(request, _) {
    if (request.action == "getHtml") {
        chrome.storage.sync.get({
            useZip: "zip",
            displayName: "pretty"
        }, function(elems) {
            let matchs = /<a href="\/g\/([0-9]+)\/".+<div class="caption">([^<]+)((<br>)+<input [^>]+>[^<]+<br>[^<]+<br>[^<]+)?<\/div>/g
            let match;
            let finalHtml = "";
            let allIds = [];
            let i = 0;
            let pageHtml = request.source.replace(/<\/a>/g, '\n');
            do {
                match = matchs.exec(pageHtml);
                if (match !== null) {
                    let isChecked = false;
                    if (match[4] !== undefined ) {
                        var testMatch = pageHtml.match('<input id="' + match[1] + '" type="checkbox"( value="(true|false)")?>');
                        try {
                            isChecked = testMatch[2] === "true";
                        } catch (_) {
                            isChecked = false;
                        }
                    }
                    let tmpName;
                    if (elems.displayName === "pretty") {
                        tmpName = match[2].replace(/\[[^\]]+\]/g, "").replace(/\([^\)]+\)/g, "").replace(/\{[^\}]+\}/g, "").trim();
                    } else {
                        tmpName = match[2].trim();
                    }
                    finalHtml += '<input id="' + match[1] + '" name="' + tmpName + '" type="checkbox" ' + (isChecked ? "checked" : "") + '/>' + tmpName + '<br/>';
                    allIds.push(match[1]);
                    i++;
                }
            } while (match);
            if (finalHtml === "") {
                document.getElementById('action').innerHTML = "This extension must be used on a page containing doujinshi(s) in nhentai.net.";
                return;
            }
            let parts = currUrl.split('/')
            let name;
            if (parts[parts.length - 1] === "" || parts[parts.length - 1].startsWith("?page=")) name = parts[parts.length - 2];
            else name = parts[parts.length - 1];
            name = name.replace("q=", "");
            let extension = "";
            if (elems.useZip == "zip")
                extension = ".zip";
            else if (elems.useZip == "cbz")
                extension = ".cbz";
            let nbDownload = 0;
            let currPage = 0;
            let maxPage = 0;
            let html =  '<h3 id="center">' + i + ' doujinshi' + (i > 1 ? 's' : '') + ' found</h3>' + finalHtml
            + '<input type="button" id="invert" value="Invert all"/><input type="button" id="remove" value="Clear all"/><br/><br/><input type="button" id="button" value="Download"/>';
            let lastMatch = /page=([0-9]+)" class="last">/.exec(pageHtml) // Get the number of pages
            if (lastMatch !== null) {
                currPage = parseInt(/page=([0-9]+)" class="page current">/.exec(pageHtml)[1]);
                maxPage = parseInt(lastMatch[1]);
                nbDownload = maxPage - currPage + 1;
                html += '<br/><input type="button" id="buttonAll" value="Download all (' + nbDownload + ' pages)"/><br/><input type="text" id="downloadInput"/><input type="button" id="buttonHelp" value="?"/>';
            }
            html += '<br/><br/>Downloads/<input type="text" id="path"/>' + extension;
            document.getElementById('action').innerHTML = html;
            document.getElementById('path').value = cleanName(name);
            if (lastMatch !== null) {
                document.getElementById('downloadInput').value = currPage + "-" + maxPage;
                document.getElementById('buttonHelp').addEventListener('click', function() {
                    alert("Input the pages you want to download for the \"Download all\" feature\nWrite your pages separated by comma ',', you can also write range of number by separating them by a dash '-'\n"
                    + "Example: 2,4,6-10 will download the pages 2, 4 and 6 to 10 (included)");
                });
            }
            document.getElementById('invert').addEventListener('click', function()
            {
                let storageAllIds;
                chrome.storage.local.get({
                    allIds: []
                }, function(elemsLocal) {
                    storageAllIds = elemsLocal.allIds;
                    for (let i = 0; i < allIds.length; i++) {
                        let id = allIds[i];
                        elem = document.getElementById(id);
                        elem.checked = !elem.checked;
                        storageAllIds = SaveIdInLocalStorage(id, storageAllIds, elem.checked);
                    }
                    chrome.storage.local.set({
                        allIds: storageAllIds
                    });
                    chrome.tabs.executeScript(null, {
                        file: "js/updateContent.js" // Update the checkboxs of the page
                    });
                });
            });
            document.getElementById('remove').addEventListener('click', function()
            {
                allIds.forEach(function(id) {
                    document.getElementById(id).checked = false;
                });
                chrome.storage.local.set({
                    allIds: []
                });
                chrome.tabs.executeScript(null, {
                    file: "js/updateContent.js" // Update the checkboxs of the page
                });
            });
            document.getElementById('button').addEventListener('click', function()
            {
                let allDoujinshis = {};
                allIds.forEach(function(id) {
                    elem = document.getElementById(id);
                    if (elem.checked) {
                        allDoujinshis[id] = elem.name;
                    }
                });
                if (Object.keys(allDoujinshis).length > 0) {
                    let finalName = document.getElementById('path').value;
                    chrome.extension.getBackgroundPage().downloadAllDoujinshis(allDoujinshis, finalName, function(error) {
                        document.getElementById('action').innerHTML = 'An error occured while downloading the doujinshi: <b>' + error + '</b>';
                    }, updateProgress);
                    updateProgress(0, finalName, false);
                } else {
                    document.getElementById('action').innerHTML = "You must select at least one element to download.";
                }
            });
            if (nbDownload > 0) {
                document.getElementById('downloadInput').addEventListener('change', function() {
                    let pages = parseDownloadAll(maxPage);
                    if (pages.length !== 0) {
                        document.getElementById("buttonAll").value = 'Download all (' + pages.length + ' pages)';
                    }
                });
                document.getElementById('buttonAll').addEventListener('click', function()
                {
                    let allDoujinshis = {};
                    allIds.forEach(function(id) {
                        elem = document.getElementById(id);
                        allDoujinshis[id] = elem.name;
                    });
                    let pages = parseDownloadAll(maxPage);
                    if (isError) {
                        alert(isError);
                        document.getElementById('downloadInput').value = currPage + "-" + nbDownload;
                    } else {
                        let choice = confirm("You are going to download " + pages.length + " pages of doujinshi. Are you sure you want to continue?");
                        if (choice) {
                            let finalName = document.getElementById('path').value;
                            chrome.extension.getBackgroundPage().downloadAllPages(allDoujinshis, currPage, pages, finalName, function(error) {
                                document.getElementById('action').innerHTML = 'An error occured while downloading the doujinshi: <b>' + error + '</b>';
                            }, updateProgress, currUrl);
                            updateProgress(0, finalName, false);
                        }
                    }
                });
            }
            allIds.forEach(function(id) {
                document.getElementById(id).addEventListener('change', function() {
                    let checked = this.checked;
                    chrome.storage.local.get({
                        allIds: []
                    }, function(elemsLocal) {
                        chrome.storage.local.set({
                            allIds: SaveIdInLocalStorage(id, elemsLocal.allIds, checked)
                        });
                    });
                    chrome.tabs.executeScript(null, {
                        file: "js/updateContent.js" // Update the checkboxs of the page
                    });
                });
                chrome.storage.local.get({
                    allIds: []
                }, function(elemsLocal) {
                    if (elemsLocal.allIds.includes(id)) {
                        document.getElementById(id).checked = true;
                    }
                });
            });
        });
    }
});

function updatePreview(url) {
    let match = /https:\/\/nhentai.net\/g\/([0-9]+)\/([/0-9a-z]+)?/.exec(url)
    if (match !== null) {
        doujinshiPreview(match[1]);
    } else if (url.startsWith("https://nhentai.net")) {
        chrome.tabs.executeScript(null, {
            file: "js/getHtml.js" // Get the HTML of the page
        });
    } else {
        document.getElementById('action').innerHTML = "This extension must be used on a page containing doujinshi(s) in nhentai.net.";
    }
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.storage.sync.get({
        darkMode: false
    }, function(elemsLocal) {
        if (elemsLocal.darkMode) {
            document.getElementById('htmlLight').id = 'htmlDark';
        }
    });
    currUrl = tabs[0].url;
    chrome.storage.local.get({
        lastUrl: ""
    }, function(elemsLocal) {
        if (elemsLocal.lastUrl !== currUrl) {
            chrome.storage.local.clear();
            chrome.storage.local.set({
                lastUrl: currUrl
            });
        }
    });
    if (!chrome.extension.getBackgroundPage().isDownloadFinished()) {
        chrome.extension.getBackgroundPage().updateProgress(updateProgress);
        return;
    }
    updatePreview(currUrl);
});