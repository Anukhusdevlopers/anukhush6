// routes/scrapItems.js
const express = require('express');
const router = express.Router();
const {createScrapItem,getRequestsByAuthTokenAndRole,getRequestById,getAllScrapRequests,getAllScrap,getRequestsByStatus} = require('../controllers/Scrapitemcontroller');
const upload=require('../image-file/index');
const authentokication =require("../middleware/authMiddleware")
// POST API endpoint
router.post('/createscraplist',  upload.single('image'), createScrapItem);

router.get('/request-all//:userId',getRequestsByAuthTokenAndRole);
router.get('/scrap-items/:requestId', getRequestById); // Define the new route
router.get('/all-customers',getAllScrapRequests);
router.post('/requests', getRequestsByStatus);

router.get('/all-scrapitems',getAllScrap);
router.get('/your-protected-route', authentokication, (req, res) => {
    res.json({ message: 'You have access!' });
});

module.exports = router;
