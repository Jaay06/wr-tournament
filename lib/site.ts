export const siteConfig = {
  name: "Rift Clash",
  title: "Rift Clash | Private Wild Rift tournament",
  description:
    "A private tournament room where friends register, settle player tiers, form balanced Wild Rift teams, and submit their rosters.",
} as const;

export function getSiteUrl() {
  const configuredUrl = process.env.APP_URL?.trim();

  try {
    return new URL(configuredUrl || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}
