import { getDbPool } from "../config/db.js";

const memSubs = [];

async function withDb(fn, fallback) {
  try {
    const db = getDbPool();
    return await fn(db);
  } catch (e) {
    return fallback(e);
  }
}

export const subscriptionRepository = {
  async upsert({ userId, stripeSubscriptionId, plan, status, currentPeriodEnd }) {
    return withDb(async (db) => {
      await db.query(
        `INSERT INTO subscriptions (user_id, stripe_subscription_id, plan, status, current_period_end)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         plan = VALUES(plan),
         status = VALUES(status),
         current_period_end = VALUES(current_period_end)`,
        [userId, stripeSubscriptionId, plan, status, currentPeriodEnd]
      );
    }, async () => {
      const idx = memSubs.findIndex((s) => s.stripe_subscription_id === stripeSubscriptionId);
      const row = { id: idx >= 0 ? memSubs[idx].id : memSubs.length + 1, user_id: userId, stripe_subscription_id: stripeSubscriptionId, plan, status, current_period_end: currentPeriodEnd, created_at: new Date().toISOString() };
      if (idx >= 0) memSubs[idx] = row; else memSubs.push(row);
    });
  },

  async findByUserId(userId) {
    return withDb(async (db) => {
      const [rows] = await db.query(`SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`, [userId]);
      return rows[0] || null;
    }, async () => memSubs.filter((s) => s.user_id === userId).at(-1) || null);
  },
};
