const ROOT_URL = "https://base1-indol.vercel.app"
/**
 * MiniApp configuration object. Must follow the mini app manifest specification.
 *
 * @see {@link https://docs.base.org/mini-apps/features/manifest}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "eyJmaWQiOjExMzg2NzYsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhFODFmMDNDQjY0MjNEOTIzMzE4RjJhQzFlZDUwMjJEZGJFRDhCY0I1In0",
    payload: "eyJkb21haW4iOiJiYXNlMS1pbmRvbC52ZXJjZWwuYXBwIn0",
    signature: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABCOuwp7WXWvozORkdLYcOCG2bE_AluViU6yDP56GwZyRCBeZwUGO9WLE73ynmkUnu2XUBgmbatW-5Mxb5FNTy7gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAl8ZgIay2xclZzG8RWZzuWvO8j9R0fus3XxDee9lRlVy8dAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD3eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiSi1MTlNHRjdpdkoyejZyUGU3VTJyLUNSSnBGUjcweXU5NVJVdS1yOHg1SSIsIm9yaWdpbiI6Imh0dHBzOi8va2V5cy5jb2luYmFzZS5jb20iLCJjcm9zc09yaWdpbiI6ZmFsc2UsIm90aGVyX2tleXNfY2FuX2JlX2FkZGVkX2hlcmUiOiJkbyBub3QgY29tcGFyZSBjbGllbnREYXRhSlNPTiBhZ2FpbnN0IGEgdGVtcGxhdGUuIFNlZSBodHRwczovL2dvby5nbC95YWJQZXgifQAAAAAAAAAAAA"
  },
  baseBuilder: {
    ownerAddress: "0xBa10d1C045Fca9470AC81755062A97df524C2569",
  },
  miniapp: {
    version: "1",
    name: "noFlake",
    subtitle: "Host and join no-flake events",
    description: "Host free or stake-backed events on Base. Collect RSVP details and boost real commitment.",
    screenshotUrls: [],
    iconUrl: `${ROOT_URL}/icon.png`,
    splashImageUrl: `${ROOT_URL}/splash.png`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "utility",
    tags: ["farcaster", "base", "blockchain", "events", "staking"],
    heroImageUrl: `${ROOT_URL}/hero.png`,
    tagline: "Host no-flake events",
    ogTitle: "noFlake events on Base",
    ogDescription: "Host free or stake-backed events on Base. Collect RSVP details and boost commitment.",
    ogImageUrl: `${ROOT_URL}/hero.png`,
  },
} as const;
