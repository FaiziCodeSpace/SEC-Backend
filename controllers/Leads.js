import Leads from "../models/Audits/Leads.js";

export const getLeads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // 1. Build Dynamic Query
        const query = {};

        // Filter by Salesman if provided (Frontend passes user.id)
        if (req.query.Salesman) {
            query.Salesman = req.query.Salesman;
        }

        // Search Logic (Company Name)
        if (req.query.search) {
            query.companyName = { $regex: req.query.search, $options: 'i' };
        }

        // 2. Timeframes for Stats
        const now = new Date();
        const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
        const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);

        // 3. Execute Aggregations and Queries in Parallel
        const [
            leads, 
            totalLeads, 
            approved, 
            rejected, 
            pending, 
            statsLast24h, 
            statsPrev24h
        ] = await Promise.all([
            // Main Data Fetch
            Leads.find(query)
                .populate('Salesman', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),

            // Global/Filtered Counts
            Leads.countDocuments(query),
            Leads.countDocuments({ ...query, currentStatus: 'approved' }),
            Leads.countDocuments({ ...query, currentStatus: 'rejected' }),
            Leads.countDocuments({ ...query, currentStatus: 'pending' }),

            // Stats for the last 24h
            Leads.aggregate([
                { $match: { ...query, createdAt: { $gte: twentyFourHoursAgo } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        approved: { $sum: { $cond: [{ $eq: ['$currentStatus', 'approved'] }, 1, 0] } },
                        rejected: { $sum: { $cond: [{ $eq: ['$currentStatus', 'rejected'] }, 1, 0] } },
                        pending: { $sum: { $cond: [{ $eq: ['$currentStatus', 'pending'] }, 1, 0] } }
                    }
                }
            ]),

            // Stats for the 24h before that
            Leads.aggregate([
                { $match: { ...query, createdAt: { $gte: fortyEightHoursAgo, $lt: twentyFourHoursAgo } } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        approved: { $sum: { $cond: [{ $eq: ['$currentStatus', 'approved'] }, 1, 0] } },
                        rejected: { $sum: { $cond: [{ $eq: ['$currentStatus', 'rejected'] }, 1, 0] } },
                        pending: { $sum: { $cond: [{ $eq: ['$currentStatus', 'pending'] }, 1, 0] } }
                    }
                }
            ])
        ]);

        // 4. Percentage Calculation Helper
        const calculatePercent = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return parseFloat(((current - previous) / previous * 100).toFixed(2));
        };

        const current24 = statsLast24h[0] || { total: 0, approved: 0, rejected: 0, pending: 0 };
        const prev24 = statsPrev24h[0] || { total: 0, approved: 0, rejected: 0, pending: 0 };

        return res.status(200).json({
            success: true,
            stats: {
                total: { 
                    value: totalLeads, 
                    percentValue: calculatePercent(current24.total, prev24.total) 
                },
                approved: { 
                    value: approved, 
                    percentValue: calculatePercent(current24.approved, prev24.approved) 
                },
                rejected: { 
                    value: rejected, 
                    percentValue: calculatePercent(current24.rejected, prev24.rejected) 
                },
                pending: { 
                    value: pending, 
                    percentValue: calculatePercent(current24.pending, prev24.pending) 
                },
                approvedLast24h: current24.approved
            },
            pagination: { 
                totalLeads, 
                totalPages: Math.ceil(totalLeads / limit), 
                currentPage: page 
            },
            data: leads
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error", 
            error: error.message 
        });
    }
};

export const getLeadById = async (req, res) => {
    try {
        const lead = await Leads.findById(req.params.id).populate('Salesman', 'name email');

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: lead
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching lead details",
            error: error.message
        });
    }
};

export const createLead = async (req, res) => {
    try {
        const lead = await Leads.create(req.body);

        return res.status(201).json({
            success: true,
            data: lead
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const editLead = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedLead = await Leads.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedLead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Lead updated successfully",
            data: updatedLead
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Error updating lead",
            error: error.message
        });
    }
};

export const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedLead = await Leads.findByIdAndDelete(id);

        if (!deletedLead) {
            return res.status(404).json({
                success: false,
                message: "Lead not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: `Lead ${deletedLead.LeadId} deleted successfully`,
            data: deletedLead
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error deleting lead",
            error: error.message
        });
    }
};

