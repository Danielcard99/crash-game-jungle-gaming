import { z } from "zod";
import { createZodDto } from "nestjs-zod";

const CashOutSchema = z.object({
  currentMultiplier: z.number().positive(),
});
export class CashOutRequestDto extends createZodDto(CashOutSchema) {}
