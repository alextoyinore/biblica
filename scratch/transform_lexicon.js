const fs = require('fs');
const path = require('path');

function transformLexicon(inputFile, outputFile) {
    const raw = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    const optimized = {};

    raw.forEach(entry => {
        optimized[entry.number] = {
            lemma: entry.lemma,
            description: entry.description,
            pronounce: entry.pronounce,
            xlit: entry.xlit
        };
    });

    fs.writeFileSync(outputFile, JSON.stringify(optimized));
    console.log(`Transformed Lexicon: ${inputFile} -> ${outputFile}`);
}

try {
    transformLexicon('src/data/lexicon/strongs.json', 'src/data/lexicon/strongs_opt.json');
} catch (e) {
    console.error("Lexicon transformation failed:", e.message);
}
