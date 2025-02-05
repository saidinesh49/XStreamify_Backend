import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import searchService from "../services/search.service.js";
import { Video } from "../models/video.model.js";

const getSuggestions = asyncHandler(async (req, res) => {
	const { query } = req.query;
	if (!query) {
		throw new ApiError(400, "Query is required");
	}

	const suggestions = searchService.getSuggestions(query);
	return res
		.status(200)
		.json(
			new ApiResponse(200, suggestions, "Suggestions fetched successfully"),
		);
});

const addSearchTerm = asyncHandler(async (req, res) => {
	const { term } = req.body;
	if (!term) {
		throw new ApiError(400, "Term is required");
	}

	await searchService.addTerm(term);
	return res
		.status(200)
		.json(new ApiResponse(200, {}, "Term added successfully"));
});

const getSearchResults = asyncHandler(async (req, res) => {
	const { query } = req.query;
	if (!query) {
		throw new ApiError(400, "Query is required");
	}

	const searchTerms = query.toLowerCase().split(" ");
	const videos = await Video.find({
		$or: [
			{ tags: { $in: searchTerms } },
			{ description: { $regex: query, $options: "i" } },
		],
	}).populate("owner", "username avatar fullName");

	return res
		.status(200)
		.json(new ApiResponse(200, videos, "Search results fetched successfully"));
});

export { getSuggestions, addSearchTerm, getSearchResults };
