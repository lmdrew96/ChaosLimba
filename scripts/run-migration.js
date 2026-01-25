#!/usr/bin/env node

/**
 * Script to run SQL migrations against the database
 * Usage: node scripts/run-migration.js path/to/migration.sql
 */

import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const migrationFile = process.argv[2];

if (!migrationFile) {
    console.error('❌ Error: Please provide a migration file path');
    console.log('Usage: node scripts/run-migration.js path/to/migration.sql');
    process.exit(1);
}

if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable not found');
    process.exit(1);
}

async function runMigration() {
    try {
        console.log(`📦 Reading migration file: ${migrationFile}`);
        const sqlContent = readFileSync(migrationFile, 'utf-8');

        console.log('🔗 Connecting to database...');
        const sql = neon(process.env.DATABASE_URL);

        console.log('⚙️  Running migration...');

        // Split SQL file into individual statements
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        // Execute each statement using tagged template syntax
        for (const statement of statements) {
            if (statement.trim()) {
                // Use tagged template call with a literal array
                const result = await sql`${sql(statement)}`;
                console.log(`  ✓ Executed statement`);
            }
        }

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runMigration();
