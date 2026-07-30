import { venice } from '@ai-sdk/venice';
import { embed } from 'ai';
import { run } from '../../lib/run';

run(async () => {
  const { embedding, usage } = await embed({
    model: venice.embeddingModel('text-embedding-bge-m3'),
    value: 'Privacy-first AI infrastructure',
  });

  console.log(embedding);
  console.log(usage);
});
