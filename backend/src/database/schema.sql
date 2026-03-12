CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  verification_token VARCHAR(255) NULL,
  reset_token VARCHAR(255) NULL,
  stripe_customer_id VARCHAR(255) NULL,
  subscription_status ENUM('inactive','trial','active','canceled','past_due') NOT NULL DEFAULT 'inactive',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  stripe_subscription_id VARCHAR(255) NOT NULL UNIQUE,
  plan VARCHAR(120) NOT NULL,
  status ENUM('inactive','trial','active','canceled','past_due') NOT NULL,
  current_period_end DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_projects_user_id (user_id)
);

CREATE TABLE IF NOT EXISTS zones (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  load_kw DECIMAL(10,2) DEFAULT 0,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS equipment_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(120) NOT NULL,
  category VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type_id INT NOT NULL,
  cooling_capacity_kw DECIMAL(10,2),
  heating_capacity_kw DECIMAL(10,2),
  power_kw DECIMAL(10,2),
  voltage INT,
  weight DECIMAL(10,2),
  width INT,
  height INT,
  depth INT,
  efficiency DECIMAL(10,2),
  noise_level DECIMAL(10,2),
  price_estimate DECIMAL(10,2),
  FOREIGN KEY (type_id) REFERENCES equipment_types(id)
);

CREATE TABLE IF NOT EXISTS connections (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  start_node VARCHAR(64) NOT NULL,
  end_node VARCHAR(64) NOT NULL,
  kind ENUM('PIPE','CABLE') NOT NULL,
  length DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pipes (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  start_node VARCHAR(64) NOT NULL,
  end_node VARCHAR(64) NOT NULL,
  length DECIMAL(10,2),
  diameter DECIMAL(10,2),
  type VARCHAR(64),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cables (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  start_node VARCHAR(64) NOT NULL,
  end_node VARCHAR(64) NOT NULL,
  length DECIMAL(10,2),
  gauge VARCHAR(64),
  voltage INT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS calculations (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  payload JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bill_of_materials (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  item_type VARCHAR(64) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
