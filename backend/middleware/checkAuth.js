const jwt = require ('jsonwebtoken');
const dotenv = require("dotenv");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const checkAuth = (req, res, next) => {
    console.log("Auth Middleware Triggered");
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1]; // Extract token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Attach user details to the request
        next(); //Proceed to next middleware or route
    } catch (error) {
        return res.status(403).json({ message: 'Forbidden: Invalid or expired token' });
    }
};

module.exports = checkAuth;