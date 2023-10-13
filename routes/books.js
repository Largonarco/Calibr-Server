import express from "express";
import { ObjectId } from "mongodb";
import db from "../mongoDB/index.js";
import elasticClient from "../elasticSearch/index.js";

const router = express.Router();

// Book schema validator
if (!db.collection("books")) {
	db.createCollection("books", {
		validator: {
			$jsonSchema: {
				bsonType: "object",
				title: "Book Object Validation",
				required: ["title", "author", "publicationYear", "isbn", "description"],
				properties: {
					title: {
						bsonType: "string",
					},
					isbn: {
						bsonType: "string",
					},
					author: {
						bsonType: "string",
					},
					description: {
						bsonType: "string",
					},
					publicationYear: {
						bsonType: "int",
					},
				},
			},
		},
	});
}

// POST /books
// Add a book to the collection
router.post("/", async (req, res) => {
	try {
		const data = req.body;

		const books = db.collection("books");
		const { insertedId } = await books.insertOne(data);
		delete data._id;
		await elasticClient.index({
			index: "search-books",
			id: insertedId.toString(),
			document: data,
		});

		res.status(200).send({ msg: "Book added succesfully" });
	} catch (error) {
		res.status(500).send({ msg: "Failed to add book" });
	}
});

// GET /books/:id
// Get a book by the ID
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const books = db.collection("books");
		const foundBook = await books.findOne({ _id: new ObjectId(id) });

		if (foundBook) {
			res.status(200).send({ msg: "Book found", book: foundBook });
		} else {
			res.status(500).send({ msg: "Book not found" });
		}
	} catch (error) {
		res.status(500).send({ msg: "Unknown error occured" });
	}
});

// PUT /books/:id
// Update a book by the ID
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const newData = req.body;

		const books = db.collection("books");
		const { modifiedCount } = await books.updateOne({ _id: new ObjectId(id) }, { $set: newData });
		if (modifiedCount === 1) {
			await elasticClient.update({
				index: "search-books",
				id,
				doc: newData,
			});

			res.status(200).send({ msg: "Book updated succesfully" });
		} else {
			res.status(500).send({ msg: "Failed to update book" });
		}
	} catch (error) {
		res.status(500).send({ msg: "Unknown error occured" });
	}
});

// DELETE /books/:id
// Delete a book by the ID
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;

		const books = db.collection("books");
		const { deletedCount } = await books.deleteOne({ _id: new ObjectId(id) });
		if (deletedCount === 1) {
			await elasticClient.delete({
				index: "search-books",
				id,
			});

			res.status(200).send({ msg: "Book deleted succesfully" });
		} else {
			res.status(500).send({ msg: "Failed to delete book" });
		}
	} catch (error) {
		res.status(500).send({ msg: "Unknown error occured" });
	}
});

// GET /books
// Get all the books
router.get("/", async (req, res) => {
	try {
		const { offset, limit } = req.query;

		let foundBooks;
		const books = db.collection("books");
		const bookCount = await books.count();
		if (!offset) {
			foundBooks = await books.find({}).limit(Number(limit)).toArray();
		} else {
			foundBooks = await books.find({}).skip(Number(offset)).limit(Number(limit)).toArray();
		}

		res.status(200).send({ books: foundBooks, bookCount });
	} catch (error) {
		res.status(500).send({ msg: "Failed to find books" });
	}
});

export default router;
