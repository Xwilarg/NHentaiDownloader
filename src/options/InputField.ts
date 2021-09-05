import AOption from "./AOption";

export default class InputField implements AOption
{
    constructor(id: string) {
        this.#id = id;
    }

    init(elems: any): void {
        (document.getElementById(this.#id) as HTMLInputElement).value = elems[this.#id];
    }

    update(object: any): any {
        let value = (object as HTMLInputElement).value;
        if (value.trim().length !== 0) {
            return null;
        }
        return (object as HTMLInputElement).value as any;
    }

    getId() : string {
        return this.#id;
    }
    
    #id: string;
}