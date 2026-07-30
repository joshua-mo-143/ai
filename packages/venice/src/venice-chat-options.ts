import { z } from 'zod/v4';

export type VeniceChatModelId = string;

export const veniceLanguageModelOptions = z.object({
  veniceParameters: z
    .object({
      enableWebSearch: z.enum(['off', 'on', 'auto']).optional(),
      enableWebScraping: z.boolean().optional(),
      enableWebCitations: z.boolean().optional(),
      enableE2ee: z.boolean().optional(),
      enableXSearch: z.boolean().optional(),
      stripThinkingResponse: z.boolean().optional(),
      disableThinking: z.boolean().optional(),
      includeVeniceSystemPrompt: z.boolean().optional(),
      characterSlug: z.string().optional(),
      includeSearchResultsInStream: z.boolean().optional(),
      returnSearchResultsAsDocuments: z.boolean().optional(),
    })
    .optional(),
  topLogprobs: z.number().int().min(0).optional(),
  maxCompletionTokens: z.number().int().min(0).optional(),
  minP: z.number().min(0).max(1).optional(),
  promptCacheKey: z.string().optional(),
  promptCacheRetention: z.enum(['default', 'extended', '24h']).optional(),
  repetitionPenalty: z.number().min(0).optional(),
  reasoning: z
    .object({
      effort: z
        .enum(['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
        .optional(),
      enabled: z.boolean().optional(),
      summary: z.enum(['auto', 'concise', 'detailed']).optional(),
    })
    .optional(),
  stopTokenIds: z.array(z.number().int()).optional(),
  parallelToolCalls: z.boolean().optional(),
  logprobs: z.boolean().optional(),
  maxTemp: z.number().min(0).max(2).optional(),
  minTemp: z.number().min(0).max(2).optional(),
});

export type VeniceLanguageModelOptions = z.infer<
  typeof veniceLanguageModelOptions
>;

export type VeniceEmbeddingModelId = string;
export type VeniceImageModelId = string;
