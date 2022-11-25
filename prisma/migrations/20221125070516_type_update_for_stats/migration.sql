/*
  Warnings:

  - You are about to alter the column `success` on the `Stats` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "operation" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "resTime" INTEGER NOT NULL
);
INSERT INTO "new_Stats" ("id", "operation", "resTime", "success") SELECT "id", "operation", "resTime", "success" FROM "Stats";
DROP TABLE "Stats";
ALTER TABLE "new_Stats" RENAME TO "Stats";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
