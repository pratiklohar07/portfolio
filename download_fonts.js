const fs = require('fs');
const https = require('https');
const path = require('path');

const fontsDir = path.join(__dirname, 'assets', 'fonts');
const cssFile = path.join(__dirname, 'assets', 'stylesheets', 'fonts.css');

if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
}

const cssUrls = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700;800;900&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
];

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': userAgent } }, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error('Failed to fetch ' + url + ' Status: ' + res.statusCode));
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function fetchFile(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error('Failed to fetch file ' + url));
            }
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('Downloading fonts...');
    let combinedCss = '';
    
    for (const url of cssUrls) {
        console.log(`Fetching CSS: ${url}`);
        let css = await fetchUrl(url);
        
        // Find all font urls
        const urlRegex = /url\((https:\/\/[^)]+)\)/g;
        let match;
        let p = [];
        
        while ((match = urlRegex.exec(css)) !== null) {
            const fontUrl = match[1];
            // Get unique filename
            const filename = fontUrl.split('/').pop();
            const localPath = path.join(fontsDir, filename);
            const relativeCssPath = `../fonts/${filename}`;
            
            // Replace in CSS immediately
            css = css.replace(fontUrl, relativeCssPath);
            
            if (!fs.existsSync(localPath)) {
                console.log(`Downloading font: ${filename}`);
                p.push(fetchFile(fontUrl, localPath));
            }
        }
        
        await Promise.all(p);
        combinedCss += css + '\n\n';
    }
    
    fs.writeFileSync(cssFile, combinedCss, 'utf8');
    console.log('Done! Generated fonts.css and downloaded fonts.');
}

main().catch(console.error);
