import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import useRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import likeRouter from "./routes/like.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import commentRouter from "./routes/comment.routes.js";
import recommendationRouter from "./routes/recommendation.routes.js";
import searchEngineRouter from "./routes/search.routes.js";
import notificationRouter from "./routes/notification.routes.js";

const app = express();

const corsOptions = {
	origin: ["http://localhost:5173", process.env.FRONTEND_URL],
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
	allowedHeaders: [
		"Origin",
		"Accept",
		"X-Requested-With",
		"Content-Type",
		"Authorization",
	],
	credentials: true,
	optionsSuccessStatus: 200,
};

// Handle CORS preflight requests
app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

// Use body-parser with increased limit
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(
	bodyParser.urlencoded({
		limit: "50mb",
		extended: true,
		parameterLimit: 50000,
	}),
);
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

app.use("/users/", useRouter);
app.use("/tweets/", tweetRouter);
app.use("/videos/", videoRouter);
app.use("/playlists/", playlistRouter);
app.use("/likes/", likeRouter);
app.use("/subscriptions/", subscriptionRouter);
app.use("/comments/", commentRouter);
app.use("/dashboard/", dashboardRouter);
app.use("/healthcheck", healthcheckRouter);
app.use("/feeds/", recommendationRouter);
app.use("/search-engine/", searchEngineRouter);
app.use("/notifications/", notificationRouter);

export { app };
