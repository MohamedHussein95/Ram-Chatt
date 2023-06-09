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
		origin: '*',
	},
});

app.use(express.json({ extended: false, limit: '4mb' })); // Parse JSON request bodies with a limit of 4MB
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies

app.use(
	cors({
		origin: '*',
	})
); // Enable Cross-Origin Resource Sharing (CORS)
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
		socket.emit('new-message', chatId, sId);
	});
	// Handle the typing event
	socket.on('istyping', (chatId, senderId) => {
		socket.broadcast.emit('istyping', chatId, senderId);
	});

	// Handle posts
	socket.on('add-post', (res) => {
		socket.broadcast.emit('add-post', res);
		socket.emit('add-post', res);
	});
	// Handle liked and dislike posts
	socket.on('liked', (res) => {
		socket.broadcast.emit('liked', res);
		socket.emit('liked', res);
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
	socket.on('new-chat', (sid, uid) => {
		socket.broadcast.emit('new-chat', sid, uid);
		socket.emit('new-chat', sid, uid);
	});
	// Handle new messages
	socket.on('new-message', (uid, cid, message) => {
		socket.broadcast.emit('new-message', uid, cid, message);
	});
	//handle viewed messages
	socket.on('message-viewed', (id, uid) => {
		socket.broadcast.emit('message-viewed', id, uid);
		socket.emit('message-viewed', id, uid);
	});
	// Handle typing
	socket.on('typing', (id) => {
		socket.broadcast.emit('typing', id);
	});
	socket.on('not-typing', (id) => {
		socket.broadcast.emit('not-typing', id);
	});
	// Handle online user
	socket.on('user-active', (id) => {
		socket.broadcast.emit('user-active', id);
	});
	// Handle offline user
	socket.on('user-inactive', (id) => {
		socket.broadcast.emit('user-inactive', id);
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
