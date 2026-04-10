const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('.git')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.html')) {
            results.push(file);
        }
    });
    return results;
}

const htmlFiles = walk(__dirname);
for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    
    const original = content;
    // Remove links
    content = content.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>/g, '');
    content = content.replace(/<link[^>]*fonts\.gstatic\.com[^>]*>/g, '');
    
    // Clean up excessive empty lines caused by removal
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated', file);
    }
}
console.log('Done cleaning HTML files');
