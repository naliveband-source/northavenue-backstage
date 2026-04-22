import { neon } from "@neondatabase/serverless";

const sql = neon("postgresql://neondb_owner:npg_H2MDlEmCq3sn@ep-lucky-tree-alan1dtk.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require");

await sql`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first TEXT, last TEXT, initials TEXT,
    instrument TEXT, phone TEXT, avatar TEXT,
    role TEXT, sub_type TEXT, is_admin BOOLEAN DEFAULT false,
    tags TEXT DEFAULT '[]',
    theme TEXT DEFAULT 'dark',
    musician_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    date TEXT, departure TEXT, arrival TEXT,
    type TEXT, city TEXT, address TEXT,
    play_time TEXT, sets TEXT,
    band_pay INTEGER DEFAULT 0,
    booker TEXT, notes TEXT,
    member_ids TEXT DEFAULT '[]',
    substitute_ids TEXT DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    musician_id INTEGER,
    date TEXT, amount INTEGER, note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS alias_bookings (
    id TEXT PRIMARY KEY,
    manager_user_id TEXT,
    date TEXT, type TEXT, city TEXT, address TEXT,
    arrival TEXT, play_time TEXT, sets TEXT,
    musicians INTEGER, band_pay INTEGER DEFAULT 0,
    booking_fee INTEGER DEFAULT 0,
    car_gear BOOLEAN DEFAULT false,
    contact TEXT, phone TEXT, booker TEXT, notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

console.log("✅ Tabeller oprettet!");