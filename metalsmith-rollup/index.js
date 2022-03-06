const Debug = require('debug');
const { sep, resolve, basename, dirname, join } = require('path');
const rollup = require('rollup');

const debug = Debug('metalsmith-rollup')

function normalizePath (p) {
  return p.split(sep).filter((q) => {
    return typeof q === 'string' && q.length > 0
  }).join('/')
}

function getMetalsmithKey (files, p) {
  p = normalizePath(p)

  for (const key in files) {
    if (files.hasOwnProperty(key) && normalizePath(key) === p) {
      return key
    }
  }
  return null
}

function passthru (name, contents) {
  return {
    load (id) {
      if (id === name) return contents
    }
  }
}

module.exports = function plugin (config, pluginConfig) {
  const outFile = config.output.file

  return function (files, metalsmith, done) {
    if (config.input && typeof config.input === 'string') {
      const inputPath = resolve(config.input)
      if (!config.plugins) config.plugins = []
      for (const file of Object.keys(files)) {
        if (resolve(metalsmith.source(), file) === inputPath) {
          const contents = files[file].contents.toString()
          config.plugins.unshift(passthru(inputPath, contents))
        }
      }
    }
    return rollup.rollup(config)
      .then((bundle) => {
        return bundle.generate(config)
      })
      .then((result) => {
        const output = result
        const mapFile = output.map ? output.map.file : ''
        const key = getMetalsmithKey(files, outFile) || outFile

        files[key] = {contents: output.code}

        if (config.output.sourcemap && mapFile) {
          const pathDirName = dirname(config.output.file);
          const mapFileName = `${mapFile}.map`
          const sourceMapKey = getMetalsmithKey(files, join(pathDirName, mapFileName)) || join(pathDirName, mapFileName)
          files[sourceMapKey] = {contents: JSON.stringify(output.map, 3)}

          files[key].contents += `\n//# sourceMappingURL=${mapFileName}`;
        }

        if (pluginConfig && pluginConfig.ignoreSources && output.modules) {
          output.modules
          .map(function getKey (file) {
            const fullPathSrc = resolve(metalsmith._source);
            const buildFile = file.split(fullPathSrc)[1];
            return getMetalsmithKey(files, buildFile) || basename(file)
          })
          .forEach(function eachFile (file) {
              delete files[file]
            })
        }
        debug(`Successfully bundled file ${outFile}!`)
        return done()
      })
      .catch((err) => {
        done(err)
      })
  }
}