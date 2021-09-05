import Tag from "./tag"

export module utils
{
    // Clean a word, if replaceSpaces is true, all spaces are replaced by an underscore
    export function cleanName(name: string, replaceSpaces: boolean): string {
        let newName = name.split('').filter(e => !invalidCharacter.includes(e)).join('');
        if (replaceSpaces) {
            return newName.replace(/ +/g, '_');
        }
        return newName;
    }

    export function getDownloadName(exampleString: string, prettyName: string, englishName: string, japaneseName: string, id: string, tags: Array<Tag>): string {
        exampleString = exampleString.replace(/{pretty}/g, prettyName);
        exampleString = exampleString.replace(/{english}/g, englishName);
        exampleString = exampleString.replace(/{japanese}/g, japaneseName);
        exampleString = exampleString.replace(/{id}/g, id);
        let language = "";
        let artists : Array<string> = [];
        let groups : Array<string> = [];
        let characters : Array<string> = [];
        tags.forEach(function(e) {
            if (e.type === "group") groups.push(e.name);
            else if (e.type === "character") characters.push(e.name);
            else if (e.type === "artist") artists.push(e.name);
            else if (e.type === "language" && e.name !== "translated") language = e.name;
        });
        exampleString = exampleString.replace(/{group}/g, groups.join(", "));
        exampleString = exampleString.replace(/{character}/g, characters.join(", "));
        exampleString = exampleString.replace(/{artist}/g, artists.join(", "));
        exampleString = exampleString.replace(/{language}/g, language);
        return exampleString;
    }

    let invalidCharacter: Array<string> = [
        '/', '\\', '?', '%', '*', ':', '|', '"', '<', '>', '.'
    ]
}