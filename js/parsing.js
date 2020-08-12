var ParsingApi =
{
    GetJson: function(response) {
        return (response);
    },
    GetUrl: function(id) {
        return ('https://nhentai.net/api/gallery/' + id);
    }
};

var ParsingHtml =
{
    GetJson: function(response) {
        return (response.split("gallery: ")[1].split(",\n\t\t\tstart_page:")[0]);
    },
    GetUrl: function(id) {
        return ("https://nhentai.net/g/" + id + "/1/")
    }
};

function cleanName(name, replaceSpaces) {
    let cleanName = "";
    name.split('').forEach (function(e) {
        if (e === ' ' && replaceSpaces)
            cleanName += '_';
        else if (e !== '/' && e !== '\\' && e !== '?' && e !== '%' && e !== '*' && e !== ':'
            && e !== '|' && e !== '"' && e != '<' && e != '>' && e !== '.')
            cleanName += e;
    });
    if (replaceSpaces) {
        cleanName = cleanName.replace(/_+/g, '_');
    }
    return cleanName;
}

function getDownloadName(exampleString, prettyName, englishName, japaneseName, id, tags) {
    console.log(prettyName);
    exampleString = exampleString.replace(/{pretty}/g, prettyName);
    exampleString = exampleString.replace(/{english}/g, englishName);
    exampleString = exampleString.replace(/{japanese}/g, japaneseName);
    exampleString = exampleString.replace(/{id}/g, id);
    let language = "";
    let artists = [];
    let groups = [];
    let characters = [];
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