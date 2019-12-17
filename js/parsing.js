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

function cleanName(name) {
    let cleanName = "";
    name.split('').forEach (function(e) {
        if (e === ' ')
            cleanName += '_';
        else if (e !== '/' && e !== '\\' && e !== '?' && e !== '%' && e !== '*' && e !== ':'
            && e !== '|' && e !== '"' && e != '<' && e != '>' && e !== '.')
            cleanName += e;
    });
    cleanName = cleanName.replace(/_+/g, '_');
    return cleanName;
}