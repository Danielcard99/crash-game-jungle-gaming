import { z } from "zod";
import { createZodDto } from "nestjs-zod";

const PlaceBetSchema = z.object({
  amountInCents: z.number().int().positive(),
});
export class PlaceBetRequestDto extends createZodDto(PlaceBetSchema) {}
