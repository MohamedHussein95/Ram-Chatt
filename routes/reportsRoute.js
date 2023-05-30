import express from 'express';
import { Reports } from '../models/ReportsModel.js';

const router = express.Router();

//Get all reports
router.get('/', async (req, res) => {
	const reports = await Reports.find({});

	res.json(reports);
});
//delete all reports
router.delete('/delete', async (req, res) => {
	const deletedReports = await Reports.deleteMany();
	res.json(deletedReports);
});

export default router;
