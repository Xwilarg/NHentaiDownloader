import Popup from "./popup"
import ApiParsing from "../parsing/ApiParsing";
import HtmlParsing from "../parsing/HtmlParsing";

let popup = new Popup();

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.storage.sync.get({
        darkMode: false,
        htmlParsing: false
    }, function(elems) {
        if (popup.parsing === null) {
            popup.parsing = elems.htmlParsing ? new HtmlParsing() : new ApiParsing();
        }
        if (elems.darkMode) {
            document.getElementById('htmlLight')!.id = 'htmlDark';
        }

        let currUrl = tabs[0].url as string;
        popup.url = currUrl;
        chrome.storage.local.get({
            lastUrl: ""
        }, function(elemsLocal) {
            if (elemsLocal.lastUrl !== currUrl) {
                chrome.storage.local.clear();
                chrome.storage.local.set({
                    lastUrl: currUrl
                });
            }
            if (!(chrome.extension.getBackgroundPage() as any).isDownloadFinished()) {
                (chrome.extension.getBackgroundPage() as any).updateProgress(popup.updateProgress);
                return;
            }
            popup.updatePreviewAsync(currUrl);
        });
    });
});

// Display popup for many doujinshis
chrome.runtime.onMessage.addListener(function(request, _) {
    if (request.action == "getHtml") {
        chrome.storage.sync.get({
            useZip: "zip",
            downloadName: "{pretty}",
            replaceSpaces: true
        }, function(elems) {
            popup.updatePreviewAll(request.source, elems.downloadName, elems.useZip, elems.replaceSpaces)
        });
    }
});