import AParsing from "./AParsing";

export default class ApiParsing implements AParsing
{
    GetUrl(id: number): string {
        return 'https://nhentai.net/api/gallery/' + id;
    }

    GetJson(response: string): string {
        return response;
    }
}