import {
  OpenAICompatibleChatLanguageModel,
  OpenAICompatibleEmbeddingModel,
  OpenAICompatibleImageModel,
} from '@ai-sdk/openai-compatible';
import { loadApiKey } from '@ai-sdk/provider-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVenice } from './venice-provider';

vi.mock('@ai-sdk/openai-compatible', () => ({
  OpenAICompatibleChatLanguageModel: vi.fn(),
  OpenAICompatibleEmbeddingModel: vi.fn(),
  OpenAICompatibleImageModel: vi.fn(),
}));

vi.mock('@ai-sdk/provider-utils', async () => {
  const actual = await vi.importActual('@ai-sdk/provider-utils');
  return {
    ...actual,
    loadApiKey: vi.fn().mockReturnValue('mock-api-key'),
  };
});

describe('VeniceProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the API key and configures requests', () => {
    const provider = createVenice({
      apiKey: 'custom-key',
      baseURL: 'https://example.com/v1/',
      headers: { 'Custom-Header': 'value' },
      queryParams: { source: 'test' },
    });

    provider('model-id');
    const config = vi.mocked(OpenAICompatibleChatLanguageModel).mock
      .calls[0][1];

    expect(config.headers?.()).toMatchObject({
      authorization: 'Bearer mock-api-key',
      'custom-header': 'value',
    });
    expect(loadApiKey).toHaveBeenCalledWith({
      apiKey: 'custom-key',
      environmentVariableName: 'VENICE_API_KEY',
      description: 'Venice API key',
    });
    expect(config.url({ modelId: 'model-id', path: '/chat/completions' })).toBe(
      'https://example.com/v1/chat/completions?source=test',
    );
    expect(config.provider).toBe('venice.chat');
    expect(config.includeUsage).toBe(true);
    expect(config.supportsStructuredOutputs).toBe(true);
  });

  it('allows a custom provider name and usage setting', () => {
    const provider = createVenice({
      name: 'customVenice',
      includeUsage: false,
    });

    provider.chatModel('model-id');
    const config = vi.mocked(OpenAICompatibleChatLanguageModel).mock
      .calls[0][1];

    expect(config.provider).toBe('customVenice.chat');
    expect(config.includeUsage).toBe(false);
  });

  it('creates chat models through all language aliases', () => {
    const provider = createVenice();

    provider('one');
    provider.languageModel('two');
    provider.chatModel('three');

    expect(OpenAICompatibleChatLanguageModel).toHaveBeenCalledTimes(3);
  });

  it('creates embedding models through both aliases', () => {
    const provider = createVenice();

    provider.embeddingModel('text-embedding-bge-m3');
    provider.textEmbeddingModel('text-embedding-bge-m3');

    expect(OpenAICompatibleEmbeddingModel).toHaveBeenCalledTimes(2);
    expect(OpenAICompatibleEmbeddingModel).toHaveBeenCalledWith(
      'text-embedding-bge-m3',
      expect.objectContaining({ provider: 'venice.embedding' }),
    );
  });

  it('creates image models through both aliases', () => {
    const provider = createVenice();

    provider.image('qwen-image');
    provider.imageModel('qwen-image');

    expect(OpenAICompatibleImageModel).toHaveBeenCalledTimes(2);
    expect(OpenAICompatibleImageModel).toHaveBeenCalledWith(
      'qwen-image',
      expect.objectContaining({ provider: 'venice.image' }),
    );
  });
});
