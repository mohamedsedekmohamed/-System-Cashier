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

  // Replace {somevar.name} with {somevar.name?.ar || somevar.name?.en || somevar.name}
  content = content.replace(/\{([a-zA-Z0-9_\.\?]+)\.name\}/g, (match, varName) => {
    if (varName === 'file') return match;
    if (match.includes('?.ar')) return match;
    return "{" + varName + ".name?.ar || " + varName + ".name?.en || " + varName + ".name}";
  });

  // Also catch {somevar?.name} 
  content = content.replace(/\{([a-zA-Z0-9_\.\?]+)\?\.name\}/g, (match, varName) => {
    if (varName === 'file') return match;
    if (match.includes('?.ar')) return match;
    return "{" + varName + "?.name?.ar || " + varName + "?.name?.en || " + varName + "?.name}";
  });
  
  // Also catch value={somevar.name} inside options 
  // e.g. >{branch.name}</option> 
  content = content.replace(/>\{([a-zA-Z0-9_\.\?]+)\.name\}</g, (match, varName) => {
    if (varName === 'file') return match;
    if (match.includes('?.ar')) return match;
    return ">{" + varName + ".name?.ar || " + varName + ".name?.en || " + varName + ".name}<";
  });

  // Also catch >{somevar?.name}< 
  content = content.replace(/>\{([a-zA-Z0-9_\.\?]+)\?\.name\}</g, (match, varName) => {
    if (varName === 'file') return match;
    if (match.includes('?.ar')) return match;
    return ">{" + varName + "?.name?.ar || " + varName + "?.name?.en || " + varName + "?.name}<";
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed:', file);
    modifiedCount++;
  }
});

console.log('Modified ' + modifiedCount + ' files.');
