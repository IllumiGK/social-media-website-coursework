const express = require('express');
const router = express.Router();
const { getDB } = require('../db/connection');

// POST register user
router.post('/users', async (req, res) => {
    try {
        const db = getDB();
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ success: false, message: "username and password required" });

        const exists = await db.collection('users').findOne({ username });
        if (exists) return res.status(200).json({ success: false, message: "Username exists" });

        const result = await db.collection('users').insertOne({ username, password });
        return res.json({ success: true, userId: result.insertedId.toString() });
    } catch (err) {
        console.error('POST /users error:', err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// GET search users
router.get('/users', async (req, res) => {
    try {
        const db = getDB();
        const q = req.query.q || '';
        const users = await db.collection('users')
            .find({ username: { $regex: q, $options: 'i' } })
            .project({ username: 1 })
            .toArray();

        // convert _id to string for client simplicity
        const out = users.map(u => ({ _id: u._id.toString(), username: u.username }));
        res.json(out);
    } catch (err) {
        console.error('GET /users error:', err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
