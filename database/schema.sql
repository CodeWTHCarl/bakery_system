CREATE DATABASE IF NOT EXISTS bakery_inventory;

USE bakery_inventory;

CREATE TABLE ingredients (
  ingredient_id INT AUTO_INCREMENT PRIMARY KEY,
  ingredient_name VARCHAR(255) NOT NULL,
  quantity_available DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  reorder_level INT,
  supplier VARCHAR(255),
  last_restock_date DATE
);