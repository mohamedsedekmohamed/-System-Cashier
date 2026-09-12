const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace {varName.name?.ar || varName.name?.en || varName.name}
  // We need a regex that captures the variable name
  // Note: regex in JS
  content = content.replace(/\{([a-zA-Z0-9_\.\?]+)\?\.name\?\.ar\s*\|\|\s*\1\?\.name\?\.en\s*\|\|\s*\1\?\.name\}/g, (match, v) => {
    return "{typeof " + v + "?.name === 'object' && " + v + "?.name !== null ? (" + v + "?.name?.ar || " + v + "?.name?.en || '') : (" + v + "?.name || '')}";
  });

  // Also replace >{varName.name?.ar || varName.name?.en || varName.name}<
  content = content.replace(/>\{([a-zA-Z0-9_\.\?]+)\?\.name\?\.ar\s*\|\|\s*\1\?\.name\?\.en\s*\|\|\s*\1\?\.name\}</g, (match, v) => {
    return ">{typeof " + v + "?.name === 'object' && " + v + "?.name !== null ? (" + v + "?.name?.ar || " + v + "?.name?.en || '') : (" + v + "?.name || '')}<";
  });

  // Also replace value={varName.name?.ar || varName.name?.en || varName.name}
  content = content.replace(/value=\{([a-zA-Z0-9_\.\?]+)\?\.name\?\.ar\s*\|\|\s*\1\?\.name\?\.en\s*\|\|\s*\1\?\.name\}/g, (match, v) => {
    return "value={typeof " + v + "?.name === 'object' && " + v + "?.name !== null ? (" + v + "?.name?.ar || " + v + "?.name?.en || '') : (" + v + "?.name || '')}";
  });

  // Also catch {varName?.name?.ar || varName?.name?.en || varName?.name} 
  // Wait, if v already has ?, it might be v?.name instead of v.name
  // I will just use a simpler replacement for any .name?.ar || .name?.en || .name
  // Actually, let's just replace .name?.ar || [anything] || [anything].name
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed:', file);
    modifiedCount++;
  }
});

console.log('Modified ' + modifiedCount + ' files.');
