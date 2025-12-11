const express = require('express');
const router = express.Router();
const { getDB } = require('../db/connection');

// POST new content (text + optional image)
router.post('/contents', async (req, res) => {
    const db = getDB();
    if (!req.session.userId) return res.json({ success: false, message: "Login required" });

    const { text, filePath } = req.body;

    const result = await db.collection('contents').insertOne({
        userId: req.session.userId,
        text,
        filePath: filePath || '',   // store image path if exists
        timestamp: new Date()
    });

    res.json({ success: true, contentId: result.insertedId });
});


// GET search contents
router.get('/contents', async (req, res) => {
    const db = getDB();
    const query = req.query.q || '';
    const contents = await db.collection('contents')
        .find({ text: { $regex: query, $options: 'i' } })
        .toArray();
    res.json(contents);
});

// GET feed (only followed users)
router.get('/feed', async (req, res) => {
    const db = getDB();
    if (!req.session.userId) return res.json([]);

    const follows = await db.collection('follows')
        .find({ followerId: req.session.userId.toString() })
        .toArray();
    const followingIds = follows.map(f => f.followingId);

    const feed = await db.collection('contents')
        .find({ userId: { $in: followingIds } })
        .sort({ timestamp: -1 })
        .toArray();
    res.json(feed);
});

module.exports = router;
