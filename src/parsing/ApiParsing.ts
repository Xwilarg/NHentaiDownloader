import AParsing from "./AParsing";

export default class ApiParsing implements AParsing
{
    GetUrl(id: string): string {
        return 'https://nhentai.net/api/gallery/' + id;
    }

    GetJsonAsync(response: Response): Promise<any> {
        return response.json();
    }
}