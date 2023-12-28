const jwt = require('jsonwebtoken');

const secretKey = 'secret-key-xxxxx'; // Change this to a secure secret key for production

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization-token'];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    req.user = user;
    next();
  });
};

module.exports = { verifyToken };