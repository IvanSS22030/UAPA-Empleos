import fs from 'fs';
import path from 'path';
const dir = 'src/pages/en/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.astro'));
files.forEach(f => {
  const fp = path.join(dir, f);
  let content = fs.readFileSync(fp, 'utf8');
  // First, convert all `from '../../../` to `from '../../`
  content = content.replace(/from '\.\.\/\.\.\/\.\.\//g, "from '../../");
  // Next, convert all `from '../` strictly to `from '../../` (Wait, this might mess up if they are already `../../`)
  // Actually, let's just make sure all imports of layouts, components, i18n point to `../../`
  content = content.replace(/from '\.\.\/layouts/g, "from '../../layouts");
  content = content.replace(/from '\.\.\/components/g, "from '../../components");
  content = content.replace(/from '\.\.\/i18n/g, "from '../../i18n");
  fs.writeFileSync(fp, content);
  console.log(`Fixed ${fp}`);
});
