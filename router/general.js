const express = require('express');
const books = require('./booksdb.js');
const { isValid, users } = require('./auth_users.js');
const public_users = express.Router();

// Register route
public_users.post('/register', async (req, res) => {
  const { username, password, email } = req.body;

  if (isValid(username)) {
    return res
      .status(400)
      .json({ message: 'Username: ' + username + ' already exists' });
  }

  if (!username || !password || !email) {
    return res
      .status(400)
      .json({ message: 'Please fill in all required fields! ' });
  }

  const newUser = { username, password, email };
  users.push(newUser);

  return res
    .status(200)
    .json({ message: 'Registration successful', user: newUser });
});

// Get the book list available in the shop ( Using async callback function )
public_users.get('/', async function (req, res) {
  try {
    const allBooks = await getBooks();
    return res.status(200).json({ books: allBooks });
  } catch (error) {
    console.error('Error fetching books:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

async function getBooks() {
  return new Promise((resolve, reject) => {
    const books = require('./booksdb.js');
    if (!books) {
      return reject('No books found');
    }
    resolve(books);
  });
}

// Get book details based on ISBN ( Using Promise )
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;

  getBookByISBN(isbn)
    .then((book) => res.status(200).json({ book }))
    .catch((error) => {
      console.error('Error fetching book:', error);
      if (error === 'No book found') {
        return res.status(404).json({ message: 'Book not found' });
      }
      return res.status(500).json({ message: 'Internal Server Error' });
    });
});

async function getBookByISBN(isbn) {
  return new Promise((resolve, reject) => {
    const book = books[isbn];
    if (!book) {
      return reject('No book found');
    }
    resolve(book);
  });
}

// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;
  const booksByAuthor = Object.values(books).filter((book) =>
    book.author.toLowerCase().includes(author.toLowerCase())
  );
  if (booksByAuthor.length > 0) {
    return res.status(200).json({ books: booksByAuthor });
  }

  return res
    .status(404)
    .json({ message: 'No books found by the author: ' + author });
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title;
  const booksWithTitle = Object.values(books).filter((book) =>
    book.title.toLowerCase().includes(title.toLowerCase())
  );

  if (booksWithTitle.length > 0) {
    return res.status(200).json({ books: booksWithTitle });
  }

  return res
    .status(404)
    .json({ message: 'No books found with the title: ' + title });
});

// Get book review
public_users.get('/review/:isbn', async function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }

  return res.status(200).json({ reviews: book.reviews });
});

module.exports.general = public_users;
