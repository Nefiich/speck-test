import { Router } from 'express';
import * as CalendarController from '../controllers/CalendarController';
import * as EventSyncController from '../controllers/EventSyncController';
import { authenticateToken } from '../middleware/jwtAuth';

const router = Router();

// authentication
router.use(authenticateToken);

// Sync events from Google Calendar to database
router.post('/sync', EventSyncController.syncEvents);

// Get calendar events from database
router.get('/events/db', EventSyncController.getEvents);

// Get calendar events directly from Google Calendar
router.get('/events', CalendarController.getEvents);

// Get user's calendars
router.get('/calendars', CalendarController.getCalendars);

export default router;