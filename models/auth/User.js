// models/auth/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            unique: true, // Added unique constraint
            trim: true,
        },
        nationalId: {
            type: String,
            required: [true, "National ID is required"],
            unique: true,
            trim: true,
        },
        address: {
            type: String,
            required: [true, "Address is required"],
        },
        role: {
            type: String,
            enum: ["superadmin", "admin", "salesman"],
            default: "salesman",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "Approved", "Rejected"],
            default: function () {
                return this.role === "salesman" ? "pending" : undefined;
            },
            validate: {
                validator: function (value) {
                    if (this.role !== "salesman" && value != null) {
                        return false;
                    }
                    return true;
                },
                message: "Status can only be set for users with the 'salesman' role."
            }
        }
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;