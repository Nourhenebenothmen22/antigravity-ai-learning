import bcrypt from "bcryptjs";
import User from "../models/user.js";
import { verifyEmail } from "../utils/verifyEmail.js";
import { generateToken } from "../utils/generateToken.js";
import { deleteFile } from "../config/multer.config.js";
import path from "path";

// ==================== HELPER FUNCTIONS ====================

/**
 * Clean up uploaded file
 * @param {Object} file - Multer file object
 */
const cleanupUploadedFile = (file) => {
  if (file) {
    const filePath = path.join(process.cwd(), `uploads/profiles/${file.filename}`);
    deleteFile(filePath);
  }
};

/**
 * Format user response (exclude sensitive data)
 * @param {Object} user - User document
 * @returns {Object} Sanitized user object
 */
const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profileImage: user.profileImage,
  createdAt: user.createdAt
});

/**
 * Set authentication cookie
 * @param {Object} res - Express response object
 * @param {String} token - JWT token
 */
const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 3600000 // 1 hour
  });
};

// ==================== CONTROLLERS ====================

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const emailExists = await verifyEmail(email);
    if (emailExists) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({ 
        success: false,
        message: "Email already registered" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare user data
    const userData = { 
      name, 
      email, 
      password: hashedPassword 
    };

    // Add profile image if uploaded
    if (req.file) {
      userData.profileImage = `uploads/profiles/${req.file.filename}`;
    }

    // Create user
    const user = await User.create(userData);

    // Generate token
    const token = generateToken({ id: user._id });

    // Set cookie
    setAuthCookie(res, token);

    res.status(201).json({ 
      success: true,
      message: "User registered successfully", 
      data: { 
        user: formatUserResponse(user), 
        token 
      } 
    });
  } catch (error) {
    cleanupUploadedFile(req.file);
    
    res.status(500).json({ 
      success: false,
      message: "User registration failed", 
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Generate token
    const token = generateToken({ id: user._id });

    // Set cookie
    setAuthCookie(res, token);

    res.status(200).json({ 
      success: true,
      message: "User logged in successfully", 
      data: { 
        user: formatUserResponse(user), 
        token 
      } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Login failed", 
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

/**
 * Get user profile
 * @route GET /api/auth/profile
 * @access Private
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Profile fetched successfully", 
      data: user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Fetching profile failed", 
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
export const updateProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Security: Prevent password and email modification via this route
    delete updates.password;
    delete updates.email;
    
    // Handle profile image upload
    if (req.file) {
      // Get current user to delete old image
      const currentUser = await User.findById(req.user.id).select("profileImage");
      
      // Delete old profile image if exists
      if (currentUser?.profileImage) {
        const oldImagePath = path.join(process.cwd(), currentUser.profileImage);
        deleteFile(oldImagePath);
      }
      
      // Set new profile image path
      updates.profileImage = `uploads/profiles/${req.file.filename}`;
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      updates, 
      { 
        new: true, 
        runValidators: true 
      }
    ).select("-password");
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Profile updated successfully", 
      data: user 
    });
  } catch (error) {
    // Cleanup uploaded file on error
    cleanupUploadedFile(req.file);
    
    res.status(500).json({ 
      success: false,
      message: "Updating profile failed", 
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

/**
 * Change user password
 * @route POST /api/auth/change-password
 * @access Private
 */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    // Validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Old password and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "New password must be at least 6 characters long" 
      });
    }

    // Retrieve user with password
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Old password is incorrect" 
      });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: "Password changed successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Changing password failed", 
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Public
 */
export const logout = async (req, res) => {
  try {
    // Clear authentication cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    
    res.status(200).json({ 
      success: true, 
      message: "User logged out successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Logout failed", 
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};
