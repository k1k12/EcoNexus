import { useEffect, useState } from "react"
import { View, Text, TextInput, Pressable, ScrollView, Platform, useWindowDimensions, TextInputProps } from "react-native"
import Svg, { Path } from "react-native-svg"
import { router } from "expo-router"

import { useThemeContext } from "@/context/ThemeContext"
import { usePage } from "@/context/PageContext"
import { useAuth } from "@/context/AuthContext"
import { checkValidEmail, checkValidName, checkValidPassword } from "@/utils/fieldValidators"
import SelectAreaScreen from "@/components/selectAreaScreen/SelectAreaScreen"
import LeafletContextProvider from "@/context/LeafletContext"
import { LoginPages, type RegisterFields, type UserRole } from "@/types/types"
import { FONT } from "@/constants/Fonts"
import { DEMO_ACCOUNTS, DEMO_ACCOUNTS_ENABLED } from "@/constants/DemoAccounts"
import { useDemoLogin } from "@/hooks/useDemoLogin"
import { useDashboardColours } from "@/components/dashboard/DashboardParts"

/**
 * Login / sign up page
 *
 * One page with "Log in" and "Sign up" tabs. On wide screens a panel on the left
 * says what the app is for; on phones it's just the form.
 *
 *   - Log in: email and password. The demo accounts are underneath for anyone just looking.
 *   - Sign up: resident or council, name, email, password (with the rules ticked off as you type).
 *     Residents can log in straight away. Councils pick their area on the next screen
 *     and then wait for an admin to approve them.
 *
 * Logged in users get sent to their role's page.
 */

type Tab = "login" | "signup"

const PASSWORD_RULES = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "a number", test: (p: string) => /\d/.test(p) },
  { label: "upper and lower case", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
]

const MissionLoginScreen = () => {
  const { theme } = useThemeContext()
  const c = useDashboardColours()
  const { width } = useWindowDimensions()
  const wide = width >= 900
  const { showToastNotification } = usePage()
  const { login, register, isUserLoggedIn, userData } = useAuth()
  const { logInAs, loadingRole, error: demoError } = useDemoLogin()

  const [activePage, setActivePage] = useState(LoginPages.LoginPage)
  const [tab, setTab] = useState<Tab>("login")
  const [focused, setFocused] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<RegisterFields>({
    firstname: "",
    surname: "",
    emailLogin: "",
    areaCode: "",
    password: "",
    confirmPassword: "",
    emailRegistering: "",
    userType: "USER",
  })

  useEffect(() => {
    if (!isUserLoggedIn || !userData) return
    if (userData.userRole === "USER") router.navigate("/dashboard")
    else if (userData.userRole === "COUNCIL") router.navigate("/councilDashboard")
    else if (userData.userRole === "ADMIN") router.navigate("/admin")
  }, [isUserLoggedIn, userData])

  const switchTab = (next: Tab) => {
    setTab(next)
    setForm((prev) => ({ ...prev, password: "" }))
  }

  const handleLogin = async () => {
    if (!form.emailLogin || !form.password) {
      showToastNotification("Enter your email and password.")
      return
    }
    if (!checkValidEmail(form.emailLogin)) {
      showToastNotification("That email doesn't look right.")
      return
    }
    setBusy(true)
    const result = await login(form.emailLogin, form.password)
    setBusy(false)
    showToastNotification(result.success ? "Welcome back!" : result.message)
  }

  const handleCreateAccount = async () => {
    if (!checkValidName(form.firstname) || !checkValidName(form.surname)) {
      showToastNotification("Enter your first name and surname.")
      return
    }
    if (!checkValidEmail(form.emailRegistering)) {
      showToastNotification("That email doesn't look right.")
      return
    }
    if (!checkValidPassword(form.password)) {
      showToastNotification("Your password needs 8+ characters, upper and lower case, and a number.")
      return
    }
    if (form.userType === "COUNCIL") {
      setActivePage(LoginPages.SelectArea)
      return
    }
    setBusy(true)
    const result = await register(form)
    setBusy(false)
    if (!result.success) {
      showToastNotification(result.message)
      return
    }
    showToastNotification("Account made, you can log in now.")
    setForm((prev) => ({ ...prev, emailLogin: prev.emailRegistering, password: "" }))
    setTab("login")
  }

  // Council sign up continues on the area picker, then a "waiting for approval" page
  if (activePage === LoginPages.SelectArea) {
    return Platform.OS === "web" ? (
      <LeafletContextProvider>
        <SelectAreaScreen registerData={form} setRegisterData={setForm} setPage={setActivePage} />
      </LeafletContextProvider>
    ) : (
      <SelectAreaScreen registerData={form} setRegisterData={setForm} setPage={setActivePage} />
    )
  }

  if (activePage === LoginPages.PendingApproval) {
    return (
      <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        <View style={{ width: "100%", maxWidth: 560, alignSelf: "center", padding: 36, borderRadius: 24, backgroundColor: theme.bg_secondary }}>
          <Text style={{ fontFamily: FONT.hand, fontSize: 30, color: theme.accent, transform: [{ rotate: "-2deg" }] }}>nearly there</Text>
          <Text style={{ fontFamily: FONT.bold, fontSize: 36, letterSpacing: -1, color: theme.text, marginTop: 6 }} accessibilityRole="header">
            Your council account is waiting for approval
          </Text>
          <Text style={{ fontFamily: FONT.regular, fontSize: 18, lineHeight: 27, color: theme.text_muted, marginTop: 14 }}>
            An admin checks each new council before it can add or edit recycling points. Once you're approved, log in
            with the email and password you just picked.
          </Text>
          <Text style={{ fontFamily: FONT.regular, fontSize: 18, lineHeight: 27, color: theme.text_muted, marginTop: 10 }}>
            You can still scan things and use the map without an account in the meantime.
          </Text>
          <PrimaryButton title="Back to log in" onPress={() => { setActivePage(LoginPages.LoginPage); switchTab("login") }} />
        </View>
      </ScrollView>
    )
  }

  const inputProps = (name: string): TextInputProps & { style: any } => ({
    onFocus: () => setFocused(name),
    onBlur: () => setFocused(null),
    placeholderTextColor: c.faint,
    style: {
      marginTop: 8,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: focused === name ? theme.accent : c.border,
      backgroundColor: c.panel,
      color: theme.text,
      fontFamily: FONT.regular,
      fontSize: 17,
      outlineStyle: "none",
    },
  })

  const label = { fontFamily: FONT.semiBold, fontSize: 15, color: theme.text }

  return (
    <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 32 }}>
      <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center", paddingHorizontal: wide ? 24 : 16, flexDirection: "row", flexWrap: "wrap", gap: 32 }}>

        {wide && <SidePanel tab={tab} />}

        <View style={{ flexGrow: 1, flexBasis: wide ? 400 : "100%", minWidth: 0, maxWidth: wide ? undefined : 560 }}>
          {/* Tabs */}
          <View style={{ flexDirection: "row", gap: 6, padding: 5, borderRadius: 14, backgroundColor: theme.bg_secondary, alignSelf: "flex-start" }} accessibilityRole="tablist">
            {(["login", "signup"] as Tab[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => switchTab(t)}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t }}
                style={{ paddingVertical: 9, paddingHorizontal: 18, borderRadius: 10, backgroundColor: tab === t ? theme.accent : "transparent" }}
              >
                <Text style={{ fontFamily: tab === t ? FONT.bold : FONT.semiBold, fontSize: 16, color: tab === t ? theme.on_accent : theme.text_muted }}>
                  {t === "login" ? "Log in" : "Sign up"}
                </Text>
              </Pressable>
            ))}
          </View>

          {tab === "login" ? (
            <View>
              <Text style={{ fontFamily: FONT.bold, fontSize: 34, letterSpacing: -1, color: theme.text, marginTop: 28 }} accessibilityRole="header">Log in</Text>

              <Text style={[label, { marginTop: 24 }]}>Email</Text>
              <TextInput
                {...inputProps("emailLogin")}
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                accessibilityLabel="Email"
                value={form.emailLogin}
                onChangeText={(text) => setForm({ ...form, emailLogin: text })}
                onSubmitEditing={handleLogin}
              />

              <Text style={[label, { marginTop: 18 }]}>Password</Text>
              <TextInput
                {...inputProps("password")}
                secureTextEntry
                autoComplete="current-password"
                accessibilityLabel="Password"
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
                onSubmitEditing={handleLogin}
              />

              <PrimaryButton title={busy ? "Logging in..." : "Log in"} onPress={handleLogin} disabled={busy} />

              {DEMO_ACCOUNTS_ENABLED && (
                <View style={{ marginTop: 28, padding: 20, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", borderColor: c.border }}>
                  <Text style={{ fontFamily: FONT.bold, fontSize: 17, color: theme.text }}>Just looking?</Text>
                  <Text style={{ fontFamily: FONT.regular, fontSize: 16, lineHeight: 24, color: theme.text_muted, marginTop: 4 }}>
                    Try it as a resident, a council or an admin. No sign up needed.
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {DEMO_ACCOUNTS.map((account) => (
                      <Pressable
                        key={account.role}
                        onPress={() => logInAs(account)}
                        disabled={loadingRole !== null}
                        accessibilityRole="button"
                        accessibilityLabel={`Log in as the demo ${account.role === "User" ? "resident" : account.role.toLowerCase()}`}
                        style={({ hovered }: any) => ({ paddingVertical: 9, paddingHorizontal: 16, borderRadius: 10, backgroundColor: hovered ? c.border : c.track })}
                      >
                        <Text style={{ fontFamily: FONT.semiBold, fontSize: 15, color: theme.text }}>
                          {loadingRole === account.role ? "Logging in..." : account.role === "User" ? "Resident" : account.role}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {demoError && <Text style={{ fontFamily: FONT.regular, fontSize: 14, color: theme.text_muted, marginTop: 10 }}>{demoError}</Text>}
                </View>
              )}
            </View>
          ) : (
            <View>
              <Text style={{ fontFamily: FONT.bold, fontSize: 34, letterSpacing: -1, color: theme.text, marginTop: 28 }} accessibilityRole="header">Make an account</Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 }} accessibilityRole="radiogroup">
                {([
                  ["USER", "I'm a resident", "Scan what you recycle and track your week."],
                  ["COUNCIL", "I work for a council", "Pick your area next. An admin checks it first."],
                ] as [UserRole, string, string][]).map(([type, title, blurb]) => {
                  const picked = form.userType === type
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setForm({ ...form, userType: type })}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: picked }}
                      style={{ flexGrow: 1, flexBasis: wide ? 200 : "100%", padding: 16, borderRadius: 14, borderWidth: picked ? 2 : 1.5, borderColor: picked ? theme.accent : c.border, backgroundColor: picked ? c.panel : "transparent" }}
                    >
                      <Text style={{ fontFamily: FONT.bold, fontSize: 17, color: theme.text }}>{title}</Text>
                      <Text style={{ fontFamily: FONT.regular, fontSize: 14, lineHeight: 20, color: theme.text_muted, marginTop: 4 }}>{blurb}</Text>
                    </Pressable>
                  )
                })}
              </View>

              <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
                <View style={{ flex: 1 }}>
                  <Text style={label}>First name</Text>
                  <TextInput {...inputProps("firstname")} placeholder="Sam" autoComplete="given-name" accessibilityLabel="First name"
                    value={form.firstname} onChangeText={(text) => setForm({ ...form, firstname: text })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={label}>Surname</Text>
                  <TextInput {...inputProps("surname")} placeholder="Taylor" autoComplete="family-name" accessibilityLabel="Surname"
                    value={form.surname} onChangeText={(text) => setForm({ ...form, surname: text })} />
                </View>
              </View>

              <Text style={[label, { marginTop: 18 }]}>Email</Text>
              <TextInput {...inputProps("emailRegistering")} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address"
                autoComplete="email" accessibilityLabel="Email" value={form.emailRegistering}
                onChangeText={(text) => setForm({ ...form, emailRegistering: text })} />

              <Text style={[label, { marginTop: 18 }]}>Password</Text>
              <TextInput {...inputProps("newPassword")} secureTextEntry autoComplete="new-password" accessibilityLabel="Password"
                value={form.password} onChangeText={(text) => setForm({ ...form, password: text })} onSubmitEditing={handleCreateAccount} />
              <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 6, marginTop: 10 }}>
                {PASSWORD_RULES.map((rule) => {
                  const ok = rule.test(form.password)
                  return (
                    <Text key={rule.label} style={{ fontFamily: FONT.regular, fontSize: 14, color: ok ? theme.text : theme.text_muted }}>
                      <Text style={{ color: ok ? theme.accent : c.faint }}>{ok ? "✓ " : "○ "}</Text>{rule.label}
                    </Text>
                  )
                })}
              </View>

              <PrimaryButton
                title={busy ? "Making your account..." : form.userType === "COUNCIL" ? "Next: pick your area" : "Create account"}
                onPress={handleCreateAccount}
                disabled={busy}
              />
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

function PrimaryButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  const { theme } = useThemeContext()
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ hovered }: any) => ({
        marginTop: 28,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: theme.accent,
        opacity: disabled ? 0.6 : hovered ? 0.88 : 1,
      })}
    >
      <Text style={{ fontFamily: FONT.bold, fontSize: 18, color: theme.on_accent }}>{title}</Text>
    </Pressable>
  )
}

// The panel on the left on wide screens, with a line or two about the app and some doodles
function SidePanel({ tab }: { tab: Tab }) {
  const { theme } = useThemeContext()
  const login = tab === "login"
  return (
    <View style={{ flexGrow: 1, flexBasis: 440, minWidth: 0, minHeight: 520, borderRadius: 24, padding: 40, backgroundColor: theme.bg_secondary, overflow: "hidden" }}>
      <Text style={{ fontFamily: FONT.hand, fontSize: 30, color: theme.accent, transform: [{ rotate: "-2deg" }] }}>
        {login ? "welcome back" : "takes a minute"}
      </Text>
      <Text style={{ fontFamily: FONT.bold, fontSize: 52, lineHeight: 54, letterSpacing: -2, color: theme.text, marginTop: 8 }}>
        {login ? "Scan it.\nSort it.\nSee it add up." : "Know what goes\nin which bin."}
      </Text>
      <Text style={{ fontFamily: FONT.regular, fontSize: 19, lineHeight: 28, color: theme.text_muted, marginTop: 20, maxWidth: 380 }}>
        {login
          ? "Your week of recycling, what it saved, and where the nearest point is."
          : "Scan a barcode, find out what it's made of, and see where to take it. Your dashboard keeps count."}
      </Text>
      <View style={{ flex: 1 }} />
      <Svg width={300} height={164} viewBox="0 0 300 164" style={{ alignSelf: "flex-end" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Path d="M40 140 V70 q0-14 10-20 V34 h20 v16 q10 6 10 20 v70 z M40 92 h40" fill="none" stroke={theme.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M120 140 l-6-82 h52 l-6 82 z M110 52 h60" fill="none" stroke={theme.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M200 98 l40-20 l40 20 v40 l-40 18 l-40-18 z M200 98 l40 18 l40-18 M240 116 v40" fill="none" stroke={theme.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  )
}

export default MissionLoginScreen
