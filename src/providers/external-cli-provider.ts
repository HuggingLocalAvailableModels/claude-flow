import { spawn } from 'child_process';
import { BaseProvider, BaseProviderOptions } from './base-provider.js';
import {
  LLMProvider,
  LLMModel,
  LLMRequest,
  LLMResponse,
  LLMStreamEvent,
  ProviderCapabilities,
  ModelInfo,
  HealthCheckResult,
} from './types.js';

interface ExternalCLIOptions extends BaseProviderOptions {
  command: string;
}

/**
 * Generic provider that proxies requests to an external CLI program.
 * This allows using tools like codex, gemini-cli or aider through
 * the existing ProviderManager infrastructure.
 */
export class ExternalCLIProvider extends BaseProvider {
  readonly name: LLMProvider;
  readonly capabilities: ProviderCapabilities;
  private command: string;

  constructor(name: LLMProvider, options: ExternalCLIOptions) {
    super(options);
    this.name = name;
    this.command = options.command;

    const model = options.config.model;
    this.capabilities = {
      supportedModels: [model],
      maxContextLength: { [model]: 4096 } as Record<LLMModel, number>,
      maxOutputTokens: { [model]: 2048 } as Record<LLMModel, number>,
      supportsStreaming: false,
      supportsFunctionCalling: false,
      supportsSystemMessages: true,
      supportsVision: false,
      supportsAudio: false,
      supportsTools: false,
      supportsFineTuning: false,
      supportsEmbeddings: false,
      supportsLogprobs: false,
      supportsBatching: false,
      pricing: {
        [model]: {
          promptCostPer1k: 0,
          completionCostPer1k: 0,
          currency: 'USD',
        },
      },
    };
  }

  protected async doInitialize(): Promise<void> {
    // Best effort check that the CLI command exists by invoking --version
    await new Promise<void>((resolve) => {
      const child = spawn(this.command, ['--version'], { shell: true });
      child.on('close', () => resolve());
      child.on('error', () => resolve());
    });
  }

  protected async doComplete(request: LLMRequest): Promise<LLMResponse> {
    const prompt = request.messages.map(m => `${m.role}: ${m.content}`).join('\n');

    const stdout = await new Promise<string>((resolve, reject) => {
      const child = spawn(this.command, [], { shell: true });
      let out = '';
      let err = '';
      child.stdout.on('data', (d) => (out += d.toString()));
      child.stderr.on('data', (d) => (err += d.toString()));
      child.on('error', (e) => reject(e));
      child.on('close', (code) => {
        if (code !== 0 && err) {
          reject(new Error(err.trim()));
        } else {
          resolve(out.trim());
        }
      });
      child.stdin.end(prompt);
    });

    return {
      id: `cli-${Date.now()}`,
      model: request.model || this.config.model,
      provider: this.name,
      content: stdout,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }

  protected async *doStreamComplete(request: LLMRequest): AsyncIterable<LLMStreamEvent> {
    const resp = await this.doComplete(request);
    yield {
      type: 'content',
      delta: { content: resp.content },
      usage: resp.usage,
    };
    yield { type: 'done' };
  }

  async listModels(): Promise<LLMModel[]> {
    return this.capabilities.supportedModels;
  }

  async getModelInfo(model: LLMModel): Promise<ModelInfo> {
    return {
      id: model,
      contextLength: this.capabilities.maxContextLength[model] || 4096,
      description: 'External CLI model',
      inputTokens: 0,
      outputTokens: 0,
    };
  }

  protected async doHealthCheck(): Promise<HealthCheckResult> {
    return { ok: true };
  }
}

