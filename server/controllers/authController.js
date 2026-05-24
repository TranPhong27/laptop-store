const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token: generateToken(user._id),
});

const verifyGoogleCredential = async (credential) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
  );

  if (!response.ok) {
    throw new Error('Invalid Google credential');
  }

  const payload = await response.json();
  if (payload.aud !== googleClientId) {
    throw new Error('Google credential audience mismatch');
  }

  if (payload.email_verified !== 'true' && payload.email_verified !== true) {
    throw new Error('Google email is not verified');
  }

  return payload;
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password });
    res.status(201).json(userResponse(user));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && await user.matchPassword(password)) {
      return res.json(userResponse(user));
    }
    res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const payload = await verifyGoogleCredential(credential);
    const email = payload.email.toLowerCase();

    let user = await User.findOne({ email });
    if (user) {
      user.googleId = payload.sub;
      user.authProvider = user.authProvider || 'google';
      if (!user.name && payload.name) user.name = payload.name;
      await user.save();
    } else {
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        password: `${crypto.randomBytes(24).toString('base64')}Aa1!`,
        authProvider: 'google',
        googleId: payload.sub,
      });
    }

    res.json(userResponse(user));
  } catch (err) {
    res.status(401).json({ message: err.message || 'Google login failed' });
  }
};
