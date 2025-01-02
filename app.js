// app.js

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { generateCSV } = require('./report');

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  const now = new Date();
  res.render('index', { 
    currentMonth: now.getMonth() + 1, 
    currentYear: now.getFullYear(), 
    message: null 
  });
});

app.post('/generate', (req, res) => {
  const { month, year, sickDays, daysOff } = req.body;
  
  // Parse inputs
  const parsedMonth = parseInt(month);
  const parsedYear = parseInt(year) || DateTime.now().year; // Default to current year if not provided
  const sick = sickDays 
    ? sickDays.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d)) 
    : [];
  const off = daysOff 
    ? daysOff.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d)) 
    : [];

  try {
    // Generate CSV string
    const csvString = generateCSV(parsedMonth, parsedYear, sick, off);
    
    // Set headers to prompt download
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${parsedMonth}_${parsedYear}.csv`);
    res.set('Content-Type', 'text/csv');
    
    // Send CSV string as response
    res.status(200).send(csvString);
  } catch (error) {
    // Render index with error message
    res.render('index', { 
      currentMonth: parsedMonth, 
      currentYear: parsedYear, 
      message: `Error: ${error.message}` 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
