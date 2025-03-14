const AuditLog = require('../models/Auditlogs'); // Adjust path accordingly

exports.getUserAuditLogs = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch audit logs for the user
        const logs = await AuditLog.find({ userId }).populate(
            'userId',
        );

        // Dynamically populate the `entityId` based on the `entity` value
        const populatedLogs = await Promise.all(logs.map(async (log) => {
            const entityModelName = log.entity.charAt(0).toLowerCase() + log.entity.slice(1); // Capitalizing first letter to match model name
            try {
                const model = require(`../model/${entityModelName}`); // Dynamically require the model
                const entityData = await model.findById(log.entityId); // Find the entity by its ID
                log.entityData = entityData; // Attach the populated data
                return log; // Return the log with populated data
            } catch (error) {
                console.error(`Error populating entity ${log.entity}:`, error);
                log.entityData = null; // If the entity population fails, set entityData to null
                return log;
            }
        }));

        // Return the populated logs
        return res.status(200).json({ logs: populatedLogs });

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
