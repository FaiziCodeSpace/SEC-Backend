import User from "../models/auth/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateAccessAndRefreshTokens } from "../utils/generateToken.js";

// --- HELPER FUNCTIONS ---

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const accessTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
};

/**
 * Centralized Error Handler
 * Specifically catches MongoDB duplicate keys (11000) for Phone, Email, and NationalID
 */
const handleControllerError = (err, res) => {
    // MongoDB Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        return res.status(400).json({
            message: `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' is already in use.`
        });
    }

    // Mongoose Validation Error (e.g., role enum, required fields)
    if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map((val) => val.message)[0];
        return res.status(400).json({ message });
    }

    // JWT/Token Errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid session token" });
    }

    // Default Server Error
    console.error("Controller Error:", err);
    return res.status(500).json({ message: "An internal server error occurred." });
};

// --- AUTHENTICATION ---

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user._id, user.role);

        res.cookie("refreshToken", refreshToken, cookieOptions);
        res.cookie("accessToken", accessToken, accessTokenCookieOptions);

        res.status(200).json({
            accessToken,
            user: { id: user._id, name: user.name, role: user.role, status: user.status }
        });
    } catch (error) {
        handleControllerError(error, res);
    }
};

export const refreshAccessToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token provided" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) return res.status(403).json({ message: "User no longer exists" });

        const tokens = generateAccessAndRefreshTokens(user._id, user.role);

        res.cookie("accessToken", tokens.accessToken, accessTokenCookieOptions);
        res.cookie("refreshToken", tokens.refreshToken, cookieOptions);

        res.status(200).json({
            accessToken: tokens.accessToken,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        handleControllerError(error, res);
    }
};

export const logout = (req, res) => {
    res.clearCookie("refreshToken", { ...cookieOptions, maxAge: 0 });
    res.clearCookie("accessToken", { ...accessTokenCookieOptions, maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
};

// --- CREATION ---

export const createAdminOrSalesman = async (req, res) => {
    try {
        const { role, password, ...userData } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).json({ message: "Password is required and must be 8+ characters" });
        }

        // Prevent unauthorized role escalation
        if (role === "superadmin" && req.user.role !== "superadmin") {
            return res.status(403).json({ message: "Forbidden: You cannot create a Super Admin" });
        }

        const hashedPassword = await hashPassword(password);
        const newUser = await User.create({
            ...userData,
            password: hashedPassword,
            role: role || "admin"
        });

        res.status(201).json({ message: "User created successfully", id: newUser._id });
    } catch (error) {
        handleControllerError(error, res);
    }
};

export const createSalesman = async (req, res) => {
    try {
        const { password, ...userData } = req.body;

        if (!password || password.length < 8) {
            return res.status(400).json({ message: "Password is required and must be 8+ characters" });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await User.create({
            ...userData,
            password: hashedPassword,
            role: "salesman"
        });

        res.status(201).json({ message: "Salesman created successfully", id: newUser._id });
    } catch (error) {
        handleControllerError(error, res);
    }
};

// --- GENERAL CRUD ---

export const getAllUsers = async (req, res) => {
    try {
        const filter = req.user.role === "superadmin" ? {} : { role: { $ne: "superadmin" } };
        const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        handleControllerError(error, res);
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role === "salesman" && req.user._id.toString() !== id) {
            return res.status(403).json({ message: "Access denied: Cannot view other profiles" });
        }

        const user = await User.findById(id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json(user);
    } catch (error) {
        handleControllerError(error, res);
    }
};

export const deleteUser = async (req, res) => {
    try {
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ message: "User not found" });

        if (target.role === "superadmin" && req.user.role !== "superadmin") {
            return res.status(403).json({ message: "Action forbidden: Cannot delete a Super Admin" });
        }

        if (target.role === "admin" && req.user.role === "admin") {
            return res.status(403).json({ message: "Admins cannot delete other Admins" });
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        handleControllerError(error, res);
    }
};