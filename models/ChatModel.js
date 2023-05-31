import moment from 'moment/moment.js';
import mongoose from 'mongoose';
// Define the Chat schema
const ChatSchema = new mongoose.Schema(
	{
		users: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		messages: [
			{
				sender: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User',
				},
				content: {
					iv: String,
					encryptedData: String,
				},
				createdAt: {
					type: Date,
					default: new Date(),
				},
				delivered: {
					type: String,
				},
				seen: {
					type: String,
					default: false,
				},
			},
		],
		status: {
			blocked: {
				type: Boolean,
				default: false,
			},
			blockedBy: String,
		},
	},
	{
		timestamps: true,
	}
);

// Create the Chat model
const Chat = mongoose.model('Chat', ChatSchema);

// Function to delete messages older than 3 days
async function deleteOldMessages() {
	const threeDaysAgo = moment().subtract(3, 'days').toDate(); // Get the date 3 days ago
	try {
		// Find and update the chats with messages older than 3 days
		const results = await Chat.updateMany(
			{ 'messages.createdAt': { $lt: threeDaysAgo } }, // Filter for messages older than 3 days
			{ $pull: { messages: { createdAt: { $lt: threeDaysAgo } } } }, // Pull the messages matching the filter
			{ timeout: 30000 } // Increased timeout to 30 seconds
		);

		console.log('Old chats deleted successfully:', results);
	} catch (error) {
		console.error('Error deleting old chats:', error);
	}
}

// Call the function to delete old messages
deleteOldMessages();

// Schedule the function to run every 3 days
setInterval(deleteOldMessages, 3 * 24 * 60 * 60 * 1000);

export { Chat };
