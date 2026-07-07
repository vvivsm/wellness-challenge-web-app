# SOULSIP - Wellness Challenge Web App

A full-stack wellness challenge platform that encourages users to build healthy habits through challenges, progress tracking, points, reviews, and gamified rewards.

The application allows users to register, log in securely, participate in wellness challenges, track their progress, earn points, and interact with features such as badges, quests, and reviews. It is designed to demonstrate secure authentication, frontend-to-backend integration, database-driven functionality, and interactive user experiences.

## Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Getting Started](#getting-started)
* [Environment Variables](#environment-variables)
* [Usage](#usage)
* [Security](#security)
* [API Integration](#api-integration)
* [Future Enhancements](#future-enhancements)
* [Project Note](#project-note)

## Overview

The Wellness Challenge Web App is a full-stack web application built to make wellness activities more engaging through gamification.

Users can complete wellness-related challenges, earn points, view their progress, and leave reviews on completed activities. The platform combines a responsive frontend interface with a backend server and MySQL database to manage users, challenges, progress, reviews, and rewards.

This project focuses on building a smooth user experience while maintaining secure backend functionality and clean application structure.

## Features

### Authentication

* User registration
* User login
* JWT-based session handling
* Password hashing using bcrypt
* Protected user actions

### Wellness Challenges

* View wellness challenges
* Create new challenges
* Track challenge progress
* Complete challenges
* Earn points from completed activities

### Gamification

* Points system
* Badges, quests, or rewards
* Progress-based user engagement
* Interactive features to encourage consistent participation

### Reviews

* Add reviews for challenges or completed activities
* Submit 1 to 5 star ratings
* View reviews from other users
* Edit own reviews
* Delete own reviews

### User Interface

* Clean and user-friendly pages
* Interactive JavaScript functionality
* Dynamic content rendering
* Form validation and feedback messages
* Smooth frontend-to-backend communication

## Tech Stack

### Frontend

* HTML
* CSS
* JavaScript
* Fetch API / Axios

### Backend

* Node.js
* Express.js
* MySQL
* JWT
* bcrypt

### Development Tools

* Git
* GitHub
* Visual Studio Code
* MySQL Workbench
* Postman

## Project Structure

```bash
wellness-challenge-web-app/
│
├── public/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── challenges.html
│   ├── reviews.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── auth.js
│       ├── challenges.js
│       ├── reviews.js
│       └── main.js
│
├── src/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   └── services/
│
├── .env
├── .gitignore
├── package.json
├── server.js
└── README.md
```

> The actual folder structure may vary depending on the final implementation.

## Getting Started

Follow the steps below to run the project locally.

### Prerequisites

Make sure you have the following installed:

* Node.js
* MySQL
* Git
* npm

### Installation

Clone the repository:

```bash
git clone https://github.com/your-username/wellness-challenge-web-app.git
```

Navigate into the project folder:

```bash
cd wellness-challenge-web-app
```

Install dependencies:

```bash
npm install
```

Set up the MySQL database using the provided SQL schema or database scripts.

Create a `.env` file in the root directory and add the required environment variables.

Start the development server:

```bash
npm start
```

Open the application in your browser:

```bash
http://localhost:3000
```

## Environment Variables

Create a `.env` file in the root directory and configure the following values:

```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret
```

Do not commit the `.env` file to GitHub.

## Usage

### Public Users

Before logging in, users can:

* View the landing page
* Register for an account
* Log in to an existing account
* View any publicly available content

### Authenticated Users

After logging in, users can:

* Access protected features
* View and manage wellness challenges
* Track progress
* Complete challenges
* Earn and view points
* Interact with gamified features
* Create, edit, and delete their own reviews

## Security

This project implements basic security practices for user authentication and data protection.

### Password Hashing

Passwords are hashed using bcrypt before being stored in the database. This prevents plain-text passwords from being saved.

### JWT Authentication

JWT is used to authenticate users and manage sessions. Protected routes require a valid token before allowing access.

### Protected User Actions

Certain actions, such as creating reviews, editing reviews, deleting reviews, and accessing user-specific data, require authentication.

### Environment Variables

Sensitive configuration values, such as database credentials and JWT secrets, are stored in environment variables.

## API Integration

The frontend communicates with the backend through HTTP requests.

Examples of backend interactions include:

* Registering users
* Logging in users
* Fetching wellness challenges
* Creating new challenges
* Updating challenge progress
* Submitting reviews
* Editing reviews
* Deleting reviews
* Retrieving points and gamification data

## Error Handling

The application handles common errors such as:

* Missing required fields
* Invalid login credentials
* Unauthorized access
* Invalid or expired tokens
* Failed database queries
* Failed frontend requests

User-friendly messages are shown where appropriate to improve the overall experience.

## Future Enhancements

Planned or possible improvements include:

* Responsive mobile-first design improvements
* User profile page
* Leaderboard system
* Challenge categories and filtering
* Admin dashboard
* More advanced badge and reward logic
* Deployment to a cloud hosting platform
* Improved accessibility
* Unit and integration testing

## Project Note

This project was developed as part of an academic full-stack web development assignment and has been adapted for portfolio presentation.
