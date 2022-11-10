const Debug = require("debug");
const { sep, resolve, basename, dirname, join } = require("path");
const rollup = require("rollup");

const debug = Debug("metalsmith-rollup");

function normalizePath(p) {
  return p
    .split(sep)
    .filter((q) => {
      return typeof q === "string" && q.length > 0;
    })
    .join("/");
}

function getMetalsmithKey(files, p) {
  p = normalizePath(p);

  for (const key in files) {
    if (files.hasOwnProperty(key) && normalizePath(key) === p) {
      return key;
    }
  }
  return null;
}

function passthru(name, contents) {
  return {
    name: "passthru",
    load: {
      order: null,
      handler: (id) => {
        if (id === name) {
          return contents;
        }
        return null;
      },
    },
  };
}

module.exports = function plugin(config, pluginConfig = {}) {
  const { inputOptions, outputOptions } = config;

  return async function (files, metalsmith) {
    if (inputOptions.input && typeof inputOptions.input === "string") {
      const inputPath = resolve(inputOptions.input);
      if (!inputOptions.plugins) inputOptions.plugins = [];
      for (const file of Object.keys(files)) {
        if (resolve(metalsmith.source(), file) === inputPath) {
          const contents = files[file].contents.toString();
          inputOptions.plugins.unshift(passthru(inputPath, contents));
        }
      }
    }
    const bundle = await rollup.rollup(inputOptions);
    const result = await bundle.generate(outputOptions);

    const output = result.output[0];
    const mapFile = output.map ? output.map.file : "";
    const key =
      getMetalsmithKey(files, outputOptions.file) || outputOptions.file;

    files[key] = { contents: output.code };

    if (outputOptions.sourceMap && mapFile) {
      const pathDirName = dirname(outputOptions.file);
      const mapFileName = `${mapFile}.map`;
      const sourceMapKey =
        getMetalsmithKey(files, join(pathDirName, mapFileName)) ||
        join(pathDirName, mapFileName);
      files[sourceMapKey] = { contents: JSON.stringify(output.map, 3) };
    }
    // Cleanup source files from build output
    const { ignoreSources } = pluginConfig;
    if (ignoreSources && output.modules) {
      Object.keys(output.modules)
        .map(function getKey(file) {
          const fullPathSrc = resolve(metalsmith._source);
          const buildFile = file.split(fullPathSrc)[1];
          return getMetalsmithKey(files, buildFile) || basename(file);
        })
        .forEach(function eachFile(file) {
          delete files[file];
        });
    }
    debug(`Successfully bundled file ${outputOptions.file}!`);
  };
};
