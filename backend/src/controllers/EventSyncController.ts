import { Request, Response } from 'express';
import EventSyncService from '../services/EventSyncService';

export async function syncEvents(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userId = BigInt(req.user.userId);
        // Remove daysAhead parameter since we now use a fixed 12-month range (6 months back, 6 months forward)

        const result = await EventSyncService.syncUserEvents(userId);

        return res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error in syncEvents controller:', error);
        
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
            message: error instanceof Error ? error.message : 'Failed to sync events'
        });
    }
}

export async function getEvents(req: Request, res: Response) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const userId = BigInt(req.user.userId);
        const daysAhead = parseInt(req.query.days as string) || 30;

        const events = await EventSyncService.getEventsFromDatabase(userId, daysAhead);

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
            message: error instanceof Error ? error.message : 'Failed to fetch events from database'
        });
    }
}