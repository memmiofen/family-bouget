module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('newExpense', (expense) => {
            io.emit('updateExpenses', expense);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};
