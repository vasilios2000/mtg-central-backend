const axios = require('axios');

const scryfall = axios.create({
    baseURL: 'https://api.scryfall.com',
    headers: {
        'User-Agent': "MTG-Central/1.0"
    }
});

async function getCardByName(name) {
    const response = await scryfall.get("/cards/named", {
        params: {
            exact: name
        }
    });
    return response.data;
}   


module.exports = {
    getCardByName
};