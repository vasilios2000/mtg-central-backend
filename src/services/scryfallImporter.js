const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const readline = require("readline");
const prisma = require("../lib/prisma");

const BATCH_SIZE = 500;

async function importAllCards() {

    const startTime = Date.now();

    const filePath = path.join(
        __dirname,
        "../../data/all_cards.jsonl.gz"
    );

    if (!fs.existsSync(filePath)) {
        throw new Error(`Scryfall data file not found: ${filePath}`);
    }

    const fileStream = fs.createReadStream(filePath);
    const gzipStream = zlib.createGunzip();

    const input = fileStream.pipe(gzipStream);

    const rl = readline.createInterface({
        input,
        crlfDelay: Infinity
    });

    let cards = [];
    let count = 0;
    let batchNumber = 0;

    try {
        for await (const line of rl) {
            if (!line.trim()) {
                continue;
            }

            let scryfallCard;

            try {
                scryfallCard = JSON.parse(line);
            } catch (error) {
                throw new Error(
                    `Failed to parse Scryfall data around card ${count + 1}: ${error.message}`
                );
            }

            cards.push(scryfallCard);

            if (cards.length >= BATCH_SIZE) {
                batchNumber++;

                console.log(
                    `Processing batch ${batchNumber}...`
                );

                await processBatch(cards);

                count += cards.length;

                console.log(
                    `Processed ${count} cards`
                );

                cards = [];
            }
        }

        if (cards.length > 0) {
            batchNumber++;

            console.log(
                `Processing final batch ${batchNumber}...`
            );

            await processBatch(cards);

            count += cards.length;

            const elapsedSeconds = (Date.now() - startTime) / 1000;
            
            const cardsPerSecond = (count / elapsedSeconds).toFixed(2);

            console.log(
                `Processed ${count} cards in ${elapsedSeconds.toFixed(2)} seconds (${cardsPerSecond} cards/sec)`
            );
    
        }

        console.log(`Finished processing ${count} cards.`);

        return {
            imported: count
        };

    } catch (error) {
        console.error(
            `Import failed while processing batch ${batchNumber}.`
        );

        throw error;
    }
}

async function processBatch(cards) {
    const cardData = [];
    const setData = [];
    const printingData = [];

    const seenCards = new Set();
    const seenSets = new Set();

    for (const scryfallCard of cards) {
        if (!seenCards.has(scryfallCard.id)) {
            seenCards.add(scryfallCard.id);
            
            const cardFace = scryfallCard.card_faces?.[0];

            const typeLine = scryfallCard.type_line || cardFace?.type_line || null;
            const oracleText = scryfallCard.oracle_text || cardFace?.oracle_text || null;
            const manaCost = scryfallCard.mana_cost || cardFace?.mana_cost || null;
            const colors = scryfallCard.colors || cardFace?.colors || null;
            const power = scryfallCard.power || cardFace?.power || null;
            const toughness = scryfallCard.toughness || cardFace?.toughness || null;

            if (!typeLine) {
                throw new Error(
                    `Missing type_line for ${scryfallCard.typeLine} ${scryfallCard.name} (${scryfallCard.id})`
                );
            }
            cardData.push({
                scryfallId: scryfallCard.id,
                name: scryfallCard.name,
                manaCost,
                typeLine,
                oracleText,
                colors,
                colorIdentity: scryfallCard.color_identity || null,
                power,
                toughness
            });
        }

        if (!seenSets.has(scryfallCard.set_id)) {
            seenSets.add(scryfallCard.set_id);

            setData.push({
                scryfallId: scryfallCard.set_id,
                code: scryfallCard.set,
                name: scryfallCard.set_name,
                setType: "unknown"
            });
        }
    }

    // Insert Cards
    await prisma.card.createMany({
        data: cardData,
        skipDuplicates: true
    });

    // Insert Sets
    await prisma.set.createMany({
        data: setData,
        skipDuplicates: true
    });

    // Get database IDs for Cards
    const cardRecords = await prisma.card.findMany({
        where: {
            scryfallId: {
                in: cardData.map(card => card.scryfallId)
            }
        },
        select: {
            id: true,
            scryfallId: true
        }
    });

    // Get database IDs for Sets
    const setRecords = await prisma.set.findMany({
        where: {
            scryfallId: {
                in: setData.map(set => set.scryfallId)
            }
        },
        select: {
            id: true,
            scryfallId: true
        }
    });

    const cardIdMap = new Map(
        cardRecords.map(card => [
            card.scryfallId,
            card.id
        ])
    );

    const setIdMap = new Map(
        setRecords.map(set => [
            set.scryfallId,
            set.id
        ])
    );

    // Build Printing records
    for (const scryfallCard of cards) {
        const cardId = cardIdMap.get(scryfallCard.id);
        const setId = setIdMap.get(scryfallCard.set_id);

        if (!cardId || !setId) {
            throw new Error(
                `Missing Card or Set for ${scryfallCard.name}`
            );
        }

        printingData.push({
            scryfallId: scryfallCard.id,
            cardId,
            setId,
            collectorNumber: scryfallCard.collector_number,
            rarity: scryfallCard.rarity,
            artist: scryfallCard.artist || null,
            flavorText: scryfallCard.flavor_text || null,
            imageUris: scryfallCard.image_uris || null
        });
    }

    // Insert Printings
    await prisma.printing.createMany({
        data: printingData,
        skipDuplicates: true
    });
}

module.exports = {
    importAllCards
};