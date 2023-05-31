import express from 'express';
import {
	createChat,
	getUserChats,
	getChatMessages,
	sendMessage,
	updateChat,
	deleteChat,
	getAllChats,
	blockChat,
	unblockChat,
	deleteMessage,
	reportChat,
	getChatLastMessage,
	updateMessage,
} from '../controllers/chatControllers.js';
import { protect } from '../middlewares/authMiddlewar.js';

const router = express.Router();

//Get all Chats
router.get('/', protect, getAllChats);

//create a new chat
router.post('/create', protect, createChat);

//Get all chats for a user
router.get('/:userId', protect, getUserChats);

//Block  a chat
router.post('/block/:chatId', protect, blockChat);

//Unblock  a chat
router.post('/unblock/:chatId', protect, unblockChat);

//Update a chat
router.put('/update/:chatId', protect, updateChat);

//Delete a chat
router.delete('/delete/:chatId', protect, deleteChat);

//report a chat
router.post('/report/:chatId', protect, reportChat);

//Get chat messages:
router.get('/messages/:chatId', protect, getChatMessages);

//Get chat last message:
router.get('/messages/last/:chatId', protect, getChatLastMessage);

//Send a message in a chat
router.post('/messages/send/:chatId', protect, sendMessage);

//delete a message
router.delete('/messages/delete/:chatId', protect, deleteMessage);
//update a message
router.put('/messages/update/:chatId', protect, updateMessage);

export default router;
