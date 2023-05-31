import { config } from 'dotenv';
import asyncHandler from 'express-async-handler';

import { Post } from '../models/PostModel.js';
import { User } from '../models/UserModel.js';
import path from 'path';
import { sendPushNotification } from '../helpers/helper.js';
import { title } from 'process';

config();

// get All posts
const getAllPosts = asyncHandler(async (req, res) => {
	//find all posts
	const posts = await Post.find({}).populate(
		'createdBy',
		'fullName userName avatar pushToken verified'
	);

	res.json(posts);
});

// get a post
const getAPost = asyncHandler(async (req, res) => {
	const { postId } = req.params;
	//find all posts
	const post = await Post.findById(postId).populate(
		'createdBy',
		'fullName userName avatar pushToken verified'
	);

	if (!post) {
		res.status(404);
		throw new Error('Post not found!');
	}

	res.json(post);
});

// Create a new post
const createPost = asyncHandler(async (req, res) => {
	//retrieve user Id
	const { createdBy, title, body, metaData } = req.body;

	const post = await Post.create({
		createdBy,
		title,
		body,
		metaData,
	});

	let user = await User.findById(createdBy).select('profileData');

	if (!user) {
		res.status(404);
		throw new Error('User not found!');
	}
	user.profileData.postCount++;
	user.save();
	res.json(post);
});

// Get all posts for a user
const getUserPosts = asyncHandler(async (req, res) => {
	const { userId } = req.params;

	const posts = await Post.find({ createdBy: userId });

	if (!posts) {
		return res.status(404).send('You have no posts');
	}
	res.json(posts);
});

//report post
const reportPost = asyncHandler(async (req, res) => {});

// Update a post
const updatePost = asyncHandler(async (req, res) => {
	const { postId } = req.params;
	const { title, text, image, url } = req.body;

	const post = await Post.findById(postId);

	if (!post) {
		res.status(404);
		throw new Error('Post Not found');
	}

	post.title = title || post.title;
	post.body.text = text || post.body.text;
	post.body.image = image || post.body.image;
	post.body.url = url || post.body.url;

	await post.save();

	res.json(post);
});

// Delete a post
const deletePost = asyncHandler(async (req, res) => {
	const { postId } = req.params;

	await Post.findByIdAndDelete(postId);

	res.send('Post deleted');
});

// like a post
const likePost = asyncHandler(async (req, res) => {
	const { postId } = req.params;
	const { userId, userName } = req.body;

	if (!userId) {
		res.status(404);
		throw new Error('Failed to like, current user not found');
	}

	const post = await Post.findById(postId).populate(
		'createdBy',
		'fullName userName avatar pushToken verified'
	);

	if (!post) {
		res.status(404);
		throw new Error('Post not found');
	}
	if (post.metaData.likes.includes(userId)) {
		// User already liked the post, return the post
		return res.json(post);
	}
	const alreadyDisliked = post.metaData.dislikes.includes(userId);

	if (alreadyDisliked) {
		// Remove user from dislikes and add to likes
		const index = post.metaData.dislikes.indexOf(userId);
		post.metaData.dislikes.splice(index, 1);
	}
	// Add user to likes
	post.metaData.likes.push(userId);
	await post.save();

	const title = post.title;
	const body = `${userName} liked your post`;
	await sendPushNotification(post.createdBy.pushToken, title, body);

	res.json(post);
});

// dislike a post
const dislikePost = asyncHandler(async (req, res) => {
	const { postId } = req.params;
	const { userId } = req.body;

	if (!userId) {
		res.status(404);
		throw new Error('Failed to dislike,current user Not found');
	}
	const post = await Post.findById(postId).populate(
		'createdBy',
		'fullName userName avatar pushToken verified'
	);

	if (!post) {
		res.status(404);
		throw new Error('Post Not found');
	}
	const alreadyDisLiked = post.metaData.dislikes.includes(userId);

	if (alreadyDisLiked) return res.json(post);

	const liked = post.metaData.likes.includes(userId);

	if (!liked) {
		post.metaData.dislikes.push(userId);
		await post.save();
		return res.json(post);
	}
	post.metaData.likes.pop(userId, 0);
	post.metaData.dislikes.push(userId);

	await post.save();

	res.json(post);
});

// add  a comment
const addComment = asyncHandler(async (req, res) => {
	const { postId } = req.params;
	const { userId, body } = req.body;

	const post = await Post.findById(postId);

	if (!post) {
		res.status(404);
		throw new Error('Post Not found');
	}

	post.metaData.comments.push({
		sentBy: userId,
		body,
	});

	await post.save();

	res.json(post);
});

// remove a comment
const removeComment = asyncHandler(async (req, res) => {});

// update a comment
const updateComment = asyncHandler(async (req, res) => {});

// Get comments
const getComments = asyncHandler(async (req, res) => {
	const { postId } = req.params;

	const post = await Post.findById(postId).populate({
		path: 'metaData.comments.sentBy',
		select: 'fullName avatar userName pushToken verified',
	});

	if (!post) {
		res.status(404);
		throw new Error('Post Not found');
	}

	res.json(post.metaData.comments);
});
export {
	getAllPosts,
	getAPost,
	createPost,
	getUserPosts,
	updatePost,
	deletePost,
	reportPost,
	likePost,
	dislikePost,
	addComment,
	removeComment,
	updateComment,
	getComments,
};
