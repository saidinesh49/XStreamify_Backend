import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';


import useRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import tweetRouter from './routes/tweet.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import likeRouter from './routes/like.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import healthcheckRouter from './routes/healthcheck.routes.js';
import playlistRouter from './routes/playlist.routes.js';
import commentRouter from './routes/comment.routes.js';

const app=express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credentials: true,
    optionsSuccessStatus: 200,
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/users/",useRouter);
app.use("/tweets/",tweetRouter);
app.use("/videos/",videoRouter);
app.use("/playlists/",playlistRouter);
app.use("/likes/",likeRouter);
app.use("/subscriptions/",subscriptionRouter);
app.use("/comments/",commentRouter);
app.use("/dashboard/",dashboardRouter);
app.use("/healthcheck",healthcheckRouter);

export { app };