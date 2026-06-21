import { Body, Controller, Get, Post } from "@nestjs/common";
import { HealthCheckResponseDto } from "../dtos/health-check-response.dto";
import { CreateWalletUseCase } from "../../application/use-cases/create-wallet.use-case";
import { WalletResponseDto } from "../dtos/wallet-response.dto";
import { CreateWalletRequestDto } from "../dtos/create-wallet-request.dto";

@Controller()
export class WalletsController {
  constructor(private readonly createWalletUseCase: CreateWalletUseCase) {}

  @Get("health")
  check(): HealthCheckResponseDto {
    return { status: "ok", service: "wallets" };
  }

  // TODO: extrair do JWT quando autenticação estiver pronta
  @Post("wallets")
  async createWallet(
    @Body() body: CreateWalletRequestDto,
  ): Promise<WalletResponseDto> {
    const wallet = await this.createWalletUseCase.execute({
      playerId: body.playerId,
    });

    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balance: Number(wallet.balance.valueInCents),
    };
  }
}
