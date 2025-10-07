/*
  Warnings:

  - A unique constraint covering the columns `[keyName]` on the table `Genre` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `keyName` to the `Genre` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Genre" ADD COLUMN     "keyName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Genre_keyName_key" ON "Genre"("keyName");
