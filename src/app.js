const express = require('express');
const prisma = require('./lib/prisma');

const app = express();

app.use(express.json());

app.get("/api/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: "ok",
            database: "connected"
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: "error",
            database: "disconnected"
        });
    }
});

module.exports = app;
