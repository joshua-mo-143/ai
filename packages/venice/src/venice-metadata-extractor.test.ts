import { describe, expect, it } from 'vitest';
import { createVeniceMetadataExtractor } from './venice-metadata-extractor';

describe('createVeniceMetadataExtractor', () => {
  it('extracts metadata from a non-streaming response', async () => {
    const extractor = createVeniceMetadataExtractor('venice');

    await expect(
      extractor.extractMetadata({
        parsedBody: {
          cost: { usd: 0.01, diem: 0.02 },
          choices: [
            {
              message: {
                reasoning_details: [{ type: 'text', text: 'reasoning' }],
                reasoning_encrypted: 'encrypted',
              },
            },
          ],
          venice_parameters: {
            web_search_citations: [
              { title: 'Example', url: 'https://example.com' },
            ],
          },
        },
      }),
    ).resolves.toEqual({
      venice: {
        cost: { usd: 0.01, diem: 0.02 },
        reasoningDetails: [{ type: 'text', text: 'reasoning' }],
        reasoningEncrypted: 'encrypted',
        webSearchCitations: [{ title: 'Example', url: 'https://example.com' }],
      },
    });
  });

  it('accumulates metadata from streaming chunks', () => {
    const extractor =
      createVeniceMetadataExtractor('venice').createStreamExtractor();

    extractor.processChunk({
      choices: [
        {
          delta: {
            reasoning_details: [{ type: 'text', text: 'reasoning' }],
          },
        },
      ],
    });
    extractor.processChunk({
      cost: { usd: 0.01 },
      venice_parameters: {
        web_search_citations: [
          { title: 'Example', url: 'https://example.com' },
        ],
      },
    });

    expect(extractor.buildMetadata()).toEqual({
      venice: {
        cost: { usd: 0.01 },
        reasoningDetails: [{ type: 'text', text: 'reasoning' }],
        webSearchCitations: [{ title: 'Example', url: 'https://example.com' }],
      },
    });
  });

  it('ignores malformed metadata', async () => {
    const extractor = createVeniceMetadataExtractor('venice');

    await expect(
      extractor.extractMetadata({ parsedBody: { cost: 'invalid' } }),
    ).resolves.toBeUndefined();
  });
});
