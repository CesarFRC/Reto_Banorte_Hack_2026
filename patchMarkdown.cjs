const fs = require('fs');
const file = 'src/orchestrator/agent.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace JSON.parse line with a cleaner version
if (code.includes('const parsed = JSON.parse((textPart as any).text);')) {
  code = code.replace(
    /const parsed = JSON\.parse\(\(textPart as any\)\.text\);/,
    `let rawText = (textPart as any).text;
    if (rawText.startsWith('\`\`\`json')) {
      rawText = rawText.replace(/^\`\`\`json\\s*/, '').replace(/\\s*\`\`\`$/, '');
    } else if (rawText.startsWith('\`\`\`')) {
      rawText = rawText.replace(/^\`\`\`\\s*/, '').replace(/\\s*\`\`\`$/, '');
    }
    const parsed = JSON.parse(rawText);`
  );
  fs.writeFileSync(file, code, 'utf8');
  console.log('Patched JSON.parse in agent.ts');
} else {
  console.log('Could not find JSON.parse line in agent.ts');
}
