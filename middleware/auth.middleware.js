import jwt from "jsonwebtoken";
import User from "../models/auth/User.js";


export const protect = async (req, res, next) => {
    let token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Not authorized, no token" });

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User no longer exists" });
        }

        if (user.role === "salesman" && user.status !== "approved") {
            return res.status(403).json({ 
                message: `Access denied. Your account status is: ${user.status}` 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: "Token failed" });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role ${req.user.role} is not authorized` });
        }
        next();
    };
};