# CartNova 🛍️

### A Full-Stack E-Commerce Platform

CartNova is a full-stack e-commerce web application where users can explore products, place orders, and track their order status. It also includes an admin dashboard to manage products and customer orders.

## ✨ Features

* 🔐 User registration and login
* 🛒 Browse and view products
* 📦 Place and manage orders
* 📋 Track order status
* 🛠️ Admin dashboard
* ➕ Add, edit, and delete products
* 📊 Admin order management
* 🔒 Role-based access for admin and users

## 💻 Tech Stack

**Frontend**

* React.js
* Vite
* HTML
* CSS
* JavaScript

**Backend**

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication

## 📁 Project Structure

```text
CartNova/
├── backend/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   └── server.js
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── pages/
│       ├── App.jsx
│       └── main.jsx
│
└── README.md
```

## ⚙️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/renukatikhat/cartnova.git
cd cartnova
```

### 2. Start the backend

```bash
cd backend
npm install
```

Configure your MongoDB connection and JWT secret in `backend/.env`, using the environment variable names expected by the backend code.

Start the server:

```bash
node server.js
```

### 3. Start the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite in your browser.

## 🎯 Project Goal

The goal of CartNova is to build a practical e-commerce application while learning full-stack web development, REST APIs, database integration, authentication, and admin-side management.

## 👩‍💻 Developer

**Renuka Tikhat**
Computer Science and Engineering Student

[GitHub Profile](https://github.com/renukatikhat)

---

*Built as a full-stack development project.*
