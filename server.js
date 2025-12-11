const express = require('express');
const session = require('express-session');
const path = require('path');
const { connectDB } = require('./db/connection');
const uploadRouter = require('./routes/upload');


const STUDENT_ID_PATH = '/M00867462';

async function start() {
    await connectDB(); // ensure DB ready before mounting routes

    const app = express();
    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(session({
        secret: 'secret123',
        resave: false,
        saveUninitialized: false
    }));

    // Mount routes after DB is ready
    app.use(STUDENT_ID_PATH, require('./routes/auth'));
    app.use(STUDENT_ID_PATH, require('./routes/users'));
    app.use(STUDENT_ID_PATH, require('./routes/contents'));
    app.use(STUDENT_ID_PATH, require('./routes/follow'));

    // Serve the uploads folder
    app.use('/M00867462', uploadRouter);
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    const port = 8080;
    app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
}

start().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});