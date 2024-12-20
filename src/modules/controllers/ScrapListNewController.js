// controllers/scrapController.js
const Scrap = require('../models/ScrapListNew');

// Add new scrap items
// This controller will handle the file upload
// controllers/scrapController.js


// Add new scrap items
exports.addScrap = async (req, res) => {
    try {
        const { id, name, types, isSelected, role } = req.body; // Destructure body
        const imageFile = req.file; // Uploaded file

        if (!imageFile) {
            return res.status(400).json({ message: 'Image file is required.' });
        }

        // Validate role
        if (!['retail', 'corporate'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Accepted values are "retail" or "corporate".' });
        }

        // Parse 'types' if it is a JSON string
        const parsedTypes = typeof types === 'string' ? JSON.parse(types) : types;

        if (!Array.isArray(parsedTypes)) {
            return res.status(400).json({ message: 'Invalid data format. "types" should be an array.' });
        }

        // Create a new scrap object
        const newScrap = {
            id,
            name,
            types: parsedTypes,
            isSelected: isSelected || false,
            image: imageFile.path, // Save the path of the uploaded image
            role,
        };

        // Save to database
        const savedScrap = await Scrap.create(newScrap);
        res.status(201).json({ message: 'Scrap data added successfully!', data: savedScrap });
    } catch (error) {
        console.error('Error adding scrap data:', error);
        res.status(500).json({ message: 'Error adding scrap data', error: error.message });
    }
};



// Get all scrap items
exports.getAllScrap = async (req, res) => {
    try {
        const { role } = req.query; // Extract the role from query parameters

        // Filter by role if provided
        const filter = role ? { role } : {}; // If role is provided, filter by it

        // Fetch the scraps from the database using the filter
        const scraps = await Scrap.find(filter);

        // Return the result
        res.status(200).json({
            message: 'Scrap items fetched successfully',
            data: scraps
        });
    } catch (error) {
        console.error('Error fetching scraps:', error);
        res.status(500).json({
            message: 'Error fetching scrap items',
            error: error.message
        });
    }
};
// Update an existing scrap item
exports.updateScrap = async (req, res) => {
    try {
        const { id } = req.params; // Get the scrap id from URL parameter
        const { name, types, isSelected, role } = req.body; // Get data from request body
        const imageFile = req.file; // Get the uploaded file if present

        // Validate role (if provided)
        if (role && !['retail', 'corporate'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Accepted values are "retail" or "corporate".' });
        }

        // Ensure the id is treated as a string if you're using it as a string
        const scrap = await Scrap.findOne({ id: id }); // Cast `id` to String in the query

        if (!scrap) {
            return res.status(404).json({ message: 'Scrap item not found' });
        }

        // Update scrap details
        scrap.name = name || scrap.name;
        scrap.types = types ? (typeof types === 'string' ? JSON.parse(types) : types) : scrap.types;
        scrap.isSelected = isSelected !== undefined ? isSelected : scrap.isSelected;
        
        // If role is provided, update it; otherwise, retain the existing role
        if (role) {
            scrap.role = role;
        }

        // If a new image file is uploaded, update it
        if (imageFile) {
            scrap.image = imageFile.path;
        }

        // Save the updated scrap item to the database
        const updatedScrap = await scrap.save();

        res.status(200).json({
            message: 'Scrap item updated successfully',
            data: updatedScrap
        });
    } catch (error) {
        console.error('Error updating scrap data:', error);
        res.status(500).json({ message: 'Error updating scrap data', error: error.message });
    }
};
// Delete a scrap item
exports.deleteScrap = async (req, res) => {
    try {
        const { id } = req.params; // Get the scrap id from URL parameter

        // Find the scrap item by id
        const scrap = await Scrap.findOne({ id });
        if (!scrap) {
            return res.status(404).json({ message: 'Scrap item not found' });
        }

        // Delete the scrap item from the database
        await scrap.remove();

        res.status(200).json({
            message: 'Scrap item deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting scrap data:', error);
        res.status(500).json({ message: 'Error deleting scrap data', error: error.message });
    }
};
