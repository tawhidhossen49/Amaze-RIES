/**
 * The single source of truth for site navigation.
 *
 * Drives the desktop bar, its dropdown panels, and the mobile drawer. The
 * dropdown block alone was previously pasted 128 times across 16 files.
 *
 * `section` is what a page sets as `activeSection` in its front matter to get
 * `aria-current="page"`. `panel` is the id the mobile accordion toggles, and
 * main.js reads it from `data-toggle`.
 *
 * Desktop panels show the children with descriptions. The drawer additionally
 * offers an "Overview" link back to the section landing page, because on
 * mobile the parent row expands the accordion instead of following its href.
 */
module.exports = {
  primary: [
    { label: "About", href: "about.html", section: "about" },
    {
      label: "Research",
      href: "research.html",
      section: "research",
      panel: "mnav-research",
      children: [
        { label: "Publications", href: "research-publications.html", desc: "Formal research output, citation-ready." },
        { label: "Methodology", href: "research-methodology.html", desc: "How we gather and verify evidence." },
      ],
    },
    {
      label: "Projects",
      href: "projects.html",
      section: "projects",
      panel: "mnav-projects",
      children: [
        { label: "Ongoing", href: "projects-ongoing.html", desc: "Work currently in the field." },
        { label: "Completed", href: "projects-completed.html", desc: "Delivered findings and outcomes." },
      ],
    },
    {
      label: "Insights",
      href: "insights.html",
      section: "insights",
      panel: "mnav-insights",
      children: [
        { label: "Articles", href: "insights-articles.html", desc: "Editorial takes on our work and its context." },
        { label: "Statistics", href: "insights-statistics.html", desc: "Data and figures from our research." },
      ],
    },
    {
      label: "Community",
      href: "community.html",
      section: "community",
      panel: "mnav-community",
      children: [
        { label: "Members", href: "community-members.html", desc: "The wider ARIES network." },
        { label: "Events", href: "community-events.html", desc: "Seminars, sessions, and gatherings." },
      ],
    },
    { label: "Contact", href: "contact.html", section: "contact" },
  ],
  cta: { label: "Join ARIES", href: "join.html" },
  footer: [
    {
      heading: "Explore",
      links: [
        { label: "Research", href: "research.html" },
        { label: "Projects", href: "projects.html" },
        { label: "Insights", href: "insights.html" },
      ],
    },
    {
      heading: "Organisation",
      links: [
        { label: "About", href: "about.html" },
        { label: "Community", href: "community.html" },
        { label: "Join", href: "join.html" },
      ],
    },
    {
      heading: "Connect",
      links: [
        { label: "Contact", href: "contact.html" },
        { label: "Terms &amp; conditions", href: "https://www.amazeconsortium.org/tos" },
        { label: "Privacy policy", href: "https://www.amazeconsortium.org/privacy" },
      ],
    },
  ],
  // Placeholder destinations. Both currently point at the contact page and
  // are flagged `tbc` in the markup until real profiles exist.
  socials: [
    { label: "Facebook", href: "contact.html", pending: true },
    { label: "LinkedIn", href: "contact.html", pending: true },
  ],
};
