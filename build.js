const metalsmith = require("metalsmith"),
  branch = require("metalsmith-branch"),
  collections = require("metalsmith-collections"),
  excerpts = require("metalsmith-excerpts"),
  markdown = require("metalsmith-markdown"),
  permalinks = require("metalsmith-permalinks"),
  serve = require("metalsmith-serve"),
  layouts = require("metalsmith-layouts"),
  inplace = require("metalsmith-in-place"),
  publish = require("metalsmith-publish"),
  sass = require("metalsmith-sass"),
  dateFilter = require("nunjucks-date-filter"),
  nunjucks = require("nunjucks"),
  sitemap = require("metalsmith-mapsite"),
  rollup = require("./metalsmith-rollup"),
  uglify = require("metalsmith-uglify"),
  devBuild = (process.env.NODE_ENV || "").trim().toLowerCase() !== "production",
  htmlmin = devBuild ? null : require("metalsmith-html-minifier"),
  watch = devBuild ? require("metalsmith-watch") : null,
  pkg = require("./package.json");

console.log("Starting site build");
console.log(
  devBuild ? "Development" : "Production",
  "build, version",
  pkg.version
);

const siteMeta = {
  site: {
    devBuild: devBuild,
    version: pkg.version,
    title: "sterbling.com",
    url: "https://sterbling.com",
    domain: devBuild ? "http://127.0.0.1" : "https://sterbling.com",
  },
};

const templateConfig = {
  engine: "nunjucks",
  directory: "src/layouts",
  watch: "true",
  noCache: "true",
  rename: true,
  cache: false,
  exposeConsolidate: (requires) => {
    const nunEnv = nunjucks.configure("./src/layouts", {
      watch: "true",
      noCache: "true",
    });
    nunEnv.addFilter("date", dateFilter);
    requires.nunjucks = nunEnv;
  },
};

let siteBuild = metalsmith(__dirname)
  .clean(true)
  .metadata(siteMeta)
  .source("./src")
  .destination("./build")
  .use(
    sass({
      outputStyle: devBuild ? "devBuild" : "compressed",
      includePaths: ["node_modules", "src", "."],
    })
  )
  .use(publish())
  .use(markdown())
  .use(excerpts())
  .use(
    collections({
      posts: {
        pattern: "posts/**.html",
        sortBy: "publishDate",
        reverse: true,
      },
    })
  )
  .use(
    branch(["!layouts/**.njk", "pages/**", "index.njk"]).use(
      inplace({
        engineOptions: {
          filters: {
            date: dateFilter,
          },
          noCache: "true",
          watch: "true",
        },
      })
    )
  )
  .use(layouts(templateConfig))
  .use(
    branch(["pages/**.html"]).use(
      permalinks({
        pattern: ":title",
        relative: false,
      })
    )
  )
  .use(
    branch("posts/**.html").use(
      permalinks({
        pattern: "posts/:title",
        relative: false,
      })
    )
  )
  .use(
    rollup(
      {
        inputOptions: {
          input: "src/js/main.js", // Entry point
        },
        outputOptions: {
          format: "iife",
          file: "js/bundle.js",
          sourcemap: devBuild,
        },
      },
      {
        ignoreSources: true,
      }
    )
  )
  .use(
    uglify({
      concat: { file: "js/bundle.js" },
      es: 6,
      uglify: { sourceMap: devBuild ? { includeSources: true } : false },
      removeOriginal: false,
    })
  );

if (htmlmin) siteBuild.use(htmlmin());

if (watch) {
  siteBuild
    .use(
      serve({
        port: 8080,
        verbose: true,
      })
    )
    .use(
      watch({
        paths: {
          "${source}/**/*": true, // every changed files will trigger a rebuild of themselves
          "${source}/layouts/**/*": "**/*.njk", // every templates changed will trigger a rebuild of all files,
          "${source}/styles/**/*": "**/*.scss", // every templates changed will trigger a rebuild of all files,
          "${source}/js/**/*": "**/main.js", // every js changed will trigger a rebuild of main.js
        },
        livereload: true,
      })
    );
}

siteBuild
  .use(
    sitemap({
      hostname: siteMeta.site.domain + (siteMeta.site.rootpath || ""),
      omitIndex: true,
    })
  )
  .build(function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Site build complete!");
      if (!watch) {
        process.exit(0);
      }
    }
  });
