import ApiParsing from "../parsing/ApiParsing";
import * as popup from "./popup"

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.storage.sync.get({
        darkMode: false
    }, function(elemsLocal) {
        if (elemsLocal.darkMode) {
            document.getElementById('htmlLight')!.id = 'htmlDark';
        }
    });
    let currUrl = tabs[0].url as string;
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
    popup.updatePreview(currUrl, new ApiParsing);
});