import { Schema, type } from "@colyseus/schema";

// Estado publico de um jogador. NUNCA inclui as pecas da mao - so a
// contagem. A mao real e privada e trafega so via client.send("hand_update").
export class PlayerSchema extends Schema {
  @type("string") id: string = "";
  @type("string") username: string = "";
  @type("number") seat: number = 0;
  @type("number") team: number = 0;
  @type("number") score: number = 0;
  @type("boolean") ready: boolean = false;
  @type("boolean") connected: boolean = true;
  @type("number") tilesCount: number = 0;
}
