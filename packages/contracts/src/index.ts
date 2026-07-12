import { z } from 'zod';

export const applicationStages = [
  'Saved',
  'Applied',
  'Interviewing',
  'Offer',
  'Closed',
] as const;

export const applicationSchema = z.object({
  id: z.string().uuid(),
  company: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  stage: z.enum(applicationStages).default('Saved'),
  nextStep: z.string().trim().max(240).optional().nullable(),
  dueDate: z.string().date().optional().nullable(),
});

export type Application = z.infer<typeof applicationSchema>;
