import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import cookieParser from 'cookie-parser';
import connectDB from './db.js';
// Routes 
import authRoutes from "./routes/auth.routes.js"
import leadRoutes from "./routes/leads.routes.js"
dotenv.config();


const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CONNECT DATABASE
connectDB();

// Authorization
app.use('/api/auth', authRoutes);
// Leads
app.use('/api/Lead', leadRoutes)

app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
})