const express = require('express');

const {getCardByName} = require('../services/scryfall');
const {
    getBulkData,
    downloadAllCards
} = require('../services/scryfallbulk');

const {importAllCards} = require('../services/scryfallImporter');

const router = express.Router();

router.get("/scryfall", async (req, res) => {
    try {
        const card = await getCardByName("Lightning Bolt");

        res.json({
            id: card.id,
            name: card.name,
            set: card.set,
            setName: card.set_name,
            rarity: card.rarity,
        });
    } catch (error) {
        console.error(error);
        
        res.status(500).json({
            error: "Failed to fetch card from scryfall"
        });
    }
});


router.get("/scryfall/bulk", async (req, res) => {
    try {
        const bulkData = await getBulkData();

        const datasets = bulkData.data.map(dataset => ({
            type: dataset.type,
            name: dataset.name,
            updatedAt: dataset.updated_at,
            downloadUri: dataset.jsonl_download_uri
        }));

        res.json(datasets);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to fetch Scryfall bulk data"
        });
    }
});

router.get("/scryfall/download", async (req, res) => {
    try {
        const result = await downloadAllCards();

        res.json({
            message: "Scryfall all_cards dataset downloaded",
            filePath: result.filePath,
            updatedAt: result.updatedAt
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to download Scryfall all_cards dataset"
        });
    }
});

router.get("/scryfall/import-all", async (req, res) => {
    try {
        const result = await importAllCards();

        res.json({
            message: "Scryfall import completed",
            imported: result.imported
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to import Scryfall cards"
        });
    }
});


module.exports = router;