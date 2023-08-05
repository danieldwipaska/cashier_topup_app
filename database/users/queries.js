const addUser = 'INSERT INTO users (id, username, password, position, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())';
const getUsers = 'SELECT * FROM users';
const getUserByUsername = 'SELECT * FROM users WHERE username = $1';
const getUserById = 'SELECT * FROM users WHERE id = $1';
const deleteUserById = 'DELETE FROM users WHERE id = $1';
// const checkEmailExists = 'SELECT s FROM students s WHERE s.email = $1';
// const removeStudent = 'DELETE FROM students WHERE id = $1';
// const updateBalance = 'UPDATE cards SET balance = $1, updated_at = NOW() WHERE barcode = $2 RETURNING *';

module.exports = {
  addUser,
  getUsers,
  getUserByUsername,
  getUserById,
  deleteUserById,
  //   checkEmailExists,

  //   removeStudent,
  //   updateStudent,
};
