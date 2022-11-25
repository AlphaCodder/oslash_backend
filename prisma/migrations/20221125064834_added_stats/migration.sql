/*
  Warnings:

  - You are about to drop the `Performance` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Performance";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "operation" TEXT NOT NULL,
    "success" INTEGER NOT NULL,
    "resTime" INTEGER NOT NULL
);
