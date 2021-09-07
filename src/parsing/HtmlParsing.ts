import AParsing from "./AParsing";

export default class HtmlParsing implements AParsing
{
    GetUrl(id: string): string {
        return "https://nhentai.net/g/" + id + "/1/";
    }

    GetJsonAsync(response: Response): Promise<any> {
        return response.text().then((value: string) =>
        {
            return JSON.parse(
                value.split("window._gallery = JSON.parse(\"")[1].split("\");")[0].replace(/\\u[\dA-F]{4}/gi,
                    function (match) {
                         return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
                    }
                )
            );
        });
    }
}