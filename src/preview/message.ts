export function downloadDone(): string {
    return 'Your file was downloaded, thanks for using NHentai Downloader.<br/><br/><input type="button" id="buttonBack" value="Go Back"/>'
}

export function downloadProgress(status: string, doujinshiName: string, progress: number): string {
    return `${status} ${doujinshiName}, please wait...<br/><progress max="100" id="progressBar" value="${progress}"></progress><br/><br/><input type="button" id="buttonBack" value="Cancel"/>`;
}

export function invalidPage(): string {
    return "This extension must be used on a page containing doujinshi(s) in nhentai.net.";
}

export function errorDownload(error: string): string {
    return 'An error occured while downloading the doujinshi: <b>' + error + '</b>';
}

export function errorOther(status: number, statusText: string): string {
    return `An unexpected error occured (Code ${status}: ${statusText}).`;
}

export function downloadInfo(title: string, nbOfPages: number, extension: string): string {
    return '<h3 id="center">' + title + '</h3><div id="center">(' + nbOfPages + ' pages)' +
        '</div><br/><input type="button" id="button" value="Download" autofocus/><br/><br/>Downloads/<input type="text" id="path"/>' + extension;
}