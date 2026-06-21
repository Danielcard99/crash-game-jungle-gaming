import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
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

@Controller()
export class GamesController {
  constructor(
    private readonly placeBetUseCase: PlaceBetUseCase,
    private readonly cashOutUseCase: CashOutUseCase,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "games" };
  }

  @Post("games/bet")
  @UseGuards(JwtAuthGuard)
  async placeBet(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: PlaceBetRequestDto,
  ): Promise<BetResponseDto> {
    const bet = await this.placeBetUseCase.execute({
      playerId: user.userId,
      playerUsername: user.username,
      amountInCents: BigInt(body.amountInCents),
    });

    return {
      id: bet.id,
      roundId: bet.roundId,
      status: bet.status,
      amountBet: Number(bet.amountBet.valueInCents),
    };
  }

  @Post("games/bet/cashout")
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
}
