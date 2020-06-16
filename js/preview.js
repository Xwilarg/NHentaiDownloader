// Set to ParsingApi to use API else set to ParsingHtml to scrap HTML, if you change this value also change it in background.js
var Parsing = ParsingApi;

function updateProgress(progress, doujinshiName, downloadAtEnd) {
    if (progress === 100 && downloadAtEnd)
        document.getElementById('action').innerHTML = 'We are preparing your file, thanks for using NHentaiDownloader.<br/>This can take several minutes.<br/>If you are downloading a lot of doujinshi, this may take a long time.';
    else
    {
        document.getElementById('action').innerHTML = 'Downloading ' + doujinshiName + ', please wait...<br/><progress max="100" id="progressBar" value="' + progress + '"></progress>' +
        '<br/><br/><input type="button" id="buttonBack" value="Go back"/>';
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

// Display popup for many doujinshis
chrome.runtime.onMessage.addListener(function(request, _) {
    if (request.action == "getHtml") {
        chrome.storage.sync.get({
            useZip: "zip",
            displayName: "pretty"
        }, function(elems) {
            let matchs = /<a href="\/g\/([0-9]+)\/".+<div class="caption">([^<]+)((<br>)+<input type="checkbox">[^<]+<br>[^<]+<br>[^<]+)?<\/div>/g
            let match;
            let finalHtml = "";
            let allIds = [];
            let i = 0;
            let pageHtml = request.source.replace(/<\/a>/g, '\n');
            do {
                match = matchs.exec(pageHtml);
                if (match !== null) {
                    let tmpName;
                    if (elems.displayName === "pretty") {
                        tmpName = match[2].replace(/\[[^\]]+\]/g, "").replace(/\([^\)]+\)/g, "").replace(/\{[^\}]+\}/g, "").trim();
                    } else {
                        tmpName = match[2].trim();
                    }
                    finalHtml += '<input id="' + match[1] + '" name="' + tmpName + '" type="checkbox"/>' + tmpName + '<br/>';
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
            if (parts[parts.length - 1] === "") name = parts[parts.length - 2];
            else name = parts[parts.length - 1];
            let extension = "";
            if (elems.useZip == "zip")
                extension = ".zip";
            else if (elems.useZip == "cbz")
                extension = ".cbz";
            document.getElementById('action').innerHTML = '<h3 id="center">' + i + ' doujinshi' + (i > 1 ? 's' : '') + ' found</h3>' + finalHtml
            + '<input type="button" id="invert" value="Invert all"/><input type="button" id="remove" value="Clear all"/><br/><input type="button" id="button" value="Download"/><br/><br/>Downloads/<input type="text" id="path"/>' + extension;
            document.getElementById('path').value = cleanName(name);
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