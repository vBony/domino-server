import { Client, Room } from "colyseus";
import { DominoGame, PlayResult, TOTAL_SEATS } from "../game/DominoGame";
import { Side, teamOf } from "../game/DominoRules";
import { DominoState } from "../schemas/DominoState";
import { PlayerSchema } from "../schemas/PlayerSchema";
import { TileSchema } from "../schemas/TileSchema";
import { MatchService, MoveLogEntry, SeatAssignment } from "../services/MatchService";
import { AuthPayload, PlayerService } from "../services/PlayerService";

interface PlayTileMessage {
  tileId?: string;
  side?: Side;
}

const RECONNECTION_WINDOW_SECONDS = 20;

// Sala autoritativa: e a UNICA fonte da verdade da partida. Clientes so
// enviam intencoes (play_tile/pass_turn/...); toda validacao e mutacao real
// acontece aqui via DominoGame. O estado sincronizado (DominoState) so leva
// informacao publica - as maos vivem em `this.game` e trafegam via
// client.send("hand_update", ...) so para o dono de cada mao (fog of war).
export class DominoRoom extends Room<DominoState> {
  override maxClients = TOTAL_SEATS;

  private game?: DominoGame;
  private matchId?: string;
  private readonly seatBySession = new Map<string, number>();
  private readonly sessionBySeat = new Map<number, string>();
  // Historico de jogadas da partida, acumulado em memoria e gravado de
  // uma vez em Match.moves (jsonb) no finishMatch/abortMatch - ver
  // MatchService.MoveLogEntry.
  private readonly moveLog: MoveLogEntry[] = [];

  override onCreate() {
    this.setState(new DominoState());
    this.state.gameId = this.roomId;

    this.onMessage("player_ready", (client) => this.handlePlayerReady(client));
    this.onMessage("play_tile", (client, message: PlayTileMessage) => this.handlePlayTile(client, message));
    this.onMessage("pass_turn", (client) => this.handlePassTurn(client));
    this.onMessage("draw_tile", (client) => this.handleDrawTile(client));
    this.onMessage("leave_game", (client) => client.leave());
  }

  override async onAuth(_client: Client, options: { token?: string }): Promise<AuthPayload> {
    if (!options?.token) throw new Error("missing_token");
    try {
      return PlayerService.verifyToken(options.token);
    } catch {
      throw new Error("invalid_token");
    }
  }

  override onJoin(client: Client, _options: unknown, auth?: AuthPayload) {
    if (!auth) {
      client.leave();
      return;
    }

    const seat = this.nextFreeSeat();
    if (seat === undefined) {
      client.leave();
      return;
    }

    this.seatBySession.set(client.sessionId, seat);
    this.sessionBySeat.set(seat, client.sessionId);

    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.username = auth.username;
    player.seat = seat;
    player.team = teamOf(seat);
    player.ready = false;
    player.connected = true;
    player.tilesCount = 0;
    this.state.players.push(player);

    if (this.state.players.length === TOTAL_SEATS) {
      this.state.status = "starting";
    }
  }

  override async onLeave(client: Client, consented: boolean) {
    const player = this.findPlayer(client.sessionId);
    if (!player) return;

    if (consented) {
      this.removePlayer(client.sessionId);
      return;
    }

    player.connected = false;
    try {
      const reconnectedClient = await this.allowReconnection(client, RECONNECTION_WINDOW_SECONDS);
      player.connected = true;
      this.sendHand(reconnectedClient);
    } catch {
      this.removePlayer(client.sessionId);
      if (this.matchId && this.state.status === "playing") {
        this.state.status = "finished";
        await MatchService.abortMatch(this.matchId, this.moveLog);
      }
    }
  }

  override async onDispose() {
    if (this.matchId && this.state.status === "playing") {
      await MatchService.abortMatch(this.matchId, this.moveLog);
    }
  }

  // ---------- helpers de sala ----------

  private nextFreeSeat(): number | undefined {
    const taken = new Set(this.state.players.map((p) => p.seat));
    for (let seat = 0; seat < TOTAL_SEATS; seat++) {
      if (!taken.has(seat)) return seat;
    }
    return undefined;
  }

  private findPlayer(sessionId: string): PlayerSchema | undefined {
    return this.state.players.find((p) => p.id === sessionId);
  }

  private removePlayer(sessionId: string): void {
    const index = this.state.players.findIndex((p) => p.id === sessionId);
    if (index >= 0) this.state.players.splice(index, 1);

    const seat = this.seatBySession.get(sessionId);
    if (seat !== undefined) {
      this.seatBySession.delete(sessionId);
      this.sessionBySeat.delete(seat);
    }

    if (this.state.status === "starting" && this.state.players.length < TOTAL_SEATS) {
      this.state.status = "waiting";
    }
  }

  private clientForSeat(seat: number): Client | undefined {
    const sessionId = this.sessionBySeat.get(seat);
    return sessionId ? this.clients.getById(sessionId) : undefined;
  }

  private authOf(client: Client | undefined): AuthPayload | undefined {
    return client?.auth as AuthPayload | undefined;
  }

  private userIdForSeat(seat: number): string {
    return this.authOf(this.clientForSeat(seat))?.userId ?? "";
  }

  private seatAssignments(): SeatAssignment[] {
    return this.state.players.map((p) => ({
      seat: p.seat,
      team: p.team,
      userId: this.userIdForSeat(p.seat),
    }));
  }

  // ---------- ciclo da partida ----------

  private handlePlayerReady(client: Client): void {
    const player = this.findPlayer(client.sessionId);
    if (!player || this.state.status === "playing" || this.state.status === "finished") return;

    player.ready = true;
    const allReady = this.state.players.length === TOTAL_SEATS && this.state.players.every((p) => p.ready);
    if (allReady) void this.startMatch();
  }

  private async startMatch(): Promise<void> {
    this.game = new DominoGame();
    const seats = this.state.players.map((p) => p.seat);
    this.game.deal(seats);

    this.state.players.forEach((p) => {
      p.tilesCount = this.game!.handOf(p.seat).length;
    });
    this.state.status = "playing";
    this.state.turnNumber = this.game.turnNumber;
    this.state.remainingTiles = this.game.remainingTiles();
    this.state.currentTurn = this.sessionBySeat.get(this.game.currentSeat) ?? "";

    const match = await MatchService.createMatch(this.roomId, this.seatAssignments());
    this.matchId = match.id;

    this.broadcast("game_started", { currentTurn: this.state.currentTurn });
    this.state.players.forEach((p) => {
      const client = this.clientForSeat(p.seat);
      if (client) this.sendHand(client);
    });
    this.sendYourTurn();
  }

  private sendHand(client: Client): void {
    const seat = this.seatBySession.get(client.sessionId);
    if (seat === undefined || !this.game) return;
    client.send("hand_update", { hand: this.game.handOf(seat) });
  }

  private sendYourTurn(): void {
    if (!this.game) return;
    this.clientForSeat(this.game.currentSeat)?.send("your_turn", { turnNumber: this.game.turnNumber });
  }

  private syncBoard(): void {
    if (!this.game) return;
    this.state.board.clear();
    for (const tile of this.game.board) {
      const schemaTile = new TileSchema();
      schemaTile.id = tile.id;
      schemaTile.left = tile.left;
      schemaTile.right = tile.right;
      schemaTile.playedBySeat = tile.playedBySeat;
      this.state.board.push(schemaTile);
    }
  }

  private handlePlayTile(client: Client, message: PlayTileMessage): void {
    if (!this.game || this.state.status !== "playing") return;
    const seat = this.seatBySession.get(client.sessionId);
    if (seat === undefined) return;

    const { tileId, side } = message ?? {};
    if (!tileId || (side !== "left" && side !== "right")) {
      client.send("invalid_move", { reason: "malformed_message" });
      return;
    }

    let result: PlayResult;
    try {
      result = this.game.playTile(seat, tileId, side);
    } catch (err) {
      client.send("invalid_move", { reason: err instanceof Error ? err.message : "unknown_error" });
      return;
    }

    this.syncBoard();
    this.findPlayer(client.sessionId)!.tilesCount = this.game.handOf(seat).length;
    this.state.turnNumber = this.game.turnNumber;
    this.state.currentTurn = this.sessionBySeat.get(this.game.currentSeat) ?? "";
    this.sendHand(client);

    this.broadcast("tile_played", {
      playerId: client.sessionId,
      tileId: result.tile.id,
      left: result.tile.left,
      right: result.tile.right,
      side,
    });

    this.moveLog.push({
      userId: this.userIdForSeat(seat),
      type: "play_tile",
      tileId,
      side,
      turnNumber: this.state.turnNumber,
      at: new Date().toISOString(),
    });

    const winnerSeat = this.game.winnerSeatByEmptyHand();
    if (winnerSeat !== null) {
      void this.finishMatch(teamOf(winnerSeat), "hand-empty");
      return;
    }

    this.sendYourTurn();
  }

  private handlePassTurn(client: Client): void {
    if (!this.game || this.state.status !== "playing") return;
    const seat = this.seatBySession.get(client.sessionId);
    if (seat === undefined) return;

    try {
      this.game.pass(seat);
    } catch (err) {
      client.send("invalid_move", { reason: err instanceof Error ? err.message : "unknown_error" });
      return;
    }

    this.state.turnNumber = this.game.turnNumber;
    this.state.currentTurn = this.sessionBySeat.get(this.game.currentSeat) ?? "";

    this.broadcast("player_passed", { playerId: client.sessionId });
    this.moveLog.push({
      userId: this.userIdForSeat(seat),
      type: "pass_turn",
      turnNumber: this.state.turnNumber,
      at: new Date().toISOString(),
    });

    if (this.game.isBlocked()) {
      // Jogo travado (ninguem tem jogada) sempre termina empatado - nao
      // decide vencedor por soma de pontos na mao. Uma revanche valendo o
      // dobro de pontos para desempatar fica para uma proxima rodada.
      void this.finishMatch(null, "blocked");
      return;
    }

    this.sendYourTurn();
  }

  private handleDrawTile(client: Client): void {
    // Partida de 4 jogadores distribui as 28 pecas inteiras (4 x 7) - nunca
    // sobra monte para comprar. O handler existe para atender o protocolo,
    // mas sempre rejeita nesta variante classica.
    client.send("invalid_move", { reason: "no_tiles_to_draw" });
  }

  // winningTeam null = empate (jogo travado). Nesse caso nenhum placar e
  // incrementado - so registra a partida como encerrada sem vencedor.
  private async finishMatch(winningTeam: number | null, reason: "hand-empty" | "blocked"): Promise<void> {
    this.state.status = "finished";
    this.state.winningTeam = winningTeam ?? -1;
    if (winningTeam !== null) {
      this.state.scoreTeamA += winningTeam === 0 ? 1 : 0;
      this.state.scoreTeamB += winningTeam === 1 ? 1 : 0;
    }

    if (this.matchId) {
      await MatchService.finishMatch(
        this.matchId,
        winningTeam,
        this.state.scoreTeamA,
        this.state.scoreTeamB,
        this.seatAssignments(),
        this.moveLog
      );
    }

    if (winningTeam !== null) {
      this.broadcast("player_won", { winningTeam, reason });
    }
    this.broadcast("game_finished", {
      winningTeam,
      isDraw: winningTeam === null,
      reason,
      scoreTeamA: this.state.scoreTeamA,
      scoreTeamB: this.state.scoreTeamB,
    });
  }
}
