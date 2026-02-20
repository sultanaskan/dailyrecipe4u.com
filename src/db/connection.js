import { MongoClient } from 'mongodb';
import 'dotenv/config';

const dbName = "dailyrecipe4u";
// srv ছাড়া সরাসরি নোড ইউআরএল (পাসওয়ার্ডের জায়গায় আপনার পাসওয়ার্ড বসান)
//const uri = "mongodb+srv://jakareatanmoy001_db_user:DLVjCkDQTKpCkQOp@cluster0.157bspu.mongodb.net/?appName=Cluster0";
const uri = process.env.MONGODB_URI;

let db;

async function connectDB() {
    if (db) return db;
    // এখানে কিছু বাড়তি অপশন যোগ করা নিরাপদ
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB Successfully");
        db = client.db(dbName);
        return db;
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error.message);
        throw error;
    }
}

export default connectDB;