/**
 * ARIES static site.
 *
 * Deliberately minimal: Eleventy only, no bundler, no client-side runtime.
 * The browser receives the same kind of static HTML it did before the build
 * step existed. Page URLs keep their `.html` extensions because the canonical
 * tags, the sitemap and every internal link depend on them.
 */
module.exports = function (eleventyConfig) {
  // Served from the same origin; the CSP allows no third-party hosts.
  eleventyConfig.addPassthroughCopy({ assets: "assets" });
  eleventyConfig.addPassthroughCopy({ "robots.txt": "robots.txt" });

  // Rebuild when the stylesheet or script changes, even though they are
  // passed through rather than compiled.
  eleventyConfig.addWatchTarget("assets/css/");
  eleventyConfig.addWatchTarget("assets/js/");

  // Every page carries a canonical URL and appears in the sitemap, both of
  // which need the output filename rather than a pretty URL.
  // Eleventy normalises a permalink of `index.html` to the URL `/`, which
  // would drop the filename from the homepage's canonical tag and from its
  // sitemap entry. Both have always carried `index.html`, and the published
  // canonical URL is not something to change as a side effect of adding a
  // build step, so the output filename is used rather than `page.url`.
  const path = require("node:path");
  eleventyConfig.addFilter("canonical", (outputPath, base) =>
    base.replace(/\/$/, "") + "/" + path.basename(String(outputPath))
  );

  eleventyConfig.addFilter("sitemapDate", (d) =>
    new Date(d).toISOString().slice(0, 10)
  );

  eleventyConfig.addCollection("pages", (collection) =>
    collection
      .getFilteredByGlob("src/*.njk")
      .filter((item) => item.data.sitemap !== false)
      .sort((a, b) => {
        if (a.fileSlug === "index") return -1;
        if (b.fileSlug === "index") return 1;
        return a.fileSlug.localeCompare(b.fileSlug);
      })
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
