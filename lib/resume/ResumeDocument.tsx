import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { Education, Project, RichText, Role, Site, StackItem } from '@/content/types'
import { heroStatements, rangeLabel } from '@/lib/content'

export type ResumeData = {
  site: Site
  siteUrl: string
  experience: Role[]
  education: Education[]
  stack: StackItem[]
  stackCategories: { id: string; label: string }[]
  projects: Project[]
}

const s = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', fontSize: 9.5, color: '#000', lineHeight: 1.35 },
  name: { fontSize: 22, lineHeight: 1.1, fontFamily: 'Helvetica-Bold' },
  role: { fontSize: 11, marginTop: 4 },
  contact: { fontSize: 9, marginTop: 4 },
  section: { marginTop: 12 },
  heading: { fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  rule: { borderBottomWidth: 0.5, borderBottomColor: '#000', marginTop: 3, marginBottom: 6 },
  row: { flexDirection: 'row', marginBottom: 5 },
  dates: { width: 90, fontSize: 9 },
  rowBody: { flex: 1 },
  bold: { fontFamily: 'Helvetica-Bold' },
  line: { marginBottom: 2 },
  // Pinned to the bottom edge so it never pushes the page onto a second sheet.
  foot: { position: 'absolute', bottom: 22, left: 36, fontSize: 8, color: '#666' },
})

const flat = (parts: RichText) => parts.map((p) => (typeof p === 'string' ? p : p.text)).join('')

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.heading}>{title}</Text>
      <View style={s.rule} />
      {children}
    </View>
  )
}

export function ResumeDocument({ data }: { data: ResumeData }) {
  const { site, siteUrl, projects } = data
  const name = `${site.firstName} ${site.lastName}`.replace(/\b\w/g, (c) => c.toUpperCase())
  const summary = heroStatements().map(flat).join(' ')
  const host = (u: string) => u.replace(/^https?:\/\//, '')
  return (
    <Document title={`${name} - Resume`} author={name}>
      <Page size="A4" style={s.page}>
        {/* First in the markup, absolutely placed at the bottom: it can't push content onto a second page. */}
        <Text style={s.foot} fixed>
          More projects: {siteUrl}/works
        </Text>
        <Text style={s.name}>{name}</Text>
        <Text style={s.role}>{site.role}</Text>
        <Text style={s.contact}>
          {[site.email, host(site.socials.github), host(site.socials.linkedin), host(siteUrl)].join(' · ')}
        </Text>

        <Section title="Summary">
          <Text>{summary}</Text>
        </Section>

        <Section title="Experience">
          {data.experience.map((r) => (
            <View key={`${r.company}-${r.title}`} style={s.row} wrap={false}>
              <Text style={s.dates}>{rangeLabel(r.start, r.end)}</Text>
              <View style={s.rowBody}>
                <Text style={s.bold}>
                  {r.title} · {r.company}
                </Text>
                <Text>{r.summary}</Text>
              </View>
            </View>
          ))}
        </Section>

        <Section title={projects.length > 1 ? 'Featured projects' : 'Featured project'}>
          {projects.map((project) => (
            <View key={project.slug} style={{ marginBottom: 6 }}>
              <Text style={s.bold}>
                {project.name} · {project.role} · {project.year}
              </Text>
              <Text>{project.summary}</Text>
              {/* The main tools only, so three or more projects still fit on one page. */}
              <Text>Stack: {project.stack.slice(0, 6).join(', ')}</Text>
            </View>
          ))}
        </Section>

        <Section title="Skills">
          {data.stackCategories
            .filter((c) => c.id !== 'all')
            .map((c) => (
              <Text key={c.id} style={s.line}>
                <Text style={s.bold}>{c.label}: </Text>
                {data.stack
                  .filter((i) => i.category === c.id)
                  .map((i) => i.name)
                  .join(', ')}
              </Text>
            ))}
        </Section>

        <Section title="Education">
          {data.education.map((e) => (
            <View key={e.course} style={s.row} wrap={false}>
              <Text style={s.dates}>{e.date}</Text>
              <Text style={s.rowBody}>
                {e.course} · {e.institution}, {e.location}
              </Text>
            </View>
          ))}
        </Section>

      </Page>
    </Document>
  )
}
