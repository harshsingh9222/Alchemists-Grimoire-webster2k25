import express from 'express';
import { verifyJWT } from '../Middlewares/auth.middleware.js';
import {
	getNotificationsForDate,
	markNotificationsRead,
	acknowledgeNotification,
	convertDoseLogToNotification
} from '../Controllers/notification.Controller.js';

const router = express.Router();

router.get('/', verifyJWT, getNotificationsForDate);

// Mark a batch of notifications as read (body: { ids: [..] })
router.post('/mark-read', verifyJWT, markNotificationsRead);

// Acknowledge a single notification (body: { id })
router.post('/ack', verifyJWT, acknowledgeNotification);

// Convert a doseLog into a notification (body: { doseLogId })
router.post('/convert', verifyJWT, convertDoseLogToNotification);

export default router;
