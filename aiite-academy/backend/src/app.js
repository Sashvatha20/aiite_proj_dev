const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
require('dotenv').config();

require('./db');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'AiiTE Academy API is running' });
});

// Routes — we will add these one by one
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/trainers',    require('./routes/trainers'));
app.use('/api/batches',     require('./routes/batches'));
app.use('/api/students',    require('./routes/students'));
app.use('/api/worklog',     require('./routes/worklog'));
app.use('/api/enquiries',   require('./routes/enquiries'));
app.use('/api/escalations', require('./routes/escalations'));
app.use('/api/followups',   require('./routes/followups'));
app.use('/api/placements',  require('./routes/placements'));
app.use('/api/watercan',    require('./routes/watercan'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/assessments',  require('./routes/assessments'));
app.use('/api/mentor-feedback', require('./routes/mentor-feedback'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});