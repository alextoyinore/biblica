const fs = require('fs');
const path = require('path');

const metaPath = path.join(process.cwd(), 'src/data/bible-meta.json');
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const books = meta.books.map(b => b.book);

function transform(inputFile, outputFile) {
    let content = fs.readFileSync(inputFile, 'utf8');
    // Remove BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    
    const raw = JSON.parse(content);
    const optimized = {};

    raw.forEach((bookData, index) => {
        const bookName = books[index];
        if (!bookName) return;

        optimized[bookName] = {};
        bookData.chapters.forEach((verses, chapterIndex) => {
            optimized[bookName][chapterIndex + 1] = verses;
        });
    });

    fs.writeFileSync(outputFile, JSON.stringify(optimized));
    console.log(`Successfully transformed ${inputFile} -> ${outputFile}`);
}

try {
    transform('src/data/translations/kjv.json', 'src/data/translations/kjv_opt.json');
    transform('src/data/translations/bbe.json', 'src/data/translations/bbe_opt.json');
} catch (e) {
    console.error("Transformation failed:", e.message);
    process.exit(1);
}
