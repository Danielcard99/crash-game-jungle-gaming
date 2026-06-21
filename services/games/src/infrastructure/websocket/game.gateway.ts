import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { OnEvent } from "@nestjs/event-emitter";

@WebSocketGateway({
  cors: { origin: "*" },
})
export class GameGateway {
  @WebSocketServer()
  server!: Server;

  @OnEvent("round.created")
  handleRoundCreated(payload: {
    roundId: string;
    serverSeedHash: string;
    bettingEndsAt: Date;
  }) {
    this.server.emit("round:created", payload);
  }

  @OnEvent("round.started")
  handleRoundStarted(payload: { roundId: string }) {
    this.server.emit("round:started", payload);
  }

  @OnEvent("round.tick")
  handleRoundTick(payload: { roundId: string; currentMultiplier: number }) {
    this.server.emit("round:tick", payload);
  }

  @OnEvent("round.crashed")
  handleRoundCrashed(payload: {
    roundId: string;
    crashPoint: number;
    serverSeed: string;
    serverSeedHash: string;
  }) {
    this.server.emit("round:crashed", payload);
  }
}
