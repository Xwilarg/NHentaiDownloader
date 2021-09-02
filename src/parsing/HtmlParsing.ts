import AParsing from "./AParsing";

export default class HtmlParsing implements AParsing
{
    GetUrl(id: string): string {
        return "https://nhentai.net/g/" + id + "/1/";
    }

    GetJsonAsync(response: Response): Promise<any> {
        return response.text().then((value: string) => { return value.split("gallery: ")[1].split(",\n\t\t\tstart_page:")[0]; });
    }
}