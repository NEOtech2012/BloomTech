require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL Connection Setup
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test Database Connection
pool.connect((err) => {
    if (err) {
        console.error('Database connection error ❌', err.stack);
    } else {
        console.log('Connected to PostgreSQL successfully! ✅');
    }
});

// Middleware
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Basic Route
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects ORDER BY id DESC');
        res.render('index', { projects: result.rows });
    } catch (err) {
        console.error(err);
        res.send("Error retrieving data from database");
    }
});

// About Page Route
app.get('/about', (req, res) => {
    res.render('about');
});

app.post('/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;

    try {
        // 1. Save the inquiry to your PostgreSQL database
        await pool.query(
            'INSERT INTO messages (sender_name, sender_email, sender_phone, message_text) VALUES ($1, $2, $3, $4)',
            [name, email, phone, message]
        );

        // 2. Redirect to your internal success page
        // This stops it from opening WhatsApp and keeps them on BloomTech
        res.redirect('/success');

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Add this to your app.js
app.get('/success', (req, res) => {
    res.render('success'); 
});

// Update your contact POST route
app.post('/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;
    try {
        await pool.query(
            'INSERT INTO messages (sender_name, sender_email, sender_phone, message_text) VALUES ($1, $2, $3, $4)',
            [name, email, phone, message]
        );
        
        // Instead of WhatsApp, redirect to your new page
        res.redirect('/success'); 
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Admin Dashboard Route
app.get('/admin-dashboard', async (req, res) => {
    try {
        const messages = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
        const projects = await pool.query('SELECT * FROM projects ORDER BY id DESC');
        res.render('admin', { messages: messages.rows, projects: projects.rows });
    } catch (err) {
        console.error(err);
        res.send("Error loading dashboard");
    }
});

// Route to delete a message
app.post('/admin/delete-message/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM messages WHERE id = $1', [id]);
        res.redirect('/admin-dashboard'); // Refresh the dashboard after deleting
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting message");
    }
});

app.listen(PORT, () => {
    console.log(`Portfolio is running on http://localhost:${PORT} 🚀`);
});