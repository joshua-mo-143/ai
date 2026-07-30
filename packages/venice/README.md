# AI SDK - Venice Provider

The **[Venice provider](https://ai-sdk.dev/providers/ai-sdk-providers/venice)** for the [AI SDK](https://ai-sdk.dev/docs) provides language, embedding, and image model support for [Venice](https://venice.ai).

## Setup

The Venice provider is available in the `@ai-sdk/venice` module:

```bash
npm i @ai-sdk/venice
```

## Provider Instance

```ts
import { venice } from '@ai-sdk/venice';
```

## Language Model Example

```ts
import { venice } from '@ai-sdk/venice';
import { generateText } from 'ai';

const { text } = await generateText({
  model: venice('venice-uncensored'),
  prompt: 'Why is privacy important?',
});
```

## Documentation

See the **[Venice provider documentation](https://ai-sdk.dev/providers/ai-sdk-providers/venice)** for setup and provider-specific options.
