import { google } from 'googleapis';
import GoogleToken from '../models/GoogleToken';
import Event, { EventCreateData } from '../models/Event';
import EncryptionService from './EncryptionService';

class EventSyncService {
    private static async getAuthenticatedClient(userId: bigint) {
        const googleToken = await GoogleToken.findByUserId(userId);

        if (!googleToken || !googleToken.access_token) {
            throw new Error('No Google access token found for user');
        }

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        try {
            oauth2Client.setCredentials({
                access_token: googleToken.access_token,
                refresh_token: googleToken.refresh_token ? EncryptionService.decrypt(googleToken.refresh_token) : undefined,
                expiry_date: googleToken.expiry ? googleToken.expiry.getTime() : undefined,
            });
        } catch (error) {
            throw new Error('Token decryption failed. Please re-authenticate with Google to refresh your tokens.');
        }

        oauth2Client.on('tokens', async (tokens) => {
            if (tokens.refresh_token) {
                await GoogleToken.saveOrUpdate({
                    userId: userId,
                    accessToken: tokens.access_token || undefined,
                    refreshToken: tokens.refresh_token ? EncryptionService.encrypt(tokens.refresh_token) : undefined,
                    expiryDate: tokens.expiry_date || undefined,
                });
            }
        });

        return oauth2Client;
    }

    static async syncUserEvents(userId: bigint): Promise<{ synced: number; message: string; }> {
        try {
            const auth = await this.getAuthenticatedClient(userId);
            const calendar = google.calendar({ version: 'v3', auth });

            const now = new Date();

            // 6 months back
            const pastDate = new Date();
            pastDate.setMonth(now.getMonth() - 6);

            // 6 months forward
            const futureDate = new Date();
            futureDate.setMonth(now.getMonth() + 6);

            console.log(`Syncing events for user ${userId} from ${pastDate.toISOString()} to ${futureDate.toISOString()}`);

            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: pastDate.toISOString(),
                timeMax: futureDate.toISOString(),
                maxResults: 2500,
                singleEvents: true,
                orderBy: 'startTime',
            });

            const googleEvents = response.data.items || [];
            console.log(`Found ${googleEvents.length} events from Google Calendar`);

            if (googleEvents.length === 0) {
                return { synced: 0, message: 'No events found to sync' };
            }

            const eventsToSync: EventCreateData[] = [];

            for (const googleEvent of googleEvents) {
                // Enhanced validation to ensure we have valid data
                if (!googleEvent.id || !googleEvent.summary || typeof googleEvent.summary !== 'string') {
                    console.log(`Skipping event with invalid data: id=${googleEvent.id}, summary=${googleEvent.summary}`);
                    continue;
                }

                const startDateTime = googleEvent.start?.dateTime
                    ? new Date(googleEvent.start.dateTime)
                    : googleEvent.start?.date
                        ? new Date(googleEvent.start.date + 'T00:00:00')
                        : undefined;

                const endDateTime = googleEvent.end?.dateTime
                    ? new Date(googleEvent.end.dateTime)
                    : googleEvent.end?.date
                        ? new Date(googleEvent.end.date + 'T23:59:59')
                        : undefined;

                if (!startDateTime) {
                    console.log(`Skipping event without start time: ${googleEvent.summary}`);
                    continue;
                }

                eventsToSync.push({
                    userId: userId,
                    googleEventId: googleEvent.id,
                    name: googleEvent.summary.trim(),
                    startDatetime: startDateTime,
                    endDatetime: endDateTime,
                });
            }

            if (eventsToSync.length > 0) {
                await Event.bulkInsert(eventsToSync);
            }

            return {
                synced: eventsToSync.length,
                message: `Successfully synced ${eventsToSync.length} events from Google Calendar (6 months back to 6 months forward)`
            };

        } catch (error) {
            console.error('Error syncing events:', error);
            throw new Error(`Failed to sync events: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    static async getEventsFromDatabase(userId: bigint, daysAhead: number = 30): Promise<Event[]> {
        try {
            return await Event.findByUserId(userId, daysAhead);
        } catch (error) {
            console.error('Error fetching events from database:', error);
            throw new Error('Failed to fetch events from database');
        }
    }
}

export default EventSyncService;