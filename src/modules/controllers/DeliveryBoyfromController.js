const mongoose = require('mongoose');
const DeliveryForm = require('../models/DeliveryBoyForm');
const Request = require('../models/Scraplist');
const DeliveryBoy = require('../models/DeliveryBoyNew');

// Inside your controller
exports.submitDeliveryForm = async (req, res) => {
    const { requestId, scrapItems, scrapSold, reason, totalPrice } = req.body;

    try {
       

        console.log("Received requestId:", requestId);

        // Find the request in the database
        const existingRequest = await Request.findOne({ requestId: requestId.trim() });
        if (!existingRequest) {
            return res.status(404).json({ error: "Request not found" });
        }

        // Parse scrapItems if it's sent as a string
        const parsedScrapItems = Array.isArray(scrapItems)
            ? scrapItems
            : JSON.parse(scrapItems);

        // Get delivery boy details and update scrapItems
        const { deliveryBoyDetails, paymentMode, status: requestStatus, scrapItems: requestScrapItems } = existingRequest;
        const updatedScrapItems = parsedScrapItems.length > 0 ? parsedScrapItems : requestScrapItems;

        // Extract delivery boy details
        const { name: deliveryBoyName, number: deliveryBoyNumber } = deliveryBoyDetails;

        // Determine status based on scrapSold
        const formStatus = scrapSold === "true" ? "Completed" : "Rejected";

        // Handle image upload
        const imageName = req.file ? req.file.filename : null;

        // Create a new DeliveryForm
        const deliveryForm = new DeliveryForm({
            requestId,
            scrapItems: updatedScrapItems,
            scrapSold: scrapSold === "true",
            reason,
            totalPrice,
            imageName,
            deliveryBoyName,
            deliveryBoyNumber,
            paymentAccepted: paymentMode,
            status: formStatus,
            isActive: true,
        });

        // Save the form to the database
        await deliveryForm.save();

        // Update the Request collection
        existingRequest.status = formStatus;
        existingRequest.isActive = true;
        await existingRequest.save();

        // Update the delivery boy's status
        const deliveryBoy = await DeliveryBoy.findOne({ number: deliveryBoyNumber });
        if (deliveryBoy) {
            deliveryBoy.isActive = scrapSold === "true";
            await deliveryBoy.save();
        }

        res.status(201).json({
            message: "Delivery form submitted successfully",
            deliveryForm,
        });
    } catch (error) {
        console.error("Error submitting delivery form:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
