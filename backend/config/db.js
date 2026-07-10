const pg = require('pg');
const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let dbClient = null;
let isSQLite = false;

// Configuration
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'wealthavatar',
  // Short connection timeout for fast failover to SQLite
  connectionTimeoutMillis: 2000
};

// Database interface
const db = {
  query: async (text, params = []) => {
    if (isSQLite) {
      return new Promise((resolve, reject) => {
        dbClient.all(text, params, (err, rows) => {
          if (err) {
            console.error('SQLite Query Error:', err.message, 'Query:', text);
            reject(err);
          } else {
            resolve({ rows });
          }
        });
      });
    } else {
      try {
        // Automatically convert '?' parameters to PostgreSQL '$1', '$2', etc.
        let paramCount = 0;
        const pgText = text.replace(/\?/g, () => {
          paramCount++;
          return `$${paramCount}`;
        });
        return await dbClient.query(pgText, params);
      } catch (err) {
        console.error('PostgreSQL Query Error:', err.message, 'Query:', text);
        throw err;
      }
    }
  },
  execute: async (text, params = []) => {
    if (isSQLite) {
      return new Promise((resolve, reject) => {
        dbClient.run(text, params, function (err) {
          if (err) {
            console.error('SQLite Run Error:', err.message, 'Query:', text);
            reject(err);
          } else {
            resolve({ lastID: this.lastID, changes: this.changes });
          }
        });
      });
    } else {
      try {
        // Automatically convert '?' parameters to PostgreSQL '$1', '$2', etc.
        let paramCount = 0;
        const pgText = text.replace(/\?/g, () => {
          paramCount++;
          return `$${paramCount}`;
        });
        const result = await dbClient.query(pgText, params);
        return { lastID: result.insertId || null, changes: result.rowCount };
      } catch (err) {
        console.error('PostgreSQL Execute Error:', err.message, 'Query:', text);
        throw err;
      }
    }
  },
  isSQLite: () => isSQLite
};

async function initializeDatabase() {
  try {
    console.log('Attempting to connect to PostgreSQL...');
    const pool = new pg.Pool(dbConfig);
    // Test connection
    const client = await pool.connect();
    client.release();
    dbClient = pool;
    isSQLite = false;
    console.log('Successfully connected to PostgreSQL database!');
  } catch (error) {
    console.warn('PostgreSQL connection failed. Falling back to SQLite local database.', error.message);
    const sqlitePath = path.join(__dirname, '..', 'wealthavatar.db');
    dbClient = new sqlite3.Database(sqlitePath);
    isSQLite = true;
    console.log(`SQLite database file path: ${sqlitePath}`);
  }

  // Define database schemas and seed tables
  await createTables();
  await seedData();
}

async function createTables() {
  const usersTable = isSQLite ? `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      risk_profile TEXT DEFAULT 'Moderate',
      monthly_income REAL DEFAULT 100000,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  ` : `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      risk_profile VARCHAR(50) DEFAULT 'Moderate',
      monthly_income NUMERIC(15, 2) DEFAULT 100000.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const transactionsTable = isSQLite ? `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      merchant_name TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  ` : `
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      amount NUMERIC(15, 2) NOT NULL,
      category VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      merchant_name VARCHAR(100) NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const portfoliosTable = isSQLite ? `
    CREATE TABLE IF NOT EXISTS portfolios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      asset_class TEXT NOT NULL,
      asset_name TEXT NOT NULL,
      units REAL NOT NULL,
      purchase_price REAL NOT NULL,
      current_value REAL NOT NULL,
      last_updated TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  ` : `
    CREATE TABLE IF NOT EXISTS portfolios (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      asset_class VARCHAR(50) NOT NULL,
      asset_name VARCHAR(100) NOT NULL,
      units NUMERIC(15, 4) NOT NULL,
      purchase_price NUMERIC(15, 2) NOT NULL,
      current_value NUMERIC(15, 2) NOT NULL,
      last_updated DATE NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const goalsTable = isSQLite ? `
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL,
      target_date TEXT NOT NULL,
      monthly_contribution REAL NOT NULL,
      status TEXT DEFAULT 'On Track',
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  ` : `
    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(50) NOT NULL,
      target_amount NUMERIC(15, 2) NOT NULL,
      current_amount NUMERIC(15, 2) NOT NULL,
      target_date DATE NOT NULL,
      monthly_contribution NUMERIC(15, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'On Track',
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const chatSessionsTable = isSQLite ? `
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT DEFAULT 'New Chat',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  ` : `
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title VARCHAR(255) DEFAULT 'New Chat',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const conversationsTable = isSQLite ? `
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_id INTEGER,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );
  ` : `
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
      sender VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  // Create tables sequentially
  if (isSQLite) {
    dbClient.serialize(() => {
      dbClient.run(usersTable);
      dbClient.run(transactionsTable);
      dbClient.run(portfoliosTable);
      dbClient.run(goalsTable);
      dbClient.run(chatSessionsTable);
      dbClient.run(conversationsTable);

      // Safe migration: add session_id if it doesn't exist
      dbClient.all("PRAGMA table_info(conversations)", (err, rows) => {
        if (!err && rows) {
          const hasSessionId = rows.some(row => row.name === 'session_id');
          if (!hasSessionId) {
            dbClient.run("ALTER TABLE conversations ADD COLUMN session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE");
          }
        }
      });
    });
  } else {
    await dbClient.query(usersTable);
    await dbClient.query(transactionsTable);
    await dbClient.query(portfoliosTable);
    await dbClient.query(goalsTable);
    await dbClient.query(chatSessionsTable);
    await dbClient.query(conversationsTable);

    try {
      await dbClient.query("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE");
    } catch (alterErr) {
      console.warn("Postgres alter table warning:", alterErr.message);
    }
  }
  console.log('Database tables verified/created successfully.');
}

async function seedData() {
  // Check if seed user already exists
  const checkUser = await db.query('SELECT * FROM users WHERE email = ? OR email = $1 LIMIT 1', ['rajesh@example.com']);
  if (checkUser.rows.length > 0) {
    console.log('Database already populated. Skipping seed.');
    return;
  }

  console.log('Seeding initial demographic and transactional data...');
  
  // Seed User
  const passwordHash = bcrypt.hashSync('Password123', 10);
  const userQuery = isSQLite 
    ? 'INSERT INTO users (name, email, password_hash, risk_profile, monthly_income) VALUES (?, ?, ?, ?, ?)'
    : 'INSERT INTO users (name, email, password_hash, risk_profile, monthly_income) VALUES ($1, $2, $3, $4, $5)';
  
  const userResult = await db.execute(userQuery, [
    'Rajesh Kumar', 
    'rajesh@example.com', 
    passwordHash, 
    'Moderate', 
    120000.00
  ]);
  
  const userId = isSQLite ? userResult.lastID : (await db.query("SELECT id FROM users WHERE email = $1", ['rajesh@example.com'])).rows[0].id;
  
  // Seed Transactions
  const transactions = [
    // June 2026 Transactions (Recent Month)
    [userId, 1200.00, 'Food', '2026-06-15', 'Zomato Delivery'],
    [userId, 450.00, 'Transport', '2026-06-14', 'Ola Cabs'],
    [userId, 15000.00, 'Bills', '2026-06-10', 'Credit Card Payment'],
    [userId, 24000.00, 'Shopping', '2026-06-08', 'Amazon India (Anomaly: High Electronic Purchase)'],
    [userId, 800.00, 'Entertainment', '2026-06-07', 'Netflix India'],
    [userId, 6000.00, 'Others', '2026-06-05', 'Dr. Lal Pathlabs Medical Checkup'],
    [userId, 3200.00, 'Food', '2026-06-04', 'Barbeque Nation Dinner'],
    [userId, 8000.00, 'Bills', '2026-06-01', 'Tata Power Electricity Bill (Anomaly: 35% higher than avg)'],
    [userId, 5000.00, 'Transport', '2026-06-01', 'HP Petrol Pump Fuel Filling'],
    
    // May 2026 Transactions
    [userId, 1100.00, 'Food', '2026-05-25', 'Swiggy Delivery'],
    [userId, 350.00, 'Transport', '2026-05-22', 'Uber Cabs'],
    [userId, 15000.00, 'Bills', '2026-05-10', 'Credit Card Payment'],
    [userId, 4200.00, 'Shopping', '2026-05-08', 'Myntra Apparel'],
    [userId, 800.00, 'Entertainment', '2026-05-07', 'Netflix India'],
    [userId, 5900.00, 'Bills', '2026-05-02', 'Tata Power Electricity Bill'],
    [userId, 4000.00, 'Transport', '2026-05-01', 'HP Petrol Pump'],
    
    // April 2026 Transactions
    [userId, 950.00, 'Food', '2026-04-26', 'Zomato Delivery'],
    [userId, 500.00, 'Transport', '2026-04-20', 'Ola Cabs'],
    [userId, 15000.00, 'Bills', '2026-04-10', 'Credit Card Payment'],
    [userId, 2500.00, 'Entertainment', '2026-04-09', 'BookMyShow Movie Tickets'],
    [userId, 800.00, 'Entertainment', '2026-04-07', 'Netflix India'],
    [userId, 5500.00, 'Bills', '2026-04-02', 'Tata Power Electricity Bill'],
    [userId, 3000.00, 'Others', '2026-04-01', 'Cash Withdrawal ATM'],
    
    // March 2026 Transactions
    [userId, 1800.00, 'Food', '2026-03-28', 'Dine-out Resto'],
    [userId, 15000.00, 'Bills', '2026-03-10', 'Credit Card Payment'],
    [userId, 6200.00, 'Shopping', '2026-03-05', 'Shoppers Stop Brand Wear'],
    [userId, 800.00, 'Entertainment', '2026-03-07', 'Netflix India'],
    [userId, 5300.00, 'Bills', '2026-03-02', 'Tata Power Electricity Bill'],
    [userId, 4000.00, 'Transport', '2026-03-01', 'HP Petrol Pump'],
    
    // February 2026 Transactions
    [userId, 1200.00, 'Food', '2026-02-15', 'Swiggy Delivery'],
    [userId, 15000.00, 'Bills', '2026-02-10', 'Credit Card Payment'],
    [userId, 800.00, 'Entertainment', '2026-02-07', 'Netflix India'],
    [userId, 5700.00, 'Bills', '2026-02-02', 'Tata Power Electricity Bill'],
    [userId, 4500.00, 'Transport', '2026-02-01', 'Ola Rental'],
    
    // January 2026 Transactions
    [userId, 2200.00, 'Food', '2026-01-20', 'Dining out with Family'],
    [userId, 15000.00, 'Bills', '2026-01-10', 'Credit Card Payment'],
    [userId, 800.00, 'Entertainment', '2026-01-07', 'Netflix India'],
    [userId, 5600.00, 'Bills', '2026-01-02', 'Tata Power Electricity Bill'],
    [userId, 3000.00, 'Shopping', '2026-01-01', 'Local Supermarket']
  ];

  const tQuery = isSQLite
    ? 'INSERT INTO transactions (user_id, amount, category, date, merchant_name) VALUES (?, ?, ?, ?, ?)'
    : 'INSERT INTO transactions (user_id, amount, category, date, merchant_name) VALUES ($1, $2, $3, $4, $5)';
  
  for (const t of transactions) {
    await db.execute(tQuery, t);
  }

  // Seed Portfolio Holdings (Equity, Debt, Gold, Cash)
  // Include SIP structures
  const holdings = [
    [userId, 'Equity', 'Top 100 Mutual Fund (SIP)', 452.12, 110.50, 62500.00, '2026-06-16'],
    [userId, 'Equity', 'Reliance Industries Ltd Stocks', 15.00, 2450.00, 43500.00, '2026-06-16'],
    [userId, 'Equity', 'Infosys Ltd Stocks', 25.00, 1380.00, 39000.00, '2026-06-16'],
    [userId, 'Debt', 'Public Provident Fund (PPF)', 1.00, 220000.00, 220000.00, '2026-06-16'],
    [userId, 'Debt', 'Fixed Deposit (FD)', 1.00, 150000.00, 165000.00, '2026-06-16'],
    [userId, 'Gold', 'Sovereign Gold Bonds (SGB)', 10.00, 6200.00, 74000.00, '2026-06-16'],
    [userId, 'Cash', 'Savings Account Balance', 1.00, 56000.00, 56000.00, '2026-06-16']
  ];

  const pQuery = isSQLite
    ? 'INSERT INTO portfolios (user_id, asset_class, asset_name, units, purchase_price, current_value, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)'
    : 'INSERT INTO portfolios (user_id, asset_class, asset_name, units, purchase_price, current_value, last_updated) VALUES ($1, $2, $3, $4, $5, $6, $7)';

  for (const h of holdings) {
    await db.execute(pQuery, h);
  }

  // Seed Financial Goals
  const goals = [
    [userId, 'Retirement Corpus', 'Retirement', 50000000.00, 450000.00, '2045-12-31', 15000.00, 'On Track'],
    [userId, 'New Dream Home Purchase', 'Home Purchase', 8000000.00, 1200000.00, '2030-06-30', 25000.00, 'Behind'],
    [userId, 'Higher Education for Daughter', 'Education', 2500000.00, 800000.00, '2035-09-30', 10000.00, 'On Track'],
    [userId, 'Emergency Fund (6 Months)', 'Emergency Fund', 600000.00, 560000.00, '2026-12-31', 5000.00, 'On Track']
  ];

  const gQuery = isSQLite
    ? 'INSERT INTO goals (user_id, name, type, target_amount, current_amount, target_date, monthly_contribution, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    : 'INSERT INTO goals (user_id, name, type, target_amount, current_amount, target_date, monthly_contribution, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';

  for (const g of goals) {
    await db.execute(gQuery, g);
  }

  console.log('Seeding completed successfully!');
}

module.exports = {
  db,
  initializeDatabase
};
