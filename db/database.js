import { Pool } from "pg";

const pool = new Pool({
  user: "igor",
  host: "80.78.243.221",
  database: "telegram_bot_db",
  password: "#%z#g%%rrHbYkr*d",
  port: 5432,
});

pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Connection error", err));

export const createUser = async (userData) => {
  const query = `
    INSERT INTO users (chat_id, tg_name, created_at) 
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  try {
    const date = new Date();
    const result = await pool.query(query, [
      userData.chatId,
      userData.tgName,
      date,
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

export const getUser = async (chatId) => {
  const query = `
    SELECT * FROM users WHERE chat_id = $1
  `;
  try {
    const result = await pool.query(query, [chatId]);
    return result.rows[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

export const updateUser = async (column, chatId, value) => {
  const query = `
  UPDATE users 
  SET ${column} = $1 
  WHERE chat_id = $2 
  RETURNING *;
  `;
  try {
    const result = await pool.query(query, [value, chatId]);
    return result.rows[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

export const saveMessage = async (chatId, text, role, type = "text") => {
  const query = `
    INSERT INTO messages (chat_id, message_text, role, type) 
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  try {
    const result = await pool.query(query, [chatId, text, role, type]);
    return result.rows[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};

export const getContext = async (chatId) => {
  const query = `
    SELECT * FROM messages WHERE chat_id = $1 ORDER BY id DESC LIMIT 20;
  `;
  try {
    const result = await pool.query(query, [chatId]);
    
    return result.rows;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
};
