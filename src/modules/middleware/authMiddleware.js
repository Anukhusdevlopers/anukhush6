// authMiddleware.js
const jwt = require('jsonwebtoken');

const verifyAuthToken = (req, res, next) => {
    const authToken = req.headers.authorization?.split(" ")[1];

    if (!authToken) {
        return res.status(401).json({
            message: 'Authorization token is required.',
        });
    }

    jwt.verify(authToken, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                message: 'Invalid or expired authorization token.',
                error: err.message,
            });
        }
        
        req.user = decoded; // Store the decoded token information in the request object
        next(); // Proceed to the next middleware or route handler
    });
};

module.exports = verifyAuthToken;
