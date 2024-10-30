import { parseArgs } from 'node:util';

import { FlowchartTestCaseGenerator } from '../src/generators/flowchart';
import { MarkdownTestCaseGenerator } from '../src/generators/markdown';
import { FlowchartParser } from '../src/parsers/flowchart';

const generate = async () => {
  const { positionals } = parseArgs({
    args: Bun.argv.slice(2),
    strict: true,
    allowPositionals: true,
  });

  if (positionals.length === 0) {
    console.error('Usage: parse <input>');
    process.exit(1);
  }

  const path = positionals[0];
  const file = Bun.file(path);

  if (!(await file.exists())) {
    throw new Error('File not found');
  }

  if (!file.name?.endsWith('.mmd')) {
    throw new Error('Invalid file extension');
  }

  const output = `${file.name?.replace('/docs/mermaid/', '/docs/testcases/')}.md`;

  const text = await file.text();

  const flowchartParser = new FlowchartParser();
  const flowchart = await flowchartParser.parse(text);

  const flowchartTestCaseGenerator = new FlowchartTestCaseGenerator();
  const testCases =
    await flowchartTestCaseGenerator.generateFlowchartTestCases(flowchart);

  const markdownTestCaseGenerator = new MarkdownTestCaseGenerator({
    fileHeader: '# テストケース一覧\n\n本ドキュメントは自動生成されています。',
    separator: '---',
  });

  // テストケースの保存
  await markdownTestCaseGenerator.saveToFile(testCases, output);
};

await generate();
