import AOption from "./AOption";

export default class CheckBox implements AOption
{
    constructor(id: string) {
        this.#id = id;
    }

    init(elems: any): void {
        (document.getElementById(this.#id) as HTMLInputElement).checked = elems[this.#id];
    }

    update(object: any): any {
        return (object as HTMLInputElement).checked as any;
    }

    getId() : string {
        return this.#id;
    }
    
    #id: string;
}