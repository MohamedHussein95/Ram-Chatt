import express from 'express';

import { protect } from '../middlewares/authMiddlewar.js';
import {
	addComment,
	createPost,
	deletePost,
	dislikePost,
	getAPost,
	getAllPosts,
	getComments,
	getUserPosts,
	likePost,
	removeComment,
	reportPost,
	updateComment,
	updatePost,
} from '../controllers/postController.js';

const router = express.Router();

//Get all Posts
router.get('/', protect, getAllPosts);

//Get a Post
router.get('/post/:postId', protect, getAPost);

//create a new post
router.post('/create', protect, createPost);

//Get all Posts for a user
router.get('/:userId', protect, getUserPosts);

//Update a post
router.put('/update/:postId', protect, updatePost);

//Delete a post
router.delete('/delete/:postId', protect, deletePost);

//report a post
router.post('/report/:postId', protect, reportPost);

//update likes
router.put('/likes/:postId', protect, likePost);

//update dislikes
router.put('/dislikes/:postId', protect, dislikePost);

//get comments of a post
router.get('/comments/:postId', protect, getComments);

//add comment
router.post('/comments/add/:postId', protect, addComment);

//remove comment
router.post('/comments/remove/:postId', protect, removeComment);

//update comment
router.post('/comments/update/:postId', protect, updateComment);

export default router;
