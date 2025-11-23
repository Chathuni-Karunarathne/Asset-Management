import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './controllers/routes.js';
import { testConnection } from './db/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable CORS for frontend
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
    credentials: true
}));

app.use(express.json());

// Add route logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.use('/api', routes);

// Test route to verify API is working
app.get('/api/test', (_req, res) => {
    res.json({ message: 'API test endpoint is working!' });
});

app.get('/', (_req, res) => {
    res.json({ status: 'OK', message: 'Asset Management API is running' });
});

// Start server only if database connection is successful
const startServer = async () => {
    console.log('Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
        console.error('❌ Cannot start server: Database connection failed');
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`✅ Server is running on http://localhost:${PORT}`);
        console.log(`✅ Test the API at http://localhost:${PORT}/api/assets`);
    });
};

startServer();

export default app;