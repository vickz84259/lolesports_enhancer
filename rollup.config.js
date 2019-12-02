import resolve from 'rollup-plugin-node-resolve';
import cleanup from 'rollup-plugin-cleanup';

let srcDir = 'src/js';
let buildDir = 'builds/js';

let files = [
  'background_scripts/navigation.js',
  'background_scripts/notification.js',
  'background_scripts/settings.js',
  'content_scripts/spoilers.js',
  'content_scripts/vod.js',
  'content_scripts/live.js',
  'internal/settings.js'
];


export default files.map(file => ({
  input: `${srcDir}/${file}`,
  output: {
    file: `${buildDir}/${file}`,
    format: 'iife'
  },
  plugins: [
    resolve({ customResolveOptions: { moduleDirectory: 'node_modules' } }),
    cleanup({ comments: 'none' })
  ]
}));
