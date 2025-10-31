// server.js
} catch (err) {
console.error('Failed to load messages.json', err);
}


function persistMessages() {
fs.writeFile(DATA_FILE, JSON.stringify(messages, null, 2), (err) => {
if (err) console.error('Failed to persist messages:', err);
});
}


// Admin route: get history
app.get('/history', (req, res) => {
res.json(messages);
});


// Basic health
app.get('/ping', (req, res) => res.send('pong'));


io.on('connection', (socket) => {
console.log('socket connected', socket.id);


// client asks to join a room (optional)
socket.on('join', (room) => {
if (room) socket.join(room);
});


// client sends message
socket.on('chat:message', (payload) => {
// payload should contain { user, text, room? }
const msg = {
id: Date.now() + '-' + Math.random().toString(36).slice(2, 9),
user: payload.user || 'Anonymous',
text: payload.text || '',
room: payload.room || null,
ts: new Date().toISOString()
};


// store message
messages.push(msg);
// keep memory reasonable: trim to last 500 messages
if (messages.length > 500) messages = messages.slice(-500);


// persist (async)
persistMessages();


// broadcast to either room or everyone
if (msg.room) {
io.to(msg.room).emit('chat:message', msg);
// also inform admin namespace
io.to('admins').emit('chat:message', msg);
} else {
io.emit('chat:message', msg);
}
});


// Admins can join admin room by sending role=admin
socket.on('register:admin', () => {
socket.join('admins');
// Send current history
socket.emit('history', messages);
});


socket.on('disconnect', () => {
console.log('socket disconnected', socket.id);
});
});


server.listen(PORT, () => {
console.log(`Server listening on http://localhost:${PORT}`);
});
