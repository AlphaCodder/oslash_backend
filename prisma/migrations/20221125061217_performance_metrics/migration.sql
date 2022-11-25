-- CreateTable
CREATE TABLE "Performance" (
    "id" INTEGER NOT NULL,
    "success" INTEGER NOT NULL,
    "failure" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Performance_id_key" ON "Performance"("id");
