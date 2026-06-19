const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'bookings.json');

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory and file exist
async function initializeDataFile() {
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing data file:', error);
  }
}

// Read bookings from file
async function readBookings() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading bookings:', error);
    return [];
  }
}

// Write bookings to file
async function writeBookings(bookings) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(bookings, null, 2));
  } catch (error) {
    console.error('Error writing bookings:', error);
    throw error;
  }
}

// API Routes
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await readBookings();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { room, date, time, name, email, purpose } = req.body;
    
    // Validation
    if (!room || !date || !time || !name || !email || !purpose) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const bookings = await readBookings();
    
    // Check for conflicts
    const conflict = bookings.some(
      booking => booking.room === room && 
                 booking.date === date && 
                 booking.time === time
    );

    if (conflict) {
      return res.status(409).json({ error: 'Room already booked at this time' });
    }

    const newBooking = {
      id: Date.now().toString(),
      room,
      date,
      time,
      name,
      email,
      purpose,
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    await writeBookings(bookings);
    
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await readBookings();
    const filteredBookings = bookings.filter(booking => booking.id !== id);
    
    if (bookings.length === filteredBookings.length) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await writeBookings(filteredBookings);
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

// Serve static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
initializeDataFile().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Room Booking App running on http://localhost:${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
  });
});
