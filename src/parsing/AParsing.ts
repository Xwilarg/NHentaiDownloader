export default abstract class AParsing {
    abstract GetUrl(id: string): string;
    abstract GetJsonAsync(response: Response): Promise<any>;
}