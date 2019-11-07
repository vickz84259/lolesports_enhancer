import copy from 'rollup-plugin-copy';

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
      { src: 'src/js/background_scripts', dest: `${jsFirefoxDir}` },
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
    }
  },
  {
    input: 'src/js/internal/settings.js',
    output: {
      file: `${jsFirefoxDir}/internal/settings.js`,
      format: 'iife'
    }
  },
]