const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMG_BASE  = path.join(__dirname, '..', 'assets', 'img');
const MAX_WIDTH = 1920;  // px — suficiente para qualquer tela
const QUALITY   = 82;    // 0-100 (82 = ótimo balanço qualidade/tamanho)

async function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDir(fullPath);
    } else if (/\.(jpg|jpeg|png)$/i.test(entry.name)) {
      const webpPath = fullPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      try {
        await sharp(fullPath)
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toFile(webpPath);

        const origKB = Math.round(fs.statSync(fullPath).size / 1024);
        const newKB  = Math.round(fs.statSync(webpPath).size / 1024);
        const pct    = Math.round((1 - newKB / origKB) * 100);
        console.log(`  ✓  ${entry.name.padEnd(40)} ${origKB}KB → ${newKB}KB  (-${pct}%)`);
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error(`  ✗  ${entry.name}: ${err.message}`);
      }
    }
  }
}

(async () => {
  console.log('\n🔧 Otimizando imagens para WebP...\n');
  const before = totalSize(IMG_BASE);
  await processDir(IMG_BASE);
  const after = totalSize(IMG_BASE);
  const savedMB = ((before - after) / 1024 / 1024).toFixed(1);
  const afterMB  = (after  / 1024 / 1024).toFixed(1);
  console.log(`\n✅ Concluído! Total: ${afterMB} MB  (economizou ${savedMB} MB)\n`);
})();

function totalSize(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((sum, e) => {
    const p = path.join(dir, e.name);
    return sum + (e.isDirectory() ? totalSize(p) : fs.statSync(p).size);
  }, 0);
}
