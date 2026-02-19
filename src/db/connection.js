import { MongoClient } from 'mongodb';

// ১. স্পেশাল ক্যারেক্টার হ্যান্ডেল করার জন্য ইউজার এবং পাসওয়ার্ড আলাদা ভেরিয়েবলে রাখুন
const user = encodeURIComponent("user");
const pass = encodeURIComponent("user123456!"); 
const dbName = "dailyrecipe4u";

// ২. authSource=admin যোগ করা হয়েছে এবং encode করা ইউজার-পাস ব্যবহার করা হয়েছে
const uri = `mongodb://${user}:${pass}@localhost:27017/${dbName}?authSource=admin`;

let db;

async function connectDB() {
    if (db) return db;
    
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB Successfully");
        db = client.db(dbName);
        return db;
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB", error.message);
        throw error;
    }
}

export default connectDB;