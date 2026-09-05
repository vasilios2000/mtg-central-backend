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


        //create or update the card in the database
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

        //create or update the set in the database
        const set = await prisma.set.upsert({
            where: { scryfallId: scryfallCard.set_id 

            },
            update: {
                code: scryfallCard.set,
                name: scryfallCard.set_name,
            },
            create: {
                scryfallId: scryfallCard.set_id,
                code: scryfallCard.set,
                name: scryfallCard.set_name,
                setType: "unknown"
            }
        });

        //create or update the printing in the database
        const printing = await prisma.printing.upsert({
            where: {
                scryfallId: scryfallCard.id
            },
            update: {
                cardId: card.id,
                setId: set.id,
                collectorNumber: scryfallCard.collector_number,
                rarity: scryfallCard.rarity,
                artist: scryfallCard.artist || null,
                flavorText: scryfallCard.flavor_text || null,
                imageUris: scryfallCard.image_uris?.normal || null
            },
            create: {
                scryfallId: scryfallCard.id,
                cardId: card.id,
                setId: set.id,
                collectorNumber: scryfallCard.collector_number,
                rarity: scryfallCard.rarity,
                artist: scryfallCard.artist || null,
                flavorText: scryfallCard.flavor_text || null,
                imageUris: scryfallCard.image_uris?.normal || null
            }
        });

        res.status(201).json({
            card,
            set,
            printing
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to import card' });
    }
});



module.exports = router;