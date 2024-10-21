const Delivery = require('../models/deliveryboy');

// Create a new delivery task
exports.createDelivery = async (req, res) => {
  try {
    const { deliveryBoyId, orderId, location } = req.body;
    const delivery = new Delivery({ deliveryBoyId, orderId, location });
    await delivery.save();
    res.status(201).json({ message: 'Delivery created successfully!', delivery });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update delivery location/status
exports.updateDelivery = async (req, res) => {
  try {
    const { orderId, location, status } = req.body;
    const delivery = await Delivery.findOneAndUpdate(
      { orderId },
      { location, status },
      { new: true }
    );

    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });

    res.status(200).json({ message: 'Delivery updated successfully!', delivery });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get delivery details
exports.getDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const delivery = await Delivery.findOne({ orderId });

    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });

    res.status(200).json(delivery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
