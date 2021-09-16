# NHentaiDownloader
A chrome extension to download doujinshi from NHentai

NHentai only allow to download doujinshi in .torrent format so I created this extension allowing to download them either in ZIP, CBZ or raw format.<br/>
You can either go on a doujinshi page to download it, or go to a page containing many of them to download them all at once.
<br/><br/>

[![CI](https://github.com/Xwilarg/NHentaiDownloader/workflows/CI/badge.svg)](https://github.com/Xwilarg/NHentaiDownloader/actions)

## How to install the extension from Release page

### Chrome
- First latest version of the extension on the [release page](https://github.com/Xwilarg/NHentaiDownloader/releases) (don't download the source code, you only need NHentaiDownloader.zip), unzip it somewhere in your computer
- Write chrome://extensions/ in your address bar
- Enable the developer mode (top right corner of the page)
- Press the "Load Unpacked" button (top left corner of the page)
- Go inside the folder of the extension and press "Select a folder"

### Firefox
**There is currently an issue on Firefox where the extension fails to download anything with no error, since it seems to happen in a library I'm using and I have no clue why, I won't be fixing it for now** 
<del>
- First latest version of the extension on the [release page](https://github.com/Xwilarg/NHentaiDownloader/releases) (don't download the source code, you only need NHentaiDownloader.zip), unzip it somewhere in your computer
- Write about:debugging#/runtime/this-firefox in your address bar
- Press the "Load Temporary Add-on" button
- Go inside the folder of the extension and select "manifest_firefox.json"
</del>

## A quick note about the Chrome store

This extension was removed the 04/12/2020 from the Chrome Store because it doesn't comply with terms of service (since it contains mature content)<br/>
While there is nothing I can do against that, I still want to thanks you for using it, over 2 years it got a note of 4.3/5 and 12 858 users.<br/>
![Chrome](Preview/Chrome.png)

## Build locally
```
npm install
npm run build
```

### Start unit tests
```
npm test
```

## Single download

![Overview](Preview/Overview.png)<br/>
![Folder](Preview/Folder.png)

## Download many doujinshi at a time

![Overview](Preview/Overview-many.png)<br/>
![Folder](Preview/Folder-many.png)

## Download many pages at a time

![Overview](Preview/Overview-pages.png)<br/>
![Folder](Preview/Folder-pages.png)
