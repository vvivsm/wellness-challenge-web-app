# BED CA1 – Backend API (Express + MySQL)

This project is a **RESTful backend API** developed for **BED CA1** using **Node.js, Express, and MySQL**.  
It implements a **gamified wellness system** where users can earn points, complete challenges, purchase ingredients, manage inventory, and craft recipes.

The application is built with a **modular MVC-based architecture**, uses middleware for validation and business logic, and is tested using **Postman**.

## Project Structure
```
BED-CA1-VIVSM-SP/
│
├── src/
│ ├── configs/
│ │ ├── createSchema.js # Database schema creation
│ │ └── initTables.js # Table initialization & seed data
│ │
│ ├── controllers/ # Request handling & control flow
│ │ ├── challengeController.js
│ │ ├── completionController.js
│ │ ├── craftController.js
│ │ ├── ingredientController.js
│ │ ├── recipeController.js
│ │ ├── userController.js
│ │ └── userIngredientController.js
│ │
│ ├── middleware/ # Reusable middleware logic
│ │ ├── request.js # Request validation
│ │ └── response.js # Standardised responses
│ │
│ ├── models/ # Database queries (SQL)
│ │ ├── challengeModel.js
│ │ ├── completionModel.js
│ │ ├── ingredientModel.js
│ │ ├── recipeModel.js
│ │ ├── userCraftedRecipeModel.js
│ │ ├── userIngredientModel.js
│ │ └── userModel.js
│ │
│ ├── routes/ # API endpoint definitions
│ │ ├── challengeRoutes.js
│ │ ├── ingredientRoutes.js
│ │ ├── recipeRoutes.js
│ │ ├── userRoutes.js
│ │ └── mainRoutes.js
│ │
│ ├── services/
│ │ └── app.js # Express app & middleware setup
│
├── .env # Environment variables
├── index.js # Application entry point
├── package.json
├── package-lock.json
└── README.md
```

## Architecture Overview

The project follows a **Model–Controller–Route** design:

- **Routes** define RESTful endpoints and attach middleware.
- **Controllers** manage request logic and responses.
- **Models** handle all database queries (SQL).
- **Middleware** enforces validation, business rules, and error handling.
- **Configs** initialize database schema and seed data.

This ensures **clear separation of concerns**, **code reusability**, and **easy maintenance**.

## Technologies Used

- Node.js
- Express.js
- MySQL
- mysql2
- Postman (API testing)

## API Design

The API follows RESTful conventions with consistent URL patterns and HTTP methods.

### Example Endpoints

| Method | Endpoint | Description |
|------|---------|-------------|
| GET | `/users` | Retrieve all users |
| GET | `/users/:user_id/inventory` | Get user inventory |
| POST | `/users/:user_id/ingredients/:ingredient_id/buy` | Purchase ingredient |
| GET | `/ingredients` | Retrieve ingredients |
| GET | `/recipes` | Retrieve recipes |
| POST | `/recipes/craft` | Craft a recipe |
| GET | `/challenges` | Retrieve challenges |

Responses are returned in **JSON format** with appropriate HTTP status codes.

## Middleware Usage

Middleware is used to:
- Validate request data
- Check resource existence (users, ingredients, recipes)
- Enforce business rules (e.g. sufficient points)
- Standardise API responses
- Reduce code duplication

Middleware chaining enables clean workflows such as:
Validate request → Check user → Check ingredient → Deduct points → Update inventory

## Database Design

- Normalised relational database structure
- Junction tables for many-to-many relationships
- Efficient JOIN queries for inventory, recipes, and challenges
- Supports scalable data retrieval and updates

## Error Handling

The API uses structured error handling with clear status codes:

| Status | Scenario |
|------|---------|
| 400 | Invalid or missing request data |
| 403 | Forbidden action (e.g. insufficient points) |
| 404 | Resource not found |
| 409 | Conflict |
| 500 | Internal server error |

Errors are returned as JSON messages for frontend consumption.

## API Testing

All endpoints were tested using **Postman**, including:
- Successful requests
- Validation failures
- Business rule violations
- Error scenarios
 Postman screenshots are included as part of the CA1 submission.

## Author

Vivian Tan Xiu Li
2518268
DAAA/FT/1B/06
BED CA2 – Backend Development
