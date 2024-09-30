import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import useRouter from './routes/user.route.js';

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

app.use("/",useRouter);

export { app };