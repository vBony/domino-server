import { Schema, type } from "@colyseus/schema";

// Usada APENAS para pecas ja jogadas na mesa: uma vez jogada, a peca e
// informacao publica (todos os jogadores enxergam o tabuleiro). Nunca usar
// esta classe para representar a mao de um jogador no estado sincronizado.
export class TileSchema extends Schema {
  @type("string") id: string = "";
  @type("number") left: number = 0;
  @type("number") right: number = 0;
  @type("number") playedBySeat: number = 0;
}
