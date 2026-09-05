/*
  Warnings:

  - The `imageUris` column on the `Printing` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Printing" DROP COLUMN "imageUris",
ADD COLUMN     "imageUris" JSONB;
