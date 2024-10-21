// routes/scrapRoutes.js
const express = require('express');
const router = express.Router();
const { addScrap, getAllScrap } = require('../controllers/ScrapListNewController');
const upload = require('../image-file/index'); // Import your multer configuration

// Route to add a new scrap item
router.post('/scraplist',upload.single('image'), addScrap);

// Route to get all scrap items
router.get('/scraplist',  getAllScrap);

module.exports = router;
