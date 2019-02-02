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