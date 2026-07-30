import { venice } from '@ai-sdk/venice';
import { generateImage } from 'ai';
import { presentImages } from '../../lib/present-image';
import { run } from '../../lib/run';

run(async () => {
  const result = await generateImage({
    model: venice.image('qwen-image'),
    prompt: 'A private city floating above the clouds at sunrise',
    size: '1024x1024',
  });

  await presentImages(result.images);
});
