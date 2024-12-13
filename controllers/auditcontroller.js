const AuditLog = require('../model/Auditlogs'); // Adjust path accordingly

exports.getUserAuditLogs = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch audit logs for the user
        const logs = await AuditLog.find({ userId }).populate(
            'userId',
        );

        // Return the populated logs
        return res.status(200).json({ logs });

    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return res.status(500).json({ error: 'Failed to fetch audit logs', details: error.message });
    }
};

exports.searchAuditLogs = async (action, startDate, endDate) => {
    try {
        const query = {};
        if (action) query.action = action;
        if (startDate) query.timestamp = { $gte: startDate };
        if (endDate) query.timestamp = { ...query.timestamp, $lte: endDate };

        const logs = await AuditLog.find(query).sort({ timestamp: -1 });
        return logs;
    } catch (error) {
        console.error('Error searching audit logs:', error);
        return [];
    }
};
