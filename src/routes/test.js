const express = require('express');
const {getCardByName} = require('../services/scryfall');

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

module.exports = router;