const getUserAuditLogs = async (userId) => {
    try {
        const logs = await AuditLog.find({ userId }).sort({ timestamp: -1 });
        return logs;
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
};
const searchAuditLogs = async (action, startDate, endDate) => {
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
