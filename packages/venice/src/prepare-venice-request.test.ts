import { describe, expect, it } from 'vitest';
import { prepareVeniceRequest } from './prepare-venice-request';

describe('prepareVeniceRequest', () => {
  it('maps Venice options to API fields', () => {
    expect(
      prepareVeniceRequest({
        modelId: 'actual-model',
        args: {
          model: 'overridden-model',
          messages: [{ role: 'user', content: 'hello' }],
          max_tokens: 100,
          topLogprobs: 3,
          maxCompletionTokens: 200,
          minP: 0.1,
          promptCacheKey: 'cache-key',
          promptCacheRetention: '24h',
          repetitionPenalty: 1.1,
          reasoning: { effort: 'high', enabled: true },
          stopTokenIds: [1, 2],
          parallelToolCalls: true,
          maxTemp: 1.2,
          minTemp: 0.2,
          veniceParameters: {
            enableWebSearch: 'auto',
            includeVeniceSystemPrompt: false,
          },
        },
      }),
    ).toEqual({
      model: 'actual-model',
      messages: [{ role: 'user', content: 'hello' }],
      max_tokens: undefined,
      top_logprobs: 3,
      max_completion_tokens: 200,
      min_p: 0.1,
      prompt_cache_key: 'cache-key',
      prompt_cache_retention: '24h',
      repetition_penalty: 1.1,
      reasoning: { effort: 'high', enabled: true },
      stop_token_ids: [1, 2],
      parallel_tool_calls: true,
      max_temp: 1.2,
      min_temp: 0.2,
      venice_parameters: {
        enable_web_search: 'auto',
        include_venice_system_prompt: false,
      },
    });
  });

  it('does not inject defaults into Venice parameters', () => {
    expect(
      prepareVeniceRequest({
        modelId: 'model-id',
        args: { model: 'model-id', messages: [] },
      }),
    ).toEqual({ model: 'model-id', messages: [] });
  });
});
