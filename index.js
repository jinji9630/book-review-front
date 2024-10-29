import React, { useState, useEffect } from 'react';
import { createClient } from "postchain-client";
import { v4 as uuidv4 } from 'uuid';

const App = () => {
  const [books, setBooks] = useState([]);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentBook, setCurrentBook] = useState(null);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [reviews, setReviews] = useState({});
  const [bReviewer_Name, setBReviewer_Name] = useState('');
  const [pageUpdate, setPageUpdate] = useState(false);

  useEffect(() => {
    const loadBooks = async () => {
      const savedBooks = JSON.parse(localStorage.getItem('books'));
      if (savedBooks) {
        setBooks(savedBooks);
      }
      const client = await createClient({
        nodeUrlPool: "http://localhost:7740",
        blockchainRid: "5DBF34DAE13460D581771389CD1080B513A9674FDDB4D2CA8451E512871CAA1B",
      });

      try {
        const fetchedBooks = await client.query("get_all_books", {});
        setBooks(fetchedBooks);
      } catch (error) {
        console.error("Query error:", error);
      }
    };

    loadBooks();
  }, [pageUpdate]);

  useEffect(() => {
    const getReview = async () => {
      const bookID = localStorage.getItem("bookID");
      if (bookID) {
        const client = await createClient({
          nodeUrlPool: "http://localhost:7740",
          blockchainRid: "5DBF34DAE13460D581771389CD1080B513A9674FDDB4D2CA8451E512871CAA1B",
        });
        try {
          const reviewsData = await client.query("get_all_reviews_for_book", { 'isbn': bookID });
          setReviews(prev => ({ ...prev, [bookID]: reviewsData }));
        } catch (error) {
          console.error("Query error:", error);
        }
      }
    };

    getReview();
  }, [pageUpdate]);

  const handleAddOrUpdateBook = async () => {
    if (editingIndex !== null) {
      const updatedBooks = books.map((book, index) =>
        index === editingIndex ? { ...book, title, author, isbn } : book
      );
      setBooks(updatedBooks);
      setEditingIndex(null);
    } else {
      const isbn = uuidv4();
      const newBook = { title, author, isbn };
      setBooks([...books, newBook]);

      const client = await createClient({
        nodeUrlPool: "http://localhost:7740",
        blockchainRid: "5DBF34DAE13460D581771389CD1080B513A9674FDDB4D2CA8451E512871CAA1B",
      });
      await client.sendTransaction({
        name: "create_book",
        args: [isbn, title, author],
      });
      setPageUpdate(prev => !prev);
      alert('Book created successfully!');
    }
    setTitle('');
    setAuthor('');
    setIsbn('');
  };

  const handleEditBook = (index) => {
    setEditingIndex(index);
    setTitle(books[index].title);
    setAuthor(books[index].author);
    setIsbn(books[index].isbn);
  };

  const handleDeleteBook = (index) => {
    setBooks(books.filter((_, i) => i !== index));
    const updatedReviews = { ...reviews };
    delete updatedReviews[books[index].isbn];
    setReviews(updatedReviews);
  };

  const handleViewReviews = (book) => {
    localStorage.setItem("bookID", book.isbn);
    setCurrentBook(book);
    setNewReview('');
    setNewRating(0);
  };

  const handleBackToBooks = () => {
    setCurrentBook(null);
    setNewReview('');
    setNewRating(0);
  };

  const handleAddReview = async () => {
    if (newReview.trim() === '' || newRating === 0) return;

    const reviewData = {
      rating: newRating,
      message: newReview,
    };

    const client = await createClient({
      nodeUrlPool: "http://localhost:7740",
      blockchainRid: "5DBF34DAE13460D581771389CD1080B513A9674FDDB4D2CA8451E512871CAA1B",
    });
    await client.sendTransaction({
      name: "create_book_review",
      args: [currentBook.isbn, bReviewer_Name, newReview, newRating],
    });

    setPageUpdate(prev => !prev);
    alert('Review added successfully!');

    setNewReview('');
    setNewRating(0); // Reset rating
  };

  return (
    <div style={styles.container}>
      {currentBook ? (
        <div>
          <input
            type="text"
            value={bReviewer_Name}
            onChange={(e) => setBReviewer_Name(e.target.value)}
            placeholder="Your name..."
            style={styles.input}
          />
          <input
            type="text"
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            placeholder="Add a review..."
            style={styles.inputreview}
          />
          <div style={styles.ratingContainer}>
            <span>Rating:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                style={{
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: newRating >= star ? 'gold' : 'gray',
                }}
                onClick={() => setNewRating(star)}
              >
                ★
              </span>
            ))}
          </div>
          <button onClick={handleAddReview} style={styles.button}>Submit Review</button>
          <button onClick={handleBackToBooks} style={styles.buttonBack}>Go Back</button>
          <h3>Reviews:</h3>
          <ul style={styles.list}>
            {(reviews[currentBook.isbn] || []).map((review, index) => (
              <li key={index} style={styles.listItem}>
                <span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} - {review.review} <b>@{review.reviewer_name}</b></span>
              </li>
            ))}
            {(!reviews[currentBook.isbn] || reviews[currentBook.isbn].length === 0) && (
              <li style={styles.listItem}>No reviews yet.</li>
            )}
          </ul>
        </div>
      ) : (
        <div>
          <header style={styles.header}>
            <span style={styles.emoji}>📚</span>
            <h1 style={styles.title}>Book Manager</h1>
          </header>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter book title"
            style={styles.input}
          />
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Enter author name"
            style={styles.input}
          />
          
          <button onClick={handleAddOrUpdateBook} style={styles.button}>
            {editingIndex !== null ? 'Update Book' : 'Add Book'}
          </button>
          <ul style={styles.list}>
            {books.map((book, index) => (
              <li key={index} style={styles.listItem}>
                {book.title} by {book.author} (ISBN: {book.isbn})
                <button onClick={() => handleViewReviews(book)} style={styles.reviewButton}>View Reviews</button>
                <button onClick={() => handleEditBook(index)} style={styles.editButton}>✏️</button>
                <button onClick={() => handleDeleteBook(index)} style={styles.deleteButton}>❌</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  emoji: {
    fontSize: '50px',
    marginRight: '10px',
  },
  title: {
    fontSize: '24px',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    width: '200px',
    marginRight: '10px',
  },
  inputreview: {
    padding: '5px',
    fontSize: '14px',
    width: '400px',
    height: '80px',
    margin: '5px',
  },
  button: {
    padding: '10px 15px',
    fontSize: '16px',
    backgroundColor: 'purple',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    marginTop: '10px',
  },
  buttonBack: {
    
    padding: '10px 15px',
    fontSize: '16px',
    backgroundColor: 'black',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    marginTop: '10px',
    margin:2,
    borderRadius:'75%  70% 10% 70%',
    fontWeight: 'bold'
  },
  ratingContainer: {
    marginTop: '10px',
  },
  list: {
    listStyleType: 'none',
    padding: 0,
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '5px 0',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
  },
  reviewButton: {
    marginLeft: '10px',
    backgroundColor: 'green',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
  editButton: {
    marginLeft: '10px',
    backgroundColor: 'blue',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
  deleteButton: {
    marginLeft: '10px',
    backgroundColor: 'red',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
};

export default App;
