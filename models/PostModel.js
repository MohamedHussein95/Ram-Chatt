import moment from 'moment';
import mongoose from 'mongoose';
// Define the Post schema
const PostSchema = new mongoose.Schema(
	{
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},

		title: {
			type: String,
			required: true,
		},
		body: {
			text: {
				type: String,
			},
			image: {
				type: String,
			},
			url: {
				type: String,
			},
		},
		metaData: {
			likes: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User',
				},
			],
			dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
			comments: [
				{
					sentBy: {
						type: mongoose.Schema.Types.ObjectId,
						ref: 'User',
					},
					body: {
						type: String,
					},
					createdAt: {
						type: Date,
						default: new Date(),
					},
				},
			],
		},
	},
	{
		timestamps: true,
	}
);

// Create the Post model
const Post = mongoose.model('Post', PostSchema);

// Function to delete posts older than one week
const deletePosts = async () => {
	const oneWeekAgo = moment().subtract(7, 'days').toDate();
	try {
		const results = await Post.deleteMany({ createdAt: { $lt: oneWeekAgo } });
		console.log('Old posts deleted successfully:', results);
	} catch (error) {
		console.error('Error deleting old posts:', error);
	}
};

// Execute the deletePosts function initially
deletePosts();

// Schedule the function to run every week (7 days)
setInterval(deletePosts, 7 * 24 * 60 * 60 * 1000);

export { Post };
