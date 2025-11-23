import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
    console.log('Setting up database...');
    
    // First, connect without specifying database to create it if needed
    const adminPool = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'password#2',
        database: 'postgres' // Connect to default postgres database
    });

    try {
        // Check if database exists
        const dbCheck = await adminPool.query(
            "SELECT 1 FROM pg_database WHERE datname = 'asset_management'"
        );

        if (dbCheck.rows.length === 0) {
            console.log('Creating database: asset_management');
            await adminPool.query('CREATE DATABASE asset_management');
            console.log('✅ Database created successfully');
        } else {
            console.log('✅ Database already exists');
        }

        // Now connect to the asset_management database
        const appPool = new Pool({
            connectionString: process.env.DATABASE_URL
        });

        // Check if table exists
        const tableCheck = await appPool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'assets'
            )
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('Creating assets table...');
            await appPool.query(`
                CREATE TABLE "assets" (
                    "id" serial PRIMARY KEY NOT NULL,
                    "name" varchar(255) NOT NULL,
                    "description" text,
                    "category" varchar(100) NOT NULL,
                    "status" varchar(50) DEFAULT 'available',
                    "purchase_date" timestamp,
                    "purchase_price" integer,
                    "created_at" timestamp DEFAULT now(),
                    "updated_at" timestamp DEFAULT now()
                )
            `);
            console.log('✅ Assets table created successfully');
        } else {
            console.log('✅ Assets table already exists');
        }

        await appPool.end();
        console.log('✅ Database setup completed successfully');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
    } finally {
        await adminPool.end();
    }
}

setupDatabase();