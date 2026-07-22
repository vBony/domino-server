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
