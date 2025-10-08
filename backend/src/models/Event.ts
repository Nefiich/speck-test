import sql from '../config/database';

export interface EventData {
    id?: bigint;
    user_id: bigint;
    google_event_id: string;
    name: string;
    start_datetime?: Date;
    end_datetime?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export interface EventCreateData {
    userId: bigint;
    googleEventId: string;
    name: string;
    startDatetime?: Date;
    endDatetime?: Date;
}

class Event {
    id?: bigint;
    user_id: bigint;
    google_event_id: string;
    name: string;
    start_datetime?: Date;
    end_datetime?: Date;
    created_at?: Date;
    updated_at?: Date;

    constructor(data: EventData) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.google_event_id = data.google_event_id;
        this.name = data.name;
        this.start_datetime = data.start_datetime;
        this.end_datetime = data.end_datetime;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    static async saveOrUpdate(data: EventCreateData): Promise<Event> {
        try {
            const result: EventData[] = await sql`
                INSERT INTO events (user_id, google_event_id, name, start_datetime, end_datetime, created_at, updated_at)
                VALUES (${data.userId.toString()}, ${data.googleEventId}, ${data.name}, ${data.startDatetime || null}, ${data.endDatetime || null}, NOW(), NOW())
                ON CONFLICT (user_id, google_event_id)
                DO UPDATE SET
                  name = EXCLUDED.name,
                  start_datetime = EXCLUDED.start_datetime,
                  end_datetime = EXCLUDED.end_datetime,
                  updated_at = NOW()
                RETURNING *
            `;

            if (result.length === 0) {
                throw new Error('Failed to save event');
            }

            return new Event(result[0]);
        } catch (error) {
            console.error('Error saving event:', error);
            throw error;
        }
    }

    static async findByUserId(userId: bigint, daysAhead: number = 30): Promise<Event[]> {
        try {
            const now = new Date();
            const futureDate = new Date();

            if (daysAhead === 1) {
                futureDate.setHours(23, 59, 59, 999);
            } else {
                futureDate.setDate(now.getDate() + daysAhead);
            }

            const result: EventData[] = await sql`
                SELECT * FROM events 
                WHERE user_id = ${userId.toString()} 
                AND start_datetime >= ${now}
                AND start_datetime <= ${futureDate}
                ORDER BY start_datetime ASC
            `;

            return result.map(data => new Event(data));
        } catch (error) {
            console.error('Error finding events by user ID:', error);
            throw error;
        }
    }

    static async deleteByUserId(userId: bigint): Promise<boolean> {
        try {
            await sql`DELETE FROM events WHERE user_id = ${userId.toString()}`;
            return true;
        } catch (error) {
            console.error('Error deleting events by user ID:', error);
            return false;
        }
    }

    static async bulkInsert(events: EventCreateData[]): Promise<void> {
        if (events.length === 0) return;

        try {
            // Use a transaction with individual inserts for better error handling and compatibility
            await sql.begin(async sql => {
                for (const event of events) {
                    // Validate data before inserting
                    if (!event.userId || !event.googleEventId || !event.name || typeof event.name !== 'string') {
                        console.log(`Skipping invalid event data:`, event);
                        continue;
                    }

                    await sql`
                        INSERT INTO events (user_id, google_event_id, name, start_datetime, end_datetime, created_at, updated_at)
                        VALUES (${event.userId.toString()}, ${event.googleEventId}, ${event.name}, ${event.startDatetime || null}, ${event.endDatetime || null}, NOW(), NOW())
                        ON CONFLICT (user_id, google_event_id)
                        DO UPDATE SET
                          name = EXCLUDED.name,
                          start_datetime = EXCLUDED.start_datetime,
                          end_datetime = EXCLUDED.end_datetime,
                          updated_at = NOW()
                    `;
                }
            });
        } catch (error) {
            console.error('Error bulk inserting events:', error);
            throw error;
        }
    }
}

export default Event;