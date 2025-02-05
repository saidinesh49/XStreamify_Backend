import { Router } from "express";
import {
	getSuggestions,
	addSearchTerm,
	getSearchResults,
} from "../controllers/search.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJwt);

router.route("/suggestions").get(getSuggestions);
router.route("/add-term").post(addSearchTerm);
router.route("/results").get(getSearchResults);

export default router;
