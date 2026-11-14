import React from "react"
import { View, Text, ScrollView, Image, Pressable, Linking, Platform, useWindowDimensions, ImageSourcePropType } from "react-native"
import Svg, { Path } from "react-native-svg"

import { useThemeContext } from "@/context/ThemeContext"
import { FONT } from "@/constants/Fonts"
import { useDashboardColours } from "@/components/dashboard/DashboardParts"

/**
 * Contributions page
 *
 * What I (Sofia) did on EcoNexus: the backend for the original group coursework,
 * then taking it live and redesigning it in November 2026. Laid out as a timeline
 * with before and after screenshots.
 */

const IMG = {
  directions: require("@/assets/images/process/directions.jpg"),
  homeBefore: require("@/assets/images/process/home_before.jpg"),
  homeAfter: require("@/assets/images/process/home_after.jpg"),
  dashboardBefore: require("@/assets/images/process/dashboard_before.jpg"),
  dashboardAfter: require("@/assets/images/process/dashboard_after.jpg"),
  councilBefore: require("@/assets/images/process/council_before.jpg"),
  councilAfter: require("@/assets/images/process/council_after.jpg"),
  scanBefore: require("@/assets/images/process/scan_before.jpg"),
  scanAfter: require("@/assets/images/process/scan_after.jpg"),
  loginBefore: require("@/assets/images/process/login_before.jpg"),
  loginAfter: require("@/assets/images/process/login_after.jpg"),
  adminBefore: require("@/assets/images/process/admin_before.jpg"),
  adminAfter: require("@/assets/images/process/admin_after.jpg"),
  bugFonts: require("@/assets/images/process/bug_fonts.jpg"),
}

const TEAM = [
  ["Danny Bunyan-Carroll", "Bladeex"],
  ["Sebastian Clarke", "Thelegendseb"],
  ["Sofia French (me)", "k1k12"],
  ["Eesha Hussain", "EeshaH12"],
  ["Vladislav Ponomarev", "VladP812"],
  ["Muhammad Qasim Sultan Raja", "qasimraja005"],
  ["Victoria Rawding-Guille", "Rawding"],
]

const COMMITS = [
  "fix: pin bcrypt to 4.0.1 so passlib can hash passwords again",
  "fix: stop users changing their own role or council",
  "fix: stop logging the login token and user details to the console",
  "feat: add demo accounts for each role that can't be changed or reach real users",
  "feat: fill the demo with real point locations and months of made-up activity",
  "fix: bundle the fonts so they load on cloudflare pages",
  "fix: point panel crashing on the guest map",
  "feat: redesign log in and sign up and drop the 2fa step",
]

const Contributions = () => {
  const { theme } = useThemeContext()
  const c = useDashboardColours()
  const { width } = useWindowDimensions()
  const wide = width >= 900

  const body = { fontFamily: FONT.regular, fontSize: wide ? 18 : 16, lineHeight: wide ? 28 : 25, color: theme.text_muted }
  const strong = { fontFamily: FONT.semiBold, color: theme.text }

  const P = ({ children, style }: { children: React.ReactNode; style?: any }) => <Text style={[body, { marginTop: 12 }, style]}>{children}</Text>

  const Bullets = ({ items }: { items: React.ReactNode[] }) => (
    <View style={{ marginTop: 12, gap: 8 }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 10 }}>
          <Text style={[body, { color: theme.accent }]}>-</Text>
          <Text style={[body, { flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </View>
  )

  // The box sets the size and the image fills it (aspectRatio on the Image itself gets ignored on web)
  const Framed = ({ source, ratio, label }: { source: ImageSourcePropType; ratio: number; label?: string }) => (
    <View style={{ width: "100%", aspectRatio: ratio, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.panel, overflow: "hidden" }}>
      <Image source={source} resizeMode="contain" accessibilityLabel={label} accessibilityIgnoresInvertColors style={{ width: "100%", height: "100%" }} />
    </View>
  )

  const Shot = ({ source, ratio = 1.6, label, tilt = 0 }: { source: ImageSourcePropType; ratio?: number; label?: string; tilt?: number }) => (
    <View style={{ flexGrow: 1, flexBasis: wide ? 300 : "100%", minWidth: 0 }}>
      {label && (
        <Text style={{ fontFamily: FONT.hand, fontSize: 26, color: label === "after" ? theme.accent : theme.text_muted, marginBottom: 4, marginLeft: 6, transform: [{ rotate: `${tilt}deg` }] }}>
          {label}
        </Text>
      )}
      <Framed source={source} ratio={ratio} />
    </View>
  )

  const BeforeAfter = ({ before, after, beforeRatio, afterRatio, note }: { before: ImageSourcePropType; after: ImageSourcePropType; beforeRatio?: number; afterRatio?: number; note?: string }) => (
    <View style={{ marginTop: 20 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
        <Shot source={before} ratio={beforeRatio} label="before" tilt={-2} />
        <Shot source={after} ratio={afterRatio} label="after" tilt={1.5} />
      </View>
      {note && <Text style={[body, { fontSize: 15, marginTop: 8 }]}>{note}</Text>}
    </View>
  )

  // One entry on the timeline: a date in handwriting, a title, then whatever goes under it
  const Entry = ({ date, title, children, last }: { date: string; title: string; children: React.ReactNode; last?: boolean }) => (
    <View style={{ flexDirection: "row", gap: wide ? 28 : 0 }}>
      {wide && (
        <View style={{ width: 20, alignItems: "center" }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, marginTop: 10, backgroundColor: theme.accent }} />
          {!last && <View style={{ flex: 1, width: 2, marginTop: 6, backgroundColor: c.border }} />}
        </View>
      )}
      <View style={{ flex: 1, paddingBottom: last ? 0 : 56, minWidth: 0 }}>
        <Text style={{ fontFamily: FONT.hand, fontSize: 26, color: theme.accent }}>{date}</Text>
        <Text style={{ fontFamily: FONT.bold, fontSize: wide ? 32 : 26, letterSpacing: -1, color: theme.text, marginTop: 2 }} accessibilityRole="header">
          {title}
        </Text>
        {children}
      </View>
    </View>
  )

  return (
    <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ paddingBottom: 64 }}>
      <View style={{ width: "100%", maxWidth: 1000, alignSelf: "center", paddingHorizontal: wide ? 24 : 16, paddingTop: 32 }}>

        <Text style={{ fontFamily: FONT.semiBold, fontSize: 16, color: theme.accent }}>My part</Text>
        <Text style={{ fontFamily: FONT.bold, fontSize: wide ? 52 : 36, lineHeight: wide ? 56 : 40, letterSpacing: -2, color: theme.text, marginTop: 6 }} accessibilityRole="header">
          What I did on EcoNexus
        </Text>
        <Text style={{ fontFamily: FONT.hand, fontSize: 28, color: theme.text_muted, marginTop: 4, transform: [{ rotate: "-1.5deg" }] }}>
          (the honest version)
        </Text>
        <P style={{ fontSize: wide ? 20 : 17, lineHeight: wide ? 31 : 26, marginTop: 18 }}>
          EcoNexus started as our second year group project at Newcastle (CSC2033, Team 30). Seven of us built it between
          February and May 2025, it got marked, and then it sat on GitHub. In November 2026 I picked it back up to put it online
          properly. This page is what I did, both times.
        </P>

        <View style={{ marginTop: 48 }}>

          <Entry date="Feb to May 2025" title="The coursework: I led the backend team">
            <P>
              The app has three kinds of user: residents scanning things, councils looking after their recycling points, and
              admins letting councils in. I led the team that built the API behind all of it, in Python with{" "}
              <Text style={strong}>FastAPI</Text> and <Text style={strong}>Postgres</Text>. Between us that was:
            </P>
            <Bullets items={[
              "logging in with JWT tokens in cookies, with separate roles for residents, councils and admins",
              "council sign up tied to a real council area (using GSS codes), with an admin approving each one",
              "barcode lookups: anything we haven't seen before gets looked up on Open Food Facts and matched to one of 16 materials",
              "recycling points for each council, with what they take and when they're open",
              "the dashboard numbers, worked out from everyone's scan history",
              "database migrations with Alembic, tests with pytest, security scans with Bandit and load tests with Locust",
            ]} />
            <P>The rest of the team built the app itself in Expo and React Native.</P>
          </Entry>

          <Entry date="11 to 14 Nov 2026" title="Getting it to run again">
            <P>
              A year and a half later it didn't start. A bcrypt update had broken password hashing, the database had two
              migration branches that disagreed, and the Docker image was missing a package.
            </P>
            <P>Before putting it on the internet I went through it looking for security problems. There were a few:</P>
            <Bullets items={[
              <Text><Text style={strong}>any user could make themselves an admin</Text> with one request, by editing their own role</Text>,
              "the login token, user details and 2FA secret were printed in the browser console",
              "an API key was in the code and a JWT secret was in the readme",
            ]} />
            <P>All fixed, each in its own small commit, before anything went live.</P>
          </Entry>

          <Entry date="same week" title="Putting it online">
            <P>
              The database is on <Text style={strong}>Neon</Text> in London, the API runs in Docker on{" "}
              <Text style={strong}>Render</Text>, and the site is on <Text style={strong}>Cloudflare Pages</Text> at
              econexus.org.uk. It's all free tiers, so if nobody has used it for 15 minutes the API goes to sleep and the
              first request takes a little while.
            </P>
            <P>
              So someone looking at my CV can try it without signing up, there's a demo login for each role. They reset every
              time the server starts, and they can't be edited, deleted or used to reach real accounts.
            </P>
            <P>
              The demo area is Newcastle. It has 34 real recycling points downloaded from OpenStreetMap, plus a few months
              of made up scans from 25 fake residents so the dashboards have something to show.
            </P>
          </Entry>

          <Entry date="same week" title="Redesigning it">
            <P>
              The original look was plain, and the dashboards were hard to read: a pie chart with 16 slices, and an
              "environmental impact" box that said things like 0.9500000000000001 kg. Before changing any code I mocked up
              four directions for the home page:
            </P>
            <View style={{ marginTop: 20, transform: [{ rotate: wide ? "-0.6deg" : "0deg" }] }}>
              <Framed source={IMG.directions} ratio={1.6} label="Four home page mockups: a light friendly one, a civic map one, a bold playful one, and a dark green one" />
              <View style={{ position: "absolute", top: -12, left: "45%", width: 90, height: 24, backgroundColor: theme.accent, opacity: 0.55, transform: [{ rotate: "3deg" }] }} />
            </View>
            <Text style={{ fontFamily: FONT.hand, fontSize: 26, color: theme.text_muted, marginTop: 10, textAlign: "right" }}>
              went with bottom right ↗
            </Text>
            <P>
              I picked the dark green one but kept our original wording, like "Ready to be green?". Then I did the same for
              every page:
            </P>
            <BeforeAfter before={IMG.homeBefore} after={IMG.homeAfter} note="Home: the big arrow pointing at the menu became a phone showing a real scan from the demo." />
            <BeforeAfter before={IMG.dashboardBefore} after={IMG.dashboardAfter} note="Resident dashboard: ranked bars instead of the pie chart, and a sentence at the top saying how your week went." />
            <BeforeAfter before={IMG.councilBefore} after={IMG.councilAfter} note="Council dashboard: what people bring, which points are busiest, and a little map of where it happens." />
            <BeforeAfter before={IMG.scanBefore} after={IMG.scanAfter} note="Scan page: one-tap example barcodes, so you can try it without a product in your hand." />
          </Entry>

          <Entry date="same week" title="Things that broke once it was live">
            <P>Using it on the real site turned up bugs I hadn't seen locally:</P>
            <Bullets items={[
              <Text><Text style={strong}>Every font was Times New Roman.</Text> Expo keeps font files inside a node_modules folder, and Cloudflare Pages doesn't upload those. I moved the fonts into the app's own assets.</Text>,
              "Clicking a recycling point showed placeholder text like \"FIXME no postcode backend\" to everyone.",
              "The admin's dashboard button opened the resident dashboard, which then errored.",
              "Clicking a point on the guest map white-screened the whole page, because the guest map and the council map describe materials differently.",
            ]} />
            <View style={{ marginTop: 20, maxWidth: 620 }}>
              <Shot source={IMG.bugFonts} ratio={1200 / 571} label="spot the serif" tilt={-2} />
            </View>
          </Entry>

          <Entry date="same week" title="Log in, sign up and the admin page">
            <P>
              The old login had a 2FA box that accepted any six digits, so it wasn't protecting anything. I took it out
              rather than pretend. Log in and sign up are one page now, with the demo logins right there.
            </P>
            <BeforeAfter before={IMG.loginBefore} after={IMG.loginAfter} />
            <P>The admin page was one table. Now it shows how the app is doing, and who's waiting to be approved.</P>
            <BeforeAfter before={IMG.adminBefore} after={IMG.adminAfter} beforeRatio={1200 / 645} />
          </Entry>

          <Entry date="next" title="What I'd still like to do" last>
            <Bullets items={[
              "swap the made up impact numbers for real ones, based on the materials you actually recycled",
              "let admins reject councils, not just approve them",
              "store postcodes and descriptions for recycling points (the backend has never had them)",
            ]} />
          </Entry>
        </View>

        {/* A few real commit messages, to show how the work was split up */}
        <View style={{ marginTop: 56, padding: wide ? 28 : 20, borderRadius: 20, backgroundColor: c.panel }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 22, color: theme.text }}>A few of the commits</Text>
          <Text style={[body, { fontSize: 15, marginTop: 4 }]}>
            Small branches, one change per commit, merged through pull requests into dev and released from main.
          </Text>
          <View style={{ marginTop: 16, gap: 8 }}>
            {COMMITS.map((commit) => (
              <Text key={commit} style={{ fontFamily: Platform.OS === "web" ? "ui-monospace, Menlo, Consolas, monospace" : "monospace", fontSize: wide ? 14 : 12, lineHeight: 20, color: theme.text }}>
                <Text style={{ color: theme.accent }}>{commit.split(":")[0]}:</Text>{commit.slice(commit.indexOf(":") + 1)}
              </Text>
            ))}
          </View>
          <Pressable onPress={() => Linking.openURL("https://github.com/k1k12/EcoNexus/commits/main")} accessibilityRole="link" style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontFamily: FONT.semiBold, fontSize: 16, color: theme.accent, textDecorationLine: "underline" }}>See the full history on GitHub</Text>
            <Svg width={16} height={16} viewBox="0 0 16 16"><Path d="M4 12 L12 4 M6 4 H12 V10" fill="none" stroke={theme.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </Pressable>
        </View>

        <View style={{ marginTop: 40 }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 22, color: theme.text }}>Team 30</Text>
          <P style={{ marginTop: 6 }}>Everyone who built the original coursework:</P>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {TEAM.map(([name, github]) => (
              <Pressable
                key={github}
                onPress={() => Linking.openURL(`https://github.com/${github}`)}
                accessibilityRole="link"
                accessibilityLabel={`${name} on GitHub`}
                style={({ hovered }: any) => ({ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: hovered ? theme.accent : c.border })}
              >
                <Text style={{ fontFamily: FONT.medium, fontSize: 15, color: theme.text }}>{name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default Contributions
