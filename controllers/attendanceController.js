import attendanceDao from '../dao/attendanceDao.js';
import { redisClient } from '../db.js';
import { isValidISO8601DateFormat, isValidUTCFormat } from '../utils/dateValidation.js';

export const recordCheckin = async (req, res) => {
    try {
        const { instructor_id, checkin_time } = req.body;
        if (!instructor_id || !checkin_time) {
            return res.status(400).json({ error: "Invalid request. All fields are compulsory" });
        }

        if (!isValidUTCFormat(checkin_time)) {
            return res.status(400).json({ error: "Invalid request. Enter the time in correct format" });
        }

        const [lastCheckin, lastCheckout] = await redisClient.hmget(`instructor:${instructor_id}`, 'lastCheckin', 'lastCheckout');

        if (lastCheckin > lastCheckout) {
            return res.status(400).json({ error: "Please checkout from your previous session first" })
        }

        if (checkin_time < lastCheckout) {
            return res.status(400).json({ error: "Invalid request. Make sure you enter correct checkin time" })
        }

        const promises = [
            attendanceDao.createCheckin({ instructorId: Number(instructor_id), checkinTime: checkin_time }),
            redisClient.hset(`instructor:${instructor_id}`, 'lastCheckin', checkin_time)
        ];

        await Promise.all(promises);
        res.status(201).json({ message: 'Check-in recorded successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const recordCheckout = async (req, res) => {
    try {
        const { instructor_id, checkout_time } = req.body;
        if (!instructor_id || !checkout_time) {
            res.status(400).json({ message: "Invalid request. All fields are compulsory" });
        }

        if (!isValidUTCFormat(checkout_time)) {
            return res.status(400).json({ error: "Invalid request. Enter the time in correct format" });
        }

        const [lastCheckin, lastCheckout] = await redisClient.hmget(`instructor:${instructor_id}`, 'lastCheckin', 'lastCheckout');

        if (lastCheckin < lastCheckout) {
            return res.status(400).json({ error: "You have already checked out from your last session" });
        }

        if (checkout_time < lastCheckin) {
            return res.status(400).json({ error: "Invalid request. Make sure you enter correct checkout time" });
        }

        const promises = [
            attendanceDao.createCheckout({ instructorId: Number(instructor_id), checkoutTime: checkout_time }),
            redisClient.hset(`instructor:${instructor_id}`, 'lastCheckout', checkout_time)
        ];

        await Promise.all(promises);
        res.status(201).json({ message: 'Check-out recorded successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getMonthlyReport = async (req, res) => {
    try {
        const { month, year } = req.query;
        if (!month || !year) {
            res.status(400).json({ message: "Invalid request. All fields are compulsory" });
        }
        const report = await attendanceDao.getMonthlyReport(month, year);
        res.json(report.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const setDailyTimeForAll = async (req, res) => {
    try {
        const { date } = req.body;
        if (!date) {
            res.status(400).json({ message: "Invalid request. All fields are compulsory" });
        }
        if (!isValidISO8601DateFormat(date)) {
            return res.status(400).json({ error: "Invalid request. Enter the date in correct format" });
        }

        // Get check-in and check-out times for all instructors on the specified date
        const instructorsData = await attendanceDao.getInstructorsCheckInOutForDate(date);

        // Calculate and set daily time for each instructor
        const setDailyTimePromises = [];
        const instructorDailyTimeMap = new Map();

        instructorsData.forEach((instructor) => {
            const { instructor_id, checkin_time, checkout_time } = instructor;

            if (checkin_time && checkout_time) {
                const durationMinutes = calculateDuration(checkin_time, checkout_time);

                // Store the calculated duration in a map
                if (instructorDailyTimeMap.has(instructor_id)) {
                    instructorDailyTimeMap.set(instructor_id, instructorDailyTimeMap.get(instructor_id) + durationMinutes);
                } else {
                    instructorDailyTimeMap.set(instructor_id, durationMinutes);
                }
            }
        });

        // Set daily time in the database for each instructor
        instructorDailyTimeMap.forEach((durationMinutes, instructor_id) => {
            setDailyTimePromises.push(attendanceDao.setDailyTime(instructor_id, date, durationMinutes));
        });

        await Promise.all(setDailyTimePromises);

        res.status(200).json({ message: 'Daily time set for all instructors.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const calculateDuration = (checkinTime, checkoutTime) => {
    const checkinTimestamp = new Date(checkinTime).getTime();
    const checkoutTimestamp = new Date(checkoutTime).getTime();

    const durationMilliseconds = checkoutTimestamp - checkinTimestamp;
    const durationMinutes = Math.floor(durationMilliseconds / (1000 * 60));

    return durationMinutes;
};