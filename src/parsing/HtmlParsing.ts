import AParsing from "./AParsing";

export default class HtmlParsing implements AParsing
{
    GetUrl(id: number): string {
        return "https://nhentai.net/g/" + id + "/1/";
    }

    GetJson(response: string): string {
        return response.split("gallery: ")[1].split(",\n\t\t\tstart_page:")[0];
    }
}