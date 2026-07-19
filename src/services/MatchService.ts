import { Prisma } from "../generated/prisma";
import { Side } from "../game/DominoRules";
import { prisma } from "../instances/prisma";

export type MoveType = "play_tile" | "pass_turn" | "draw_tile";

export interface SeatAssignment {
  seat: number;
  userId: string;
  team: number;
}

// Uma entrada do historico de jogadas de uma partida. Acumulado em memoria
// pela DominoRoom (this.moveLog) e gravado de uma vez em Match.moves
// (jsonb) no finishMatch/abortMatch - nao e mais uma linha por jogada no
// banco (ver schema.prisma para o motivo).
export interface MoveLogEntry {
  userId: string;
  type: MoveType;
  tileId?: string;
  side?: Side;
  turnNumber: number;
  at: string;
}

const POINTS_PER_WIN = 10;

// Persistencia da partida: historico de movimentos, jogadores participantes,
// vencedor, pontuacao e ranking. Chamado pela DominoRoom em pontos-chave do
// ciclo de vida da partida (inicio, fim).
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

  // winningTeam null = empate (jogo travado): a partida fica registrada
  // como encerrada sem vencedor e o ranking nao e alterado para ninguem -
  // fica neutro ate existir uma revanche de desempate valendo pontos em dobro.
  static async finishMatch(
    matchId: string,
    winningTeam: number | null,
    scoreTeamA: number,
    scoreTeamB: number,
    seats: SeatAssignment[],
    moves: MoveLogEntry[]
  ) {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: "finished",
        finishedAt: new Date(),
        winnerTeam: winningTeam,
        scoreTeamA,
        scoreTeamB,
        moves: moves as unknown as Prisma.InputJsonValue,
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

  static async abortMatch(matchId: string, moves: MoveLogEntry[]) {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "finished", finishedAt: new Date(), moves: moves as unknown as Prisma.InputJsonValue },
    });
  }
}
