import "server-only";
import { google } from "googleapis";
import { requireEnv } from "@/lib/services/errors";

export interface CallSheetRow {
  timestamp: string;
  callerName: string;
  phone: string;
  email?: string;
  leadScore?: number;
  summary?: string;
  appointment?: string;
  durationSeconds?: number;
  recordingUrl?: string;
}

export interface CalendarEventInput {
  summary: string;
  startISO: string;
  endISO: string;
  attendeeEmail?: string;
  description?: string;
}

/**
 * Builds an OAuth2 client authorized with a pre-obtained access token.
 *
 * NOTE on token lifecycle: this deliberately takes a bare `accessToken`
 * string rather than managing refresh itself. Google access tokens expire
 * (~1 hour); storing/refreshing the org's refresh token and minting a
 * fresh access token before calling these functions is the responsibility
 * of the integrations OAuth flow (a separate concern — see
 * `Integration.config` in the Prisma schema, which is where the
 * access/refresh tokens should live once that flow exists). Calling code
 * here should not be trusted to silently refresh; if the token has
 * expired, the Google API call below will fail with a 401 and the caller
 * should surface that to the integrations UI to reconnect.
 */
function getOAuthClient(accessToken: string) {
  requireEnv("GOOGLE_CLIENT_ID", "Google");
  requireEnv("GOOGLE_CLIENT_SECRET", "Google");
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

/**
 * Appends one row summarizing a completed call to the org's connected
 * Google Sheet (Sheets API `spreadsheets.values.append`).
 */
export async function appendCallRowToSheet(
  spreadsheetId: string,
  row: CallSheetRow,
  accessToken: string,
): Promise<void> {
  const auth = getOAuthClient(accessToken);
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1!A1",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          row.timestamp,
          row.callerName,
          row.phone,
          row.email ?? "",
          row.leadScore ?? "",
          row.summary ?? "",
          row.appointment ?? "",
          row.durationSeconds ?? "",
          row.recordingUrl ?? "",
        ],
      ],
    },
  });
}

/**
 * Creates a Google Calendar event for a booked appointment (Calendar API
 * `events.insert`).
 */
export async function createCalendarEvent(
  calendarId: string,
  event: CalendarEventInput,
  accessToken: string,
): Promise<{ eventId: string | null; htmlLink: string | null }> {
  const auth = getOAuthClient(accessToken);
  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.startISO },
      end: { dateTime: event.endISO },
      attendees: event.attendeeEmail
        ? [{ email: event.attendeeEmail }]
        : undefined,
    },
  });

  return {
    eventId: response.data.id ?? null,
    htmlLink: response.data.htmlLink ?? null,
  };
}
