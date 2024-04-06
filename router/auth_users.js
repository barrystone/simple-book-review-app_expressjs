const express = require('express');
const jwt = require('jsonwebtoken');
let books = require('./booksdb.js');
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  return users.includes(username);
};

const authenticatedUser = (username, password) => {
  return users.some(
    (user) => user.username === username && user.password === password
  );
};

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, 'secret_key', (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

async function handleReview(req, res, action) {
  const { isbn } = req.params;
  const { review } = req.body;
  const token = req.session.authorization['token'];

  try {
    const decoded = await verifyToken(token);
    const username = decoded.username;

    if (!books[isbn]) {
      return res.status(404).json({ message: 'ISBN of book not found' });
    }

    switch (action) {
      case 'add':
        if (books[isbn].reviews[username]) {
          return res.status(400).json({ message: 'Review already exists' });
        }
        books[isbn].reviews[username] = review;
        return res.status(200).json({ message: 'Review added successfully' });
      case 'modify':
        if (!books[isbn].reviews[username]) {
          return res.status(400).json({ message: 'Review does not exist' });
        }
        books[isbn].reviews[username] = review;
        return res
          .status(200)
          .json({ message: 'Review modified successfully' });
      case 'delete':
        if (!books[isbn].reviews[username]) {
          return res.status(400).json({ message: 'Review does not exist' });
        }
        delete books[isbn].reviews[username];
        return res.status(200).json({ message: 'Review deleted successfully' });
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

regd_users.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (authenticatedUser(username, password)) {
    try {
      const token = jwt.sign({ username }, 'secret_key', {
        expiresIn: 60 * 60
      });
      req.session.authorization = {
        token,
        username
      };

      return res.status(200).send('User successfully logged in');
    } catch (error) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  return res.status(401).json({ message: 'Invalid credentials' });
});

// Add a book review
regd_users.post('/auth/review/:isbn', async (req, res) =>
  handleReview(req, res, 'add')
);

// Modify a book review
regd_users.put('/auth/review/:isbn', async (req, res) =>
  handleReview(req, res, 'modify')
);

// Delete a book review
regd_users.delete('/auth/review/:isbn', async (req, res) =>
  handleReview(req, res, 'delete')
);

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
