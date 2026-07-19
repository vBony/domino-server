-- DropForeignKey
ALTER TABLE "game_moves" DROP CONSTRAINT "game_moves_match_id_fkey";

-- DropForeignKey
ALTER TABLE "game_moves" DROP CONSTRAINT "game_moves_user_id_fkey";

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "moves" JSONB NOT NULL DEFAULT '[]';

-- DropTable
DROP TABLE "game_moves";

-- DropEnum
DROP TYPE "MoveType";

