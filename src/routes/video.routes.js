import {
    getAllVideos, 
    deleteVideo, 
    updateVideo,
    publishAVideo,
    getVideoById
    } from '../controllers/video.controller.js';

import { Router } from 'express'; 
import { verifyJwt } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.use(verifyJwt);

router.route('/')
    .get(getAllVideos)
    .post(
        upload.fields(
            [{
                name: "videoFile",
                maxCount: 1
            },
            {
                name: "thumbnail",
                maxCount: 1
            }]),
            publishAVideo);


router.route('/:videoId')
    .get(getVideoById)
    .patch(updateVideo)
    .delete(deleteVideo);


router.route('/toggle/publish/:videoId')
    .patch(publishAVideo);

export default router;