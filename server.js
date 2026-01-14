require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { notFound, errorHandler } = require('./src/middlewares/errorHandler');
const adminAuthRoutes = require('./src/routes/adminAuthRoutes');
const authRoutes = require('./src/routes/authRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const propertyRoutes = require('./src/routes/propertyRoutes');
const { router: propertyQueryRoutes, adminRouter: allQueryRoutes } = require('./src/routes/propertyQueryRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const { connectDB } = require('./src/config/db');

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

connectDB();

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/properties/:propertyId/queries', propertyQueryRoutes);
app.use('/api/queries', allQueryRoutes);
app.use('/api/admin/stats', statsRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5050;
app.listen(port, () => {
  console.log(`Server running: http://localhost:${port}/`);
});
