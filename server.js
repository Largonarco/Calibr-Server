import cors from "cors";
import "dotenv/config";
import express from "express";
import booksRoute from "./routes/books.js";
import searchRoute from "./routes/search.js";

const server = express();

server.use(cors());
server.use(express.json());

server.use("/books", booksRoute);
server.use("/search", searchRoute);

server.listen(process.env.PORT);
