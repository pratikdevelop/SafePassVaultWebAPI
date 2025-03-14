const SSOSettings = require('../models/SSOSettings')

exports.getAllSSoSettings = async (req, res) => {
    try {
        const settings = await SSOSettings.find();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Get a specific SSO setting by provider
exports.getAllSSOSettingsByProvider = async (req, res) => {
    try {
        const settings = await SSOSettings.findOne({ provider: req.params.provider });
        if (!settings) {
            return res.status(404).json({ message: 'Provider settings not found' });
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


// Create or update SSO settings
exports.saveSSOSettings = async (req, res) => {
    const { provider = 'google', loginUrl, redirectUrl, clientId, tenantId, secret, secretExpiry, scopes } = req.body;

    try {
        // Check if settings for the provider already exist
        const existingSettings = await SSOSettings.findOne({ provider });

        if (existingSettings) {
            // Update existing settings
            existingSettings.loginUrl = loginUrl || existingSettings.loginUrl;
            existingSettings.redirectUrl = redirectUrl;
            existingSettings.clientId = clientId;
            existingSettings.tenantId = tenantId;
            existingSettings.clientSecret = secret;
            existingSettings.secretExpiry = secretExpiry;
            existingSettings.scopes = scopes;

            const updatedSettings = await existingSettings.save();
            return res.status(200).json({ message: 'Settings updated', data: updatedSettings });
        }

        // Create new settings
        const newSettings = new SSOSettings({
            provider,
            loginUrl,
            redirectUrl,
            clientId,
            tenantId,
            clientSecret: secret,
            secretExpiry,
            scopes,
        });

        const savedSettings = await newSettings.save();
        res.status(201).json({ message: 'Settings saved', data: savedSettings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete SSO settings
exports.deletedSettings = async (req, res) => {
    try {
        const deletedSettings = await SSOSettings.findOneAndDelete({ provider: req.params.provider });
        if (!deletedSettings) {
            return res.status(404).json({ message: 'Provider settings not found' });
        }
        res.json({ message: 'Settings deleted', data: deletedSettings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};