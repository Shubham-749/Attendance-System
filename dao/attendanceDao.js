import { pool as db } from '../db.js';

class AttendanceDao {
    constructor() {
        this.db = db;
    }

    async createCheckin({ instructorId, checkinTime }) {
        try {
            const query = `
                INSERT INTO checkinout (instructor_id, checkin_time)
                VALUES ($1, $2)
            `;
            const result = await db.query(query, [instructorId, checkinTime]);
            return result;
        } catch (error) {
            console.error('Error in createCheckin:', error);
            throw error;
        }
    }

    async createCheckout({ instructorId, checkoutTime }) {
        try {
            const query = `
                UPDATE checkinout
                SET checkout_time = $1
                WHERE instructor_id = $2 AND checkout_time IS NULL
            `;
            const result = await db.query(query, [checkoutTime, instructorId]);
            return result;
        } catch (error) {
            console.error('Error in createCheckout:', error);
            throw error;
        }
    }


    async getMonthlyReport(month, year) {
        const query = `
        SELECT instructor_id, EXTRACT(month FROM date) AS month, EXTRACT(year FROM date) AS year,
        FLOOR(SUM(duration_minutes) / 60) AS total_hours
        FROM instructor_daily_time
        WHERE
        EXTRACT(month FROM date) = $1
        AND EXTRACT(year FROM date) = $2
        GROUP BY instructor_id, EXTRACT(month FROM date), EXTRACT(year FROM date);
        `;
        return db.query(query, [month, year]);
    }

    async getInstructorsCheckInOutForDate(date) {
        try {
            const query = {
                text: `
                    SELECT instructor_id, checkin_time, checkout_time
                    FROM checkinout
                    WHERE DATE(checkin_time) = $1
                `,
                values: [date],
            };

            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error in getInstructorsCheckInOutForDate:', error);
            throw error;
        }
    }

    async setDailyTime(instructorId, date, durationMinutes) {
        try {
            const query = {
                text: `
                    INSERT INTO instructor_daily_time (instructor_id, date, duration_minutes)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (instructor_id, date) DO UPDATE
                    SET duration_minutes = EXCLUDED.duration_minutes
                `,
                values: [instructorId, date, durationMinutes],
            };

            await db.query(query);
            return true;
        } catch (error) {
            console.error('Error in setDailyTime:', error);
            throw error;
        }
    }
}

export default new AttendanceDao();
