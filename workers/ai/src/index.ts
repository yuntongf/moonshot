import { Hono } from 'hono';
import { z } from 'zod';

type Bindings = { TRACES_DB: D1Database; OPENAI_API_KEY?: string; ENVIRONMENT: string };
const requestSchema = z.object({ company: z.string().min(1), role: z.string().min(1), stage: z.string().min(1) });
const app = new Hono<{ Bindings: Bindings }>();

app.get('/health', (c) => c.json({ ok: true, environment: c.env.ENVIRONMENT }));
app.post('/interview-plan', async (c) => {
  const parsed = requestSchema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: 'Invalid interview context', details: parsed.error.flatten() }, 422);
  const { company, role, stage } = parsed.data;
  // Deterministic starter behavior means this endpoint is safe to run locally.
  // TODO(moonshot-04): use `generateObject` from Vercel AI SDK, validate the
  // provider output, redact PII before tracing, and persist a trace in D1.
  return c.json({ company, role, stage, exercises: [
    `Explain why ${company}'s product needs ${role}.`,
    'Prepare one STAR story with a measurable outcome.',
    'Write three questions that reveal team expectations.'
  ] });
});
export default app;
