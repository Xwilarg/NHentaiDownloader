export default abstract class AParsing {
    abstract GetUrl(id: number): string;
    abstract GetJson(response: string): string;
}