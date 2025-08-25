import { spawnSync, spawn } from 'child_process';
import inquirer from 'inquirer';
import chalk from 'chalk';

function checkCommand(cmd) {
  const result = spawnSync('command', ['-v', cmd], { stdio: 'ignore' });
  return result.status === 0;
}

async function promptInstall(cli) {
  const { install } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'install',
      message: `${cli} is not installed. Install now?`,
      default: false,
    },
  ]);
  if (!install) {
    console.log(chalk.red(`${cli} is required.`));
    process.exit(1);
  }
  if (cli === 'deno') {
    await new Promise((resolve, reject) => {
      const sh = spawn('sh', ['-c', 'curl -fsSL https://deno.land/install.sh | sh'], {
        stdio: 'inherit',
      });
      sh.on('exit', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Failed to install deno'));
      });
    });
  } else {
    console.log(
      chalk.yellow(
        'Please install Node.js from https://nodejs.org/ and rerun the command.'
      )
    );
    process.exit(1);
  }
}

export async function ensureCliAndApiKey() {
  const available = [];
  if (checkCommand('deno')) available.push('deno');
  if (checkCommand('node')) available.push('node');

  let cli = 'node';
  if (available.length === 0) {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'No CLI detected. Which one would you like to set up?',
        choices: ['deno', 'node'],
      },
    ]);
    cli = choice;
    await promptInstall(cli);
  } else if (available.length === 1) {
    cli = available[0];
  } else {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'Select CLI runtime to use',
        choices: available,
      },
    ]);
    cli = choice;
  }

  if (!checkCommand(cli)) {
    await promptInstall(cli);
  }

  if (!process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_API_KEY) {
    const { apiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter your API key (leave blank to skip)',
      },
    ]);
    if (apiKey) {
      process.env.ANTHROPIC_API_KEY = apiKey;
      console.log(chalk.green('API key set for current session.'));
    } else {
      console.log(
        chalk.yellow(
          'No API key provided. Set ANTHROPIC_API_KEY or CLAUDE_API_KEY for full functionality.'
        )
      );
    }
  }

  return cli;
}
