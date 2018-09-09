chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    let url = tabs[0].url;
    if (url.match('https://nhentai.net/g/[0-9]*/[/0-9a-z]*')) {
        let id = url.replace("https://nhentai.net/g/", "").split('/')[0];
        let http = new XMLHttpRequest();
        http.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    let json = JSON.parse(this.responseText);
                    document.getElementById('action').innerHTML = '<h3>' + json.title.pretty + '</h3><div id="center">(' + json.images.pages.length + ' pages)' +
                    '</div><br/><input type="button" id="button" value="Download"><br/><br/>Downloads/<input type="text" id="path">';
                    document.getElementById('path').value = id;
                    document.getElementById('button').addEventListener('click', function()
                    {
                        http = new XMLHttpRequest();
                        http.onreadystatechange = function() {
                            if (this.readyState == 4) {
                                if (this.status === 200) {
                                    chrome.extension.getBackgroundPage().download(this.responseText, document.getElementById('path').value, function(error) {
                                        document.getElementById('action').innerHTML = 'An error occured while downloading the doujinshi: <b>' + error.message + '</b>';
                                    });
                                    document.getElementById('action').innerHTML = "Your files are downloading, thanks for using NHentaiDownloader.";
                                } else if (this.status === 403) {
                                    document.getElementById('action').innerHTML = "This extension must be used on a doujinshi page in nhentai.net.";
                                } else {
                                    document.getElementById('action').innerHTML = "An unexpected error occured (Code " + this.status + ").";
                                }
                            }
                        }
                        http.open("GET", 'https://nhentai.net/api/gallery/' + id, true);
                        http.send();
                    });
                } else {
                    document.getElementById('action').innerHTML = "An unexpected error occured (Code " + this.status + ").";
                }
            }
        };
        http.open("GET", 'https://nhentai.net/api/gallery/' + id, true);
        http.send();
    }
    else
        document.getElementById('action').innerHTML = "This extension must be used on a doujinshi page in nhentai.net.";
});
