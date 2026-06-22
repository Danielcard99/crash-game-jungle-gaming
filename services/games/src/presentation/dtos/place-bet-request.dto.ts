import { z } from "zod";
import { createZodDto } from "nestjs-zod";

const PlaceBetSchema = z.object({
  amountInCents: z.number().int().positive(),
  autoCashoutMultiplier: z.number().min(1.01).optional().nullable(),
});
export class PlaceBetRequestDto extends createZodDto(PlaceBetSchema) {}
