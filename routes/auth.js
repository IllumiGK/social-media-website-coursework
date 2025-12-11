const express = require('express');
const router = express.Router();
const { getDB } = require('../db/connection');

router.post('/login', async (req, res) => {
    try {
        const db = getDB();
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ success: false, message: "username and password required" });

        const user = await db.collection('users').findOne({ username, password });
        if (user) {
            req.session.userId = user._id.toString();
            return res.json({ success: true, userId: user._id.toString(), username: user.username });
        } else return res.json({ success: false, message: "Invalid login" });
    } catch (err) {
        console.error('POST /login error:', err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

router.get('/login', (req, res) => {
    try {
        if (req.session && req.session.userId) return res.json({ loggedIn: true, userId: req.session.userId });
        return res.json({ loggedIn: false });
    } catch (err) {
        console.error('GET /login error:', err);
        res.status(500).json({ loggedIn: false });
    }
});

router.delete('/login', (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.error('Session destroy error:', err);
                return res.status(500).json({ success: false });
            }
            return res.json({ success: true });
        });
    } catch (err) {
        console.error('DELETE /login error:', err);
        res.status(500).json({ success: false });
    }
});

module.exports = router;