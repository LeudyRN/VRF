import { getDbPool } from "../config/db.js";

const mem = { users: [], seq: 1 };

async function withDb(fn, fallback) {
  try {
    const db = getDbPool();
    return await fn(db);
  } catch (e) {
    return fallback(e);
  }
}

export const userRepository = {
  async create({ name, email, passwordHash, verificationToken }) {
    return withDb(
      async (db) => {
        const [r] = await db.query(
          `INSERT INTO users (name, email, password_hash, verification_token, email_verified, subscription_status)
           VALUES (?, ?, ?, ?, 0, 'inactive')`,
          [name, email, passwordHash, verificationToken]
        );
        return r.insertId;
      },
      async () => {
        const id = mem.seq++;
        mem.users.push({ id, name, email, password_hash: passwordHash, email_verified: 0, verification_token: verificationToken, reset_token: null, stripe_customer_id: null, subscription_status: "inactive", created_at: new Date().toISOString() });
        return id;
      }
    );
  },

  async findByEmail(email) {
    return withDb(async (db) => {
      const [rows] = await db.query(`SELECT * FROM users WHERE email = ? LIMIT 1`, [email]);
      return rows[0] || null;
    }, async () => mem.users.find((u) => u.email === email) || null);
  },

  async findById(id) {
    return withDb(async (db) => {
      const [rows] = await db.query(`SELECT * FROM users WHERE id = ? LIMIT 1`, [id]);
      return rows[0] || null;
    }, async () => mem.users.find((u) => u.id === Number(id)) || null);
  },

  async verifyEmail(token) {
    return withDb(async (db) => {
      const [r] = await db.query(`UPDATE users SET email_verified = 1, verification_token = NULL WHERE verification_token = ?`, [token]);
      return r.affectedRows > 0;
    }, async () => {
      const u = mem.users.find((x) => x.verification_token === token);
      if (!u) return false;
      u.email_verified = 1;
      u.verification_token = null;
      return true;
    });
  },

  async setResetToken(email, token) {
    return withDb(async (db) => { await db.query(`UPDATE users SET reset_token = ? WHERE email = ?`, [token, email]); }, async () => {
      const u = mem.users.find((x) => x.email === email);
      if (u) u.reset_token = token;
    });
  },

  async resetPassword(token, passwordHash) {
    return withDb(async (db) => {
      const [r] = await db.query(`UPDATE users SET password_hash = ?, reset_token = NULL WHERE reset_token = ?`, [passwordHash, token]);
      return r.affectedRows > 0;
    }, async () => {
      const u = mem.users.find((x) => x.reset_token === token);
      if (!u) return false;
      u.password_hash = passwordHash;
      u.reset_token = null;
      return true;
    });
  },

  async changePassword(userId, passwordHash) {
    return withDb(async (db) => { await db.query(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, userId]); }, async () => {
      const u = mem.users.find((x) => x.id === Number(userId));
      if (u) u.password_hash = passwordHash;
    });
  },

  async updateName(userId, name) {
    return withDb(async (db) => { await db.query(`UPDATE users SET name = ? WHERE id = ?`, [name, userId]); }, async () => {
      const u = mem.users.find((x) => x.id === Number(userId));
      if (u) u.name = name;
    });
  },

  async setStripeCustomerId(userId, customerId) {
    return withDb(async (db) => { await db.query(`UPDATE users SET stripe_customer_id = ? WHERE id = ?`, [customerId, userId]); }, async () => {
      const u = mem.users.find((x) => x.id === Number(userId));
      if (u) u.stripe_customer_id = customerId;
    });
  },

  async updateSubscriptionStatusByCustomer(customerId, status) {
    return withDb(async (db) => { await db.query(`UPDATE users SET subscription_status = ? WHERE stripe_customer_id = ?`, [status, customerId]); }, async () => {
      const u = mem.users.find((x) => x.stripe_customer_id === customerId);
      if (u) u.subscription_status = status;
    });
  },

  async findByStripeCustomer(customerId) {
    return withDb(async (db) => {
      const [rows] = await db.query(`SELECT * FROM users WHERE stripe_customer_id = ? LIMIT 1`, [customerId]);
      return rows[0] || null;
    }, async () => mem.users.find((u) => u.stripe_customer_id === customerId) || null);
  },
};
