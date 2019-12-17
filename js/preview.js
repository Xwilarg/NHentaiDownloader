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
                    useZip: "zip"
                }, function(elems) {
                    let extension = "";
                    if (elems.useZip == "zip")
                        extension = ".zip";
                    else if (elems.useZip == "cbz")
                        extension = ".cbz";
                    chrome.storage.sync.get({
                        displayName: "pretty"
                    }, function(elems) {
                        let title;
                        if (elems.displayName == "pretty") {
                            title = json.title.pretty;
                        } else if (elems.displayName === "english") {
                            title = json.title.english;
                        } else {
                            title = json.title.japanese;
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

// Display popup for many doujinshis
chrome.runtime.onMessage.addListener(function(request, _) {
    if (request.action == "getHtml") {
        let matchs = /<a href="\/g\/([0-9]+)\/".+<div class="caption">([^<]+)<\/div>/g
        let match;
        let finalHtml = "";
        let allIds = [];
        let i = 0;
        do {
            match = matchs.exec(request.source);
            if (match !== null) {
                let tmpName = match[2].replace(/\[[^\]]+\]/g, "").replace(/\([^\)]+\)/g, "").replace(/\{[^\}]+\}/g, "").trim();
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
        chrome.storage.sync.get({
            useZip: "zip"
        }, function(elems) {
            let extension = "";
            if (elems.useZip == "zip")
                extension = ".zip";
            else if (elems.useZip == "cbz")
                extension = ".cbz";
            document.getElementById('action').innerHTML = '<h3 id="center">' + i + ' doujinshi' + (i > 1 ? 's' : '') + ' found</h3>' + finalHtml
            + '<input type="button" id="invert" value="Invert all"/><br/><input type="button" id="button" value="Download"/><br/><br/>Downloads/<input type="text" id="path"/>' + extension;
            document.getElementById('path').value = cleanName(name);
            document.getElementById('invert').addEventListener('click', function()
            {
                allIds.forEach(function(id) {
                    elem = document.getElementById(id);
                    elem.checked = !elem.checked;
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
    if (!chrome.extension.getBackgroundPage().isDownloadFinished()) {
        chrome.extension.getBackgroundPage().updateProgress(updateProgress);
        return;
    }
    updatePreview(currUrl);
});