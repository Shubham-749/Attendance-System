import express from 'express';
import { recordCheckin, recordCheckout, getMonthlyReport, setDailyTimeForAll } from '../controllers/attendanceController.js';

const router = express.Router();

router.post('/checkin', recordCheckin);
router.post('/checkout', recordCheckout);
router.get('/monthly_report', getMonthlyReport);

/* This cron job will daily calculate and store checked_in time for each user in a table.
We can use that table for not just getting monthly report but also provides us a convenient option for 
getting daily/weekly analysis when required */
router.post('/set_daily_time', setDailyTimeForAll);

export { router };
