import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middlewares/authMiddlewar.js';
import upload from '../utils/multer.js';
import {
	RegisterForPushToken,
	deleteUser,
	downloadUserData,
	followUser,
	forgotPassword,
	getCurrentUserProfile,
	getUserProfile,
	logOutUser,
	loginUser,
	registerUser,
	requestEmailVerification,
	resetPassword,
	searchUser,
	updateBio,
	updatePassword,
	updateUser,
	uploadProfile,
	validateResetCode,
	verifyEmail,
} from '../controllers/userController.js';

const router = express.Router();

// Register a new user
router.post(
	'/register',
	[
		body('firstName').notEmpty().withMessage('First Name is required'),
		body('lastName').notEmpty().withMessage('Last Name is required'),
		body('email').notEmpty().withMessage('Email is required'),
		body('password')
			.isLength({ min: 6 })
			.withMessage('Password must be at least 6 characters long'),
	],
	registerUser
);

// User login
router.post(
	'/login',
	[
		body('email').notEmpty().withMessage('Email is required'),
		body('password').exists().withMessage('Password is required'),
	],
	loginUser
);

// User logout
router.post('/logout', logOutUser);

// Request password reset
router.post(
	'/forgot_password',
	[body('email').notEmpty().withMessage('Email is required')],
	forgotPassword
);

// Reset user password
router.post(
	'/reset_password',
	[
		body('email').notEmpty().withMessage('Email is required'),
		body('new_password')
			.isLength({ min: 6 })
			.withMessage('Password must be at least 6 characters long'),
	],
	resetPassword
);

// Validate reset code
router.post(
	'/verify_resetcode',
	[
		body('email').notEmpty().withMessage('Email is required'),
		body('resetCode').notEmpty().withMessage('Reset Code is required'),
	],
	validateResetCode
);

// Update user password
router.put(
	'/update_password/:id',
	[
		body('password').exists().withMessage('Password is required'),
		body('new_password')
			.isLength({ min: 6 })
			.withMessage('New Password must be at least 6 characters long'),
	],
	protect,
	updatePassword
);

// Upload user profile image
router.put(
	'/upload_profile/:id',
	protect,
	upload.single('image'),
	uploadProfile
);

// Verify user email
router.get('/verify_email/:token', verifyEmail);

// Request email verification
router.post('/request_verification/:id', protect, requestEmailVerification);

// Get user profile
router.get('/profile/:id', protect, getCurrentUserProfile);

// Get any User profile
router.get('/profile/user/:id', getUserProfile);

// Download user data
router.post('/download/:id', protect, downloadUserData);

// Delete user account
router.delete('/delete/:id', protect, deleteUser);

// Update user information
router.put('/update/:id', [protect, upload.single('image')], updateUser);

//search for a user
router.get('/search', protect, searchUser);

//update bio
router.put('/bio/:id', protect, updateBio);

//follow User
router.put('/follow/:id', followUser);

//register push token
router.post('/pushToken/:id', RegisterForPushToken);

export default router;
