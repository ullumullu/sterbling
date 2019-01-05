const metalsmith = require('metalsmith'),
  branch = require('metalsmith-branch'),
  collections = require('metalsmith-collections'),
  excerpts = require('metalsmith-excerpts'),
  markdown = require('metalsmith-markdown'),
  permalinks = require('metalsmith-permalinks'),
  serve = require('metalsmith-serve'),
  layouts = require('metalsmith-layouts'),
  inplace = require('metalsmith-in-place'),
  publish = require('metalsmith-publish'),
  moment = require('moment'),
  sass = require('metalsmith-sass'),
  dateFilter = require('nunjucks-date-filter'),
  nunjucks = require('nunjucks'),
  sitemap = require('metalsmith-mapsite'),
  rollup = require('metalsmith-rollup'),
  devBuild = ((process.env.NODE_ENV || '').trim().toLowerCase() !== 'production'),
  htmlmin = devBuild ? null : require('metalsmith-html-minifier'),
  watch = devBuild ? require('metalsmith-watch') : null,
  pkg = require('./package.json');

console.log('Starting site build');
console.log((devBuild ? 'Development' : 'Production'), 'build, version', pkg.version);

const siteMeta = {
  site: {
    devBuild: devBuild,
    version: pkg.version,
    title: 'blogbout.com',
    url: 'https://blogbout.com',
    domain: devBuild ? 'http://127.0.0.1' : 'https://blogbout.com'
  }
}

const templateConfig = {
  engine: 'nunjucks',
  directory: 'src/layouts',
  watch: 'true',
  noCache: 'true',
  rename: true,
  cache: false,
  exposeConsolidate: requires => {
    const nunEnv = nunjucks
      .configure('./src/layouts', {
        watch: 'true',
        noCache: 'true'
      });
    nunEnv.addFilter('date', dateFilter);
    requires.nunjucks = nunEnv;
  }
}

let siteBuild = metalsmith(__dirname)
  .clean(true)
  .metadata(siteMeta)
  .source('./src')
  .destination('./build')
  .use(sass({
    outputStyle: "expanded",
    includePaths: ['node_modules', 'src', '.']
  }))
  .use(publish())
  .use(markdown())
  .use(excerpts())
  .use(collections({
    posts: {
      pattern: 'posts/**.html',
      sortBy: 'publishDate',
      reverse: true
    }
  }))
  .use(branch(['!layouts/**.njk', 'pages/**', 'index.njk'])
    .use(
      inplace({
        engineOptions: {
          filters: {
            'date': dateFilter
          },
          noCache: 'true',
          watch: 'true'
        }
      }))
  )
  .use(layouts(templateConfig))
  .use(branch(['pages/**.html'])
    .use(permalinks({
      pattern: 'pages/:title',
      relative: false
    }))
  )
  .use(branch('posts/**.html')
    .use(permalinks({
      pattern: 'posts/:title',
      relative: false
    }))
  )
  .use(rollup({
      input: 'src/js/main.js', // Entry point
      output: {
        format: 'iife',
        file: 'js/bundle.js',
        sourcemap: devBuild // This will be placed under "build/"
      }
    },
    {
      ignoreSources: devBuild
    }
  ));

if (htmlmin) siteBuild.use(htmlmin())


if (watch) {
  siteBuild.use(serve({
      port: 8080,
      verbose: true
    }))
    .use(watch({
      paths: {
        "${source}/**/*": true, // every changed files will trigger a rebuild of themselves
        "${source}/layouts/**/*": "**/*.njk", // every templates changed will trigger a rebuild of all files,
        "${source}/styles/**/*": "**/*.scss", // every templates changed will trigger a rebuild of all files,
        "${source}/js/**/*": "**/main.js" // every js changed will trigger a rebuild of main.js
      },
      livereload: true
    }));
}

siteBuild
  .use(sitemap({
    hostname: siteMeta.site.domain + (siteMeta.site.rootpath || ''),
    omitIndex: true
  }))
  .build(function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log('Site build complete!');
      if (!watch) {
        process.exit(0)
      }
    }
  });