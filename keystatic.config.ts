import { collection, config, fields, singleton } from "@keystatic/core";

/**
 * Admin panel ("Studio"). Every save is a git commit to the repo, which
 * redeploys the site. In development it edits the files on disk instead.
 *
 * The panel lives behind a private address handled by proxy.ts; nothing on the
 * site links to it. Content files are read by content/*.ts.
 */

const isDev = process.env.NODE_ENV === "development";

const text = (label: string, description?: string) =>
  fields.text({ label, description, validation: { isRequired: true } });
const optionalText = (label: string, description?: string) => fields.text({ label, description });
const paragraph = (label: string, description?: string) =>
  fields.text({ label, description, multiline: true, validation: { isRequired: true } });
const list = (label: string, itemLabel: string, description?: string) =>
  fields.array(fields.text({ label: itemLabel }), {
    label,
    description,
    itemLabel: (p) => p.value || itemLabel,
  });

const logo = (description: string) =>
  fields.object(
    {
      image: fields.image({
        label: "Logo image",
        description: "Square works best. Leave empty to show initials instead.",
        directory: "public/logos",
        publicPath: "/logos/",
      }),
      initials: optionalText("Initials", "Shown on a plain tile when there is no logo image, e.g. CT."),
    },
    { label: "Logo", description },
  );

export default config({
  storage: isDev
    ? { kind: "local" }
    : { kind: "github", repo: { owner: "jonathandestinec", name: "my-portfolio-redesign" } },
  ui: {
    brand: { name: "Studio" },
    navigation: {
      Home: ["site"],
      Work: ["projects", "playground"],
      About: ["experience", "education", "stack"],
      Writing: ["posts"],
    },
  },

  singletons: {
    site: singleton({
      label: "Site & hero",
      path: "content/site",
      format: { data: "json" },
      schema: {
        firstName: text("First name", "Lowercase, as in the wordmark."),
        lastName: text("Last name", "Lowercase, as in the wordmark."),
        role: text("Role", "Used in the page description and résumé."),
        email: text("Email"),
        calendarUrl: fields.url({ label: "Booking link", description: "Where “Book a call” goes.", validation: { isRequired: true } }),
        githubUsername: text("GitHub username", "Used for the contribution grid."),
        socials: fields.object(
          {
            github: fields.url({ label: "GitHub", validation: { isRequired: true } }),
            linkedin: fields.url({ label: "LinkedIn", validation: { isRequired: true } }),
            x: fields.url({ label: "X", validation: { isRequired: true } }),
          },
          { label: "Social links" },
        ),
        hero: fields.object(
          {
            lead: text("Greeting", "The first, bold line, e.g. Hi, I’m Destine."),
            intro: paragraph("Intro line"),
            status: list("Status lines", "Line", "Small grey lines under the buttons."),
          },
          {
            label: "Hero",
            description:
              "The “Lately: …” line is built from the first two projects (by their Order) and their one-line blurbs.",
          },
        ),
      },
    }),

    experience: singleton({
      label: "Experience",
      path: "content/experience",
      format: { data: "json" },
      schema: {
        roles: fields.array(
          fields.object({
            title: text("Job title"),
            company: text("Company"),
            slug: text("Anchor", "Short id for links, lowercase with dashes, e.g. nexorra-studio. Must be unique."),
            companyUrl: fields.url({ label: "Company website" }),
            logo: logo("Shown on the card."),
            start: text("Start", "e.g. Aug 2024"),
            end: text("End", "e.g. Present"),
            type: optionalText("Type", "e.g. Internship, Contract, Programme"),
            location: optionalText("Location", "e.g. Remote"),
            summary: paragraph("Summary", "One line, shown on the closed card."),
            details: paragraph("Details", "Shown when the card is opened."),
            highlights: list("Highlights", "Highlight"),
            stack: list("Stack", "Tool"),
          }),
          {
            label: "Roles",
            description: "In display order; drag to reorder.",
            itemLabel: (p) => `${p.fields.title.value} · ${p.fields.company.value}`,
          },
        ),
      },
    }),

    education: singleton({
      label: "Education",
      path: "content/education",
      format: { data: "json" },
      schema: {
        items: fields.array(
          fields.object({
            course: text("Course"),
            institution: text("Institution"),
            slug: text("Anchor", "Short id for links, lowercase with dashes. Must be unique."),
            institutionUrl: fields.url({ label: "Institution website" }),
            logo: logo("Shown on the card."),
            date: text("Date", "e.g. 05/2024"),
            location: text("Location"),
            summary: paragraph("Summary"),
            details: paragraph("Details"),
            highlights: list("Highlights", "Highlight"),
          }),
          {
            label: "Courses and studies",
            description: "In display order; drag to reorder.",
            itemLabel: (p) => `${p.fields.course.value} · ${p.fields.institution.value}`,
          },
        ),
      },
    }),

    stack: singleton({
      label: "Stack",
      path: "content/stack",
      format: { data: "json" },
      schema: {
        notes: fields.object(
          {
            frontend: paragraph("Frontend"),
            backend: paragraph("Backend"),
            tools: paragraph("Tools"),
            design: paragraph("Design"),
          },
          { label: "How I use them", description: "Shown on the Stack page." },
        ),
        items: fields.array(
          fields.object({
            name: text("Name"),
            category: fields.select({
              label: "Category",
              options: [
                { label: "Frontend", value: "frontend" },
                { label: "Backend", value: "backend" },
                { label: "Tools", value: "tools" },
                { label: "Design", value: "design" },
              ],
              defaultValue: "frontend",
            }),
            icon: text(
              "Icon",
              "A simple-icons slug (see simpleicons.org, e.g. nextdotjs, postgresql), or key, terminal, card, check. Unknown slugs show a key.",
            ),
          }),
          { label: "Tools", description: "In display order.", itemLabel: (p) => p.fields.name.value },
        ),
      },
    }),

    playground: singleton({
      label: "Client work & experiments",
      path: "content/playground",
      format: { data: "json" },
      schema: {
        items: fields.array(
          fields.object({
            name: text("Name"),
            group: fields.select({
              label: "List",
              options: [
                { label: "Client & collaborations", value: "client" },
                { label: "Experiments", value: "experiment" },
              ],
              defaultValue: "client",
            }),
            role: text("Role", "e.g. Built end-to-end, Collaborated · frontend, Solo"),
            summary: paragraph("Summary"),
            stack: list("Stack", "Tool"),
            url: fields.url({ label: "Live link", description: "Client sites on their own domain are listed first." }),
            repo: fields.url({ label: "Code link", description: "Shown for experiments only." }),
          }),
          {
            label: "Items",
            description: "In display order within each list.",
            itemLabel: (p) => `${p.fields.name.value} (${p.fields.group.value === "client" ? "client" : "experiment"})`,
          },
        ),
      },
    }),
  },

  collections: {
    projects: collection({
      label: "Projects",
      path: "content/projects/*",
      slugField: "name",
      format: { data: "json" },
      columns: ["order"],
      schema: {
        name: fields.slug({
          name: { label: "Name", validation: { isRequired: true } },
          slug: { label: "Page address", description: "The project page is /work/<this>." },
        }),
        order: fields.integer({
          label: "Order",
          description: "Lowest first. The first two are named in the home hero.",
          defaultValue: 10,
          validation: { isRequired: true },
        }),
        blurb: text("Hero blurb", "Follows the name in the hero: “Huddle, <blurb>”."),
        tagline: text("Case-study tagline", "Follows the name in the case-study title: “Huddle: <tagline>”."),
        context: text("Status label", "Short, e.g. Live or In progress."),
        summary: paragraph("Summary", "Shown on the Works card and in the résumé."),
        cover: fields.object(
          {
            image: fields.image({
              label: "Cover image",
              description: "Carousel slide, Works card and case-study header. About 16:10.",
              directory: "public/work",
              publicPath: "/work/",
              validation: { isRequired: true },
            }),
            alt: text("Cover description", "What the image shows, for screen readers."),
          },
          { label: "Cover" },
        ),
        story: fields.array(fields.text({ label: "Paragraph", multiline: true }), {
          label: "Story",
          description: "Paragraphs under the case-study title.",
          itemLabel: (p) => (p.value.length > 60 ? `${p.value.slice(0, 60)}…` : p.value) || "Paragraph",
        }),
        chapters: fields.array(
          fields.object({
            title: text("Title"),
            id: text("Anchor", "Short id, lowercase with dashes, e.g. paid-on-delivery. Unique within the project."),
            text: paragraph("Text"),
            images: fields.array(
              fields.object({
                image: fields.image({
                  label: "Image",
                  directory: "public/work",
                  publicPath: "/work/",
                  validation: { isRequired: true },
                }),
                alt: text("Description", "What the image shows, for screen readers."),
                phone: fields.checkbox({ label: "Phone screenshot", description: "Shown narrower, centred on a grey panel." }),
              }),
              {
                label: "Screenshots",
                description: "One is shown full width; two or more side by side.",
                itemLabel: (p) => p.fields.alt.value || "Screenshot",
              },
            ),
          }),
          { label: "Chapters", itemLabel: (p) => p.fields.title.value || "Chapter" },
        ),
        role: text("What I did", "e.g. Solo · fullstack"),
        stack: list("Stack", "Tool"),
        year: text("Year"),
        status: fields.select({
          label: "Status",
          options: [
            { label: "In progress", value: "in-progress" },
            { label: "Shipped", value: "shipped" },
          ],
          defaultValue: "in-progress",
        }),
        links: fields.object(
          {
            live: fields.url({ label: "Live link" }),
            repo: fields.url({ label: "Code link" }),
          },
          { label: "Links" },
        ),
      },
    }),

    posts: collection({
      label: "Writing",
      path: "content/blog/*",
      slugField: "title",
      format: { contentField: "content" },
      entryLayout: "content",
      columns: ["date"],
      schema: {
        title: fields.slug({
          name: { label: "Title", validation: { isRequired: true } },
          slug: { label: "Page address", description: "The post is /blog/<this>." },
        }),
        date: fields.date({ label: "Date", validation: { isRequired: true } }),
        summary: paragraph("Summary", "Shown in lists, the RSS feed and link previews."),
        tags: list("Tags", "Tag"),
        draft: fields.checkbox({ label: "Draft", description: "Drafts are hidden on the live site." }),
        content: fields.mdx({
          label: "Post",
          extension: "mdx",
          options: { image: { directory: "public/blog", publicPath: "/blog/" } },
        }),
      },
    }),
  },
});
