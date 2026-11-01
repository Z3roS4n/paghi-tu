import { z } from "zod";

export const agentRequestSchema = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("ask"), requestId: z.uuid(), question: z.string().trim().min(1).max(300), conversationId: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/).optional() }),
  z.strictObject({ action: z.literal("reset"), requestId: z.uuid(), conversationId: z.string().regex(/^[A-Za-z0-9_-]{32,64}$/) }),
]);
export type AgentRequest = z.infer<typeof agentRequestSchema>;
export type AgentSource = { id: string; title: string; url: string; pageUrl: string; verification: string };
export type AgentAskResponse = { requestId: string; conversationId: string; text: string; abstention: boolean; mode: string; notice?: string; sources: AgentSource[] };
export type AgentErrorResponse = { error: { code: string; message: string }; requestId?: string };
