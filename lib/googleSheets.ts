import { JWT } from "google-auth-library";

// Read-only access to a single sheet tab via a Google service account - used
// by the nightly sync cron, never by anything the browser can reach.
export async function fetchSheetRows(spreadsheetId: string, range: string): Promise<Record<string, unknown>[]> {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error("GOOGLE_SHEETS_CLIENT_EMAIL / GOOGLE_SHEETS_PRIVATE_KEY are not configured.");
  }

  const auth = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const { token } = await auth.getAccessToken();

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Google Sheets API error ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as { values?: string[][] };
  const values = body.values ?? [];
  if (values.length < 2) return [];

  const [header, ...dataRows] = values;
  return dataRows
    .filter((row) => row.some((cell) => cell !== undefined && cell !== ""))
    .map((row) => {
      const record: Record<string, unknown> = {};
      header.forEach((key, index) => {
        record[key] = row[index] ?? "";
      });
      return record;
    });
}
