const express = require('express');
const prisma = require('../lib/prisma');
const { getCardByName } = require('../services/scryfall');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const cards = await prisma.card.findMany({
            orderBy: {
                name: "asc"
            }
        })
        res.json(cards);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post("/import", async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                error: "Card name is required"
            });
        }

        const scryfallCard = await getCardByName(name);

        const card = await prisma.card.upsert({
            where: { scryfallId: scryfallCard.id },
            update: {
                name: scryfallCard.name,
                manaCost: scryfallCard.mana_cost || null,
                typeLine: scryfallCard.type_line,
                oracleText: scryfallCard.oracle_text || null,
                colors: scryfallCard.colors || null,
                colorIdentity: scryfallCard.color_identity || null,
                power: scryfallCard.power || null,
                toughness: scryfallCard.toughness || null,
            },
            create: {
                scryfallId: scryfallCard.id,
                name: scryfallCard.name,
                manaCost: scryfallCard.mana_cost || null,
                typeLine: scryfallCard.type_line,
                oracleText: scryfallCard.oracle_text || null,
                colors: scryfallCard.colors || null,
                colorIdentity: scryfallCard.color_identity || null,
                power: scryfallCard.power || null,
                toughness: scryfallCard.toughness || null,
            }
        });

        res.status(201).json(card);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to import card' });
    }
});



module.exports = router;