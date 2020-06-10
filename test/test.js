const assert = require('assert');
const fetch = require('node-fetch')

describe('Is API alive', () => {
    it('Get doujinshi pretty text', () => {
        fetch('https://nhentai.net/api/gallery/161194')
        .then(function(response) {
            assert.equal(response.status, 200);
            return response.json();
        })
        .then(function(json) {
            assert.equal(json.title.pretty, "Tsuna-kan. | Tuna Can");
        });
    });
});