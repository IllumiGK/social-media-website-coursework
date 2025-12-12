const express = require('express');
const router = express.Router();
const { getDB } = require('../db/connection');

// POST follow
router.post('/follow', async (req, res) => {
    const db = getDB();
    if (!req.session.userId) return res.json({ success: false, message: "Login required" });
    const { followingId } = req.body;

    await db.collection('follows').updateOne(
        { followerId: req.session.userId.toString(), followingId },
        { $set: { followerId: req.session.userId.toString(), followingId } },
        { upsert: true }
    );
    res.json({ success: true });
});

// DELETE unfollow
router.delete('/follow', async (req, res) => {
    const db = getDB();
    if (!req.session.userId) return res.json({ success: false, message: "Login required" });
    const { followingId } = req.body;

    await db.collection('follows').deleteOne({ followerId: req.session.userId.toString(), followingId });
    res.json({ success: true });
});

module.exports = router;

// GET followers of a user
router.get('/followers', async (req,res)=>{
    const db = getDB();
    const userId = req.query.userId;
    const followers = await db.collection('follows').find({ followingId: userId }).toArray();
    res.json(followers);
});

// GET following of a user
router.get('/following', async (req,res)=>{
    const db = getDB();
    const userId = req.query.userId;
    const following = await db.collection('follows').find({ followerId: userId }).toArray();
    res.json(following);
});
