import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import chatRoute from './routes/chatRoute.js';
import postRoute from './routes/postRoutes.js';
import reportRoute from './routes/reportsRoute.js';
import userRoute from './routes/userRoute.js';

dotenv.config();

await connectDB();

const app = express();
const server = http.Server(app);
const port = process.env.PORT;

const socketIO = new Server(server, {
	cors: {
		origin: ['http://localhost:19000'],
	},
});

app.use(express.json({ extended: false, limit: '4mb' })); // Parse JSON request bodies with a limit of 4MB
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies

app.use(cors()); // Enable Cross-Origin Resource Sharing (CORS)
app.use(cookieParser()); // Parse cookies in incoming requests
app.use(express.static('public')); // Serve static files from the 'public' directory
app.use('/uploads', express.static('uploads'));

app.use('/api/users', userRoute);
app.use('/api/chats', chatRoute);
app.use('/api/posts', postRoute);
app.use('/api/reports', reportRoute);

socketIO.on('connection', (socket) => {
	console.log(`⚡: ${socket.id} user just connected!`);

	socket.on('send-message', (chatId, sId) => {
		console.log(chatId);
		socket.emit('new-message', chatId, sId);
	});
	// Handle the typing event
	socket.on('istyping', (chatId, senderId) => {
		socket.broadcast.emit('istyping', chatId, senderId);
	});

	// Handle posts
	socket.on('posted', () => {
		socket.broadcast.emit('posted');
		socket.emit('posted');
	});
	// Handle liked and dislike posts
	socket.on('liked', (id) => {
		socket.broadcast.emit('liked', id);
		socket.emit('liked', id);
	});
	socket.on('disliked', (id) => {
		socket.broadcast.emit('disliked', id);
		socket.emit('disliked', id);
	});
	// Handle comments
	socket.on('add-comment', (id) => {
		socket.broadcast.emit('add-comment', id);
		socket.emit('add-comment', id);
	});
	// Handle new chats
	socket.on('new-chat', (id) => {
		socket.broadcast.emit('new-chat', id);
		socket.emit('new-chat', id);
	});
	// Handle new messages
	socket.on('new-message', (id, message) => {
		socket.broadcast.emit('new-message', id, message);
	});
	// Handle typing
	socket.on('typing', (id) => {
		socket.broadcast.emit('typing', id);
	});
	socket.on('not-typing', (id) => {
		socket.broadcast.emit('not-typing', id);
	});

	socket.on('disconnect', () => {
		socket.disconnect();
		console.log('🔥: A user disconnected');
	});
});

if (process.env.NODE_ENV === 'production') {
	const __dirname = path.resolve();

	app.use(express.static(path.join(__dirname, 'public/index.html')));

	app.get('*', (req, res) =>
		res.sendFile(path.resolve(__dirname, 'public', 'index.html'))
	);
} else {
	app.get('/', (req, res) => {
		res.status(200).send('eaSt0-auth-api Server is running'); // Respond with a simple message for the root route
	});
}

app.use(notFound); // Handle 404 Not Found errors
app.use(errorHandler); // Custom error handler for other types of errors

server.listen(port, () => console.log(`server is listening on port:${port} `)); // Start the server and listen on the specified port
