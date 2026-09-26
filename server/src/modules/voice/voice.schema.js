import { z } from 'zod';

export const parseBody = z.object({
  text: z.string({ error: 'Say or type a command' }).trim().min(3, 'Command is too short').max(500, 'Command is too long'),
  language: z.enum(['en-IN', 'hi-IN', 'gu-IN']).default('en-IN'),
  contextType: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL']).optional(),
});
