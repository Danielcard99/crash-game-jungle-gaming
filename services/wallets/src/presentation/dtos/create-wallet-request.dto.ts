import { z } from "zod";
import { createZodDto } from "nestjs-zod";

const CreateWalletRequestSchema = z.object({
  playerId: z.string().min(1, "playerId is required"),
});

export class CreateWalletRequestDto extends createZodDto(
  CreateWalletRequestSchema,
) {}
