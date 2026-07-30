import type { MetadataExtractor } from '@ai-sdk/openai-compatible';
import type { SharedV4ProviderMetadata } from '@ai-sdk/provider';
import { z } from 'zod/v4';

const reasoningDetailSchema = z.object({
  type: z.string(),
  id: z.string().nullish(),
  format: z.string().nullish(),
  index: z.number().nullish(),
  text: z.string().nullish(),
  data: z.string().nullish(),
});

const messageMetadataSchema = z.object({
  reasoning_details: z.array(reasoningDetailSchema).nullish(),
  reasoning_encrypted: z.union([z.string(), z.boolean()]).nullish(),
});

const citationSchema = z.object({
  title: z.string(),
  url: z.string(),
  content: z.string().nullish(),
  date: z.string().nullish(),
});

const responseMetadataSchema = z.object({
  cost: z
    .object({
      diem: z.number().nullish(),
      usd: z.number().nullish(),
    })
    .nullish(),
  choices: z
    .array(
      z.object({
        message: messageMetadataSchema.nullish(),
        delta: messageMetadataSchema.nullish(),
      }),
    )
    .nullish(),
  venice_parameters: z
    .object({
      web_search_citations: z.array(citationSchema).nullish(),
    })
    .nullish(),
});

type VeniceMetadata = {
  cost?: {
    diem?: number | null;
    usd?: number | null;
  };
  reasoningDetails?: z.infer<typeof reasoningDetailSchema>[];
  reasoningEncrypted?: string | boolean;
  webSearchCitations?: z.infer<typeof citationSchema>[];
};

function extractVeniceMetadata(value: unknown): VeniceMetadata {
  const parsed = responseMetadataSchema.safeParse(value);
  if (!parsed.success) {
    return {};
  }

  const message = parsed.data.choices?.[0]?.message;
  const delta = parsed.data.choices?.[0]?.delta;

  return {
    ...(parsed.data.cost != null && { cost: parsed.data.cost }),
    ...((message?.reasoning_details ?? delta?.reasoning_details) != null && {
      reasoningDetails:
        message?.reasoning_details ?? delta?.reasoning_details ?? undefined,
    }),
    ...((message?.reasoning_encrypted ?? delta?.reasoning_encrypted) !=
      null && {
      reasoningEncrypted:
        message?.reasoning_encrypted ?? delta?.reasoning_encrypted ?? undefined,
    }),
    ...(parsed.data.venice_parameters?.web_search_citations != null && {
      webSearchCitations: parsed.data.venice_parameters.web_search_citations,
    }),
  };
}

function toProviderMetadata(
  providerName: string,
  metadata: VeniceMetadata,
): SharedV4ProviderMetadata | undefined {
  return Object.keys(metadata).length > 0
    ? { [providerName]: metadata }
    : undefined;
}

export function createVeniceMetadataExtractor(
  providerName: string,
): MetadataExtractor {
  return {
    async extractMetadata({ parsedBody }) {
      return toProviderMetadata(
        providerName,
        extractVeniceMetadata(parsedBody),
      );
    },
    createStreamExtractor() {
      const metadata: VeniceMetadata = {};

      return {
        processChunk(chunk) {
          const extracted = extractVeniceMetadata(chunk);
          Object.assign(metadata, extracted);
        },
        buildMetadata() {
          return toProviderMetadata(providerName, metadata);
        },
      };
    },
  };
}
