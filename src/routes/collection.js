const express = require('express');
const prisma = require('../lib/prisma');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const collection = await prisma.collectionEntry.findMany({
            include: {
                printing: {
                    include: {
                        card: true,
                        set: true
                    }
                }
            },
            orderBy: {
                id: "asc"
            }
        });
        res.json(collection);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to fetch collection'        
        });
    }  
});

router.post('/', async (req, res) => {
    try {
        const {
            printingId,
            quantity,
            foil,
            condition,
            language
        } = req.body;

        if (!printingId) {
            return res.status(400).json({ error: 'Printing ID is required' 

            });  
        }

        const collectionEntry = await prisma.collectionEntry.create({
            data: {
                printingId,
                quantity: quantity || 1,
                foil: foil || false,
                condition: condition || null,
                language: language || "English"
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

        res.status(201).json(collectionEntry);
                
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to add card to collection' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        const {
            quantity,
            foil,
            condition,
            language  
        } = req.body;

        const collectionEntry = await prisma.collectionEntry.update({
            where: { id },
            data: {
                quantity,
                foil,
                condition,
                language
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
        
        res.json(collectionEntry);
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to update collection entry' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        await prisma.collectionEntry.delete({
            where: { id }
        });

        res.json({ message: 'Collection entry deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Failed to delete collection entry' });
    }
});

module.exports = router;