import User from "./models/auth/User.js";
import bcrypt from "bcryptjs";

export const createInitialAdmin = async () => {
    try {
        const hashedPassword = await bcrypt.hash("Admin@1234", 10);
        
        const adminData = {
            name: "System SuperAdmin",
            email: "superadmin@gmail.com",
            password: hashedPassword,
            phone: "0101010101",
            nationalId: "ADMIN-001",
            address: "Main Office, Floor 5",
            role: "superadmin"
        };

        const admin = await User.create(adminData);
        console.log("Admin created successfully:", admin._id);
    } catch (error) {
        console.error("Error creating admin:", error.message);
    }
};