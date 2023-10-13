import { MongoClient } from "mongodb";

let db;

try {
	const mongoClient = new MongoClient(process.env.MONGO_URI);
	const conn = await mongoClient.connect();
	db = conn.db("DB");
} catch (error) {
	console.log(error);
}

export default db;
