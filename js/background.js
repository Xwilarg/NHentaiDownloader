chrome.tabs.onUpdated.addListener(function
    (tabId, changeInfo, tab) {
        if (changeInfo.url !== undefined)
            setIcon(changeInfo.url);
    }
);

chrome.tabs.onActivated.addListener(function() {
    chrome.tabs.getSelected(null,function(tab) {
        setIcon(tab.url);
    });
});

function setIcon(url) {
    if (url.match('https://nhentai.net/g/[0-9]*/[/0-9a-z]*'))
        chrome.browserAction.setIcon({path: "Icon.png"});
    else
        chrome.browserAction.setIcon({path: "Icon-grey.png"});
}

function download(json, path, errorCb, progress) {
    let totalNumber = json.images.pages.length;
    let downloaded = 0;
    let mediaId = json.media_id;
    let zip = new JSZip();
    zip.folder(path);
    for (let page in json.images.pages)
    {
        let format = (json.images.pages[page].t === 'j') ? ('.jpg') : ('.png');
        let filename = (parseInt(page) + 1) + format;
        fetch('https://i.nhentai.net/galleries/' + mediaId + '/' + filename)
        .then(function(response) {
            return (response.blob());
        })
        .then(function(blob) {
            let reader = new FileReader();
            reader.addEventListener("loadend", function() {
                zip.file(path + '/' + filename, reader.result);
                downloaded++;
                progress(downloaded * 100 / totalNumber);
                if (downloaded === totalNumber)
                {
                    zip.generateAsync({type:"blob"})
                    .then(function(content) {
                        saveAs(content, path + ".zip");
                    });
                }
             });
            reader.readAsArrayBuffer(blob);
        });
    }
}