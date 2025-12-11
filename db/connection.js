const { MongoClient } = require('mongodb');

const URL = 'mongodb://localhost:27017';
const DB_NAME = 'socialapp';

let client = null;
let db = null;

async function connectDB() {
    if (db) return db;
    client = new MongoClient(URL);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`[DB] Connected to ${DB_NAME}`);
    return db;
}

function getDB() {
    if (!db) throw new Error("Database not connected - call connectDB() first");
    return db;
}

module.exports = { connectDB, getDB };
