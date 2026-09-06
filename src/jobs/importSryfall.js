require("dotenv").config();

const { importAllCards } = require("../services/scryfallImporter");
const prisma = require("../lib/prisma");

let shuttingDown = false;

process.on("SIGINT", async () => {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log("");
    console.log("Stopping Scryfall import...");

    try {
        await prisma.$disconnect();
        console.log("Database connection closed.");
    } catch (error) {
        console.error("Failed to close database connection.");
    }

    process.exit(0);
});

async function main() {
    console.log("Starting Scryfall import...");
    console.log("");

    try {
        const result = await importAllCards();

        console.log("");
        console.log("Scryfall import completed.");
        console.log(`Cards processed: ${result.imported}`);

    } catch (error) {
        console.error("");
        console.error("Scryfall import failed.");
        console.error(error);

        process.exitCode = 1;

    } finally {
        if (!shuttingDown) {
            await prisma.$disconnect();
        }
    }
}

main();