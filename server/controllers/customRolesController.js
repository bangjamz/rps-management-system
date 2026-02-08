import { CustomAdminRole, User } from '../models/index.js';

// Get all custom roles
export const getCustomRoles = async (req, res) => {
    try {
        const roles = await CustomAdminRole.findAll({
            include: [{
                model: User,
                as: 'creator',
                attributes: ['id', 'nama_lengkap']
            }],
            order: [['created_at', 'DESC']]
        });
        res.json(roles);
    } catch (error) {
        console.error('Error fetching custom roles:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create a new custom role
export const createCustomRole = async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        const creatorId = req.user.id;

        // Check if role name exists
        const existingRole = await CustomAdminRole.findOne({ where: { name } });
        if (existingRole) {
            return res.status(400).json({ message: 'Role with this name already exists' });
        }

        const newRole = await CustomAdminRole.create({
            name,
            description,
            permissions: permissions || [],
            created_by: creatorId
        });

        res.status(201).json(newRole);
    } catch (error) {
        console.error('Error creating custom role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update a custom role
export const updateCustomRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permissions } = req.body;

        const role = await CustomAdminRole.findByPk(id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        // Check name uniqueness if changed
        if (name && name !== role.name) {
            const existingRole = await CustomAdminRole.findOne({ where: { name } });
            if (existingRole) {
                return res.status(400).json({ message: 'Role with this name already exists' });
            }
        }

        role.name = name || role.name;
        role.description = description !== undefined ? description : role.description;
        role.permissions = permissions || role.permissions;

        await role.save();

        res.json(role);
    } catch (error) {
        console.error('Error updating custom role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete a custom role
export const deleteCustomRole = async (req, res) => {
    try {
        const { id } = req.params;

        const role = await CustomAdminRole.findByPk(id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        await role.destroy();

        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Error deleting custom role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
