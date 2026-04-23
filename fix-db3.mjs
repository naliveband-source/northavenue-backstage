import { neon } from "@neondatabase/serverless";

const sql = neon("postgresql://neondb_owner:npg_H2MDlEmCq3sn@ep-lucky-tree-alan1dtk.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require");

// Genskab bookings med TEXT id
await sql`DROP TABLE IF EXISTS bookings CASCADE`;
await sql`CREATE TABLE bookings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  hs_id TEXT UNIQUE,
  date TEXT, departure TEXT, arrival TEXT,
  type TEXT, city TEXT, address TEXT,
  play_time TEXT, sets TEXT,
  band_pay INTEGER DEFAULT 0,
  booker TEXT, notes TEXT,
  member_ids TEXT DEFAULT '[]',
  substitute_ids TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
)`;

// Genskab alias_bookings med TEXT id
await sql`DROP TABLE IF EXISTS alias_bookings CASCADE`;
await sql`CREATE TABLE alias_bookings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  hs_id TEXT UNIQUE,
  manager_user_id TEXT,
  date TEXT, type TEXT, city TEXT, address TEXT,
  arrival TEXT, play_time TEXT, sets TEXT,
  musicians INTEGER DEFAULT 0,
  band_pay INTEGER DEFAULT 0,
  booking_fee INTEGER DEFAULT 0,
  car_gear BOOLEAN DEFAULT false,
  contact TEXT, phone TEXT, booker TEXT, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`;

console.log("✅ Tabeller genskabt!");