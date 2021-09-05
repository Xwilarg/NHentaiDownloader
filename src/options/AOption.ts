export default abstract class AOption
{
    abstract init(elems: any): void;
    abstract update(object: any): any;
    abstract getId(): string
}