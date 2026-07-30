function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function mapKeysToSnakeCase(
  value: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (value == null) {
    return undefined;
  }

  const result = Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [toSnakeCase(key), entry]),
  );

  return Object.keys(result).length > 0 ? result : undefined;
}

export function prepareVeniceRequest({
  args,
  modelId,
}: {
  args: Record<string, any>;
  modelId: string;
}): Record<string, any> {
  const {
    veniceParameters,
    topLogprobs,
    maxCompletionTokens,
    minP,
    promptCacheKey,
    promptCacheRetention,
    repetitionPenalty,
    reasoning,
    stopTokenIds,
    parallelToolCalls,
    maxTemp,
    minTemp,
    ...rest
  } = args;

  return {
    ...rest,
    model: modelId,
    ...(veniceParameters != null && {
      venice_parameters: mapKeysToSnakeCase(veniceParameters),
    }),
    ...(topLogprobs != null && { top_logprobs: topLogprobs }),
    ...(maxCompletionTokens != null && {
      max_completion_tokens: maxCompletionTokens,
      max_tokens: undefined,
    }),
    ...(minP != null && { min_p: minP }),
    ...(promptCacheKey != null && { prompt_cache_key: promptCacheKey }),
    ...(promptCacheRetention != null && {
      prompt_cache_retention: promptCacheRetention,
    }),
    ...(repetitionPenalty != null && {
      repetition_penalty: repetitionPenalty,
    }),
    ...(reasoning != null && { reasoning }),
    ...(stopTokenIds != null && { stop_token_ids: stopTokenIds }),
    ...(parallelToolCalls != null && {
      parallel_tool_calls: parallelToolCalls,
    }),
    ...(maxTemp != null && { max_temp: maxTemp }),
    ...(minTemp != null && { min_temp: minTemp }),
  };
}
