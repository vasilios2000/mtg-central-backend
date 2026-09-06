const axios = require("axios");
const fs = require("fs");
const path = require("path");

const scryfall = axios.create({
    baseURL: "https://api.scryfall.com",
    headers: {
        "User-Agent": "MTG-Central/1.0",
        "Accept": "application/json"
    }
});

async function getBulkData() {
    const response = await scryfall.get("/bulk-data");

    return response.data;
}

async function downloadAllCards() {
    const bulkData = await getBulkData();

    const allCards = bulkData.data.find(
        dataset => dataset.type === "all_cards"
    );

    if (!allCards) {
        throw new Error("Scryfall all_cards dataset was not found");
    }

    const dataDirectory = path.join(__dirname, "../../data");

    fs.mkdirSync(dataDirectory, {
        recursive: true
    });

    const filePath = path.join(dataDirectory, "all_cards.jsonl.gz");

    console.log("Downloading Scryfall all_cards dataset...");
    console.log(`Download URL: ${allCards.jsonl_download_uri}`);

    const response = await axios.get(allCards.jsonl_download_uri, {
        responseType: "stream"
    });

    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });

    console.log(`Scryfall data saved to: ${filePath}`);

    return {
        filePath,
        updatedAt: allCards.updated_at
    };
}

module.exports = {
    getBulkData,
    downloadAllCards
};