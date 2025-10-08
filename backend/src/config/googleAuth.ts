import { google } from 'googleapis';

export const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export const GOOGLE_SCOPES = [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/calendar',
];