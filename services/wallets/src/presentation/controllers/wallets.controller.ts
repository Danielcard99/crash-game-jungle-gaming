import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { CreateWalletUseCase } from "../../application/use-cases/create-wallet.use-case";
import { WalletResponseDto } from "../dtos/wallet-response.dto";
import {
  type AuthenticatedUser,
  CurrentUser,
  JwtAuthGuard,
} from "@crash/auth-kit";
import { GetWalletUseCase } from "../../application/use-cases/get-wallet.use-case";

@Controller("wallets")
export class WalletsController {
  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getWalletUseCase: GetWalletUseCase,
  ) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createWallet(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WalletResponseDto> {
    const wallet = await this.createWalletUseCase.execute({
      playerId: user.userId,
    });

    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balance: Number(wallet.balance.valueInCents),
    };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMyWallet(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WalletResponseDto> {
    const wallet = await this.getWalletUseCase.execute(user.userId);

    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balance: Number(wallet.balance.valueInCents),
    };
  }
}
