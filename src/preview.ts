// Update progress bar on the preview popup
function updateProgress(progress: number, doujinshiName: string, isZipping: boolean) {
    // File is being downloaded
    if (isZipping && progress == -1) {
        document.getElementById('action')!.innerHTML = 'Your file was downloaded, thanks for using NHentai Downloader.' +
            '<br/><br/><input type="button" id="buttonBack" value="Go Back"/>';
        document.getElementById('buttonBack')!.addEventListener('click', function()
        {
            chrome.extension.getBackgroundPage()!.goBack();
            updatePreview(currUrl);
        });
    } else {
        const status = isZipping ? "Zipping" : "Downloading";
        document.getElementById('action')!.innerHTML = `${status} ${doujinshiName}, please wait...<br/><progress max="100" id="progressBar" value="${progress}"></progress><br/><br/><input type="button" id="buttonBack" value="Cancel"/>`;
        document.getElementById('buttonBack')!.addEventListener('click', function()
        {
            chrome.extension.getBackgroundPage()!.goBack();
            updatePreview(currUrl);
        });
    }
}

let currUrl: string;

// Display popup for a doujinshi
async function doujinshiPreviewAsync(id: string) {
    const resp = await fetch(Parsing.GetUrl(id));
    if (resp.status == 403) {
        document.getElementById('action')!.innerHTML = "This extension must be used on a page containing doujinshi(s) in nhentai.net.";
    } else if (!resp.ok) {
        document.getElementById('action')!.innerHTML = `An unexpected error occured (Code ${resp.status}: ${resp.statusText}).`
    } else {
        
    }
}