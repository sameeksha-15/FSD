const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up Tailwind CSS...');

// 1. Create tailwind.config.js
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

fs.writeFileSync(path.join(__dirname, 'tailwind.config.js'), tailwindConfig);
console.log('✅ Created tailwind.config.js');

// 2. Create postcss.config.js
const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

fs.writeFileSync(path.join(__dirname, 'postcss.config.js'), postcssConfig);
console.log('✅ Created postcss.config.js');

// 3. Update index.css
const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;`;

fs.writeFileSync(path.join(__dirname, 'src', 'index.css'), indexCss);
console.log('✅ Updated index.css');

// 4. Ensure index.css is imported in index.js
const indexJsPath = path.join(__dirname, 'src', 'index.js');
let indexJs = fs.readFileSync(indexJsPath, 'utf-8');

if (!indexJs.includes('./index.css')) {
  indexJs = indexJs.replace("import React from 'react';", "import React from 'react';\nimport './index.css';");
  fs.writeFileSync(indexJsPath, indexJs);
  console.log('✅ Updated index.js to import index.css');
}

console.log('\nTailwind CSS setup complete! Try running npm start to see the changes.');
console.log('\nIf styling is still not applied, you may need to:');
console.log('1. Run npm install -D tailwindcss postcss autoprefixer');
console.log('2. Ensure you are running the React dev server with npm start');
console.log('3. Clear your browser cache or use incognito mode\n'); 