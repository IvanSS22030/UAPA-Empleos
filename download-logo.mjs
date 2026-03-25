import fs from 'fs';
import https from 'https';
import path from 'path';

const url = 'https://www.uapa.edu.do/wp-content/uploads/2023/10/Logo-UAPA-Blanco.png';
const dest = path.resolve('public', 'uapa-logo-blanco.png');

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    'Referer': 'https://www.uapa.edu.do/'
  }
}, (res) => {
  if (res.statusCode === 200) {
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Logo downloaded successfully to ' + dest);
    });
  } else {
    console.error('Failed to download logo. Status:', res.statusCode);
  }
}).on('error', (err) => {
  console.error('Error downloading logo:', err.message);
});
