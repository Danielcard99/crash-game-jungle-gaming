import { RoundStatus } from "../../domain/round/round-status.enum";

export interface RoundResponseDto {
  id: string;
  status: RoundStatus;
  serverSeedHash: string;
  bettingEndsAt: Date;
  startedAt: Date | null;
  crashedAt: Date | null;
}
