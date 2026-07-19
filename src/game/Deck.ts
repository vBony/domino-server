export interface Tile {
  id: string;
  left: number;
  right: number;
}

const MAX_PIP = 6;

export function generateDeck(): Tile[] {
  const tiles: Tile[] = [];
  for (let left = 0; left <= MAX_PIP; left++) {
    for (let right = left; right <= MAX_PIP; right++) {
      tiles.push({ id: `${left}-${right}`, left, right });
    }
  }
  return tiles;
}

export function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
