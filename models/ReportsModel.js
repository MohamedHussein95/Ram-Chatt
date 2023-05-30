import mongoose from 'mongoose';

// Define the Reports schema
const ReportsSchema = mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
		},
		reportedFrom: [
			{
				chatId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Chat',
				},
				recentMessages: [
					{
						sender: {
							type: mongoose.Schema.Types.ObjectId,
							ref: 'User',
						},
						content: String,
					},
				],
			},
		],

		count: {
			type: Number,
			default: 0,
		},
	},
	{
		timestamps: true,
	}
);

ReportsSchema.pre('save', async function (next) {
	this.count = this.reportedFrom.length;
	next();
});

// Create the Reports model
const Reports = mongoose.model('Reports', ReportsSchema);

export { Reports };
