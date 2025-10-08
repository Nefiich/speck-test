import { google } from 'googleapis';
import GoogleToken from '../models/GoogleToken';
import EncryptionService from './EncryptionService';

export interface CalendarEvent {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    location?: string;
    attendees?: Array<{
        email: string;
        displayName?: string;
        responseStatus?: string;
    }>;
    htmlLink: string;
    status: string;
    created: string;
    updated: string;
}

class CalendarService {
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
            throw new Error('Token decryption failed. Re-authenticate with google to refresh your tokens.');
        }

        // If needed refresh tokens..
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

    static async getEvents(userId: bigint, daysAhead: number = 30): Promise<CalendarEvent[]> {
        try {
            const auth = await this.getAuthenticatedClient(userId);
            const calendar = google.calendar({ version: 'v3', auth });

            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + daysAhead);

            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: now.toISOString(),
                timeMax: futureDate.toISOString(),
                maxResults: 50,
                singleEvents: true,
                orderBy: 'startTime',
            });

            const events = response.data.items || [];

            return events.map((event: any): CalendarEvent => ({
                id: event.id,
                summary: event.summary || 'No Title',
                description: event.description,
                start: {
                    dateTime: event.start?.dateTime,
                    date: event.start?.date,
                    timeZone: event.start?.timeZone,
                },
                end: {
                    dateTime: event.end?.dateTime,
                    date: event.end?.date,
                    timeZone: event.end?.timeZone,
                },
                location: event.location,
                attendees: event.attendees?.map((attendee: any) => ({
                    email: attendee.email,
                    displayName: attendee.displayName,
                    responseStatus: attendee.responseStatus,
                })),
                htmlLink: event.htmlLink,
                status: event.status,
                created: event.created,
                updated: event.updated,
            }));
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            throw new Error('Failed to fetch calendar events');
        }
    }

    static async createEvent(userId: bigint, eventData: {
        summary: string;
        description?: string;
        start: {
            dateTime?: string;
            date?: string;
            timeZone?: string;
        };
        end: {
            dateTime?: string;
            date?: string;
            timeZone?: string;
        };
        location?: string;
    }): Promise<CalendarEvent> {
        try {
            const auth = await this.getAuthenticatedClient(userId);
            const calendar = google.calendar({ version: 'v3', auth });

            const response = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: eventData,
            });

            const event = response.data;

            if (!event) {
                throw new Error('Failed to create event');
            }

            // Save to database
            const Event = (await import('../models/Event')).default;
            await Event.saveOrUpdate({
                userId: userId,
                googleEventId: event.id!,
                name: event.summary || 'No Title',
                startDatetime: event.start?.dateTime ? new Date(event.start.dateTime) : 
                              event.start?.date ? new Date(event.start.date) : undefined,
                endDatetime: event.end?.dateTime ? new Date(event.end.dateTime) : 
                            event.end?.date ? new Date(event.end.date) : undefined,
            });

            return {
                id: event.id!,
                summary: event.summary || 'No Title',
                description: event.description,
                start: {
                    dateTime: event.start?.dateTime,
                    date: event.start?.date,
                    timeZone: event.start?.timeZone,
                },
                end: {
                    dateTime: event.end?.dateTime,
                    date: event.end?.date,
                    timeZone: event.end?.timeZone,
                },
                location: event.location,
                attendees: event.attendees?.map((attendee: any) => ({
                    email: attendee.email,
                    displayName: attendee.displayName,
                    responseStatus: attendee.responseStatus,
                })),
                htmlLink: event.htmlLink!,
                status: event.status!,
                created: event.created!,
                updated: event.updated!,
            };
        } catch (error) {
            console.error('Error creating calendar event:', error);
            throw new Error('Failed to create calendar event');
        }
    }



    static async getCalendars(userId: bigint) {
        try {
            const auth = await this.getAuthenticatedClient(userId);
            const calendar = google.calendar({ version: 'v3', auth });

            const response = await calendar.calendarList.list();
            return response.data.items || [];
        } catch (error) {
            console.error('Error fetching calendars:', error);
            throw new Error('Failed to fetch calendars');
        }
    }
}

export default CalendarService;