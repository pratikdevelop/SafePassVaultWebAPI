const Organization = require("../models/Organization");


exports.deleteOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const organization = await Organization.findByIdAndDelete(id);
        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }
        return res
            .status(200)
            .json({ message: "Organization deleted successfully" });
    } catch (err) {
        console.error("Error deleting organization:", err);
        res.status(500).json({ message: "Failed to delete organization" });
    }
};
exports.getOrganizationBYId = async (req, res) => {
    try {
        const { id } = req.params;
        const organization = await Organization.findById(id);
        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }
        return res.status(200).json({ organization });
    } catch (err) {
        console.error("Error fetching organization:", err);
        res.status(500).json({ message: "Failed to fetch organization" });
    }
};

exports.updateOrganization = async (req, res) => {
    try {
        const { id } = req.params;
        const organization = await Organization.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }
        return res.status(200).json({ organization });
    } catch (err) {
        console.error("Error updating organization:", err);
        res.status(500).json({ message: "Failed to update organization" });
    }
};

// Create organization
exports.createOrganization = async (req, res) => {
    const { name, description } = req.body;
    const owner = req.user._id;
    try {
        const organization = new Organization({ name, description, owner });
        await organization.save();
        res.status(201).json({ message: "Organization created successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error creating organization" });
    }
};
exports.getOrganizations = async (req, res) => {
    try {
        const organizations = await Organization.find({
            owner: req.user._id,
        })
            .populate({
                path: "owner",
                select: "name email",
            })
            .exec();
        res.json(organizations);
    } catch (err) {
        res.status(500).json({ message: "Error fetching organizations" });
    }
};