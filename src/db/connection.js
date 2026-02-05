import {MongoClient} from 'mongodb';

const uri = "mongodb://localhost:27017";
const dbName = "dailyrecipe4u";
let db;

async function connectDB(){
    if(db) return db;
    const client = new MongoClient(uri);
    try {
        await client.connect();
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
        throw error;
    }
    console.log("Connected to MongoDB");
    db = client.db(dbName);
    return db;
}
export default connectDB;