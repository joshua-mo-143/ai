import type {
  ImageModelV4CallOptions,
  LanguageModelV4Prompt,
} from '@ai-sdk/provider';
import { convertReadableStreamToArray } from '@ai-sdk/provider-utils/test';
import { createTestServer } from '@ai-sdk/test-server/with-vitest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { VeniceLanguageModelOptions } from './venice-chat-options';
import { createVenice } from './venice-provider';

const prompt: LanguageModelV4Prompt = [
  { role: 'user', content: [{ type: 'text', text: 'Hello' }] },
];

const provider = createVenice({
  apiKey: 'test-api-key',
  baseURL: 'https://api.venice.test/api/v1',
});

const server = createTestServer({
  'https://api.venice.test/api/v1/chat/completions': {},
  'https://api.venice.test/api/v1/embeddings': {},
  'https://api.venice.test/api/v1/images/generations': {},
});

describe('Venice models', () => {
  beforeEach(() => {
    server.urls['https://api.venice.test/api/v1/chat/completions'].response = {
      type: 'json-value',
      body: {
        id: 'chat-1',
        created: 1720000000,
        model: 'venice-uncensored',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Hello!',
              reasoning_content: 'Thinking...',
              reasoning_details: [{ type: 'text', text: 'Thinking...' }],
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 2,
          completion_tokens: 3,
          total_tokens: 5,
          completion_tokens_details: { reasoning_tokens: 1 },
        },
        cost: { usd: 0.001, diem: 0.002 },
        venice_parameters: {
          web_search_citations: [{ title: 'Venice', url: 'https://venice.ai' }],
        },
      },
    };
  });

  it('generates chat text with Venice options and metadata', async () => {
    const result = await provider('venice-uncensored').doGenerate({
      prompt,
      providerOptions: {
        venice: {
          veniceParameters: {
            enableWebSearch: 'auto',
            includeVeniceSystemPrompt: false,
          },
          maxCompletionTokens: 100,
          minP: 0.1,
          promptCacheKey: 'session',
          reasoning: { effort: 'high' },
        } satisfies VeniceLanguageModelOptions,
      },
    });

    expect(result.content).toEqual([
      { type: 'text', text: 'Hello!' },
      { type: 'reasoning', text: 'Thinking...' },
    ]);
    expect(result.providerMetadata?.venice).toMatchObject({
      cost: { usd: 0.001, diem: 0.002 },
      webSearchCitations: [{ title: 'Venice', url: 'https://venice.ai' }],
    });
    expect(await server.calls[0].requestBodyJson).toMatchObject({
      model: 'venice-uncensored',
      max_completion_tokens: 100,
      min_p: 0.1,
      prompt_cache_key: 'session',
      reasoning: { effort: 'high' },
      venice_parameters: {
        enable_web_search: 'auto',
        include_venice_system_prompt: false,
      },
    });
    expect(server.calls[0].requestHeaders.authorization).toBe(
      'Bearer test-api-key',
    );
  });

  it('streams chat text and usage', async () => {
    server.urls['https://api.venice.test/api/v1/chat/completions'].response = {
      type: 'stream-chunks',
      chunks: [
        `data: ${JSON.stringify({
          id: 'chat-1',
          created: 1720000000,
          model: 'venice-uncensored',
          choices: [
            {
              index: 0,
              delta: { role: 'assistant', content: 'Hello' },
              finish_reason: null,
            },
          ],
        })}\n\n`,
        `data: ${JSON.stringify({
          id: 'chat-1',
          created: 1720000000,
          model: 'venice-uncensored',
          choices: [{ index: 0, delta: {}, finish_reason: 'stop' }],
          usage: {
            prompt_tokens: 2,
            completion_tokens: 1,
            total_tokens: 3,
          },
          cost: { usd: 0.001 },
        })}\n\n`,
        'data: [DONE]\n\n',
      ],
    };

    const { stream } = await provider('venice-uncensored').doStream({
      prompt,
    });
    const parts = await convertReadableStreamToArray(stream);

    expect(parts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'text-delta', delta: 'Hello' }),
        expect.objectContaining({
          type: 'finish',
          usage: expect.objectContaining({
            inputTokens: expect.objectContaining({ total: 2 }),
            outputTokens: expect.objectContaining({ total: 1 }),
          }),
        }),
      ]),
    );
    expect(await server.calls[0].requestBodyJson).toMatchObject({
      stream: true,
      stream_options: { include_usage: true },
    });
  });

  it('generates embeddings', async () => {
    server.urls['https://api.venice.test/api/v1/embeddings'].response = {
      type: 'json-value',
      body: {
        data: [{ embedding: [0.1, 0.2], index: 0 }],
        usage: { prompt_tokens: 2, total_tokens: 2 },
      },
    };

    const result = await provider
      .embeddingModel('text-embedding-bge-m3')
      .doEmbed({ values: ['hello'] });

    expect(result.embeddings).toEqual([[0.1, 0.2]]);
    expect(await server.calls[0].requestBodyJson).toMatchObject({
      model: 'text-embedding-bge-m3',
      input: ['hello'],
    });
  });

  it('generates base64 images', async () => {
    server.urls['https://api.venice.test/api/v1/images/generations'].response =
      {
        type: 'json-value',
        body: { data: [{ b64_json: 'dGVzdA==' }] },
      };

    const options: ImageModelV4CallOptions = {
      prompt: 'A private city',
      files: undefined,
      mask: undefined,
      n: 1,
      size: '1024x1024',
      aspectRatio: undefined,
      seed: undefined,
      providerOptions: {},
      headers: {},
      abortSignal: undefined,
    };
    const result = await provider.image('qwen-image').doGenerate(options);

    expect(result.images).toEqual(['dGVzdA==']);
    expect(await server.calls[0].requestBodyJson).toMatchObject({
      model: 'qwen-image',
      prompt: 'A private city',
      n: 1,
    });
  });
});
