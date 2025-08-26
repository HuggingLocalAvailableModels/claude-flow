/**
 * Tests for simple-cli.js
 */

import { jest } from '@jest/globals';

const setupMocks = () => {
  jest.unstable_mockModule('../command-registry.js', () => ({
    executeCommand: jest.fn(),
    hasCommand: jest.fn(),
    showCommandHelp: jest.fn(),
    showAllCommands: jest.fn(),
    listCommands: jest.fn(() => ['init', 'agent', 'task', 'memory', 'swarm']),
    commandRegistry: new Map(),
    registerCoreCommands: jest.fn(),
  }));

  jest.unstable_mockModule('../node-compat.js', () => ({
    get args() {
      return process.argv.slice(2);
    },
    cwd: () => process.cwd(),
    isMainModule: () => true,
    exit: process.exit,
    readTextFile: async () => '',
    writeTextFile: async () => {},
    mkdirAsync: async () => {},
    errors: {},
    existsSync: () => true,
  }));
};

setupMocks();

const { parseFlags } = await import('../utils.js');

describe.skip('Claude-Flow CLI', () => {
  let originalArgv;
  let originalExit;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    originalArgv = process.argv;
    originalExit = process.exit;
    process.exit = jest.fn();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.resetModules();
    setupMocks();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.argv = originalArgv;
    process.exit = originalExit;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Help output', () => {
    test('should show help when no arguments provided', async () => {
      process.argv = ['node', 'claude-flow'];

      const { hasCommand } = await import('../command-registry.js');
      hasCommand.mockReturnValue(false);

      await import('../simple-cli.js');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Claude-Flow v2.0.0');
      expect(output).toContain('USAGE:');
      expect(output).toContain('claude-flow <command> [options]');
    });

    test('should show help for --help flag', async () => {
      process.argv = ['node', 'claude-flow', '--help'];

      const { hasCommand } = await import('../command-registry.js');
      hasCommand.mockReturnValue(false);

      await import('../simple-cli.js');

      expect(consoleLogSpy).toHaveBeenCalled();
      const output = consoleLogSpy.mock.calls.join('\n');
      expect(output).toContain('Claude-Flow v2.0.0');
    });

    test('should show version for --version flag', async () => {
      process.argv = ['node', 'claude-flow', '--version'];

      await import('../simple-cli.js');

      expect(consoleLogSpy).toHaveBeenCalledWith('2.0.0');
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });

  describe('Command execution', () => {
    test('should execute valid command', async () => {
      process.argv = ['node', 'claude-flow', 'init', '--sparc'];

      const { executeCommand, hasCommand } = await import('../command-registry.js');
      hasCommand.mockReturnValue(true);
      executeCommand.mockResolvedValue(undefined);

      await import('../simple-cli.js');

      expect(hasCommand).toHaveBeenCalledWith('init');
      expect(executeCommand).toHaveBeenCalledWith('init', ['--sparc'], {});
    });

    test('should handle command with multiple arguments', async () => {
      process.argv = [
        'node',
        'claude-flow',
        'swarm',
        'Build a REST API',
        '--strategy',
        'development',
      ];

      const { executeCommand, hasCommand } = await import('../command-registry.js');
      hasCommand.mockReturnValue(true);
      executeCommand.mockResolvedValue(undefined);

      await import('../simple-cli.js');

      expect(hasCommand).toHaveBeenCalledWith('swarm');
      expect(executeCommand).toHaveBeenCalledWith('swarm', ['Build a REST API'], {
        strategy: 'development',
      });
    });

    test('should show error for unknown command', async () => {
      process.argv = ['node', 'claude-flow', 'invalid-command'];

      const { hasCommand } = await import('../command-registry.js');
      hasCommand.mockReturnValue(false);

      await import('../simple-cli.js');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown command: invalid-command'),
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Available commands:'),
      );
    });
  });

  describe('Flag parsing', () => {
    test('should parse boolean flags correctly', () => {
      const { flags } = parseFlags(['--force', '--verbose']);
      expect(flags).toEqual({ force: true, verbose: true });
    });

    test('should parse value flags correctly', () => {
      const { flags } = parseFlags(
        ['--port', '8080', '--name', 'test'],
        { number: ['port'], string: ['name'] }
      );
      expect(flags).toEqual({ port: 8080, name: 'test' });
    });

    test('should handle mixed flags and arguments', () => {
      const { flags, args } = parseFlags(
        ['arg1', '--flag', 'value', 'arg2', '--bool'],
        { string: ['flag'] }
      );
      expect(flags).toEqual({ flag: 'value', bool: true });
      expect(args).toEqual(['arg1', 'arg2']);
    });

    test('should handle flags with equals sign', () => {
      const { flags } = parseFlags(
        ['--port=8080', '--name=test'],
        { number: ['port'], string: ['name'] }
      );
      expect(flags).toEqual({ port: 8080, name: 'test' });
    });

    test('should set provider and tool limit env vars', async () => {
      const originalProvider = process.env.DEFAULT_LLM_PROVIDER;
      const originalLimit = process.env.TOOL_LIMIT;
      process.argv = ['node', 'claude-flow', '--provider', 'codex-cli', '--tool-limit', '10'];

      const { hasCommand } = await import('../command-registry.js');
      hasCommand.mockReturnValue(false);

      await import('../simple-cli.js');

      expect(process.env.DEFAULT_LLM_PROVIDER).toBe('codex-cli');
      expect(process.env.TOOL_LIMIT).toBe('10');

      if (originalProvider === undefined) {
        delete process.env.DEFAULT_LLM_PROVIDER;
      } else {
        process.env.DEFAULT_LLM_PROVIDER = originalProvider;
      }
      if (originalLimit === undefined) {
        delete process.env.TOOL_LIMIT;
      } else {
        process.env.TOOL_LIMIT = originalLimit;
      }
    });
  });

  describe('Error handling', () => {
    test('should handle command execution errors gracefully', async () => {
      process.argv = ['node', 'claude-flow', 'init'];

      const { executeCommand, hasCommand } = await import('../command-registry.js');
      hasCommand.mockReturnValue(true);
      executeCommand.mockRejectedValue(new Error('Test error'));

      await import('../simple-cli.js');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error executing command:'),
      );
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('should handle missing required arguments', async () => {
      process.argv = ['node', 'claude-flow', 'agent'];

      const { executeCommand, hasCommand } = await import('../command-registry.js');
      hasCommand.mockReturnValue(true);
      executeCommand.mockRejectedValue(new Error('Missing required argument'));

      await import('../simple-cli.js');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing required argument'),
      );
    });
  });
});
