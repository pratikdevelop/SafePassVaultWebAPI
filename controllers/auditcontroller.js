const AuditLog = require('../model/Auditlogs'); // Adjust path accordingly

exports.getUserAuditLogs = async (req, res) => {
    const { action, entity, searchTerm, start, end } = req.query;
    console.log(req.query);

    const userId = req.user._id;

    try {
        // Build the query object dynamically
        const query = { userId };

        if (action && action !== 'all') {
            query.action = action; // Filter by action
        }

        if (entity && entity !== 'all') {
            // Use regex to allow partial matches on the entity field
            query.$or = [
                { entity: { $regex: entity, $options: 'i' } }, // Matches in entity
            ];
        }

        if (searchTerm) {
            // Add regex search for general matching
            query.$or = [
                { entity: { $regex: searchTerm, $options: 'i' } }, // Matches in entity
                { 'newValue.label': { $regex: searchTerm, $options: 'i' } } // Matches in newValue.label
            ];
        }

        if (start && end && start !== 'null' && end !== 'null') {
            query.createdAt = { $gte: start, $lte: end };

        }

        console.log('Query:', query.$or);

        // Fetch filtered audit logs for the user
        const logs = await AuditLog.find(query)
            .populate('userId') // Populate user details
            .sort({ createdAt: -1 }) // Sort by creation date (most recent first)
            .exec();

        // Return the populated logs
        return res.status(200).json({ logs });
    } catch (error) {
        console.error('Error fetching logs:', error);
        return res.status(500).json({ message: 'Error fetching logs', error });
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
