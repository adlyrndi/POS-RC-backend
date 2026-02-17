const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/vouchers', require('./routes/voucherRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

app.get('/', (req, res) => {
    res.json({ message: 'POS Backend is running' });
});

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`--- POS BACKEND ---`);
        console.log(`Port: ${PORT}`);
        console.log(`URL: http://localhost:${PORT}`);
    });
}

module.exports = app;
