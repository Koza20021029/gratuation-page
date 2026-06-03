const fs = require('fs');
const html = fs.readFileSync('c:/Users/hanso/Desktop/文發系/大四上/畢業專題/遊戲規則/index.html', 'utf8');

const glossaryMatch = html.match(/const\s+GLOSSARY\s*=\s*(\{[\s\S]*?\n\s*\});/);
if (!glossaryMatch) { console.log('No GLOSSARY found'); process.exit(1); }

let GLOSSARY = {};
eval('GLOSSARY = ' + glossaryMatch[1]);

const keys = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
const ZH_REGEXP = new RegExp(keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');

let classroomHtml = fs.readFileSync('c:/Users/hanso/Desktop/文發系/大四上/畢業專題/遊戲規則/課堂.html', 'utf8');
let translatedHtml = classroomHtml.replace(ZH_REGEXP, match => GLOSSARY[match] || match);

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
while ((match = scriptRegex.exec(translatedHtml)) !== null) {
    let scriptContent = match[1];
    if (scriptContent.trim() && !scriptContent.includes('src=')) {
        try {
            // we don't have @babel/core installed necessarily in this exact dir, so let's try basic syntax check
            new Function(scriptContent); 
        } catch (e) {
            console.error('Function Syntax Error:', e.message);
            // It might fail because of JSX, so we only print first 100 chars of the error
            console.error(scriptContent.substring(0, 100));
        }
    }
}
console.log('Regex validation complete. Saving translated HTML to test_translated.html');
fs.writeFileSync('c:/Users/hanso/Desktop/文發系/大四上/畢業專題/遊戲規則/test_translated.html', translatedHtml);
