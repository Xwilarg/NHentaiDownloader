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
        if ((e >= 'a' && e <= 'z') || (e >= 'A' && e <= 'Z') || (e >= '0' && e <= '9') || e === '-' || e === '_')
            cleanName += e;
        else if (e === ' ')
            cleanName += '_';
    });
    cleanName = cleanName.replace(/_+/g, '_');
    return cleanName;
}