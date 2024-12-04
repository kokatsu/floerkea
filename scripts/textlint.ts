import { parseArgs } from 'node:util';

const runTextlint = async () => {
  const { positionals, values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      fix: {
        type: 'boolean',
        short: 'f',
        default: false,
      },
    },
    strict: true,
    allowPositionals: true,
  });

  const target = positionals.length > 0 ? positionals.join(' ') : '**/*.md';
  const fix = values.fix ? '--fix' : '';

  try {
    const proc = Bun.spawn({
      cmd: ['bun', 'textlint', target, fix],
      stdout: 'inherit',
    });

    const exit = await proc.exited;
    if (exit !== 0) {
      process.exit(exit);
    }
  } catch (error) {
    console.error('Error running textlint:', error);
    process.exit(1);
  }
};

await runTextlint();
