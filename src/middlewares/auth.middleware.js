import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import admin from "../utils/firebase.js"; // Changed to import

const verifyFirebaseToken = asyncHandler(async (req, res, next) => {
	const { idToken, email } = req.body;
	if (!idToken) {
		throw new ApiError(400, "Token not recieved at backend");
	}
	const decodedToken = await admin.auth().verifyIdToken(String(idToken));
	if (!decodedToken.uid || decodedToken.email != email) {
		throw new ApiError(401, "token not valid");
	}
	req.body = { email: decodedToken?.email };
	next();
});

const verifyJwt = asyncHandler(async (req, res, next) => {
	try {
		const token =
			req?.cookies?.accessToken ||
			req?.header("Authorization")?.replace("Bearer ", "");
		console.log("Jwt recieved Token is: ", token);
		if (!token) {
			throw new ApiError(400, "UnAuthorized user");
		}

		const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

		const user = await User.findById(decodedToken?._id).select(
			"-password -refreshToken",
		);

		if (!user) {
			throw new ApiError(401, "User not found");
		}
		req.user = user;
		next();
	} catch (error) {
		throw new ApiError(
			error.statusCode || 404,
			error.message || "Something went wrong during verification",
		);
	}
});

export { verifyJwt, verifyFirebaseToken };
