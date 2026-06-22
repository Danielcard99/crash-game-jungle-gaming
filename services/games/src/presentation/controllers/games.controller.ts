import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import {
  type AuthenticatedUser,
  CurrentUser,
  JwtAuthGuard,
} from "@crash/auth-kit";
import { PlaceBetRequestDto } from "../dtos/place-bet-request.dto";
import { PlaceBetUseCase } from "../../application/use-cases/place-bet.use-case";
import { BetResponseDto } from "../dtos/bet-response.dto";
import { CashOutUseCase } from "../../application/use-cases/cash-out.use-case";
import { CashOutRequestDto } from "../dtos/cash-out-request.dto";
import { CashOutResponseDto } from "../dtos/cash-out-response.dto";
import { BetHistoryResponseDto } from "../dtos/bet-history-response.dto";
import { GetMyBetsUseCase } from "../../application/use-cases/get-my-bets.use-case";
import { RoundResponseDto } from "../dtos/round-response.dto";
import { GetCurrentRoundUseCase } from "../../application/use-cases/get-current-round.use-case";
import { RoundHistoryResponseDto } from "../dtos/round-history-response.dto";
import { GetRoundHistoryUseCase } from "../../application/use-cases/get-round-history.use-case";
import { RoundVerifyResponseDto } from "../dtos/round-verify-response.dto";
import { VerifyRoundUseCase } from "../../application/use-cases/verify-round.use-case";
import { RoundHistoryQueryDto } from "../dtos/round-history-query.dto";

@Controller("games")
export class GamesController {
  constructor(
    private readonly placeBetUseCase: PlaceBetUseCase,
    private readonly cashOutUseCase: CashOutUseCase,
    private readonly getMyBetsUseCase: GetMyBetsUseCase,
    private readonly getCurrentRoundUseCase: GetCurrentRoundUseCase,
    private readonly getRoundHistoryUseCase: GetRoundHistoryUseCase,
    private readonly verifyRoundUseCase: VerifyRoundUseCase,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  @Post("bet")
  @UseGuards(JwtAuthGuard)
  async placeBet(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: PlaceBetRequestDto,
  ): Promise<BetResponseDto> {
    const bet = await this.placeBetUseCase.execute({
      playerId: user.userId,
      playerUsername: user.username,
      amountInCents: BigInt(body.amountInCents),
      autoCashoutMultiplier: body.autoCashoutMultiplier ?? null,
    });

    return {
      id: bet.id,
      roundId: bet.roundId,
      status: bet.status,
      amountBet: Number(bet.amountBet.valueInCents),
    };
  }

  @Post("bet/cashout")
  @UseGuards(JwtAuthGuard)
  async cashOut(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CashOutRequestDto,
  ): Promise<CashOutResponseDto> {
    const bet = await this.cashOutUseCase.execute({
      playerId: user.userId,
      currentMultiplier: body.currentMultiplier,
    });

    return {
      id: bet.id,
      roundId: bet.roundId,
      status: bet.status,
      amountBet: Number(bet.amountBet.valueInCents),
      cashoutMultiplier: bet.cashoutMultiplier!,
      payout: Number(bet.payout!.valueInCents),
    };
  }

  @Get("bets/me")
  @UseGuards(JwtAuthGuard)
  async getMyBets(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BetHistoryResponseDto[]> {
    const bets = await this.getMyBetsUseCase.execute(user.userId);

    return bets.map((bet) => ({
      id: bet.id,
      roundId: bet.roundId,
      status: bet.status,
      amountBet: Number(bet.amountBet.valueInCents),
      payout: bet.payout ? Number(bet.payout.valueInCents) : null,
      cashoutMultiplier: bet.cashoutMultiplier ?? null,
    }));
  }

  @Get("rounds/current")
  async getCurrentRound(): Promise<RoundResponseDto> {
    const round = await this.getCurrentRoundUseCase.execute();

    return {
      id: round.id,
      status: round.status,
      serverSeedHash: round.serverSeedHash,
      bettingEndsAt: round.bettingEndsAt,
      startedAt: round.startedAt,
      crashedAt: round.crashedAt,
    };
  }

  @Get("rounds/history")
  async getRoundHistory(
    @Query() query: RoundHistoryQueryDto,
  ): Promise<RoundHistoryResponseDto[]> {
    const rounds = await this.getRoundHistoryUseCase.execute(query.limit);

    return rounds.map((round) => ({
      id: round.id,
      crashPoint: round.crashPoint,
      settledAt: round.settledAt!,
    }));
  }

  @Get("rounds/:roundId/verify")
  async verifyRound(
    @Param("roundId") roundId: string,
  ): Promise<RoundVerifyResponseDto> {
    const round = await this.verifyRoundUseCase.execute(roundId);

    return {
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      crashPoint: round.crashPoint,
    };
  }
}
