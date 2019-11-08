import copy from 'rollup-plugin-copy';
import resolve from 'rollup-plugin-node-resolve';

let firefoxDir = 'builds/firefox';
let jsFirefoxDir = `${firefoxDir}/js`;

function my_copy() {
  return copy({
    targets: [
      { src: 'src/manifest.json', dest: firefoxDir },
      { src: 'src/css', dest: firefoxDir },
      { src: 'src/html', dest: firefoxDir },
      { src: 'src/img', dest: firefoxDir },
      { src: 'src/json', dest: firefoxDir },
      { src: 'src/js/background_scripts/navigation.js', dest: `${jsFirefoxDir}/background_scripts` },
      { src: 'src/js/external', dest: `${jsFirefoxDir}` }
    ],
  });
}

export default [{
    input: 'src/js/content_scripts/spoilers.js',
    output: {
      file: `${jsFirefoxDir}/content_scripts/spoilers.js`,
      format: 'iife'
    },
    plugins: [
      my_copy()
    ]
  },
  {
    input: 'src/js/content_scripts/vod.js',
    output: {
      file: `${jsFirefoxDir}/content_scripts/vod.js`,
      format: 'iife'
    },
    plugins: [
      resolve({
        customResolveOptions: {
          moduleDirectory: 'node_modules'
        }
      })
    ]
  },
  {
    input: 'src/js/internal/settings.js',
    output: {
      file: `${jsFirefoxDir}/internal/settings.js`,
      format: 'iife'
    }
  },
  {
    input: 'src/js/background_scripts/settings.js',
    output: {
      file: `${jsFirefoxDir}/background_scripts/settings.js`,
      format: 'iife',
    },
    plugins: [
      resolve({
        customResolveOptions: {
          moduleDirectory: 'node_modules'
        }
      })
    ]
  }
]