# 🥣 Wellness Quest – Backend Web Development CA2

## Module
**ST0503 – Backend Web Development**  
**Academic Year:** 2025 / 2026 Semester 2  
**Assignment:** CA2 (Individual)

---

## 📌 Project Overview

**Wellness Quest** is a gamified wellness challenge web application built on top of the CA1 backend server.  
Users can register, log in securely, complete wellness challenges, earn points, and interact with gamification features such as crafting, inventory, and rewards.

This project focuses on **frontend development and frontend–backend integration**, while enhancing backend security and functionality using **JWT authentication** and **bcrypt password hashing**.

---

## 🎯 Project Objectives

- Build a responsive frontend website that integrates with an existing Node.js + MySQL backend
- Implement secure authentication using JWT and bcrypt
- Allow users to complete wellness challenges and earn points
- Display and update user progress dynamically
- Support gamification features such as crafting, inventory, and rewards
- Apply proper modular coding practices and version control

---

## 🛠️ Tech Stack

### Frontend
- HTML5  
- CSS3  
- JavaScript (Vanilla JS)  
- Bootstrap  
- Fetch API  

### Backend
- Node.js  
- Express.js  
- MySQL  
- JSON Web Token (JWT)  
- bcrypt  

### Tools
- Git & GitHub Classroom  
- MySQL Workbench  
- Visual Studio Code  

---

## 🔐 Key Features

### 1. User Authentication
- User registration and login
- Password hashing using **bcrypt**
- Secure session handling using **JWT**
- Token stored in `localStorage` for authenticated requests

### 2. Wellness Challenges
- View available challenges
- Complete challenges
- Prevent multiple completions
- Earn points upon successful completion

### 3. Points & Gamification
- Dynamic points system
- Points displayed in the navigation bar
- Points used for crafting or unlocking features
- Inventory system for ingredients and crafted items

### 4. Crafting System
- Users can craft items using ingredients
- Ingredients are removed from inventory after crafting
- Crafted items cannot be crafted again
- Crafted status is visually indicated

### 5. Frontend–Backend Integration
- RESTful API calls using Fetch API
- JWT included in request headers
- Real-time UI updates without page reloads

### 6. Error Handling
- User-friendly error messages
- Disabled buttons to prevent duplicate requests
- Graceful handling of invalid or expired tokens

---

## 📂 Project Structure



---

## ⚙️ Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-github-classroom-repo-url>
cd project-root

