// engine.js - Safe, Non-Destructive Template Engine
(async () => {
  // Utility: Recursively walk all text nodes in the DOM
  function walkNodes(node, cb) {
    if (node.nodeType === Node.TEXT_NODE) {
      cb(node);
    } else {
      for (const child of node.childNodes) walkNodes(child, cb);
    }
  }
  // 1. Collect all unique data files needed
  const placeholders = new Set();
  walkNodes(document.body, node => {
    const matches = node.textContent.matchAll(/\$\{data\.([a-zA-Z0-9_]+)\[([^\]]+)\]\}/g);
    for (const m of matches) placeholders.add(m[1]);
  });
  // 2. Load required JSON files
  const jsonData = {};
  await Promise.all([...placeholders].map(async name => {
    try {
      const res = await fetch(`/templates/${name}.json`);
      jsonData[name] = await res.json();
    } catch { jsonData[name] = {}; }
  }));
  // 3. Replace templates in text nodes
  walkNodes(document.body, node => {
    node.textContent = node.textContent.replace(/\$\{data\.([a-zA-Z0-9_]+)\[([^\]]+)\]\}/g, (_, file, key) => {
      const data = jsonData[file];
      if (!data) return '';
      const values = Array.isArray(data) ? data : Object.values(data);
      if (key === 'R') return values[Math.floor(Math.random() * values.length)] ?? '';
      if (/^\d+$/.test(key)) return values[Number(key)] ?? '';
      return data[key] ?? '';
    });
  });
  // 4. (Optional) Process templates in attribute values (like <title>)
  for (const el of document.querySelectorAll('*')) {
    for (const attr of el.attributes) {
      if (attr.value.includes('${data.')) {
        attr.value = attr.value.replace(/\$\{data\.([a-zA-Z0-9_]+)\[([^\]]+)\]\}/g, (_, file, key) => {
          const data = jsonData[file];
          if (!data) return '';
          const values = Array.isArray(data) ? data : Object.values(data);
          if (key === 'R') return values[Math.floor(Math.random() * values.length)] ?? '';
          if (/^\d+$/.test(key)) return values[Number(key)] ?? '';
          return data[key] ?? '';
        });
        el.setAttribute(attr.name, attr.value);
      }
    }
  }
})();
