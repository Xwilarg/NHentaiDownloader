chrome.storage.sync.get({
    displayCheckbox: true
}, function(elems) {
    if (elems.displayCheckbox) {
        var captions = document.getElementsByClassName("caption");
        for (let i = 0; i < captions.length; i++)
        {
            captions[i].innerHTML += '<br/><br/><input type="checkbox"> NHentai Downloader:<br/>Add to downloads<br/>&nbsp;';
        }
    }
});