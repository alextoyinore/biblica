const fs = require('fs');
const path = require('path');
const https = require('https');

const bibles = {
    'asv': 'en_asv.json',
    'web': 'en_web.json',
    'darby': 'en_darby.json',
    'dra': 'en_douayrheims.json',
    'ylt': 'en_ylt.json',
    'oeb-us': 'en_oeb-us.json',
    'almeida': 'pt_joaoalmeida.json',
    'synodal': 'ru_synodal.json',
    'cuv': 'zh_cuv.json',
    'rccv': 'ro_cornilescu.json',
    'cherokee': 'chr_cherokee.json'
};

const baseUrl = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/';

Object.entries(bibles).forEach(([key, filename]) => {
    const outPath = path.join(process.cwd(), 'src/data/translations', `${key}.json`);
    const url = baseUrl + filename;
    
    https.get(url, (res) => {
        if (res.statusCode !== 200) {
            console.error(`Failed to fetch ${key}: ${res.statusCode}`);
            return;
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            fs.writeFileSync(outPath, data);
            console.log(`Downloaded ${key}`);
        });
    }).on('error', err => {
        console.error(`Error fetching ${key}:`, err.message);
    });
});
