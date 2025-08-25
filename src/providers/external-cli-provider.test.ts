import { ExternalCLIProvider } from './external-cli-provider.js';
import { LLMRequest } from './types.js';

const logger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
} as any;

describe('ExternalCLIProvider', () => {
  it('should proxy completions through external CLI', async () => {
    const provider = new ExternalCLIProvider('codex-cli', {
      logger,
      config: {
        provider: 'codex-cli',
        model: 'codex',
        providerOptions: { command: 'cat' },
      } as any,
      command: 'cat',
    });

    await provider.initialize();

    const request: LLMRequest = {
      messages: [{ role: 'user', content: 'hello world' }],
    };

    const response = await provider.complete(request);
    expect(response.content).toContain('user: hello world');
  });
});
