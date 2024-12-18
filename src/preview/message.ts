export module message
{
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
        return '<h3>' + title + '</h3><div>(' + nbOfPages + ' pages)' +
            '</div><br/><input type="button" id="button" value="Download" autofocus/><br/><br/>Downloads/<input type="text" id="path"/>' + extension;
    }
    
    export function invalidSyntax(): string {
        return "Invalid page syntax, each number must be separated by a comma ',' or a dash '-'";
    }
    
    export function invalidPageNumber(maxPage: number): string {
        return "Page number must be between 0 and " + maxPage;
    }
    
    export function invalidBounds(): string {
        return "Upper limit must be strictly bigger than lower limit";
    }
}