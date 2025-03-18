import AOption from "./AOption";

export default class Select implements AOption
{
    constructor(id: string) {
        this.#id = id;
    }

    init(elems: any): void {
        let select = document.getElementById(this.#id) as HTMLSelectElement;
        for (var i, j = 0; i = select.options[j]; j++) {
            if (i.value == elems[this.#id]) {
                select.selectedIndex = j;
                break;
            }
        }
    }

    update(object: any): any {
        let select = object as HTMLSelectElement;
        return select.options[select.selectedIndex].value;
    }

    getId() : string {
        return this.#id;
    }
    
    #id: string;
}