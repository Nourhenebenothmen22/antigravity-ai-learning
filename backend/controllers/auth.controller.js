import bcrypt from "bcryptjs";
import User from "../models/user.js";
import { verifyEmail } from "../utils/verifyEmail.js";
import { generateToken } from "../utils/generateToken.js";

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email already exists
    const emailExists = await verifyEmail(email);
    if (emailExists) {
      return res.status(400).json({ 
        success: false,
        message: "Email already registered" 
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the user
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    // Generate token for auto-login after registration
    const token = generateToken({ id: user._id });

    // Don't expose password in response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage
    };

    // Send token in HTTP-only cookie for better security
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000 // 1 hour
    });

    res.status(201).json({ 
      success: true,
      message: "User registered successfully", 
      data: { user: userResponse, token } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "User registration failed", 
      error: error.message 
    });
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists and retrieve password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid password" 
      });
    }

    // Generate token
    const token = generateToken({ id: user._id });

    // Prepare response without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage
    };

    // Send token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600000 // 1 hour
    });

    res.status(200).json({ 
      success: true,
      message: "User logged in successfully", 
      data: { user: userResponse, token } 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Login failed", 
      error: error.message 
    });
  }
};

/**
 * Get user profile
 */
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
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
      error: error.message 
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    // Prevent password modification via this route
    delete updates.password;
    
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
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
    res.status(500).json({ 
      success: false,
      message: "Updating profile failed", 
      error: error.message 
    });
  }
};

/**
 * Change user password
 */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    // Basic validation
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Old password and new password are required" 
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

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Old password is incorrect" 
      });
    }

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
      error: error.message 
    });
  }
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
  try {
    // Clear token cookie
    res.clearCookie("token");
    
    res.status(200).json({ 
      success: true, 
      message: "User logged out successfully" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Logout failed", 
      error: error.message 
    });
  }
};
