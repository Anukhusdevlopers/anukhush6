const DeliveryBoy = require('../models/DeliveryBoyNew');
const User = require('../models/AnuUser');


const assignDeliveryBoy = async (req, res) => {
    const { userId, latitude, longitude } = req.body;

    try {
        // Fetch the nearest delivery boy within 5 km
        const nearestDeliveryBoy = await DeliveryBoy.findOne({
            isActive: true,
            status: 'current',
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                    $maxDistance: 5000 // 5 km radius
                }
            }
        });

        if (nearestDeliveryBoy) {
            // Assign the delivery boy to the user
            nearestDeliveryBoy.isActive = false; // Mark delivery boy as assigned
            nearestDeliveryBoy.assignedBy = userId;
            await nearestDeliveryBoy.save();

            // Respond with the assigned delivery boy details
            return res.json({
                message: 'Delivery boy assigned successfully',
                deliveryBoy: {
                    name: nearestDeliveryBoy.name,
                    number: nearestDeliveryBoy.number
                }
            });
        } else {
            return res.status(404).json({ message: 'No delivery boy available within 5 km.' });
        }
    } catch (error) {
        console.error('Error in assignDeliveryBoy:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    assignDeliveryBoy,
};
