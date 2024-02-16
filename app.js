import express from 'express';
import { router as attendanceRoutes } from './routes/attendanceRoutes.js';

const app = express();
const port = 3000;

app.use(express.json());

app.use('/api/attendance', attendanceRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
