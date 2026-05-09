const fs   = require('fs');
const path = require('path');

const CATEGORIES = [
  { key: 'esportes-futebol', dir: 'esportes/futebol', label: 'Futebol',     tall: (i) => i % 3 === 0, placeholders: 0 },
  { key: 'esportes-corrida', dir: 'esportes/corrida', label: 'Corrida',     tall: (i) => i % 2 === 0, placeholders: 0 },
  { key: 'casamentos',       dir: 'casamentos',        label: 'Casamento',   tall: ()  => true,         placeholders: 0 },
  { key: 'aniversarios',     dir: 'aniversarios',      label: 'Aniversário', tall: (i) => i % 2 === 0,  placeholders: 0 },
  { key: 'gestante',         dir: 'gestante',          label: 'Gestante',    tall: ()  => true,         placeholders: 0 },
  { key: 'corporativo',      dir: 'corporativo',       label: 'Corporativo', tall: ()  => false,        placeholders: 0 },
  { key: 'jiu-jitsu',        dir: 'jiu-jitsu',         label: 'Jiu-Jitsu',  tall: (i) => i % 2 === 0,  placeholders: 0 },
  { key: 'eventos',          dir: 'eventos',            label: 'Eventos',     tall: (i) => i % 2 === 0,  placeholders: 0 },
  { key: 'ciclismo',         dir: 'ciclismo',           label: 'Ciclismo',    tall: (i) => i % 3 === 0,  placeholders: 0 },
  { key: 'alimentos',        dir: 'alimentos',          label: 'Alimentos',   tall: ()  => false,        placeholders: 0 },
  { key: 'shows',            dir: 'shows',              label: 'Shows',       tall: (i) => i % 2 === 0,  placeholders: 0 },
  { key: 'premiacao',        dir: 'premiacao',          label: 'Premiação',   tall: (i) => i % 3 === 0,  placeholders: 0 },
];

const IMG_BASE   = path.join(__dirname, '..', 'assets', 'img');
const INDEX_PATH = path.join(__dirname, '..', 'index.html');

function scanDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  Criada pasta: ${path.relative(path.join(__dirname, '..'), dir)}/`);
  }
  return fs.readdirSync(dir)
    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort();
}

function scanCategory(cat) {
  const dir  = path.join(IMG_BASE, cat.dir);
  const files = scanDir(dir);

  if (files.length > 0) {
    return files.map((file, i) => ({
      src:   `assets/img/${cat.dir}/${file}`,
      cat:   cat.key,
      label: cat.label,
      tall:  cat.tall(i),
    }));
  }

  if (cat.placeholders > 0) {
    return Array.from({ length: cat.placeholders }, (_, i) => ({
      src:       `https://picsum.photos/800/600?random=${101 + i}`,
      cat:       cat.key,
      label:     cat.label,
      tall:      cat.tall(i),
      placeholder: true,
    }));
  }

  return [];
}

// ── GALERIA PRINCIPAL ──
const allItems = [];
const counters = {};

console.log('\n📸 Escaneando pastas de imagens...\n');
CATEGORIES.forEach(cat => {
  const items = scanCategory(cat);
  allItems.push(...items);
  const realCount = items.filter(p => !p.placeholder).length;
  counters[cat.key] = realCount;
  const phCount = items.length - realCount;
  const note = phCount > 0 ? ` (${phCount} placeholder${phCount>1?'s':''})` : '';
  console.log(`  ${cat.label.padEnd(14)} → ${realCount} foto(s) real${realCount!==1?'is':''}${note}`);
});

const totalReal = Object.values(counters).reduce((a,b)=>a+b,0);
console.log(`\n  TOTAL real: ${totalReal} foto(s) | Com placeholders: ${allItems.length}`);

// ── DESTAQUES ──
const destaquesDir   = path.join(IMG_BASE, 'destaques');
const destaquesFiles = scanDir(destaquesDir);
const destaquesItems = destaquesFiles.map((file, i) => ({
  src:  `assets/img/destaques/${file}`,
  cat:  'destaques',
  label:'Destaque',
  tall: i % 2 === 0,
}));
const destaquesStatus = destaquesItems.length >= 6
  ? `${destaquesItems.length} foto(s) — usadas na aba "Todos"`
  : destaquesItems.length > 0
    ? `${destaquesItems.length} foto(s) — menos de 6, usando 1 por nicho na aba "Todos"`
    : `vazia — usando 1 por nicho na aba "Todos"`;
console.log(`  ${'Destaques'.padEnd(14)} → ${destaquesStatus}\n`);

// ── GERA BLOCO GALLERY DATA ──
const galleryLines = CATEGORIES.map(cat => {
  const items = allItems.filter(p => p.cat === cat.key);
  if (items.length === 0) return `  // ${cat.label} — sem fotos ainda`;
  const isPlaceholder = items[0].placeholder;
  const comment = isPlaceholder
    ? `  // ${cat.label} — placeholders (TODO: substituir em assets/img/${cat.dir}/)`
    : `  // ${cat.label} — ${items.length} foto(s)`;
  const entries = items.map(p =>
    `    {src:'${p.src}',cat:'${p.cat}',label:'${p.label}',tall:${p.tall}}`
  ).join(',\n');
  return `${comment}\n${entries}`;
}).join(',\n');

const newGallery =
  `// GALLERY DATA START\nconst GALLERY = [\n${galleryLines},\n];\n// GALLERY DATA END`;

// ── GERA BLOCO DESTAQUES ──
const destaquesLines = destaquesItems.length > 0
  ? destaquesItems.map(p =>
      `  {src:'${p.src}',cat:'${p.cat}',label:'${p.label}',tall:${p.tall}}`
    ).join(',\n')
  : '  // sem fotos ainda — adicione fotos em assets/img/destaques/';

const newDestaques =
  `// DESTAQUES START\nconst DESTAQUES = [\n${destaquesLines},\n];\n// DESTAQUES END`;

// ── INJETA NO INDEX.HTML ──
let html = fs.readFileSync(INDEX_PATH, 'utf8');

const gStart = html.indexOf('// GALLERY DATA START');
const gEnd   = html.indexOf('// GALLERY DATA END') + '// GALLERY DATA END'.length;
const dStart = html.indexOf('// DESTAQUES START');
const dEnd   = html.indexOf('// DESTAQUES END') + '// DESTAQUES END'.length;

if (gStart === -1 || gEnd === -1) {
  console.error('❌ Marcadores GALLERY DATA START/END não encontrados no index.html');
  process.exit(1);
}
if (dStart === -1 || dEnd === -1) {
  console.error('❌ Marcadores DESTAQUES START/END não encontrados no index.html');
  process.exit(1);
}

// substitui de trás pra frente para não deslocar índices
html = html.slice(0, dStart) + newDestaques + html.slice(dEnd);
html = html.slice(0, gStart) + newGallery   + html.slice(gEnd);

fs.writeFileSync(INDEX_PATH, html, 'utf8');

console.log('✅ index.html atualizado com sucesso!');
console.log('\n🚀 Para publicar:');
console.log('   git add .');
console.log('   git commit -m "Atualiza galeria"');
console.log('   git push origin main\n');
