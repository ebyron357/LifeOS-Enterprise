import "server-only";

export type RevenueRadarData = {
  connected: boolean;
  currentMonthGross: number;
  currentMonthNet: number;
  monthlyTarget: number;
  targetProgress: number;
  ytdNet: number;
  last30DaysNet: number;
  updatedAt: string;
  businesses: Array<{ name: string; currentMonthNet: number; ytdNet: number }>;
};

const SHEET_RANGE = "'Dashboard Feed'!A1:C17";
let cachedToken: { value: string; expiresAt: number } | undefined;

function base64Url(value: string | Buffer) { return Buffer.from(value).toString("base64url"); }

async function getAccessToken(email: string, privateKey: string) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({ iss: email, scope: "https://www.googleapis.com/auth/spreadsheets.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const unsigned = `${header}.${claims}`;
  const keyBytes = privateKey.replace(/\\n/g, "\n").replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Buffer.from(keyBytes, "base64"), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, Buffer.from(unsigned));
  const assertion = `${unsigned}.${base64Url(Buffer.from(signature))}`;
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }), cache: "no-store" });
  if (!response.ok) throw new Error(`Google OAuth returned ${response.status}`);
  const token = await response.json() as { access_token: string; expires_in: number };
  cachedToken = { value: token.access_token, expiresAt: Date.now() + token.expires_in * 1000 };
  return token.access_token;
}

function money(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number(value.replace(/[$,%]/g, "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyRevenue(): RevenueRadarData {
  return { connected: false, currentMonthGross: 0, currentMonthNet: 0, monthlyTarget: 0, targetProgress: 0, ytdNet: 0, last30DaysNet: 0, updatedAt: "", businesses: [] };
}

export async function getRevenueRadar(): Promise<RevenueRadarData> {
  const sheetId = process.env.REVENUE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!sheetId || !email || !privateKey) return emptyRevenue();
  try {
    const accessToken = await getAccessToken(email, privateKey);
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(SHEET_RANGE)}`, { headers: { authorization: `Bearer ${accessToken}` }, next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`Google Sheets API returned ${response.status}`);
    const { values = [] } = await response.json() as { values?: string[][] };
    const valueFor = (label: string) => values.find((row) => row[0] === label)?.[1];
    return {
      connected: true,
      currentMonthGross: money(valueFor("Current Month Gross")), currentMonthNet: money(valueFor("Current Month Net")), monthlyTarget: money(valueFor("Monthly Target")),
      targetProgress: money(valueFor("Target Progress")) / 100, ytdNet: money(valueFor("YTD Net")), last30DaysNet: money(valueFor("Last 30 Days Net")), updatedAt: valueFor("Updated At") ?? "",
      businesses: values.slice(12, 17).filter((row) => row[0]).map((row) => ({ name: row[0], currentMonthNet: money(row[1]), ytdNet: money(row[2]) })),
    };
  } catch { return emptyRevenue(); }
}
