export default [{
    input: 'src/js/content_scripts/spoilers.js',
    output: {
      file: 'builds/spoilers.js',
      format: 'iife'
    }
  },
  {
    input: 'src/js/content_scripts/vod.js',
    output: {
      file: 'builds/vod.js',
      format: 'iife'
    }
  }
]