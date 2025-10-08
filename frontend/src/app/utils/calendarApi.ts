import ApiClient from './apiClient';

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

export interface CalendarEventsResponse {
    success: boolean;
    events: CalendarEvent[];
    count: number;
    message?: string;
    requiresReauth?: boolean;
}

export interface SyncResponse {
    success: boolean;
    synced: number;
    message: string;
    requiresReauth?: boolean;
}

export async function getCalendarEvents(days: number = 30): Promise<CalendarEvent[]> {
    try {
        const response = await ApiClient.get<CalendarEventsResponse>(`/calendar/events?days=${days}`);

        if (response.error) {
            throw new Error(response.error);
        }

        if (response.data?.requiresReauth) {
            throw new Error(response.data.message || 'Please re-authenticate with Google');
        }

        return response.data?.events || [];
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
    }
}

export async function getCalendarEventsFromDB(days: number = 30): Promise<CalendarEvent[]> {
    try {
        const response = await ApiClient.get<CalendarEventsResponse>(`/calendar/events/db?days=${days}`);

        if (response.error) {
            throw new Error(response.error);
        }

        return response.data?.events || [];
    } catch (error) {
        console.error('Error fetching calendar events from database:', error);
        throw error;
    }
}

export async function syncCalendarEvents(): Promise<SyncResponse> {
    try {
        const response = await ApiClient.post<SyncResponse>(`/calendar/sync`);

        if (response.error) {
            throw new Error(response.error);
        }

        if (response.data?.requiresReauth) {
            throw new Error(response.data.message || 'Please re-authenticate with Google');
        }

        return response.data || { success: false, synced: 0, message: 'Unknown error' };
    } catch (error) {
        console.error('Error syncing calendar events:', error);
        throw error;
    }
}

export async function getCalendars() {
    try {
        const response = await ApiClient.get('/calendar/calendars');

        if (response.error) {
            throw new Error(response.error);
        }

        if (response.data?.requiresReauth) {
            throw new Error(response.data.message || 'Please re-authenticate with Google');
        }

        return response.data?.calendars || [];
    } catch (error) {
        console.error('Error fetching calendars:', error);
        throw error;
    }
}