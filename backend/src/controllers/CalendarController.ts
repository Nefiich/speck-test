import { Request, Response } from 'express';
import CalendarService from '../services/CalendarService';

export async function getEvents(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userId = BigInt(req.user.userId);
        const daysAhead = parseInt(req.query.days as string) || 30;

        const events = await CalendarService.getEvents(userId, daysAhead);

        return res.json({
            success: true,
            events,
            count: events.length
        });
    } catch (error) {
        console.error('Error in getEvents controller:', error);

        if (error instanceof Error &&
            (error.message.includes('Token decryption failed') ||
                error.message.includes('Legacy encrypted data') ||
                error.message.includes('re-authenticate'))) {
            return res.status(401).json({
                success: false,
                message: error.message,
                requiresReauth: true
            });
        }

        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch calendar events'
        });
    }
}

export async function getCalendars(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userId = BigInt(req.user.userId);
        const calendars = await CalendarService.getCalendars(userId);

        return res.json({
            success: true,
            calendars
        });
    } catch (error) {
        console.error('Error in getCalendars controller:', error);

        if (error instanceof Error &&
            (error.message.includes('Token decryption failed') ||
                error.message.includes('Legacy encrypted data') ||
                error.message.includes('re-authenticate'))) {
            return res.status(401).json({
                success: false,
                message: error.message,
                requiresReauth: true
            });
        }

        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to fetch calendars'
        });
    }
}