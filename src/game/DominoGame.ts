import { Tile, generateDeck, shuffle } from "./Deck";
import { BoardEnds, Side, canPlace, findStartingSeat, hasLegalMove, orientTileForPlacement } from "./DominoRules";

export const TOTAL_SEATS = 4;
export const HAND_SIZE = 7;

export interface PlacedTile extends Tile {
  playedBySeat: number;
}

export interface PlayResult {
  tile: PlacedTile;
  nextSeat: number;
}

// Unica fonte da verdade da partida: mantem as maos reais (nunca
// serializadas para o schema publico), o tabuleiro e o turno. Toda mutacao
// passa por aqui, entao nenhuma camada externa (room, rede) consegue colocar
// o jogo em um estado invalido.
export class DominoGame {
  private readonly hands = new Map<number, Tile[]>();
  readonly board: PlacedTile[] = [];
  private boardEnds: BoardEnds | null = null;
  private passStreak = 0;

  currentSeat = 0;
  turnNumber = 1;

  deal(seats: number[]): void {
    const deck = shuffle(generateDeck());
    seats.forEach((seat, index) => {
      this.hands.set(seat, deck.slice(index * HAND_SIZE, index * HAND_SIZE + HAND_SIZE));
    });
    this.currentSeat = findStartingSeat(this.hands);
  }

  handOf(seat: number): readonly Tile[] {
    return this.hands.get(seat) ?? [];
  }

  legalMoves(seat: number): { tileId: string; side: Side }[] {
    const hand = this.handOf(seat);
    if (!this.boardEnds) {
      return hand.map((tile) => ({ tileId: tile.id, side: "right" as Side }));
    }
    const moves: { tileId: string; side: Side }[] = [];
    for (const tile of hand) {
      if (canPlace(tile, "left", this.boardEnds)) moves.push({ tileId: tile.id, side: "left" });
      if (canPlace(tile, "right", this.boardEnds)) moves.push({ tileId: tile.id, side: "right" });
    }
    return moves;
  }

  playTile(seat: number, tileId: string, side: Side): PlayResult {
    if (seat !== this.currentSeat) throw new Error("not_your_turn");

    const hand = this.hands.get(seat) ?? [];
    const tile = hand.find((t) => t.id === tileId);
    if (!tile) throw new Error("tile_not_in_hand");
    if (!canPlace(tile, side, this.boardEnds)) throw new Error("illegal_move");

    const oriented = orientTileForPlacement(tile, side, this.boardEnds);
    const placed: PlacedTile = { ...oriented, playedBySeat: seat };

    if (!this.boardEnds || side === "left") {
      this.board.unshift(placed);
    } else {
      this.board.push(placed);
    }

    this.boardEnds = this.boardEnds
      ? {
          left: side === "left" ? oriented.left : this.boardEnds.left,
          right: side === "right" ? oriented.right : this.boardEnds.right,
        }
      : { left: oriented.left, right: oriented.right };

    this.hands.set(
      seat,
      hand.filter((t) => t.id !== tileId)
    );
    this.passStreak = 0;
    this.advanceTurn();

    return { tile: placed, nextSeat: this.currentSeat };
  }

  pass(seat: number): number {
    if (seat !== this.currentSeat) throw new Error("not_your_turn");
    if (hasLegalMove(this.hands.get(seat) ?? [], this.boardEnds)) throw new Error("has_legal_move");

    this.passStreak += 1;
    this.advanceTurn();
    return this.currentSeat;
  }

  // Em uma partida de 4 jogadores as 28 pecas do baralho sao totalmente
  // distribuidas (4 x 7 = 28), entao nunca sobra monte para comprar.
  remainingTiles(): number {
    return 0;
  }

  isBlocked(): boolean {
    return this.passStreak >= TOTAL_SEATS;
  }

  winnerSeatByEmptyHand(): number | null {
    for (const [seat, hand] of this.hands) {
      if (hand.length === 0) return seat;
    }
    return null;
  }

  handsSnapshot(): Map<number, Tile[]> {
    return new Map(this.hands);
  }

  private advanceTurn(): void {
    this.currentSeat = (this.currentSeat + 1) % TOTAL_SEATS;
    this.turnNumber += 1;
  }
}
