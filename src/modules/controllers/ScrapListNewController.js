// controllers/scrapController.js
const Scrap = require('../models/ScrapListNew');

// Add new scrap items
// This controller will handle the file upload
exports.addScrap = async (req, res) => {
    try {
        const scrapData = req.body; // Get data from request body
        const imageFile = req.file; // Get the uploaded file

        if (!imageFile) {
            return res.status(400).json({ message: 'Image file is required.' });
        }

        // Check if 'types' is a string and parse it into an array of objects
        if (typeof scrapData.types === 'string') {
            try {
                scrapData.types = JSON.parse(scrapData.types); // Parse the JSON string to an array
            } catch (error) {
                return res.status(400).json({ message: 'Invalid JSON format for types.' });
            }
        }

        // Validate that 'types' is now an array
        if (!Array.isArray(scrapData.types)) {
            return res.status(400).json({ message: 'Invalid data format. Expected an array of scrap types.' });
        }

        // Create a new scrap object
        const newScrap = {
            id: scrapData.id,
            name: scrapData.name,
            types: scrapData.types, // types should now be an array of objects
            isSelected: scrapData.isSelected,
            image: imageFile.path // Save the path of the uploaded image
        };

        const newScraps = await Scrap.create(newScrap); // Use create to add the new scrap
        res.status(201).json({ message: 'Scrap data added successfully!', data: newScraps });
    } catch (error) {
        console.error('Error adding scrap data:', error);
        res.status(500).json({ message: 'Error adding scrap data', error: error.message });
    }
};



// Get all scrap items
exports.getAllScrap = async (req, res) => {
    try {
        const scraps = await Scrap.find();
        res.status(200).json({ message: 'Scrap items fetched successfully', data: scraps });
    } catch (error) {
        console.error('Error fetching scraps:', error);
        res.status(500).json({ message: 'Error fetching scrap items', error: error.message });
    }
};
