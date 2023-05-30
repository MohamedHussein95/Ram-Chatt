export const ioServer = (io) => {
	io.on('connection', (socket) => {
		console.log(`⚡: ${socket.id} user just connected!`);

		socket.on('send-message', (message, id) => {
			console.log(message, id);
		});
		socket.emit('Hello from the server');

		socket.on('disconnect', () => {
			socket.disconnect();
			console.log('🔥: A user disconnected');
		});
	});
};
