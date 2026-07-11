import { z } from 'zod';

export const DoctorRewriteSchema = z.object({
  rewritten_prompt: z.string().min(1),
  change_summary: z.string(),
});

export type DoctorRewrite = z.infer<typeof DoctorRewriteSchema>;
