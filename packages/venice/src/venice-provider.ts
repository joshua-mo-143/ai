import {
  OpenAICompatibleChatLanguageModel,
  OpenAICompatibleEmbeddingModel,
  OpenAICompatibleImageModel,
} from '@ai-sdk/openai-compatible';
import type {
  EmbeddingModelV4,
  ImageModelV4,
  LanguageModelV4,
  ProviderV4,
} from '@ai-sdk/provider';
import {
  loadApiKey,
  withoutTrailingSlash,
  withUserAgentSuffix,
  type FetchFunction,
} from '@ai-sdk/provider-utils';
import { prepareVeniceRequest } from './prepare-venice-request';
import type {
  VeniceChatModelId,
  VeniceEmbeddingModelId,
  VeniceImageModelId,
} from './venice-chat-options';
import { createVeniceMetadataExtractor } from './venice-metadata-extractor';
import { VERSION } from './version';

export interface VeniceProviderSettings {
  /**
   * Venice API key. Defaults to the `VENICE_API_KEY` environment variable.
   */
  apiKey?: string;

  /**
   * Base URL for Venice API calls.
   */
  baseURL?: string;

  /**
   * Provider name used for provider options and metadata.
   */
  name?: string;

  /**
   * Custom headers to include in requests.
   */
  headers?: Record<string, string>;

  /**
   * Query parameters to append to request URLs.
   */
  queryParams?: Record<string, string>;

  /**
   * Custom fetch implementation.
   */
  fetch?: FetchFunction;

  /**
   * Include token usage in streaming chat responses.
   *
   * @default true
   */
  includeUsage?: boolean;
}

export interface VeniceProvider extends ProviderV4 {
  (modelId: VeniceChatModelId): LanguageModelV4;
  languageModel(modelId: VeniceChatModelId): LanguageModelV4;
  chatModel(modelId: VeniceChatModelId): LanguageModelV4;
  embeddingModel(modelId: VeniceEmbeddingModelId): EmbeddingModelV4;

  /**
   * @deprecated Use `embeddingModel` instead.
   */
  textEmbeddingModel(modelId: VeniceEmbeddingModelId): EmbeddingModelV4;

  image(modelId: VeniceImageModelId): ImageModelV4;
  imageModel(modelId: VeniceImageModelId): ImageModelV4;
}

const defaultBaseURL = 'https://api.venice.ai/api/v1';

export function createVenice(
  options: VeniceProviderSettings = {},
): VeniceProvider {
  const baseURL = withoutTrailingSlash(options.baseURL ?? defaultBaseURL);
  const providerName = options.name ?? 'venice';

  const getHeaders = () =>
    withUserAgentSuffix(
      {
        Authorization: `Bearer ${loadApiKey({
          apiKey: options.apiKey,
          environmentVariableName: 'VENICE_API_KEY',
          description: 'Venice API key',
        })}`,
        ...options.headers,
      },
      `ai-sdk/venice/${VERSION}`,
    );

  const getModelConfig = (modelType: string) => ({
    provider: `${providerName}.${modelType}`,
    url: ({ path }: { path: string }) => {
      const url = new URL(`${baseURL}${path}`);
      if (options.queryParams != null) {
        url.search = new URLSearchParams(options.queryParams).toString();
      }
      return url.toString();
    },
    headers: getHeaders,
    fetch: options.fetch,
  });

  const createChatModel = (modelId: VeniceChatModelId) =>
    new OpenAICompatibleChatLanguageModel(modelId, {
      ...getModelConfig('chat'),
      includeUsage: options.includeUsage ?? true,
      supportsStructuredOutputs: true,
      supportedUrls: () => ({
        '*/*': [/^data:/],
        'image/*': [/^https?:\/\//],
        'video/*': [/^https?:\/\//],
        'application/*': [/^https?:\/\//],
        'text/*': [/^https?:\/\//],
      }),
      transformRequestBody: args => prepareVeniceRequest({ args, modelId }),
      metadataExtractor: createVeniceMetadataExtractor(providerName),
    });

  const createEmbeddingModel = (modelId: VeniceEmbeddingModelId) =>
    new OpenAICompatibleEmbeddingModel(modelId, getModelConfig('embedding'));

  const createImageModel = (modelId: VeniceImageModelId) =>
    new OpenAICompatibleImageModel(modelId, getModelConfig('image'));

  const provider = (modelId: VeniceChatModelId) => createChatModel(modelId);

  provider.specificationVersion = 'v4' as const;
  provider.languageModel = createChatModel;
  provider.chatModel = createChatModel;
  provider.embeddingModel = createEmbeddingModel;
  provider.textEmbeddingModel = createEmbeddingModel;
  provider.image = createImageModel;
  provider.imageModel = createImageModel;

  return provider;
}

export const venice = createVenice();
