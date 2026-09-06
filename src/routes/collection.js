const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

//gets all collections
router.get("/", async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
        include: {
            items: {
                include: {
                    printing: {
                        include: {
                            card: true,
                            set: true,
                    }
                }
            }
        }
    }, 
    orderBy: {
        name: "asc"
    }
    });
    res.json(collections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch collection" });
  }
});

//makes a new collection with the given name
router.post("/", async (req, res) => {
    try {
        const {name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }

        const collection = await prisma.collection.create({
            data: {
                name,
            },
        });

        res.status(201).json(collection);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create collection" });
    }
});

//adds an item to a collection
router.post("/:collectionId/items", async (req, res) => {
    try {
        const collectionId = Number(req.params.collectionId);

        const {
            printingId,
            quantity,
            foil,
            condition,
            language
        } = req.body;

        if (!Number.isInteger(collectionId)) {
            return res.status(400).json({
                error: "Invalid collection ID"
            });
        }

        if (!printingId) {
            return res.status(400).json({
                error: "Printing ID is required"
            });
        }

        const collection = await prisma.collection.findUnique({
            where: {
                id: collectionId
            }
        });

        if (!collection) {
            return res.status(404).json({
                error: "Collection not found"
            });
        }

        const printing = await prisma.printing.findUnique({
            where: {
                id: Number(printingId)
            }
        });

        if (!printing) {
            return res.status(404).json({
                error: "Printing not found"
            });
        }

        const collectionItem = await prisma.collectionItem.create({
            data: {
                collectionId,
                printingId: Number(printingId),
                quantity: quantity ?? 1,
                foil: foil ?? false,
                condition: condition ?? null,
                language: language ?? "English"
            },
            include: {
                printing: {
                    include: {
                        card: true,
                        set: true
                    }
                }
            }
        });

        res.status(201).json(collectionItem);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to add card to collection"
        });
    }
});

//updates an item in a collection
router.put("/:collectionId/items/:itemId", async (req, res) => {
    try {
        const collectionId = Number(req.params.collectionId);
        const itemId = Number(req.params.itemId);

        const {
            quantity,
            foil,
            condition,
            language
        } = req.body;

        if (!Number.isInteger(collectionId) || !Number.isInteger(itemId)) {
            return res.status(400).json({
                error: "Invalid collection or item ID"
            });
        }

        const collectionItem = await prisma.collectionItem.findFirst({
            where: {
                id: itemId,
                collectionId
            }
        });

        if (!collectionItem) {
            return res.status(404).json({
                error: "Collection item not found"
            });
        }

        const updatedItem = await prisma.collectionItem.update({
            where: {
                id: itemId
            },
            data: {
                quantity: quantity ?? collectionItem.quantity,
                foil: foil ?? collectionItem.foil,
                condition: condition ?? collectionItem.condition,
                language: language ?? collectionItem.language
            },
            include: {
                printing: {
                    include: {
                        card: true,
                        set: true
                    }
                }
            }
        });

        res.json(updatedItem);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to update collection item"
        });
    }
});

//deletes an item from a collection
router.delete("/:collectionId/items/:itemId", async (req, res) => {
    try {
        const collectionId = Number(req.params.collectionId);
        const itemId = Number(req.params.itemId);

        if (!Number.isInteger(collectionId) || !Number.isInteger(itemId)) {
            return res.status(400).json({
                error: "Invalid collection or item ID"
            });
        }

        const collectionItem = await prisma.collectionItem.findFirst({
            where: {
                id: itemId,
                collectionId
            }
        });

        if (!collectionItem) {
            return res.status(404).json({
                error: "Collection item not found"
            });
        }

        await prisma.collectionItem.delete({
            where: {
                id: itemId
            }
        });

        res.json({
            message: "Card removed from collection"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to remove card from collection"
        });
    }
});

module.exports = router;