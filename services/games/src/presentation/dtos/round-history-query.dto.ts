import { z } from "zod";
import { createZodDto } from "nestjs-zod";

const RoundHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export class RoundHistoryQueryDto extends createZodDto(
  RoundHistoryQuerySchema,
) {}
