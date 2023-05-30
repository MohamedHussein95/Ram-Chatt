import { config } from 'dotenv';
import asyncHandler from 'express-async-handler';
import {
	decryptMessage,
	encryptMessage,
	sendPushNotification,
} from '../helpers/helper.js';
import { Chat } from '../models/ChatModel.js';
import { Reports } from '../models/ReportsModel.js';
import { User } from '../models/UserModel.js';
config();

// get All chats
const getAllChats = asyncHandler(async (req, res) => {
	//find all chats in the db
	const chats = await Chat.find({});

	//send back the chats
	res.status(201).json(chats);
});
// Create a new chat
const createChat = asyncHandler(async (req, res) => {
	// Extract the necessary data from the request
	const { users, messages, createdAt } = req.body;
	console.log(users, messages);
	// Check if these users exist
	const usersExist = await User.find({
		_id: { $in: users },
	});

	if (usersExist.length !== users.length) {
		res.status(404);
		throw new Error("Chat cannot be created, users don't exist");
	}

	// Find a chat that only these users have
	const chatExists = await Chat.findOne({
		users: { $all: users },
	});

	if (chatExists) {
		res.status(400);
		throw new Error('Chat already exists');
	}

	// Encrypt the messages
	const encryptedMessages = messages.map((message) => ({
		sender: message.sender,
		content: encryptMessage(message.content),
		createdAt: message.createdAt,
	}));

	// Create a new chat instance
	const chat = new Chat({
		users,
		messages: encryptedMessages,
	});

	// Save the chat to the database
	await chat.save();

	// const otherUserId = users.filter((u) => u !== messages[0].sender);

	// // Find the other user by ID
	// const otherUser = await User.findById(otherUserId);

	// if (!otherUser) {
	// 	res.status(404);
	// 	throw new Error('Sending notifications failed!');
	// }

	// messages.forEach((message) => {
	// 	otherUser.notifications.push({ message: message.content });
	// });

	// await otherUser.save();
	res.status(201).json(chat);
});

// Send a message in a chat
const sendMessage = asyncHandler(async (req, res) => {
	const { chatId } = req.params;
	const { sender, content, createdAt, userName } = req.body;

	// Retrieve the chat by its ID from the database
	const chat = await Chat.findById(chatId);

	if (!chat) {
		res.status(404);
		throw new Error('Chat not found');
	}

	// Check if the user has blocked this chat
	if (chat.status.blocked && chat.status.blockedBy === sender) {
		res.status(400);
		throw new Error('You blocked this chat. Unblock them to send a message');
	}
	if (chat.status.blocked && chat.status.blockedBy !== sender) {
		res.status(400);
		throw new Error('Message not sent');
	}

	// Encrypt the message
	const encryptedMessage = encryptMessage(content);

	// Add the new message to the chat
	chat.messages.push({ sender, content: encryptedMessage, createdAt });

	// Save the chat with the updated messages to the database
	await chat.save();

	const otherUserId = chat.users.filter((u) => u !== sender);

	// Find the otherUser by ID
	const otherUser = await User.findById(otherUserId);

	if (!otherUser) {
		res.status(404);
		throw new Error('Sending notifications failed!');
	}

	const title = `${userName}`;
	const body = content;
	await sendPushNotification(otherUser.pushToken, title, body);

	res.status(201).json(chat.messages);
});

// Get all chats for a user
const getUserChats = asyncHandler(async (req, res) => {
	const userId = req.params.userId;

	// Retrieve all chats for the user from the database
	const chats = await Chat.find({ users: { $in: [userId] } })
		.populate({
			path: 'users',
			match: { _id: { $ne: userId } }, // Specify the condition for other users
			select: 'fullName avatar profileData introSong userName email', // Specify the fields you want to populate
		})
		.exec();

	res.json(chats);
});

// Get chat messages
const getChatMessages = asyncHandler(async (req, res) => {
	const chatId = req.params.chatId;

	// Retrieve the chat by its ID from the database and populate the 'sender' field in the 'messages' array
	const chat = await Chat.findById(chatId).populate({
		path: 'messages.sender',
		select: 'lastName avatar',
	});

	if (!chat) {
		res.status(404);
		throw new Error('Chat not found');
	}

	let decryptedMessages = [];
	chat.messages = await Promise.all(
		chat.messages.map(async (message) => {
			const decryptedContent = await decryptMessage(message.content);

			decryptedMessages.push({
				_id: message?._id,
				text: decryptedContent,
				createdAt: message?.createdAt,
				user: {
					_id: message?.sender._id,
					name: message?.sender.lastName,
					avatar: message?.sender.avatar,
				},
			});
		})
	);

	res.json(decryptedMessages);
});

//get last message

const getChatLastMessage = asyncHandler(async (req, res) => {
	const chatId = req.params.chatId;

	// Retrieve the chat by its ID from the database
	const chat = await Chat.findById(chatId);

	if (!chat) {
		res.status(404);
		throw new Error('Chat not found');
	}
	let decryptedLastMessage;

	//console.log(chat.messages[chat.messages.length - 1].content);

	decryptedLastMessage = await decryptMessage(
		chat.messages[chat.messages.length - 1].content
	);
	// console.log(decryptMessage);
	res.json(decryptedLastMessage);
});
// Update a chat
const blockChat = asyncHandler(async (req, res) => {
	const chatId = req.params.chatId;
	const userId = req.body.userId; // Assuming the user ID is sent as `userId` in the request body

	// Retrieve the chat by its ID from the database
	const chat = await Chat.findById(chatId);
	if (!chat) {
		res.status(404);
		throw new Error('Chat not found');
	}

	const userInChat = chat.users.includes(userId);
	if (!userInChat) {
		res.status(401);
		throw new Error('Not authorized, you are not part of this chat');
	}

	chat.status.blocked = true;
	chat.status.blockedBy = userId;

	await chat.save();

	res.send('You blocked this user!');
});
//Unblock User
const unblockChat = asyncHandler(async (req, res) => {
	const chatId = req.params.chatId;
	const userId = req.body.userId; // Assuming the user ID is sent as `userId` in the request body

	// Retrieve the chat by its ID from the database
	const chat = await Chat.findById(chatId);
	if (!chat) {
		res.status(404);
		throw new Error('Chat not found');
	}

	const userInChat = chat.users.includes(userId);
	if (!userInChat) {
		res.status(401);
		throw new Error('Not authorized, you are not part of this chat');
	}

	if (chat.status.blockedBy === userId) {
		chat.status.blocked = false;
		chat.status.blockedBy = null;

		await chat.save();

		res.send('You unblocked this user!');
	} else {
		res.status(401);
		throw new Error('Not authorized!');
	}
});

//Delete Message
const deleteMessage = asyncHandler(async (req, res) => {
	const chatId = req.params.chatId;
	const userId = req.body.userId;
	const message = req.body.message; // Assuming the user ID is sent as `userId` in the request body

	// Retrieve the chat by its ID from the database
	const chat = await Chat.findById(chatId);
	if (!chat) {
		res.status(404);
		throw new Error('Chat not found');
	}

	const userInChat = chat.users.includes(userId);
	if (!userInChat) {
		res.status(401);
		throw new Error('Not authorized, you are not part of this chat');
	}

	const messageContent = chat.messages.find((m) => m.content === message);

	if (!messageContent) {
		res.status(404);
		throw new Error('Message not found!');
	}

	if (!messageContent.sender.equals(userId)) {
		console.log(messageContent.sender);
		res.status(401);
		throw new Error("You can't delete this message!");
	}

	messageContent.content = 'message deleted';

	await chat.save();

	res.send('message deleted!');
});

//Delete Message
const reportChat = asyncHandler(async (req, res) => {
	const chatId = req.params.chatId;
	const reporter = req.body.reporter;
	const reportee = req.body.reportee;

	//console.log(req.user);

	// Check if the request user ID matches the target user ID
	if (reportee === req.user.id) {
		res.status(400);
		throw new Error("you can't report your self!");
	}
	// Check if the user is authorized to report
	if (reporter !== req.user.id) {
		res.status(401);
		throw new Error(
			"You are no't authorized to report this user,Please login again!"
		);
	}

	// Retrieve the chat by its ID from the database
	const chat = await Chat.findById(chatId);
	if (!chat) {
		res.status(404);
		throw new Error('Chat not found');
	}

	// Check if user exists
	const userExists = await User.findById(reportee);
	if (!userExists) {
		res.status(404);
		throw new Error('No user found!');
	}
	const userInChat = chat.users.includes(reportee);
	if (!userInChat) {
		res.status(401);
		throw new Error(
			"you can't report this user,you don't have a chat together!"
		);
	}

	const messages = chat.messages
		.sort((a, b) => b.timestamp - a.timestamp) // Sort messages in descending order based on timestamp
		.slice(0, 5); // Get the first 5 messages

	const reportedUser = await Reports.findOne({ user: reportee });

	if (reportedUser) {
		reportedUser.reportedFrom.push({
			chatId,
			recentMessages: messages,
		});

		reportedUser.save();
		return res.send('user reported!');
	}
	await Reports.create({
		user: reportee,
		reportedFrom: {
			chatId,
			recentMessages: messages,
		},
	});

	res.send('user reported!');
});

// Update a chat
const updateChat = asyncHandler(async (req, res) => {
	const chatId = req.params.chatId;
	const { users, messages } = req.body;

	// Retrieve the chat by its ID from the database
	const chat = await Chat.findById(chatId);

	if (!chat) {
		res.status(404);
		throw new Error('Chat not found');
	}

	// Update the chat's users and messages
	chat.users = users.map((participant) => participant);
	chat.messages = messages.map((message) => ({
		sender: message.sender,
		content: message.content,
	}));

	// Save the updated chat to the database
	await chat.save();

	res.json(chat);
});

// Delete a chat
const deleteChat = asyncHandler(async (req, res) => {
	const chatId = req.params.chatId;

	// Find the chat by its ID and remove it from the database
	await Chat.findByIdAndDelete(chatId);

	res.json({ message: 'Chat deleted' });
});

export {
	blockChat,
	createChat,
	deleteChat,
	deleteMessage,
	getAllChats,
	getChatMessages,
	getUserChats,
	reportChat,
	sendMessage,
	unblockChat,
	updateChat,
	getChatLastMessage,
};
