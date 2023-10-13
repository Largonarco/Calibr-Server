import express from "express";
import elasticClient from "../elasticSearch/index.js";

const router = express.Router();

router.get("/", async (req, res) => {
	try {
		const { query } = req.query;

		console.log(query);

		const results = await elasticClient.search({
			query: {
				multi_match: {
					query,
					type: "bool_prefix",
					fields: ["title", "description", "author"],
				},
			},
		});

		res.status(200).send({ results });
	} catch (error) {
		res.status(500).send({ msg: "Failed to fetch results" });
	}
});

export default router;
