import express from "express";
import { 
    login, 
    refreshAccessToken, 
    createAdminOrSalesman, 
    createSalesman, 
    getAllUsers, 
    getUserById, 
    deleteUser, 
    logout
} from "../controllers/authController.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { createInitialAdmin } from "../seed.js";

const router = express.Router();

// Auth
router.post("/login", login);
router.post("/refresh", refreshAccessToken);
router.post("/create-salesman", createSalesman);
router.post("/logout", logout);

// Split Creation Routes
router.post("/create-admin", protect, authorize("superadmin", "admin"), createAdminOrSalesman);

// CRUD
router.get("/", protect, authorize("superadmin", "admin"), getAllUsers);
router.route("/:id")
    .get(protect, authorize("superadmin", "admin", "salesman"), getUserById)
    .delete(protect, authorize("superadmin", "admin"), deleteUser);


//  testing 
router.post('/create', createInitialAdmin);   

export default router;