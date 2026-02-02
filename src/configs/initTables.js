// Name: Vivian Tan Xiu Li
// StudentID: 2518268
// Class: DAAA/FT/1B/06

const pool = require("../services/db");

const bcrypt = require("bcrypt");
const saltRounds = 10;

// Import env
require('dotenv').config();

//Import parameters from .env
const pepper = process.env.BCRYPT_PEPPER

const callback = (error, results, fields) => {
  if (error) {
    console.error("Error creating tables:", error);
  } else {
    console.log("Tables created successfully");
  }
  process.exit();
}

bcrypt.hash('1234' + pepper, saltRounds, (error, hash) => {
  if (error) {
    console.error("Error hashing password:", error);
  } else {
    console.log("Hashed password:", hash);

    const INIT_DB_SQL = `
    DROP TABLE IF EXISTS UserCraftedRecipes;
    DROP TABLE IF EXISTS RecipeRequirements;
    DROP TABLE IF EXISTS Recipes;
    DROP TABLE IF EXISTS UserIngredients;
    DROP TABLE IF EXISTS Ingredients;
    DROP TABLE IF EXISTS UserCompletion;
    DROP TABLE IF EXISTS Wellnesschallenge;
    DROP TABLE IF EXISTS Users;

    CREATE TABLE Users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL, 
      created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      points INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE Wellnesschallenge (
      id INT AUTO_INCREMENT PRIMARY KEY,
      creator_id INT NOT NULL,
      description TEXT NOT NULL,
      points INT NOT NULL,
      type VARCHAR(20) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE UserCompletion (
      id INT AUTO_INCREMENT PRIMARY KEY,
      challenge_id INT NOT NULL,
      user_id INT NOT NULL,
      details TEXT,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE Ingredients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      cost INT NOT NULL,
      type VARCHAR(20) NOT NULL
    );

    CREATE TABLE UserIngredients (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      ingredient_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 0
    );

    CREATE TABLE Recipes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE RecipeRequirements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      recipe_id INT NOT NULL,
      ingredient_id INT NOT NULL,
      required_qty INT NOT NULL
    );

    CREATE TABLE UserCraftedRecipes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      recipe_id INT NOT NULL,
      crafted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO Users (username, email, password, points, created_at) VALUES
    ('soc123', 'soc123@test.com', 'ubuntu123', 1000000, NOW());

    INSERT INTO Wellnesschallenge (creator_id, description, points, type)
    VALUES
    -- SLEEP 
    (1, 'Sleep 7+ hours tonight', 10, 'sleep'),
    (1, 'No caffeine after 3pm', 10, 'sleep'),
    (1, 'No screens 30 minutes before bed', 15, 'sleep'),
    (1, 'Sleep and wake up at consistent time (±30 mins)', 20, 'sleep'),

    -- PHYSICAL 
    (1, 'Take 8,000 steps today', 20, 'physical'),
    (1, 'Do a 15-minute stretch or mobility routine', 15, 'physical'),
    (1, 'Do 20 squats + 10 push-ups (any variation)', 20, 'physical'),
    (1, 'Take the stairs at least once today', 10, 'physical'),

    -- MENTAL 
    (1, 'Write down 3 things you are grateful for', 10, 'mental'),
    (1, 'Do 5 minutes of deep breathing / meditation', 15, 'mental'),
    (1, 'Journal for 5 minutes about your day', 15, 'mental'),
    (1, 'Do a 10-minute “focus session” with no phone', 20, 'mental'),

    -- SOCIAL 
    (1, 'Send a kind message to a friend', 10, 'social'),
    (1, 'Have a 10-minute face-to-face conversation', 20, 'social'),
    (1, 'Help someone with a small task today', 15, 'social'),
    (1, 'Compliment someone sincerely today', 10, 'social');

    INSERT INTO Ingredients (name, cost, type) VALUES
    -- SLEEP 
    ('Chamomile Petals', 10, 'sleep'),
    ('Lavender Buds', 12, 'sleep'),
    ('Warm Almond Milk', 14, 'sleep'),

    -- PHYSICAL 
    ('Lean Chicken', 14, 'physical'),
    ('Fresh Ginger Root', 12, 'physical'),
    ('Power Carrot', 10, 'physical'),

    -- MENTAL 
    ('Forest Mushroom', 12, 'mental'),
    ('Focus Spinach', 10, 'mental'),
    ('Mindful Seaweed', 14, 'mental'),

    -- SOCIAL 
    ('Friendly Tomato', 10, 'social'),
    ('Golden Sweet Corn', 12, 'social'),
    ('Sharing Noodles', 14, 'social');

    INSERT INTO Recipes (name, description) VALUES
    ('Sleepy Night Milk Soup', 'A calming soup to help you unwind and prepare for restful sleep.'),
    ('Ginger Chicken Boost Soup', 'A hearty soup to energise the body and support physical wellness.'),
    ('Focus Forest Soup', 'A light soup that supports focus and mental clarity.'),
    ('Tomato Corn Comfort Soup', 'A warm, comforting soup best enjoyed with friends.'),
    ('Cozy Recharge Soup', 'A balanced soup that restores energy, focus, and connection.');

    INSERT INTO RecipeRequirements (recipe_id, ingredient_id, required_qty) VALUES
    -- Sleepy Night Milk Soup 
    (1, 1, 1),  -- Chamomile Petals
    (1, 2, 1),  -- Lavender Buds
    (1, 3, 1),  -- Warm Almond Milk

    -- Ginger Chicken Boost Soup
    (2, 4, 1),  -- Lean Chicken
    (2, 5, 1),  -- Fresh Ginger Root
    (2, 6, 1),  -- Power Carrot

    -- Focus Forest Soup
    (3, 7, 1),  -- Forest Mushroom
    (3, 8, 1),  -- Focus Spinach
    (3, 9, 1),  -- Mindful Seaweed

    -- Tomato Corn Comfort Soup
    (4, 10, 1), -- Friendly Tomato
    (4, 11, 1), -- Golden Sweet Corn
    (4, 12, 1), -- Sharing Noodles

    -- Cozy Recharge Soup 
    (5, 2, 1),  -- Lavender Buds
    (5, 5, 1),  -- Fresh Ginger Root
    (5, 8, 1),  -- Focus Spinach
    (5, 10, 1); -- Friendly Tomato

    `;

    // Initialise database
    pool.query(INIT_DB_SQL, (error, results) => {
      if (error) {
        console.error("Error initialising database:", error);
        process.exit(1);
      }

      console.log("Database initialised successfully:", results);
      process.exit(0);
    });

  }
});
