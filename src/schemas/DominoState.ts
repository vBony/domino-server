import { ArraySchema, Schema, type } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";
import { TileSchema } from "./TileSchema";

export type MatchStatus = "waiting" | "starting" | "playing" | "finished";

// Estado publico e sincronizado da partida. Tudo aqui e seguro de enviar
// para qualquer cliente conectado - fog of war e garantido por nunca colocar
// as maos dos jogadores neste schema (ver PlayerSchema/hand_update).
export class DominoState extends Schema {
  @type("string") gameId: string = "";
  @type("string") status: MatchStatus = "waiting";
  @type([PlayerSchema]) players = new ArraySchema<PlayerSchema>();
  @type([TileSchema]) board = new ArraySchema<TileSchema>();
  @type("string") currentTurn: string = "";
  @type("number") turnNumber: number = 0;
  @type("number") remainingTiles: number = 0;
  @type("number") scoreTeamA: number = 0;
  @type("number") scoreTeamB: number = 0;
  @type("number") winningTeam: number = -1;
}
