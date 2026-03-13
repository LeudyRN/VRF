USE vrf_platform;

INSERT INTO users (
  name,
  email,
  password_hash,
  email_verified,
  verification_token,
  reset_token,
  stripe_customer_id,
  subscription_status
) VALUES (
  'Admin Local',
  'admin@vrf.local',
  '$2b$10$viw2W7gT7jd1M7Ggy1P2zuNU/SKekXNz7HT3KxNvidG5pV0osPgyy',
  1,
  NULL,
  NULL,
  NULL,
  'active'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  email_verified = 1,
  subscription_status = 'active';

INSERT INTO subscriptions (
  user_id,
  stripe_subscription_id,
  plan,
  status,
  current_period_end
)
SELECT
  id,
  'sub_local_admin_vrf',
  'VRF Designer Plan',
  'active',
  DATE_ADD(NOW(), INTERVAL 1 YEAR)
FROM users
WHERE email = 'admin@vrf.local'
ON DUPLICATE KEY UPDATE
  plan = VALUES(plan),
  status = VALUES(status),
  current_period_end = VALUES(current_period_end);
