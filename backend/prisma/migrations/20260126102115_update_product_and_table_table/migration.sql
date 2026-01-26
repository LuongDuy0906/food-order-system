/*
  Warnings:

  - You are about to drop the column `quantity` on the `Product` table. All the data in the column will be lost.
  - Added the required column `isEnable` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `floor` to the `Table` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isVip` to the `Table` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "quantity",
ADD COLUMN     "isEnable" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "floor" INTEGER NOT NULL,
ADD COLUMN     "isVip" BOOLEAN NOT NULL;
