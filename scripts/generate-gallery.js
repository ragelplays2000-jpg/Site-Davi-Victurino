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

function scanCategory(cat) {
  const dir = path.join(IMG_BASE, cat.dir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  Criada pasta: assets/img/${cat.dir}/`);
  }

  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort()
    : [];

  if (files.length > 0) {
    return files.map((file, i) => ({
      src:   `assets/img/${cat.dir}/${file}`,
      cat:   cat.key,
      label: cat.label,
      tall:  cat.tall(i),
    }));
  }

  // Nenhuma foto real: usar placeholders se configurado
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
console.log(`\n  TOTAL real: ${totalReal} foto(s) | Com placeholders: ${allItems.length}\n`);

// Gera o bloco GALLERY DATA
const lines = CATEGORIES.map(cat => {
  const items = allItems.filter(p => p.cat === cat.key);
  if (items.length === 0) {
    return `  // ${cat.label} — sem fotos ainda`;
  }
  const isPlaceholder = items[0].placeholder;
  const comment = isPlaceholder
    ? `  // ${cat.label} — placeholders (TODO: substituir por fotos reais em assets/img/${cat.dir}/)`
    : `  // ${cat.label} — ${items.length} foto(s)`;
  const entries = items.map(p =>
    `    {src:'${p.src}',cat:'${p.cat}',label:'${p.label}',tall:${p.tall}}`
  ).join(',\n');
  return `${comment}\n${entries}`;
}).join(',\n');

const newGallery =
  `// GALLERY DATA START\nconst GALLERY = [\n${lines},\n];\n// GALLERY DATA END`;

// Substitui o bloco no index.html
let html = fs.readFileSync(INDEX_PATH, 'utf8');
const start = html.indexOf('// GALLERY DATA START');
const end   = html.indexOf('// GALLERY DATA END') + '// GALLERY DATA END'.length;

if (start === -1 || end === -1) {
  console.error('❌ Marcadores // GALLERY DATA START/END não encontrados no index.html');
  process.exit(1);
}

html = html.slice(0, start) + newGallery + html.slice(end);
fs.writeFileSync(INDEX_PATH, html, 'utf8');

console.log('✅ index.html atualizado com sucesso!');
console.log('\n🚀 Para publicar:');
console.log('   git add .');
console.log('   git commit -m "Atualiza galeria"');
console.log('   git push origin main\n');
