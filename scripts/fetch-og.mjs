import fs from 'fs';

async function fetchAndSave(url, filename) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(filename, Buffer.from(buffer));
    console.log(`Saved: ${filename}`);
  } catch (err) {
    console.error(`Error saving ${filename}:`, err);
  }
}

async function run() {
  const agencyUrl = 'http://localhost:3001/api/og?title=Syntaxure%20Labs&subtitle=Context%20Governance%20for%20Agentic%20Development&description=with%20our%20flagship%20product%20Prism%20Context%20engine';
  await fetchAndSave(agencyUrl, 'apps/agency/public/syntaxure-business-card.png');

  const mhtUrl = 'http://localhost:3003/api/og?title=Nexure%20Networks&subtitle=Localized%20High-Speed%20Internet';
  await fetchAndSave(mhtUrl, 'apps/mht/public/nexure-business-card.png');
}

run();
