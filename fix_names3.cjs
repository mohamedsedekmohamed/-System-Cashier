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

  // We want to match: {someVar.name?.ar || someVar.name?.en || someVar.name}
  // where someVar can contain . or ?
  content = content.replace(/\{([a-zA-Z0-9_\.\?]+)\.name\?\.ar\s*\|\|\s*\1\.name\?\.en\s*\|\|\s*\1\.name\}/g, (match, v) => {
    return "{typeof " + v + ".name === 'object' && " + v + ".name !== null ? (" + v + ".name?.ar || " + v + ".name?.en || '') : (" + v + ".name || '')}";
  });

  content = content.replace(/>\{([a-zA-Z0-9_\.\?]+)\.name\?\.ar\s*\|\|\s*\1\.name\?\.en\s*\|\|\s*\1\.name\}</g, (match, v) => {
    return ">{typeof " + v + ".name === 'object' && " + v + ".name !== null ? (" + v + ".name?.ar || " + v + ".name?.en || '') : (" + v + ".name || '')}<";
  });

  content = content.replace(/value=\{([a-zA-Z0-9_\.\?]+)\.name\?\.ar\s*\|\|\s*\1\.name\?\.en\s*\|\|\s*\1\.name\}/g, (match, v) => {
    return "value={typeof " + v + ".name === 'object' && " + v + ".name !== null ? (" + v + ".name?.ar || " + v + ".name?.en || '') : (" + v + ".name || '')}";
  });

  // What about error={errors.name?.ar || errors.name?.en || errors.name}
  content = content.replace(/error=\{([a-zA-Z0-9_\.\?]+)\.name\?\.ar\s*\|\|\s*\1\.name\?\.en\s*\|\|\s*\1\.name\}/g, (match, v) => {
    return "error={typeof " + v + ".name === 'object' && " + v + ".name !== null ? (" + v + ".name?.ar || " + v + ".name?.en || '') : (" + v + ".name || '')}";
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed:', file);
    modifiedCount++;
  }
});

console.log('Modified ' + modifiedCount + ' files.');
