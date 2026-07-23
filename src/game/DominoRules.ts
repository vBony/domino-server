import { Tile } from "./Deck";

export type Side = "left" | "right";

export interface BoardEnds {
  left: number;
  right: number;
}

export function teamOf(seat: number): number {
  return seat % 2;
}

export function canPlace(tile: Tile, side: Side, boardEnds: BoardEnds | null): boolean {
  if (!boardEnds) return true;
  const target = side === "left" ? boardEnds.left : boardEnds.right;
  return tile.left === target || tile.right === target;
}

// Reorienta a peca para que o lado que encosta no fim da mesa fique voltado
// para o centro (ex: mesa termina em 4, jogador encaixa peca "4-2" no lado
// direito -> deve virar "4-2" para o 4 ficar colado no fim existente).
export function orientTileForPlacement(tile: Tile, side: Side, boardEnds: BoardEnds | null): Tile {
  if (!boardEnds) return tile;
  const target = side === "left" ? boardEnds.left : boardEnds.right;
  if (side === "left") {
    return tile.right === target ? tile : { ...tile, left: tile.right, right: tile.left };
  }
  return tile.left === target ? tile : { ...tile, left: tile.right, right: tile.left };
}

export function hasLegalMove(hand: Tile[], boardEnds: BoardEnds | null): boolean {
  if (!boardEnds) return hand.length > 0;
  return hand.some((t) => canPlace(t, "left", boardEnds) || canPlace(t, "right", boardEnds));
}

// Simula a jogada (peca "tile" no lado "side") e verifica se, com o
// tabuleiro resultante, NENHUM assento (considerando as maos reais de todos,
// menos a peca jogada saindo da mao de quem jogou) teria jogada legal - ou
// seja, se essa escolha de lado fecha o jogo imediatamente. Usado para a
// regra "nao pode fechar o jogo escolhendo um lado da peca se o outro lado
// da mesma peca mantem o jogo aberto".
export function wouldBlockGame(
  hands: Map<number, Tile[]>,
  boardEnds: BoardEnds | null,
  actingSeat: number,
  tile: Tile,
  side: Side
): boolean {
  const oriented = orientTileForPlacement(tile, side, boardEnds);
  const newBoardEnds: BoardEnds = boardEnds
    ? {
        left: side === "left" ? oriented.left : boardEnds.left,
        right: side === "right" ? oriented.right : boardEnds.right,
      }
    : { left: oriented.left, right: oriented.right };

  for (const [seat, hand] of hands) {
    const remainingHand = seat === actingSeat ? hand.filter((t) => t.id !== tile.id) : hand;
    if (hasLegalMove(remainingHand, newBoardEnds)) return false;
  }
  return true;
}

// Classificacao da vitoria por mao vazia, do maior para o menor bonus.
// So uma se aplica por vitoria (a primeira que bater, na ordem abaixo):
//
// 1. "gabuada" (25 pts): o vencedor jogou uma pedra comum que fechou uma
//    ponta com o mesmo numero da bucha que ele guardava, provocando passe
//    geral (todos os outros 3 assentos passam em sequencia), e na volta do
//    turno bate com a propria bucha. Nao precisa checar explicitamente "foi
//    o mesmo jogador que fechou e que bateu" - com 4 assentos fixos e turno
//    sempre avancando +1 (jogada ou passe), 3 passes consecutivos SO podem
//    devolver o turno para quem jogou por ultimo (ver DominoGame.playTile).
//    Por isso "precededByFullPassCycle" ja garante isso sozinho.
// 2. "double-ended" (15 pts): a ultima pedra encaixava nas duas pontas
//    abertas no momento da jogada (independente de qual lado foi escolhido).
// 3. "double" (15 pts, mesmo valor de "double-ended"): a ultima pedra e uma
//    bucha, sem se encaixar forcosamente nas duas pontas.
// 4. "common" (10 pts): qualquer outra vitoria por mao vazia.
export type WinReason = "gabuada" | "double-ended" | "double" | "common";

export const WIN_BONUS_POINTS: Record<WinReason, number> = {
  gabuada: 25,
  "double-ended": 15,
  double: 15,
  common: 10,
};

export function classifyHandEmptyWin(
  tile: Tile,
  boardEndsBeforePlay: BoardEnds | null,
  precededByFullPassCycle: boolean
): WinReason {
  const isDouble = tile.left === tile.right;

  if (precededByFullPassCycle && isDouble) return "gabuada";

  if (
    boardEndsBeforePlay &&
    canPlace(tile, "left", boardEndsBeforePlay) &&
    canPlace(tile, "right", boardEndsBeforePlay)
  ) {
    return "double-ended";
  }

  if (isDouble) return "double";

  return "common";
}

// Jogador dono da pedra 6|6 comeca a partida; se ninguem tiver (nao deveria
// acontecer com o deck completo de 28 pecas), comeca quem tem a maior carroca.
export function findStartingSeat(hands: Map<number, Tile[]>): number {
  for (const [seat, hand] of hands) {
    if (hand.some((t) => t.left === 6 && t.right === 6)) return seat;
  }

  let bestSeat = 0;
  let bestDouble = -1;
  for (const [seat, hand] of hands) {
    for (const tile of hand) {
      if (tile.left === tile.right && tile.left > bestDouble) {
        bestDouble = tile.left;
        bestSeat = seat;
      }
    }
  }
  return bestSeat;
}
