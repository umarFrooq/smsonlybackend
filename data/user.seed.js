const bcrypt = require('bcryptjs');
const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);
const users = [
  {
    fullname: 'Admin User',
    email: 'admin@example.com',
    password: hashedPassword,
    role: 'admin',
  },
  {
    fullname: 'Supplier User',
    email: 'supplier@example.com',
    password: hashedPassword,
    role: 'supplier',
  },
  {
    fullname: 'Supplier 1 User',
    email: 'supplier1@example.com',
    password: hashedPassword,
    role: 'supplier',
  },
  {
    fullname: 'Supplier 2',
    email: 'supplier2@example.com',
    password: hashedPassword,
    role: 'supplier',
  },
  {
    fullname: 'Supplier 3',
    email: 'supplier3@example.com',
    password: hashedPassword,
    role: 'supplier',
  },
  
  {
    name: 'John Doe',
    email: 'john@example.com',
    password:hashedPassword,
    role: 'user',
  },
  {
    name: 'User',
    email: 'user@example.com',
    password: hashedPassword,
    role: 'user',
  },
  {
    name: 'User 1',
    email: 'user1@example.com',
    password: hashedPassword,
    role: 'user',
  },
]
module.exports = {
  users
};
