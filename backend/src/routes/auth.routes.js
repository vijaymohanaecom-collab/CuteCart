const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token validation endpoint
router.get('/validate-token', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ valid: false, message: 'No token provided' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ valid: false, message: 'User not found' });
    }

    // Token is valid
    res.json({ valid: true, user: { id: user._id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }
});

module.exports = router;
