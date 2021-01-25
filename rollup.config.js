import { nodeResolve } from '@rollup/plugin-node-resolve';
import cleanup from 'rollup-plugin-cleanup';
import { eslint } from 'rollup-plugin-eslint';

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
    eslint({ throwOnError: true }),
    nodeResolve(),
    cleanup({ comments: 'none' })
  ]
}));
