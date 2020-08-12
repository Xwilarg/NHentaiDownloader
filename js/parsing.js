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

function getDownloadName(exampleString, prettyName, englishName, japaneseName, id) {
    console.log(prettyName);
    exampleString = exampleString.replace(/{pretty}/g, prettyName);
    exampleString = exampleString.replace(/{english}/g, englishName);
    exampleString = exampleString.replace(/{japanese}/g, japaneseName);
    exampleString = exampleString.replace(/{id}/g, id);
    return exampleString;
}