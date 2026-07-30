import { venice, type VeniceLanguageModelOptions } from '@ai-sdk/venice';
import { generateText } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  const { text, sources, usage } = await generateText({
    model: venice('venice-uncensored'),
    prompt: 'What are the latest developments in private AI?',
    providerOptions: {
      venice: {
        veniceParameters: {
          enableWebSearch: 'auto',
          enableWebCitations: true,
        },
      } satisfies VeniceLanguageModelOptions,
    },
  });

  console.log(text);
  console.log('Sources:', sources);
  console.log('Usage:', usage);
});
