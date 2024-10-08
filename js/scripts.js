// Function to handle login
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  // Check if loginForm exists before adding event listener
  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      fetch('/api/auth/login', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password }) 
      })
      .then(response => response.json())
      .then(data => {
          if (data.token) {
              localStorage.setItem('token', data.token);
              alert('Login successful');
              window.location.href = 'index.html'; 
          } else {
              alert(data.message);
          }
      })
      .catch(error => console.error('Error:', error));
    });
  }

  // Check if signupForm exists before adding event listener
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;

      fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password, role }),
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              window.location.href = 'login.html';
          } else {
              alert('Signup failed');
          }
      })
      .catch(error => console.error('Error:', error));
    });
  }

  function checkUserRole() {
    const userToken = localStorage.getItem('token');
    if (userToken) {
        const decodedToken = parseJwt(userToken);
        return decodedToken.role;
    }
    return null;
  }

  // Decode JWT token (to get role)
  function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = decodeURIComponent(atob(base64Url).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(base64);
  }

  // Show add book section if the user is a librarian
  window.onload = function () {
    const role = checkUserRole();
    if (role === 'LIBRARIAN') {
        document.getElementById('addBookSection').style.display = 'block';
    }

    // Fetch books and display them in the list
    fetchBooks();

    // Handle book adding if the user is a librarian
    const addBookForm = document.getElementById('addBookForm');
    if (addBookForm) {
      addBookForm.addEventListener('submit', function (e) {
        e.preventDefault();
        
        const title = document.getElementById('title').value;
        const author = document.getElementById('author').value;
        const isbn = document.getElementById('isbn').value;

        const userToken = localStorage.getItem('token'); 

        fetch('/api/books/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ title, author, isbn }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Book added successfully!');
                fetchBooks(); 
            } else {
                alert('Failed to add book');
            }
        })
        .catch(error => console.error('Error:', error));
      });
    }
  }

  // Function to fetch and display books
  function fetchBooks() {
    fetch('/api/books/view', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
    })
    .then(response => response.json())
    .then(data => {
      const bookList = document.getElementById('bookList');
      bookList.innerHTML = ''; 
      window.booksData = data; 

      // Display all books initially
      displayBooks(data);
    })
    .catch(error => console.error('Error:', error));
  }

  function displayBooks(books) {
    const bookList = document.getElementById('bookList');
    bookList.innerHTML = ''; 
    // Dynamically insert books into the list
    books.forEach(book => {
      const li = document.createElement('li');
      li.className = 'list-group-item';
      li.textContent = `${book.title} by ${book.author} (ISBN: ${book.isbn})`;
      
      // Create buttons based on user role
      const role = checkUserRole();
      if (role === 'MEMBER') {
          const borrowButton = document.createElement('button');
          borrowButton.className = 'btn btn-success btn-sm ml-3';
          borrowButton.textContent = 'Borrow';
          borrowButton.onclick = () => borrowBook(book._id);
          li.appendChild(borrowButton);
      } else if (role === 'LIBRARIAN') {
          const updateButton = document.createElement('button');
          updateButton.className = 'btn btn-warning btn-sm ml-3';
          updateButton.textContent = 'Update';
          updateButton.onclick = () => showUpdateForm(book);
          li.appendChild(updateButton);

          const removeButton = document.createElement('button');
          removeButton.className = 'btn btn-danger btn-sm ml-3';
          removeButton.textContent = 'Remove';
          removeButton.onclick = () => removeBook(book._id);
          li.appendChild(removeButton);
      }
      bookList.appendChild(li);
    });
  }

  function searchBooks() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const filteredBooks = window.booksData.filter(book => {
        return book.title.toLowerCase().includes(searchInput) || 
               book.author.toLowerCase().includes(searchInput);
    });
    displayBooks(filteredBooks);
  }

  // Call fetchBooks when the page loads
  document.addEventListener('DOMContentLoaded', fetchBooks);

  function borrowBook(bookId) {
    fetch(`/api/history/borrow/${bookId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchBooks(); 
    })
    .catch(error => console.error('Error:', error));
  }

  function showUpdateForm(book) {
    // Set values in the form fields
    document.getElementById('update-book-id').value = book._id; 
    document.getElementById('update-title').value = book.title;
    document.getElementById('update-author').value = book.author;
    document.getElementById('update-isbn').value = book.isbn;
    document.getElementById('update-status').value = book.status;
    document.getElementById('updateForm').style.display = 'block'; 
  }

  // Function to update a book
  function updateBook() {
    const bookId = document.getElementById('update-book-id').value;
    const title = document.getElementById('update-title').value;
    const author = document.getElementById('update-author').value;
    const isbn = document.getElementById('update-isbn').value;
    const status = document.getElementById('update-status').value;

    const updatedBook = {
        title,
        author,
        isbn,
        status
    };

    fetch(`/api/books/update/${bookId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedBook)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchBooks();
        document.getElementById('updateForm').style.display = 'none'; 
    })
    .catch(error => console.error('Error:', error));
  }

  // Add event listener to the update button in your update form
  document.getElementById('update-book-btn')?.addEventListener('click', updateBook);

  function removeBook(bookId) {
    fetch(`/api/books/remove/${bookId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchBooks(); 
    })
    .catch(error => console.error('Error:', error));
  }

  function fetchMembers() {
    fetch('/api/members/view', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
    })
    .then(response => {
        if (response.status === 403) {
            // Show no access message if the user is not authorized
            document.getElementById('membersSection').style.display = 'none';
            document.getElementById('noAccessMessage').style.display = 'block';
            return;
        }
        return response.json();
    })
    .then(data => {
        if (data) {
            const memberList = document.getElementById('memberList');
            memberList.innerHTML = '';

            // Dynamically insert members into the list
            data.forEach(member => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = `${member.username} (${member.role})`;
                const role = checkUserRole();
              if (role === 'LIBRARIAN') {
                  const updateButton = document.createElement('button');
                  updateButton.className = 'btn btn-warning btn-sm ml-3';
                  updateButton.textContent = 'Update';
                  updateButton.onclick = () => showMemberupdate(member);
                  li.appendChild(updateButton);

                  const removeButton = document.createElement('button');
                  removeButton.className = 'btn btn-danger btn-sm ml-3';
                  removeButton.textContent = 'Remove';
                  removeButton.onclick = () => removeMember(member._id);
                  li.appendChild(removeButton);
              }

              memberList.appendChild(li);
          });
        }
      })
      .catch(error => console.error('Error:', error));
  }

  // Function to delete the user's account
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', function() {
      fetch('/api/members/me', {
          method: 'DELETE',
          headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
      })
      .then(response => response.json())
      .then(data => {
          alert(data.message);
      })
      .catch(error => console.error('Error:', error));
    });
  }

  function showMemberupdate(member) {
    document.getElementById('update-member-id').value = member._id;
    document.getElementById('update-username').value = member.username;
    document.getElementById('update-role').value = member.role;
    document.getElementById('memberUpdateForm').style.display = 'block';
  }

  // Function to update a member
  function updateMember() {
    const memberId = document.getElementById('update-member-id').value;
    const username = document.getElementById('update-username').value;
    const role = document.getElementById('update-role').value;

    const updatedMember = {
        username,
        role
    };

    fetch(`/api/members/update/${memberId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedMember)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        fetchMembers();
        document.getElementById('memberUpdateForm').style.display = 'none';
    })
    .catch(error => console.error('Error:', error));
  }

  document.getElementById('update-member-btn')?.addEventListener('click', updateMember);

  // Function to remove a member
  function removeMember(memberId) {
      fetch(`/api/members/${memberId}`, {
          method: 'DELETE',
          headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
      })
      .then(response => response.json())
      .then(data => {
          alert(data.message);
          fetchMembers();
      })
      .catch(error => console.error('Error:', error));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const role = checkUserRole();
    if (role === 'LIBRARIAN') {
        fetchMembers();
    } else {
        document.getElementById('membersSection').style.display = 'none';
        document.getElementById('noAccessMessage').style.display = 'block';
    }
  });

  // Fetch and display history
  function fetchHistory() {
    fetch('/api/history/view', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        data.forEach(record => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = `Book: ${record.bookTitle}, Status: ${record.status}, Date: ${record.date}`;
            historyList.appendChild(li);
        });
    })
    .catch(error => console.error('Error:', error));
  }

  // Call fetchHistory() when the history page is loaded
  if (window.location.pathname === '/history.html') {
    fetchHistory();
  }

});
