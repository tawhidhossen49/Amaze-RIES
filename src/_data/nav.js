/**
 * The single source of truth for site navigation.
 *
 * Drives the desktop bar and the mobile drawer.
 *
 * `section` is what a page sets as `activeSection` in its front matter to get
 * `aria-current="page"`.
 *
 * The IA is flat: no item carries `children` or `panel`, so header.njk and
 * nav-mobile.njk both take their non-dropdown branch and emit no `.dropdown`
 * panel and no `.nav-mobile-children` accordion. Re-adding a `children` array
 * to any item is all it takes to bring the dropdown back.
 */
module.exports = {
  primary: [
    { label: "About", href: "about.html", section: "about" },
    { label: "Research", href: "research.html", section: "research" },
    { label: "Projects", href: "projects.html", section: "projects" },
    { label: "Events", href: "events.html", section: "events" },
    { label: "Articles", href: "articles.html", section: "articles" },
  ],
  cta: { label: "Join ARIES", href: "join.html" },
  footer: [
    {
      heading: "Explore",
      links: [
        { label: "Research", href: "research.html" },
        { label: "Projects", href: "projects.html" },
        { label: "Articles", href: "articles.html" },
      ],
    },
    {
      heading: "Organisation",
      links: [
        { label: "About", href: "about.html" },
        { label: "Events", href: "events.html" },
        { label: "Join", href: "join.html" },
      ],
    },
    {
      heading: "Connect",
      links: [
        { label: "Terms &amp; conditions", href: "https://www.amazeconsortium.org/tos" },
        { label: "Privacy policy", href: "https://www.amazeconsortium.org/privacy" },
      ],
    },
  ],
};
