import { neon } from "@neondatabase/serverless";

export const sql = (strings, ...values) => {
  const db = neon(process.env.DATABASE_URL);
  return db(strings, ...values);
};