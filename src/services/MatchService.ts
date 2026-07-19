import { Side } from "../game/DominoRules";
import { prisma } from "../instances/prisma";

export type MoveType = "play_tile" | "pass_turn" | "draw_tile";

export interface SeatAssignment {
  seat: number;
  userId: string;
  team: number;
}

const POINTS_PER_WIN = 10;

// Persistencia da partida: historico de movimentos, jogadores participantes,
// vencedor, pontuacao e ranking. Chamado pela DominoRoom em pontos-chave do
// ciclo de vida da partida (inicio, cada jogada valida, fim).
export class MatchService {
  static async createMatch(roomId: string, seats: SeatAssignment[]) {
    return prisma.match.create({
      data: {
        roomId,
        status: "playing",
        startedAt: new Date(),
        players: {
          create: seats.map((seat) => ({ userId: seat.userId, seat: seat.seat, team: seat.team })),
        },
      },
    });
  }

  static async recordMove(
    matchId: string,
    userId: string,
    type: MoveType,
    turnNumber: number,
    tileId?: string,
    side?: Side
  ) {
    await prisma.gameMove.create({
      data: { matchId, userId, type, turnNumber, tileId, side },
    });
  }

  // winningTeam null = empate (jogo travado): a partida fica registrada
  // como encerrada sem vencedor e o ranking nao e alterado para ninguem -
  // fica neutro ate existir uma revanche de desempate valendo pontos em dobro.
  static async finishMatch(
    matchId: string,
    winningTeam: number | null,
    scoreTeamA: number,
    scoreTeamB: number,
    seats: SeatAssignment[]
  ) {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "finished",
        finishedAt: new Date(),
        winnerTeam: winningTeam,
        scoreTeamA,
        scoreTeamB,
      },
    });

    if (winningTeam === null) return;

    await Promise.all(
      seats.map(async (seat) => {
        const won = seat.team === winningTeam;
        await prisma.matchPlayer.updateMany({
          where: { matchId, seat: seat.seat },
          data: { score: won ? POINTS_PER_WIN : 0 },
        });
        await prisma.ranking.upsert({
          where: { userId: seat.userId },
          create: { userId: seat.userId, wins: won ? 1 : 0, losses: won ? 0 : 1, points: won ? POINTS_PER_WIN : 0 },
          update: {
            wins: { increment: won ? 1 : 0 },
            losses: { increment: won ? 0 : 1 },
            points: { increment: won ? POINTS_PER_WIN : 0 },
          },
        });
      })
    );
  }

  static async abortMatch(matchId: string) {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "finished", finishedAt: new Date() },
    });
  }
}
