-- =============================================
-- Scout Gate - Complete Database for MariaDB
-- Includes: All Tables + All Data
-- Converted from PostgreSQL (Supabase)
-- Generated: 2026-02-13
-- =============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- PART 1: TABLE STRUCTURES
-- =============================================

-- =============================================
-- Table: user_roles
-- =============================================
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `role` ENUM('admin', 'player', 'club') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_roles_user_role` (`user_id`, `role`),
  KEY `idx_user_roles_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: profiles
-- =============================================
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) DEFAULT NULL,
  `avatar_url` TEXT DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_profiles_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: players
-- =============================================
CREATE TABLE IF NOT EXISTS `players` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `position` VARCHAR(100) DEFAULT NULL,
  `nationality` VARCHAR(100) DEFAULT NULL,
  `current_club` VARCHAR(255) DEFAULT NULL,
  `previous_clubs` JSON DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `profile_image_url` TEXT DEFAULT NULL,
  `video_urls` JSON DEFAULT NULL,
  `height_cm` INT DEFAULT NULL,
  `weight_kg` INT DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_players_user_id` (`user_id`),
  KEY `idx_players_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: player_private
-- =============================================
CREATE TABLE IF NOT EXISTS `player_private` (
  `user_id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  `id_document_url` TEXT DEFAULT NULL,
  `rejection_reason` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: clubs
-- =============================================
CREATE TABLE IF NOT EXISTS `clubs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `country` VARCHAR(100) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT NULL,
  `logo_url` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `website` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_clubs_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: subscription_plans
-- =============================================
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `description_ar` TEXT DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `duration_days` INT NOT NULL DEFAULT 30,
  `plan_type` VARCHAR(50) NOT NULL DEFAULT 'club',
  `features` JSON DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: subscriptions
-- =============================================
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `plan_id` CHAR(36) NOT NULL,
  `status` ENUM('active', 'expired', 'cancelled', 'pending') NOT NULL DEFAULT 'active',
  `start_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` TIMESTAMP NOT NULL,
  `auto_renew` TINYINT(1) NOT NULL DEFAULT 0,
  `renewal_reminder_sent` TINYINT(1) NOT NULL DEFAULT 0,
  `payment_method` VARCHAR(100) DEFAULT NULL,
  `payment_reference` VARCHAR(255) DEFAULT NULL,
  `proof_url` TEXT DEFAULT NULL,
  `admin_notes` TEXT DEFAULT NULL,
  `approved_at` TIMESTAMP NULL DEFAULT NULL,
  `approved_by` CHAR(36) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_subscriptions_user_id` (`user_id`),
  KEY `idx_subscriptions_plan_id` (`plan_id`),
  CONSTRAINT `fk_subscriptions_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: renewal_logs
-- =============================================
CREATE TABLE IF NOT EXISTS `renewal_logs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `subscription_id` CHAR(36) NOT NULL,
  `old_end_date` TIMESTAMP NOT NULL,
  `new_end_date` TIMESTAMP NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'success',
  `error_message` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_renewal_logs_sub` (`subscription_id`),
  CONSTRAINT `fk_renewal_logs_sub` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: favorites
-- =============================================
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `club_user_id` CHAR(36) NOT NULL,
  `player_id` CHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_favorites_club_player` (`club_user_id`, `player_id`),
  KEY `idx_favorites_player` (`player_id`),
  CONSTRAINT `fk_favorites_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: player_views
-- =============================================
CREATE TABLE IF NOT EXISTS `player_views` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `club_user_id` CHAR(36) NOT NULL,
  `player_id` CHAR(36) NOT NULL,
  `viewed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_player_views_club` (`club_user_id`),
  KEY `idx_player_views_player` (`player_id`),
  CONSTRAINT `fk_player_views_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: player_ratings
-- =============================================
CREATE TABLE IF NOT EXISTS `player_ratings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `player_id` CHAR(36) NOT NULL,
  `club_user_id` CHAR(36) NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_player_ratings_player` (`player_id`),
  CONSTRAINT `fk_player_ratings_player` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: player_interests
-- =============================================
CREATE TABLE IF NOT EXISTS `player_interests` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `player_id` CHAR(36) NOT NULL,
  `club_user_id` CHAR(36) NOT NULL,
  `interest_type` VARCHAR(50) NOT NULL DEFAULT 'interested',
  `message` TEXT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `admin_notes` TEXT DEFAULT NULL,
  `reviewed_by` CHAR(36) DEFAULT NULL,
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_player_interests_player` (`player_id`),
  KEY `idx_player_interests_club` (`club_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: club_usage
-- =============================================
CREATE TABLE IF NOT EXISTS `club_usage` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `club_user_id` CHAR(36) NOT NULL,
  `month_year` VARCHAR(7) NOT NULL,
  `player_views` INT NOT NULL DEFAULT 0,
  `messages_sent` INT NOT NULL DEFAULT 0,
  `favorites_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_club_usage_month` (`club_user_id`, `month_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: messages
-- =============================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `sender_id` CHAR(36) NOT NULL,
  `receiver_id` CHAR(36) NOT NULL,
  `subject` VARCHAR(500) DEFAULT NULL,
  `content` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_messages_sender` (`sender_id`),
  KEY `idx_messages_receiver` (`receiver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: notifications
-- =============================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `type` VARCHAR(100) NOT NULL DEFAULT 'general',
  `title` VARCHAR(500) NOT NULL,
  `title_ar` VARCHAR(500) DEFAULT NULL,
  `message` TEXT NOT NULL,
  `message_ar` TEXT DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`),
  KEY `idx_notifications_read` (`user_id`, `is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: consultation_settings
-- =============================================
CREATE TABLE IF NOT EXISTS `consultation_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `fee` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `duration_minutes` INT NOT NULL DEFAULT 30,
  `description` TEXT DEFAULT NULL,
  `description_ar` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: consultation_slots
-- =============================================
CREATE TABLE IF NOT EXISTS `consultation_slots` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `day_of_week` INT NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `recurrence_type` VARCHAR(50) NOT NULL DEFAULT 'weekly',
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `specific_dates` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: consultation_bookings
-- =============================================
CREATE TABLE IF NOT EXISTS `consultation_bookings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `player_user_id` CHAR(36) NOT NULL,
  `booking_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `fee_amount` DECIMAL(10,2) NOT NULL,
  `fee_currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `payment_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `payment_method` VARCHAR(100) DEFAULT NULL,
  `payment_reference` VARCHAR(255) DEFAULT NULL,
  `proof_url` TEXT DEFAULT NULL,
  `meet_link` TEXT DEFAULT NULL,
  `player_notes` TEXT DEFAULT NULL,
  `admin_notes` TEXT DEFAULT NULL,
  `confirmed_at` TIMESTAMP NULL DEFAULT NULL,
  `reminder_sent` TINYINT(1) NOT NULL DEFAULT 0,
  `admin_reminder_sent` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_consultation_bookings_player` (`player_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: google_meet_logs
-- =============================================
CREATE TABLE IF NOT EXISTS `google_meet_logs` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `booking_id` CHAR(36) NOT NULL,
  `player_user_id` CHAR(36) NOT NULL,
  `booking_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `meet_link` TEXT NOT NULL,
  `calendar_event_id` VARCHAR(255) DEFAULT NULL,
  `player_name` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'created',
  `error_message` TEXT DEFAULT NULL,
  `regenerated_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_meet_logs_booking` (`booking_id`),
  CONSTRAINT `fk_meet_logs_booking` FOREIGN KEY (`booking_id`) REFERENCES `consultation_bookings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: payment_methods
-- =============================================
CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `name_ar` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `config` JSON DEFAULT NULL,
  `instructions` TEXT DEFAULT NULL,
  `instructions_ar` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: languages
-- =============================================
CREATE TABLE IF NOT EXISTS `languages` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `code` VARCHAR(10) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `native_name` VARCHAR(100) NOT NULL,
  `direction` VARCHAR(5) NOT NULL DEFAULT 'ltr',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `order_index` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_languages_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: translations
-- =============================================
CREATE TABLE IF NOT EXISTS `translations` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `language_code` VARCHAR(10) NOT NULL,
  `key` VARCHAR(255) NOT NULL,
  `value` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'general',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_translations_lang_key` (`language_code`, `key`),
  CONSTRAINT `fk_translations_lang` FOREIGN KEY (`language_code`) REFERENCES `languages` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: pages
-- =============================================
CREATE TABLE IF NOT EXISTS `pages` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `slug` VARCHAR(255) NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `title_ar` VARCHAR(500) DEFAULT NULL,
  `content` LONGTEXT DEFAULT NULL,
  `content_ar` LONGTEXT DEFAULT NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 0,
  `order_index` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pages_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: page_sections
-- =============================================
CREATE TABLE IF NOT EXISTS `page_sections` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `page_key` VARCHAR(100) NOT NULL,
  `section_key` VARCHAR(100) NOT NULL,
  `is_visible` TINYINT(1) NOT NULL DEFAULT 1,
  `order_index` INT NOT NULL DEFAULT 0,
  `settings` JSON DEFAULT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: menu_items
-- =============================================
CREATE TABLE IF NOT EXISTS `menu_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `title` VARCHAR(255) NOT NULL,
  `title_ar` VARCHAR(255) DEFAULT NULL,
  `url` VARCHAR(500) NOT NULL,
  `location` VARCHAR(50) NOT NULL,
  `is_external` TINYINT(1) NOT NULL DEFAULT 0,
  `order_index` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `parent_id` CHAR(36) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_menu_items_parent` (`parent_id`),
  CONSTRAINT `fk_menu_items_parent` FOREIGN KEY (`parent_id`) REFERENCES `menu_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: site_settings
-- =============================================
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `key` VARCHAR(255) NOT NULL,
  `value` JSON NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_site_settings_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: theme_settings
-- =============================================
CREATE TABLE IF NOT EXISTS `theme_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `key` VARCHAR(255) NOT NULL,
  `value` JSON NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_theme_settings_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: slider_settings
-- =============================================
CREATE TABLE IF NOT EXISTS `slider_settings` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `slider_key` VARCHAR(100) NOT NULL,
  `auto_play` TINYINT(1) NOT NULL DEFAULT 1,
  `auto_play_interval` INT NOT NULL DEFAULT 5000,
  `show_navigation` TINYINT(1) NOT NULL DEFAULT 1,
  `show_dots` TINYINT(1) NOT NULL DEFAULT 1,
  `items_per_view` INT NOT NULL DEFAULT 3,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_slider_settings_key` (`slider_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: slider_items
-- =============================================
CREATE TABLE IF NOT EXISTS `slider_items` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `slider_key` VARCHAR(100) NOT NULL DEFAULT 'players',
  `title` VARCHAR(500) DEFAULT NULL,
  `title_ar` VARCHAR(500) DEFAULT NULL,
  `subtitle` VARCHAR(500) DEFAULT NULL,
  `subtitle_ar` VARCHAR(500) DEFAULT NULL,
  `image_url` TEXT DEFAULT NULL,
  `link_url` TEXT DEFAULT NULL,
  `order_index` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `settings` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: custom_color_templates
-- =============================================
CREATE TABLE IF NOT EXISTS `custom_color_templates` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `colors` JSON NOT NULL,
  `created_by` CHAR(36) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- VIEWS
-- =============================================

CREATE OR REPLACE VIEW `players_public` AS
SELECT
  p.`id`, p.`user_id`, p.`full_name`, p.`position`, p.`nationality`,
  p.`bio`, p.`profile_image_url`, p.`video_urls`, p.`height_cm`, p.`weight_kg`,
  p.`status`, p.`created_at`, p.`updated_at`, pp.`date_of_birth`
FROM `players` p
LEFT JOIN `player_private` pp ON p.`user_id` = pp.`user_id`
WHERE p.`status` = 'approved';

CREATE OR REPLACE VIEW `payment_methods_public` AS
SELECT `id`, `name`, `name_ar`, `type`, `instructions`, `instructions_ar`,
  `is_active`, `config`, `created_at`, `updated_at`
FROM `payment_methods`
WHERE `is_active` = 1;

CREATE OR REPLACE VIEW `custom_color_templates_public` AS
SELECT `id`, `name`, `colors`, `created_at`, `updated_at`
FROM `custom_color_templates`;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

DELIMITER //

CREATE FUNCTION IF NOT EXISTS `has_active_subscription`(uid CHAR(36))
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE result TINYINT(1) DEFAULT 0;
  SELECT 1 INTO result FROM `subscriptions`
  WHERE `user_id` = uid AND `status` = 'active' AND `end_date` >= NOW() LIMIT 1;
  RETURN COALESCE(result, 0);
END //

CREATE FUNCTION IF NOT EXISTS `has_role`(uid CHAR(36), role_name VARCHAR(20))
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE result TINYINT(1) DEFAULT 0;
  SELECT 1 INTO result FROM `user_roles`
  WHERE `user_id` = uid AND `role` = role_name LIMIT 1;
  RETURN COALESCE(result, 0);
END //

DELIMITER ;

-- =============================================
-- PART 2: DATA INSERTS
-- =============================================

-- =============================================
-- Data: user_roles
-- =============================================
INSERT INTO `user_roles` (`id`, `user_id`, `role`) VALUES
('62fc9dfa-a14b-476d-b01e-0ed8acc9197e', '3bfda3d2-b403-4af3-8f2e-978f310e00a7', 'club'),
('833f3e32-e0c4-43b9-8161-fc62bac557b9', '6394e80b-014f-43fe-8379-0de61c89671d', 'club'),
('8678c641-fc33-4555-a1f2-7605e0f61885', 'a1790a52-7308-45e5-b45c-0dba668cefdb', 'admin'),
('32a5ae46-cce5-4cdf-9f15-4945d73d6f79', 'a1790a52-7308-45e5-b45c-0dba668cefdb', 'player'),
('abe94f6b-357a-46d6-949d-00a0e3d3eeed', 'a2a9ec94-8599-433c-864d-9ffd26d08ea5', 'player'),
('9179791c-8513-4341-9fbd-2b22fba609fe', 'f95c9755-df0f-4b92-903f-7f0c39ad9bc4', 'player');

-- =============================================
-- Data: players
-- =============================================
INSERT INTO `players` (`id`, `user_id`, `full_name`, `position`, `nationality`, `current_club`, `previous_clubs`, `bio`, `profile_image_url`, `video_urls`, `height_cm`, `weight_kg`, `status`, `created_at`, `updated_at`) VALUES
('db4bfa8a-a482-4c1c-b100-eafcabdc5170', 'a1790a52-7308-45e5-b45c-0dba668cefdb', 'Hesham Saad', 'مهاجم', 'مصري', NULL, NULL, 'جيدا جدا', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/player-images/a1790a52-7308-45e5-b45c-0dba668cefdb/1769108106849.webp', NULL, 179, 78, 'approved', '2026-01-17 13:51:41', '2026-01-22 18:55:08'),
('8b0d0771-669f-40a3-a8dd-a109ff9cff2c', 'a2a9ec94-8599-433c-864d-9ffd26d08ea5', 'يوسف خالد', 'ظهير أيمن', 'مصري', 'البنك الأهلي', NULL, 'لاعب محترف ظهير ايمن', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/player-images/a2a9ec94-8599-433c-864d-9ffd26d08ea5/profile-1768813782311.jpg', NULL, 175, 70, 'approved', '2026-01-19 09:09:43', '2026-01-19 09:10:59'),
('217e81fe-f82c-4ee2-ae46-5fa022077e5e', 'f95c9755-df0f-4b92-903f-7f0c39ad9bc4', 'أحمد علي حسن', 'لاعب وسط', 'مصري', 'المصري', '["الاهلي","المصري"]', 'لاعب محترف خط وسط', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/player-images/f95c9755-df0f-4b92-903f-7f0c39ad9bc4/1770656028851.jpeg', NULL, 179, 72, 'approved', '2026-01-24 18:00:02', '2026-02-09 16:53:49');

-- =============================================
-- Data: player_private
-- =============================================
INSERT INTO `player_private` (`user_id`, `email`, `phone`, `date_of_birth`, `id_document_url`, `rejection_reason`, `created_at`, `updated_at`) VALUES
('a1790a52-7308-45e5-b45c-0dba668cefdb', 'heshamsaad05@gmail.com', '+201028566646', '1993-12-11', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/player-documents/a1790a52-7308-45e5-b45c-0dba668cefdb/id-1768657858363.jpg', NULL, '2026-01-18 13:01:54', '2026-01-22 18:55:08'),
('a2a9ec94-8599-433c-864d-9ffd26d08ea5', 'heshamsaad040@gmail.com', '+201028566646', '2006-12-11', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/player-documents/a2a9ec94-8599-433c-864d-9ffd26d08ea5/id-1768813782965.jpeg', NULL, '2026-01-19 09:09:43', '2026-01-19 09:09:43'),
('f95c9755-df0f-4b92-903f-7f0c39ad9bc4', 'heshamsaad050@gmail.com', '+201028566646', '2008-11-12', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/player-documents/f95c9755-df0f-4b92-903f-7f0c39ad9bc4/id-1769277603906.webp', NULL, '2026-01-24 18:00:02', '2026-02-09 16:53:49');

-- =============================================
-- Data: clubs
-- =============================================
INSERT INTO `clubs` (`id`, `user_id`, `name`, `email`, `phone`, `country`, `city`, `logo_url`, `description`, `website`, `created_at`, `updated_at`) VALUES
('d29a701b-d6ac-4b1a-9078-a850be136f49', '6394e80b-014f-43fe-8379-0de61c89671d', 'النادي الأهلي المصري', 'info@alahlysc.com', '0096574895489', 'Egypt', 'Cairo', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/club-logos/6394e80b-014f-43fe-8379-0de61c89671d/1768675969260.png', 'النادي الأهلي للرياضة البدنية أو كَما يُعرف اختصارًا بِاسم النادي الأهلي، هو نادٍ رياضي مصري محترف يلعب في الدوري المصري الممتاز، ومقره في القاهرة، وهو واحد من سبعة أندية على مستوى العالم لم تهبط للدرجة الأدنى والوحيد في مصر بجانب نادي الزمالك الذي لم يهبط إلى دوري الدرجة الثانية', 'https://www.alahlyegypt.com', '2026-01-17 18:52:42', '2026-01-17 18:52:42'),
('7596be06-ded7-42fa-a3c5-6582a1d0dbbb', '3bfda3d2-b403-4af3-8f2e-978f310e00a7', 'نادي الزمالك المصري', 'info@zamaleksc.com', '+201028566646', 'Egypt', 'Cairo', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/club-logos/3bfda3d2-b403-4af3-8f2e-978f310e00a7/1769108474023.png', 'نادي الزمالك للألعاب الرياضية أو كَما يُعرف اختصارًا بِاسم نادي الزمالك، هو نادٍ رياضي مصري محترف يلعب في الدوري المصري الممتاز، ومقره في الجيزة، وهو واحد من سبعة أندية على مستوى العالم لم تهبط للدرجة الأدنى والوحيد في مصر بجانب النادي الأهلي الذي لم يهبط إلى دوري الدرجة الثانية', 'https://www.zamaleksc.com', '2026-01-19 09:23:31', '2026-01-22 19:07:35');

-- =============================================
-- Data: subscription_plans
-- =============================================
INSERT INTO `subscription_plans` (`id`, `name`, `name_ar`, `description`, `description_ar`, `price`, `currency`, `duration_days`, `plan_type`, `features`, `is_active`, `created_at`, `updated_at`) VALUES
('cdd82f9e-5e2d-474c-a4d7-c7003e3ac454', 'Basic', 'الباقة الأساسية', 'Access to player profiles', 'الوصول لملفات اللاعبين', 99.00, 'USD', 30, 'club', '["مشاهدة 25 لاعب","أولوية عرض اللاعبين المتميزين","أولوية عرض الأعلى تقييماً","توثيق النادي (علامة زرقاء)","البحث الأساسي","5 رسائل شهرياً","إضافة لاعبين للمفضلة"]', 1, '2026-01-17 13:03:27', '2026-01-17 15:05:59'),
('0f7340fc-f066-4856-ac3d-17c01e80bf2b', 'Premium', 'الباقة المميزة', 'Full access to all features', 'وصول كامل لجميع المميزات', 199.00, 'USD', 30, 'club', '["مشاهدة غير محدودة للاعبين","أولوية عرض اللاعبين المتميزين","أولوية عرض اللاعبين الجدد","أولوية عرض الأعلى تقييماً","الوصول المبكر للاعبين الجدد","البحث الأساسي","الفلترة المتقدمة","الفلترة حسب المركز","الفلترة حسب الجنسية","الفلترة حسب العمر","الفلترة حسب المواصفات الجسدية","حفظ عمليات البحث","توثيق النادي (علامة زرقاء)","شارة التوثيق المميزة","دعم فني ذو أولوية","مدير حساب مخصص","عرض معلومات الاتصال الكاملة","التواصل المباشر مع اللاعبين","رسائل غير محدودة","إضافة لاعبين للمفضلة","قائمة مفضلة غير محدودة","مشاهدة فيديوهات اللاعبين","تحميل السيرة الذاتية للاعب","تصدير قائمة اللاعبين","إحصائيات وتقارير مفصلة"]', 1, '2026-01-17 13:03:27', '2026-01-17 15:07:35'),
('39a6c184-04d0-4ccb-9191-149e875b5057', 'Player Package', 'باقة اللاعب', 'A package that gives the player more features', 'باقة تتيح للاعب مميزات اكثر', 0.00, 'USD', 30, 'player', '["رسائل غير محدودة"]', 1, '2026-01-19 08:52:05', '2026-01-19 08:52:05');

-- =============================================
-- Data: subscriptions
-- =============================================
INSERT INTO `subscriptions` (`id`, `user_id`, `plan_id`, `status`, `start_date`, `end_date`, `auto_renew`, `renewal_reminder_sent`, `payment_method`, `payment_reference`, `proof_url`, `admin_notes`, `approved_at`, `approved_by`, `created_at`, `updated_at`) VALUES
('fcf6db2f-865f-4090-8d1d-2fd55eca4586', '6394e80b-014f-43fe-8379-0de61c89671d', 'cdd82f9e-5e2d-474c-a4d7-c7003e3ac454', 'cancelled', '2026-01-17 18:53:59', '2026-02-16 18:54:07', 0, 0, 'wallet', '65416846861465235613', NULL, NULL, NULL, NULL, '2026-01-17 18:53:59', '2026-01-17 19:05:53'),
('48cc715e-48b2-48c1-b4cc-b698d2dd37f2', '6394e80b-014f-43fe-8379-0de61c89671d', 'cdd82f9e-5e2d-474c-a4d7-c7003e3ac454', 'cancelled', '2026-01-17 19:11:15', '2026-02-16 19:11:22', 0, 0, 'paypal', '', NULL, NULL, NULL, NULL, '2026-01-17 19:11:15', '2026-02-03 18:56:33'),
('6acd4cad-efb5-4c4e-b5f5-39a9bb936dbd', 'a2a9ec94-8599-433c-864d-9ffd26d08ea5', '39a6c184-04d0-4ccb-9191-149e875b5057', 'active', '2026-01-19 00:00:00', '2026-02-18 00:00:00', 0, 0, 'admin_assigned', NULL, NULL, NULL, NULL, NULL, '2026-01-19 09:18:58', '2026-01-19 09:18:58'),
('8d10e135-bc97-4390-afa5-83730083a5df', '3bfda3d2-b403-4af3-8f2e-978f310e00a7', '0f7340fc-f066-4856-ac3d-17c01e80bf2b', 'cancelled', '2026-01-19 09:47:04', '2026-02-18 09:47:05', 0, 0, 'wallet', '554646867649191566', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/payment-proofs/3bfda3d2-b403-4af3-8f2e-978f310e00a7/1768816023396.jpg', NULL, NULL, NULL, '2026-01-19 09:47:04', '2026-02-03 18:56:23');

-- =============================================
-- Data: favorites
-- =============================================
INSERT INTO `favorites` (`id`, `club_user_id`, `player_id`, `created_at`) VALUES
('e72649f8-8316-4f13-99a1-61ad3496a0c3', '6394e80b-014f-43fe-8379-0de61c89671d', '8b0d0771-669f-40a3-a8dd-a109ff9cff2c', '2026-01-19 09:19:37');

-- =============================================
-- Data: player_views
-- =============================================
INSERT INTO `player_views` (`id`, `club_user_id`, `player_id`, `viewed_at`) VALUES
('e2e63d6c-4414-413c-a632-5b420a17d538', '6394e80b-014f-43fe-8379-0de61c89671d', 'db4bfa8a-a482-4c1c-b100-eafcabdc5170', '2026-01-18 23:58:06'),
('65738937-aa76-4508-8642-ff0bc9fdf27e', '6394e80b-014f-43fe-8379-0de61c89671d', '8b0d0771-669f-40a3-a8dd-a109ff9cff2c', '2026-01-19 09:19:41'),
('798b5253-fff5-48f0-a652-10f2bbdb9e85', '6394e80b-014f-43fe-8379-0de61c89671d', '217e81fe-f82c-4ee2-ae46-5fa022077e5e', '2026-01-24 19:08:24');

-- =============================================
-- Data: player_ratings
-- =============================================
INSERT INTO `player_ratings` (`id`, `player_id`, `club_user_id`, `rating`, `comment`, `created_at`, `updated_at`) VALUES
('fb4831c0-ff22-4cb3-9ee5-a46d2902c95b', '8b0d0771-669f-40a3-a8dd-a109ff9cff2c', '6394e80b-014f-43fe-8379-0de61c89671d', 5, 'لاعب جيد', '2026-01-19 09:19:55', '2026-01-19 09:19:55');

-- =============================================
-- Data: player_interests
-- =============================================
INSERT INTO `player_interests` (`id`, `player_id`, `club_user_id`, `interest_type`, `message`, `status`, `admin_notes`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`) VALUES
('82d377bb-ade9-40fd-9b05-50136d109c6f', '8b0d0771-669f-40a3-a8dd-a109ff9cff2c', '6394e80b-014f-43fe-8379-0de61c89671d', 'interested', 'لدي أهتمام بهذا اللاعب احتاج التفاصيل والتواصل', 'rejected', 'أختبار الرد ', NULL, '2026-02-03 18:54:56', '2026-01-24 19:32:57', '2026-02-03 18:54:56');

-- =============================================
-- Data: club_usage
-- =============================================
INSERT INTO `club_usage` (`id`, `club_user_id`, `month_year`, `player_views`, `messages_sent`, `favorites_count`, `created_at`, `updated_at`) VALUES
('e701d3a0-af45-495f-a0f4-b0d8ef149abf', '6394e80b-014f-43fe-8379-0de61c89671d', '2026-01', 3, 2, 0, '2026-01-18 23:58:06', '2026-01-24 19:08:26'),
('d566efbb-6a5f-486a-954e-87b8efa3fd75', 'a2a9ec94-8599-433c-864d-9ffd26d08ea5', '2026-01', 0, 1, 0, '2026-01-19 09:20:48', '2026-01-19 09:20:48');

-- =============================================
-- Data: messages
-- =============================================
INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `subject`, `content`, `is_read`, `created_at`, `updated_at`) VALUES
('405d88a0-1be7-4658-a18b-dd46161cd4b3', '6394e80b-014f-43fe-8379-0de61c89671d', 'a1790a52-7308-45e5-b45c-0dba668cefdb', 'مرحبا', 'كيف حالك هذا اختبار لنظام المراسلة', 1, '2026-01-18 23:59:08', '2026-01-18 23:59:35'),
('b8fa2de4-5736-4c90-a106-2b2fd795c004', '6394e80b-014f-43fe-8379-0de61c89671d', 'a2a9ec94-8599-433c-864d-9ffd26d08ea5', 'مرحبا بك', 'كيف حالك', 1, '2026-01-19 09:20:15', '2026-01-19 09:20:38'),
('d93d2615-1124-4045-98b1-6793014219c9', 'a2a9ec94-8599-433c-864d-9ffd26d08ea5', '6394e80b-014f-43fe-8379-0de61c89671d', NULL, 'الحمدلله بخير', 0, '2026-01-19 09:20:47', '2026-01-19 09:20:47');

-- =============================================
-- Data: notifications
-- =============================================
INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `title_ar`, `message`, `message_ar`, `metadata`, `is_read`, `created_at`) VALUES
('a3e9e2bb-8218-48f5-8e46-2322f6aa1f9e', 'f95c9755-df0f-4b92-903f-7f0c39ad9bc4', 'consultation_confirmed', 'Consultation Confirmed', 'تم تأكيد الاستشارة', 'Your consultation on 2026-01-25 at 09:00:00 has been confirmed.', 'تم تأكيد استشارتك بتاريخ 2026-01-25 الساعة 09:00:00.', '{"booking_date":"2026-01-25","booking_id":"7d141f0a-c6a6-46b7-9a72-8eb7d492d183","end_time":"10:00:00","meet_link":null,"start_time":"09:00:00"}', 1, '2026-01-24 19:18:38'),
('cf3849db-f482-4d6b-a843-c9ce21f204a1', 'f95c9755-df0f-4b92-903f-7f0c39ad9bc4', 'consultation_reminder', 'Consultation Reminder', 'تذكير بموعد الاستشارة', 'Your consultation is starting at 09:00:00. Don\'t forget to join!', 'موعد استشارتك يبدأ الساعة 09:00:00. لا تنسَ الانضمام!', '{"booking_id":"7d141f0a-c6a6-46b7-9a72-8eb7d492d183","meet_link":"","start_time":"09:00:00"}', 0, '2026-01-25 08:00:07');

-- =============================================
-- Data: consultation_settings
-- =============================================
INSERT INTO `consultation_settings` (`id`, `fee`, `currency`, `duration_minutes`, `description`, `description_ar`, `is_active`, `updated_at`) VALUES
('9bf8e570-cb94-4f88-aa1c-183dc698873f', 50.00, 'EUR', 30, 'One-on-one consultation with admin via Google Meet', 'استشارة فردية مع المدير عبر Google Meet', 1, '2026-02-03 18:52:44');

-- =============================================
-- Data: consultation_slots
-- =============================================
INSERT INTO `consultation_slots` (`id`, `day_of_week`, `start_time`, `end_time`, `is_active`, `recurrence_type`, `start_date`, `end_date`, `specific_dates`, `created_at`, `updated_at`) VALUES
('1987d59e-57a2-4459-9146-6628d12b59e0', 1, '10:00:00', '14:00:00', 1, 'weekly', NULL, NULL, '[]', '2026-02-03 18:53:48', '2026-02-03 18:53:48'),
('c0d44518-3f9e-4c66-8912-68c2d7230e64', 1, '15:00:00', '19:00:00', 1, 'weekly', NULL, NULL, '[]', '2026-02-03 18:53:48', '2026-02-03 18:53:48'),
('0cbc7cfe-b63c-4069-8897-beb09a51d6e2', 2, '09:00:00', '10:00:00', 1, 'weekly', NULL, NULL, '[]', '2026-01-24 17:13:20', '2026-01-24 17:13:20'),
('ae2586dd-c573-4d64-9a88-3833cef0e281', 2, '15:00:00', '19:00:00', 1, 'weekly', NULL, NULL, '[]', '2026-02-03 18:53:48', '2026-02-03 18:53:48'),
('c0a9e946-842a-44b7-a84b-6e0b42c00240', 3, '10:00:00', '14:00:00', 1, 'weekly', NULL, NULL, '[]', '2026-02-03 18:53:48', '2026-02-03 18:53:48'),
('2787fbf6-b3fa-4871-a2fa-f34e423afac0', 3, '15:00:00', '19:00:00', 1, 'weekly', NULL, NULL, '[]', '2026-02-03 18:53:48', '2026-02-03 18:53:48'),
('0163d1d8-4698-420b-82f9-66510304e413', 4, '10:00:00', '14:00:00', 1, 'weekly', NULL, NULL, '[]', '2026-02-03 18:53:48', '2026-02-03 18:53:48'),
('218fdb62-afdf-4c92-b223-744255db57b2', 4, '15:00:00', '19:00:00', 1, 'weekly', NULL, NULL, '[]', '2026-02-03 18:53:48', '2026-02-03 18:53:48'),
('bf8afd1b-1f28-44e2-8a93-b9670999aff9', 5, '10:00:00', '14:00:00', 1, 'weekly', NULL, NULL, '[]', '2026-02-03 18:53:48', '2026-02-03 18:53:48'),
('02cec479-64f0-4380-a116-abf0cf57af8f', 5, '15:00:00', '19:00:00', 1, 'weekly', NULL, NULL, '[]', '2026-02-03 18:53:48', '2026-02-03 18:53:48');

-- =============================================
-- Data: consultation_bookings
-- =============================================
INSERT INTO `consultation_bookings` (`id`, `player_user_id`, `booking_date`, `start_time`, `end_time`, `fee_amount`, `fee_currency`, `status`, `payment_status`, `payment_method`, `payment_reference`, `proof_url`, `meet_link`, `player_notes`, `admin_notes`, `confirmed_at`, `reminder_sent`, `admin_reminder_sent`, `created_at`, `updated_at`) VALUES
('7d141f0a-c6a6-46b7-9a72-8eb7d492d183', 'f95c9755-df0f-4b92-903f-7f0c39ad9bc4', '2026-01-25', '09:00:00', '10:00:00', 50.00, 'USD', 'confirmed', 'paid', 'bank_transfer', '654688668568658616', 'consultations/f95c9755-df0f-4b92-903f-7f0c39ad9bc4/1769278979395.png', 'https://meet.google.com/xxx-xxxx-xxx', 'اختبار عملية حجز استشارة', '', NULL, 1, 1, '2026-01-24 18:23:00', '2026-01-25 12:09:12'),
('f28602aa-7996-4ddd-8a17-96e8d665e9d3', 'a1790a52-7308-45e5-b45c-0dba668cefdb', '2026-02-05', '09:00:00', '10:00:00', 50.00, 'USD', 'cancelled', 'pending', 'wallet', '25626624626620', NULL, NULL, NULL, NULL, NULL, 0, 0, '2026-02-03 16:30:05', '2026-02-03 18:54:18');

-- =============================================
-- Data: payment_methods
-- =============================================
INSERT INTO `payment_methods` (`id`, `name`, `name_ar`, `type`, `config`, `instructions`, `instructions_ar`, `is_active`, `created_at`, `updated_at`) VALUES
('cc3b65ba-031b-42e9-8e50-7248b13d2214', 'Bank Transfer', 'تحويل بنكي', 'bank_transfer', '{"account_name":"Hesham Elsayed","account_number":"895668266565612","bank_name":"AlexBank","iban":"EG6546616316846615386132","swift_code":"ALEXXXXEG"}', 'Transfer to the bank account and upload receipt', 'حوّل إلى الحساب البنكي وارفع إيصال التحويل', 1, '2026-01-17 13:03:27', '2026-01-19 09:35:20'),
('4021d6ea-1535-423a-9c5d-023519a3220c', 'PayPal', 'باي بال', 'paypal', '{"client_id":"ARfp_X0HfP8WHBE227oRUH2v0XnivxR8L6miPMhsRumK3xl6QoI_LWUmpAdB9uRSSQe4VaS57DYl5j35","client_secret":"ENLDPWmg-3v-Rx64_0kDdXr5gOusJj7Zfl-QgEs8Qf32Z5OqwLB27r3p8OtO-NYnZZY2D5_lh830HJmi","email":"","mode":"live"}', 'Send payment to the PayPal email address', 'أرسل الدفع إلى عنوان البريد الإلكتروني الخاص بـ PayPal', 1, '2026-01-17 13:03:27', '2026-01-19 09:46:12'),
('6e1eaa26-eeea-4250-bb3f-eddb642337b2', 'OPay Egypt', 'أوباي مصر', 'opay', '{}', 'Pay through OPay', 'ادفع من خلال أوباي', 0, '2026-01-17 13:03:27', '2026-01-17 14:51:11'),
('c3b49f02-8a0b-4632-8c00-82c45c4011a6', 'E-Wallet', 'محفظة إلكترونية', 'wallet', '{"wallet_name":"Stars Agency","wallet_number":"01028566646","wallet_type":"Vodafon Cash"}', 'Transfer to wallet number and upload receipt', 'حوّل إلى رقم المحفظة وارفع إيصال التحويل', 0, '2026-01-17 13:03:27', '2026-02-03 18:58:44'),
('89be4e52-173a-4532-83a7-24bd017fffbd', '2Checkout', '2Checkout', '2checkout', '{}', 'Pay through 2Checkout', 'ادفع من خلال 2Checkout', 0, '2026-01-17 13:03:27', '2026-01-17 19:10:09'),
('7aeb05f4-c5ee-4f2e-91e7-12fab4d1f454', 'Stripe', 'سترايب', 'stripe', '{}', 'Pay securely with your card', 'ادفع بشكل آمن ببطاقتك', 0, '2026-01-17 13:03:27', '2026-01-19 09:25:51'),
('6e793bfb-dc99-4c88-a27a-c862e8e05af6', 'Kashier Egypt', 'كاشير مصر', 'kashier', '{}', 'Pay through Kashier', 'ادفع من خلال كاشير', 0, '2026-01-17 13:03:27', '2026-01-19 09:26:12');

-- =============================================
-- Data: languages
-- =============================================
INSERT INTO `languages` (`id`, `code`, `name`, `native_name`, `direction`, `is_active`, `is_default`, `order_index`, `created_at`, `updated_at`) VALUES
('b42c2a1c-753d-427a-b147-776538fe93f5', 'ar', 'Arabic', 'العربية', 'rtl', 1, 0, 1, '2026-01-17 15:23:30', '2026-01-24 13:03:28'),
('3d8ded36-3608-4c25-8c17-0a39b3f758f7', 'en', 'English', 'English', 'ltr', 1, 1, 2, '2026-01-17 15:23:30', '2026-01-24 13:03:28'),
('b4ed5b3e-9e10-4031-9c12-138cd5b38d16', 'du', 'German', 'الالمانية', 'ltr', 1, 0, 3, '2026-02-03 18:21:13', '2026-02-03 18:21:13');

-- =============================================
-- Data: translations (Arabic)
-- =============================================
INSERT INTO `translations` (`id`, `language_code`, `key`, `value`, `category`) VALUES
('1a4540b8-4fa5-48d0-9310-30d57770644e', 'ar', 'auth.alreadyHaveAccount', 'لديك حساب بالفعل؟', 'auth'),
('c822ef89-d629-43c0-a808-2b40b55c9c9d', 'ar', 'auth.createAccount', 'إنشاء حساب جديد', 'auth'),
('715c8a6d-56d4-408e-82a1-603c3bb72e86', 'ar', 'auth.email', 'البريد الإلكتروني', 'auth'),
('0331138a-f023-47bd-8946-2e701a792024', 'ar', 'auth.forgotPassword', 'نسيت كلمة المرور؟', 'auth'),
('f2e8160b-b5d5-4b68-bee6-48fdb46ad958', 'ar', 'auth.fullName', 'الاسم الكامل', 'auth'),
('1f47a693-f891-4cc5-8025-756beb132f35', 'ar', 'auth.noAccount', 'ليس لديك حساب؟', 'auth'),
('93ba39ab-ebba-4653-a3ed-340d7dd6fb11', 'ar', 'auth.password', 'كلمة المرور', 'auth'),
('55deea6d-5f9a-42b9-b593-8e3b9cc568bc', 'ar', 'auth.phone', 'رقم الهاتف', 'auth'),
('d745796e-3fa2-486e-87ad-3a4280932ddd', 'ar', 'auth.signIn', 'تسجيل الدخول', 'auth'),
('00dc4d94-e0ef-45d7-8801-a79713179aea', 'ar', 'auth.signUp', 'إنشاء حساب', 'auth'),
('f36ed7a3-4cae-4ee0-a4b2-50d1bea5c6f3', 'ar', 'club.active', 'نشط', 'club'),
('09a3329f-9ae1-4b0d-a7dd-253b89f5ced3', 'ar', 'club.browsePlayers', 'تصفح اللاعبين', 'club'),
('b536cd0f-4a3d-40fa-b491-47e26125507c', 'ar', 'club.dashboard', 'لوحة تحكم النادي', 'club'),
('8b480f06-931f-4308-9150-7221857d78c2', 'ar', 'club.daysRemaining', 'يوم متبقي', 'club'),
('3e961d85-b1ab-4caa-8ce0-acb36e7f91c1', 'ar', 'club.expired', 'منتهي', 'club'),
('64735042-0b7d-411a-bc4d-757a040a8f1f', 'ar', 'club.expiresIn', 'ينتهي في', 'club'),
('4a427790-1b6d-455f-915d-e45f3a744ac7', 'ar', 'club.favorites', 'المفضلة', 'club'),
('6e585a13-4ef7-42f4-9000-28e0755a0ae8', 'ar', 'club.notSubscribed', 'غير مشترك', 'club'),
('3540cce8-7e77-420a-9b25-589efd9ba52e', 'ar', 'club.profile', 'ملف النادي', 'club'),
('236db92c-30d7-4efc-a694-6e70926a595d', 'ar', 'club.subscriptionStatus', 'حالة الاشتراك', 'club'),
('2d56d2fb-9fdc-46e6-a6a9-71be3f949323', 'ar', 'common.add', 'إضافة', 'common'),
('def1b5ff-bf81-44fb-82d2-af65de457d74', 'ar', 'common.back', 'رجوع', 'common'),
('32646a85-e1ab-4baa-9858-34a50ac080a1', 'ar', 'common.cancel', 'إلغاء', 'common'),
('b3370ed1-738f-45fa-8414-28637fe1c186', 'ar', 'common.close', 'إغلاق', 'common'),
('d6206d94-6bdc-4fa1-a073-bf381a1d4574', 'ar', 'common.confirm', 'تأكيد', 'common'),
('d98c7ff8-dc3b-423a-91fd-d85e8b180169', 'ar', 'common.delete', 'حذف', 'common'),
('8da5cf7c-b0c7-4e1a-8724-58082992a48b', 'ar', 'common.edit', 'تعديل', 'common'),
('064b674b-2c7f-46b3-8347-8f4401346183', 'ar', 'common.error', 'خطأ', 'common'),
('6d6e1780-ad6a-4db9-848d-ade4c2eee52b', 'ar', 'common.filter', 'فلترة', 'common'),
('2d1f96c6-530c-45f3-aed1-ba1143bc767b', 'ar', 'common.learnMore', 'اعرف المزيد', 'common'),
('f33524a3-f35e-4cc4-a5cc-fc47457fea01', 'ar', 'common.loading', 'جاري التحميل...', 'common'),
('7685c564-b00b-45ac-b624-a32fb1aa50dd', 'ar', 'common.next', 'التالي', 'common'),
('5c0859c5-e4d1-4e85-83c0-ba8255f8f35c', 'ar', 'common.noResults', 'لا توجد نتائج', 'common'),
('76990e73-09ca-44aa-9fd2-90c5b0e35003', 'ar', 'common.previous', 'السابق', 'common'),
('562bbe8d-e968-4f88-bee7-9fa6e2d70eda', 'ar', 'common.save', 'حفظ', 'common'),
('808ecaa5-79cf-4f75-9616-a2810683161d', 'ar', 'common.search', 'بحث', 'common'),
('225595ce-91e1-41af-838f-58a58089aeb8', 'ar', 'common.submit', 'إرسال', 'common'),
('2e0f04e7-f267-4ea9-ab33-569610890ab0', 'ar', 'common.success', 'تم بنجاح', 'common'),
('fbc6facd-c4ed-4cf3-99e4-607296dcfe72', 'ar', 'common.viewAll', 'عرض الكل', 'common'),
('6eadaa0c-66f4-450e-b751-a140018ddfc8', 'ar', 'features.communication', 'التواصل', 'features'),
('d5296e34-7936-45e7-8017-2e4c31dbecfc', 'ar', 'features.extras', 'مميزات إضافية', 'features'),
('0df488fc-3e77-4aeb-b0ec-7ba9eb96d14d', 'ar', 'features.priority', 'أولوية العرض', 'features'),
('8db35699-89f2-4cf4-970c-a161ce1e930d', 'ar', 'features.search', 'البحث والفلترة', 'features'),
('458dcb0b-c68b-4e61-ae1b-b48d855815f7', 'ar', 'features.verification', 'التوثيق والميزات', 'features'),
('a277f378-86c8-495e-9cfd-191fb9cdf13f', 'ar', 'features.viewing', 'عرض اللاعبين', 'features'),
('a1271bbd-7607-4968-a09e-e98cabf2f468', 'ar', 'footer.contactUs', 'تواصل معنا', 'footer'),
('c87248ea-8079-4b8a-aee7-cdaff1df6b5f', 'ar', 'footer.description', 'الوكالة الرائدة في اكتشاف المواهب الكروية وربطها بأفضل الأندية حول العالم.', 'footer'),
('bbb12416-58f6-443c-b2ef-a97411165ab1', 'ar', 'footer.followUs', 'تابعنا', 'footer'),
('9fa6c4a2-553f-44e7-87ed-d16c1125ff9a', 'ar', 'footer.importantPages', 'صفحات مهمة', 'footer'),
('6518aca6-8faa-4980-9a23-91e08a28c21c', 'ar', 'footer.location', 'القاهرة، مصر', 'footer'),
('c7b9eea2-ba3b-4f08-bc3e-fe824dc2b42d', 'ar', 'footer.privacy', 'سياسة الخصوصية', 'footer'),
('b28936f5-b1e7-4c3c-91fa-23242d017ede', 'ar', 'footer.quickLinks', 'روابط سريعة', 'footer'),
('eea6ad38-a1de-4b11-848b-df9e199eb912', 'ar', 'footer.rights', 'جميع الحقوق محفوظة', 'footer'),
('0987e774-32ea-46d9-898d-3802e38bc860', 'ar', 'footer.terms', 'الشروط والأحكام', 'footer'),
('163948ba-421d-4119-a6c2-bcf08b04f18d', 'ar', 'playerReg.bio', 'نبذة تعريفية', 'forms'),
('f6ab32f5-92e4-4654-b453-edfa502a855c', 'ar', 'playerReg.bioPlaceholder', 'اكتب نبذة قصيرة عن نفسك وخبراتك...', 'forms'),
('6caa1a66-c69a-44e0-aefb-aa60d475d8f2', 'ar', 'playerReg.currentClub', 'النادي الحالي', 'forms'),
('51a2d057-c2c2-4935-8224-b86d927ad55a', 'ar', 'playerReg.currentClubPlaceholder', 'اسم النادي الحالي (اختياري)', 'forms'),
('7b2e789f-dc3d-4c9e-9135-0af9d7fa1701', 'ar', 'playerReg.dateOfBirth', 'تاريخ الميلاد', 'forms'),
('6cf18943-d080-4f97-8554-e621b698c63d', 'ar', 'playerReg.email', 'البريد الإلكتروني', 'forms'),
('b0ac377d-5dcf-4d45-b0ba-96c77d44ffaa', 'ar', 'playerReg.fullName', 'الاسم الكامل', 'forms'),
('d5bdee26-25db-47d3-9ef9-4d5d143b54e9', 'ar', 'playerReg.fullNamePlaceholder', 'أدخل اسمك الكامل', 'forms'),
('815408b4-6846-4023-a739-0890f0be98fb', 'ar', 'playerReg.height', 'الطول (سم)', 'forms'),
('a6be3e67-d458-4326-98f9-e690c2ffe5ee', 'ar', 'playerReg.idDocument', 'صورة الهوية', 'forms'),
('357f1be8-9a20-4852-8bdd-a6c70df56f67', 'ar', 'playerReg.idDocumentDesc', 'صورة واضحة لبطاقة الهوية أو جواز السفر', 'forms'),
('e2d9ad35-9a2c-44d3-a0f5-fda5dd9ed171', 'ar', 'playerReg.nationality', 'الجنسية', 'forms'),
('b518206d-8d2e-4b0b-b18b-0d74ce64b2d2', 'ar', 'playerReg.phone', 'رقم الهاتف', 'forms'),
('5cf3d787-0e7f-484c-8f10-d91a5842b768', 'ar', 'playerReg.position', 'المركز', 'forms'),
('8ebd9711-e9fb-4585-9b00-e43eec7d842d', 'ar', 'playerReg.previousClubs', 'الأندية السابقة', 'forms'),
('0cba2c86-373c-4730-9181-d41be0ab2f86', 'ar', 'playerReg.previousClubsPlaceholder', 'النادي 1، النادي 2، النادي 3', 'forms'),
('40ab574e-8e7f-42b7-bacd-e3caf788dc1d', 'ar', 'playerReg.profileImage', 'الصورة الشخصية', 'forms'),
('f3ffd225-bfcf-44d1-8dca-cd03d6c9a0b7', 'ar', 'playerReg.profileImageDesc', 'صورة واضحة للوجه بحجم أقصى 5 ميجابايت', 'forms'),
('b07f2a87-f4e9-4264-87b4-deb1fffd9b3d', 'ar', 'playerReg.selectDocument', 'اختر ملف', 'forms'),
('1fd423d5-ef9b-4588-8009-41a87e76745b', 'ar', 'playerReg.selectImage', 'اختر صورة', 'forms'),
('5750875c-a481-4d9a-87ba-8d0c995954b0', 'ar', 'playerReg.selectNationality', 'اختر الجنسية', 'forms'),
('83212311-1306-414c-862e-68ce38425ee5', 'ar', 'playerReg.selectPosition', 'اختر المركز', 'forms'),
('958b0b8c-125b-4c7f-93a0-74e222d1fb9b', 'ar', 'playerReg.selectVideos', 'اختر فيديوهات', 'forms'),
('21e3db71-4253-4774-9a8d-63a2f3e08d41', 'ar', 'playerReg.submit', 'تقديم طلب التسجيل', 'forms'),
('7d4e8508-50e1-4428-8891-ec792617c40e', 'ar', 'playerReg.submitting', 'جاري التقديم...', 'forms'),
('0f12ce46-993d-482d-aa4f-bbb9a5c5bdd5', 'ar', 'playerReg.videos', 'فيديوهات اللعب', 'forms'),
('c227273b-c31e-49f7-8e2b-272c12a070b7', 'ar', 'playerReg.videosDesc', 'فيديوهات تظهر مهاراتك (حد أقصى 5 فيديوهات، 100 ميجابايت لكل فيديو)', 'forms'),
('2f8d55ea-69ca-4cca-95e0-1035137da5c8', 'ar', 'playerReg.weight', 'الوزن (كجم)', 'forms'),
('aa5854fd-83e4-4e9d-806f-0b6d99ab712e', 'ar', 'subscription.confirmPayment', 'تأكيد الدفع', 'forms'),
('d1dff4b4-7baa-4108-a25b-846de7efc885', 'ar', 'subscription.enterTransactionNumber', 'أدخل رقم العملية', 'forms'),
('4ba6b40e-4adf-407f-b544-67e5c519e3e0', 'ar', 'subscription.paymentProof', 'إثبات الدفع', 'forms'),
('f53a0cc2-ad53-4651-a23e-4d541a137571', 'ar', 'subscription.processing', 'جاري المعالجة...', 'forms'),
('ad366b68-4381-4a11-993c-6b2f31556a21', 'ar', 'subscription.transactionNumber', 'رقم العملية', 'forms'),
('cdfc0408-dd83-4497-bec8-00eb9c049b10', 'ar', 'subscription.uploadProof', 'رفع إثبات الدفع', 'forms'),
('bad03d18-f867-4a03-b6d8-d24f4beedd24', 'ar', 'hero.badge', 'وكالة اللاعبين الأولى في الوطن العربي', 'hero'),
('19046dfe-2a57-4d57-bd1e-2bcbeda39814', 'ar', 'hero.cta.browse', 'تصفح اللاعبين', 'hero'),
('74cd431e-a7a7-4c00-8bc8-e3d8ea54ab89', 'ar', 'hero.cta.club', 'انضم كنادي', 'hero'),
('932a274d-4029-485b-a8fb-56580f956f5d', 'ar', 'hero.cta.player', 'سجل كلاعب', 'hero'),
('d212a135-1008-4290-be0d-b58e2871b54f', 'ar', 'hero.stats.clubs', 'نادي شريك', 'hero'),
('eea6ad38-a1de-4b11-848b-df9e199eb912', 'ar', 'footer.rights', 'جميع الحقوق محفوظة', 'footer');

-- =============================================
-- Data: menu_items
-- =============================================
INSERT INTO `menu_items` (`id`, `title`, `title_ar`, `url`, `location`, `is_external`, `order_index`, `is_active`, `parent_id`, `created_at`, `updated_at`) VALUES
('6490113f-30c2-4ffc-9c1d-86fd19ac3526', 'Home', 'الرئيسية', '#home', 'footer', 0, 1, 1, NULL, '2026-01-17 16:46:42', '2026-01-17 16:46:42'),
('db198694-a29e-466f-83e1-4e5eab450c74', 'Services', 'خدماتنا', '#services', 'footer', 0, 2, 1, NULL, '2026-01-17 16:46:42', '2026-01-17 16:46:42'),
('ef0f0db9-9b47-4295-ace3-3898d9b45d98', 'Players', 'اللاعبون', '#players', 'footer', 0, 3, 1, NULL, '2026-01-17 16:46:42', '2026-01-17 16:46:42'),
('81a2a4bc-8bce-4b85-b7e1-a5fb3b76f024', 'About', 'عن الوكالة', '#about', 'footer', 0, 4, 1, NULL, '2026-01-17 16:46:42', '2026-01-17 16:46:42'),
('f424ad7f-19c0-43a8-8e85-3bfdbf939c64', 'Contact', 'تواصل معنا', '#contact', 'footer', 0, 5, 1, NULL, '2026-01-17 16:46:42', '2026-01-17 16:46:42'),
('115c1d5a-c7b3-40d3-8fed-9a3b81a92aa7', 'Home', 'الرئيسية', '/', 'header', 0, 1, 1, NULL, '2026-01-17 16:46:42', '2026-01-20 16:53:30'),
('f53f5166-b5e4-4d7f-9f2e-f816f5ca874b', 'Services', 'خدماتنا', '#services', 'header', 0, 2, 1, NULL, '2026-01-17 16:46:42', '2026-01-17 16:46:42'),
('8d944ca6-8096-4edd-bba5-282563673f72', 'Players', 'اللاعبون', '#players', 'header', 0, 3, 1, NULL, '2026-01-17 16:46:42', '2026-01-17 16:46:42'),
('4f694b63-fbda-4541-a3d8-b61246264707', 'About', 'عن الوكالة', '/page/about', 'header', 0, 4, 1, NULL, '2026-01-17 16:46:42', '2026-01-20 19:44:58'),
('89ad1013-06ef-4355-8574-bd913f6491e6', 'Contact', 'تواصل معنا', '#contact', 'header', 0, 5, 1, NULL, '2026-01-17 16:46:42', '2026-01-18 18:07:06');

-- =============================================
-- Data: page_sections
-- =============================================
INSERT INTO `page_sections` (`id`, `page_key`, `section_key`, `is_visible`, `order_index`, `settings`, `updated_at`) VALUES
('0380e3b9-3ca1-4509-aa6a-794771b777df', 'home', 'hero', 1, 1, '{"background_video":"https://d.top4top.io/m_3671abaog1.mp4","media_opacity":100,"stat_clubs_value":"+250","stat_deals_value":"+5000","stat_players_value":"+50000"}', '2026-02-03 19:46:30'),
('b035f2e4-7995-40e0-a8ec-e187b3e60873', 'home', 'features', 1, 2, '{}', '2026-01-18 20:15:12'),
('e9b81264-4a9d-4f16-9020-4b5b0085870b', 'home', 'how_it_works', 1, 3, '{}', '2026-01-18 20:15:12'),
('4a3da4c5-c08e-410b-b445-33f6e570ce0d', 'home', 'players_slider', 1, 4, '{"badge":"outstanding players ","badge_ar":"لاعبين متميزين","description":"We have a local and international agency to introduce you to the best clubs. ","description_ar":"لدينا وكالة محلية وعالمية لتقديمك لأفضل النوادي","title_part1":"With us you will be ","title_part1_ar":"معنا ستكون","title_part2":"The best","title_part2_ar":"الأفضل"}', '2026-01-24 20:07:04'),
('5f823699-1a7f-4a62-b9f4-663700a29729', 'home', 'cta', 1, 5, '{}', '2026-01-18 20:15:12');

-- =============================================
-- Data: slider_settings
-- =============================================
INSERT INTO `slider_settings` (`id`, `slider_key`, `auto_play`, `auto_play_interval`, `show_navigation`, `show_dots`, `items_per_view`, `updated_at`) VALUES
('9802dc56-6640-48ae-b783-26def492b33b', 'players', 1, 3000, 1, 1, 5, '2026-01-22 18:48:28');

-- =============================================
-- Data: slider_items
-- =============================================
INSERT INTO `slider_items` (`id`, `slider_key`, `title`, `title_ar`, `subtitle`, `subtitle_ar`, `image_url`, `link_url`, `order_index`, `is_active`, `settings`, `created_at`, `updated_at`) VALUES
('75adca79-2af6-4332-b1a9-f281b1680b9b', 'players', 'You will reach progress', 'ستصل للتقدم', 'You will achieve your dream and become one of the stars in international clubs.', 'ستحقق حلمك وتكون أحد النجوم في النوادي العالمية.', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/slider-images/slider/75adca79-2af6-4332-b1a9-f281b1680b9b-1768931298286.jpg', '#', 1, 1, '{}', '2026-01-20 16:58:30', '2026-01-20 19:46:59'),
('22768386-a361-4ef6-ab72-cc89d4a31983', 'players', 'We save you the trouble of searching', 'نوفر عليك عناء البحث', 'We are committed to providing you with the best opportunities .', 'نهتم بتقديمك لأفضل الفرص .', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/slider-images/slider/22768386-a361-4ef6-ab72-cc89d4a31983-1768938473258.avif', '#', 2, 1, '{}', '2026-01-20 17:50:00', '2026-01-20 19:47:51'),
('62256535-cacb-4bd9-8150-d682cc272670', 'players', 'Introduce yourself on our website', 'قدم نفسك في موقعنا', 'Millions of clubs will be watching you to find the opportunity', 'سيشاهدك ملايين النوادي لتجد الفرصة', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/slider-images/slider/62256535-cacb-4bd9-8150-d682cc272670-1768938483072.png', '#', 3, 1, '{}', '2026-01-20 17:53:31', '2026-01-20 19:48:02'),
('ab4ac3a8-d608-4f3b-ad9d-1f614072128c', 'players', 'Don\'t miss your chance and join', 'لا تضيع فرصتك وأنضم', 'Be like the stars and become a professional', 'كن كالنجوم وأحترف', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/slider-images/slider/ab4ac3a8-d608-4f3b-ad9d-1f614072128c-1768938489468.png', '#', 4, 1, '{}', '2026-01-20 17:56:25', '2026-01-20 19:48:23'),
('e7a6a334-72ef-4ff4-9176-6cc757fb6c1c', 'players', 'Make your own history', 'أصنع التاريخ الخاص بك', 'Make your dream a reality and join us to find your opportunity', 'حقق حلمك وانضم لنا لتجد الفرصة', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/slider-images/slider/e7a6a334-72ef-4ff4-9176-6cc757fb6c1c-1768938506026.jpg', '#', 5, 1, '{}', '2026-01-20 18:18:34', '2026-01-20 19:48:23'),
('e5cffefa-11f8-4fce-9b90-2b28a6ba3345', 'players', 'Trust that you are the best ', 'ثق أنك الأفضل', 'You will be with the agent who gives you the opportunity', 'ستكون مع الوكيل الذي يمنحك الفرصة', 'https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/slider-images/slider/e5cffefa-11f8-4fce-9b90-2b28a6ba3345-1768938516915.jpg', '#', 6, 1, '{}', '2026-01-20 18:20:05', '2026-01-20 19:48:34');

-- =============================================
-- Data: theme_settings
-- =============================================
INSERT INTO `theme_settings` (`id`, `key`, `value`, `updated_at`) VALUES
('c0373765-653b-4964-9bcd-ec412e8fcb0c', 'colors', '{"dark":{"accent":"180 70% 20%","accent_foreground":"180 70% 75%","background":"210 40% 8%","foreground":"0 0% 98%","muted":"210 20% 18%","muted_foreground":"0 0% 70%","primary":"200 80% 50%","primary_foreground":"200 100% 10%","secondary":"210 30% 20%","secondary_foreground":"0 0% 98%"},"light":{"accent":"220 13% 96%","accent_foreground":"220 14% 30%","background":"0 0% 100%","foreground":"220 14% 10%","muted":"220 13% 94%","muted_foreground":"220 14% 50%","primary":"220 14% 40%","primary_foreground":"0 0% 100%","secondary":"220 13% 94%","secondary_foreground":"220 14% 20%"}}', '2026-01-24 21:19:10'),
('593def80-b53f-442c-b2bd-d32909412c48', 'mode_settings', '{"autoSwitch":false,"darkStart":"17:00","lightStart":"07:00","mode":"system"}', '2026-02-03 18:19:03');

-- =============================================
-- Data: site_settings
-- =============================================
INSERT INTO `site_settings` (`id`, `key`, `value`, `updated_at`) VALUES
('1819f9e9-a2ff-41ee-9ea4-fa5a84da20e6', 'footer_branding', '{"description":"الوكالة الرائدة في اكتشاف المواهب الكروية وربطها بأفضل الأندية حول العالم.","description_en":"The leading agency in discovering football talents and connecting them with the best clubs worldwide.","logo_url":"https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/slider-images/footer-logo-1770148439671.png"}', '2026-02-03 19:54:06'),
('b911cc35-514f-477b-acd8-20afdbcb177b', 'footer_contact', '{"email":"info@scoutgate.io","location":"بوخارست رومانيا","location_en":"Bucarest,Romania","phone":"+40733811219"}', '2026-02-03 18:15:20'),
('e78726ea-59af-4502-a824-2a2974ecf401', 'footer_social', '{"facebook":"","instagram":"","snapchat":"","tiktok":"","twitter":"","whatsapp":"","youtube":""}', '2026-01-18 23:45:46'),
('89719aff-3e45-432a-840c-482b7603ffdc', 'footer_social_advanced', '{"platforms":[{"enabled":true,"icon_type":"builtin","id":"facebook","name":"Facebook","name_ar":"فيسبوك","order":0,"url":"https://www.facebook.com/share/1C5uc4pFe7/"},{"enabled":true,"icon_type":"builtin","id":"twitter","name":"Twitter / X","name_ar":"تويتر / X","order":1,"url":"https://x.com/core_dev_tech"},{"enabled":true,"icon_type":"builtin","id":"instagram","name":"Instagram","name_ar":"إنستغرام","order":2,"url":"https://www.instagram.com/scoutgateai?igsh=bnR4aW82NGY0dzds"},{"enabled":false,"icon_type":"builtin","id":"youtube","name":"YouTube","name_ar":"يوتيوب","order":3,"url":"#"},{"enabled":true,"icon_type":"builtin","id":"tiktok","name":"TikTok","name_ar":"تيك توك","order":4,"url":"https://www.tiktok.com/@scoutgate.io?_r=1&_t=ZG-93caQfpvlAm"},{"enabled":true,"icon_type":"builtin","id":"whatsapp","name":"WhatsApp","name_ar":"واتساب","order":5,"url":"https://api.whatsapp.com/message/HTWYASL2VMC2M1?autoload=1&app_absent=0"},{"enabled":false,"icon_type":"builtin","id":"snapchat","name":"Snapchat","name_ar":"سناب شات","order":6,"url":""},{"enabled":true,"icon_type":"builtin","id":"linkedin","name":"LinkedIn","name_ar":"لينكد إن","order":7,"url":"https://www.linkedin.com/in/hesham-moustafa-161662387"},{"enabled":false,"icon_type":"builtin","id":"telegram","name":"Telegram","name_ar":"تيليجرام","order":8,"url":""},{"enabled":false,"icon_type":"builtin","id":"pinterest","name":"Pinterest","name_ar":"بينترست","order":9,"url":""}]}', '2026-02-03 20:04:13'),
('4e9c50d3-341f-4eaa-823b-3a421c75d5e9', 'footer_style', '{"accent_color":"#ffc400","background_color":"#404040","border_color":"#333333","text_color":"#ffffff"}', '2026-02-03 19:54:56'),
('4fc60876-0437-406d-abe8-fd15b2a93bea', 'player_registration_fee', '{"amount":5,"currency":"EUR","enabled":true}', '2026-01-17 13:03:27'),
('58598bc4-865c-45de-ace0-769b664e0c01', 'site_description', '{"ar":"وكالة لاعبي كرة القدم المحترفين","en":"Professional Football Players Agency"}', '2026-01-17 13:03:27'),
('67f076d2-0367-4c79-ae2c-8e44f2721f32', 'site_favicon', '{"dark_url":"https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/site-assets/favicon-dark-1769184184041.png","light_url":null}', '2026-01-23 16:00:51'),
('6b5d8394-2e0d-40ef-8005-7c8561faf60f', 'site_logo', '{"dark_image_url":"https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/site-assets/logo-dark-1769184120617.png","image_url":"https://uzxwawsybsnnyuoohkxo.supabase.co/storage/v1/object/public/site-assets/logo-dark-1769184046946.jpeg","size":"large","type":"image"}', '2026-01-20 16:22:56'),
('69dd4193-5036-43ee-9a01-b7d1e7c294e5', 'site_name', '{"ar":"Scout Gate","en":"Scout Gate"}', '2026-01-17 13:03:27');

-- =============================================
-- Data: custom_color_templates
-- =============================================
INSERT INTO `custom_color_templates` (`id`, `name`, `colors`, `created_by`, `created_at`, `updated_at`) VALUES
('aaad3c70-5235-4be4-93a5-161c284c81d9', 'القالب الحالي المحفوظ', '{"accent":"180 70% 20%","accent_foreground":"180 70% 75%","background":"210 40% 8%","foreground":"0 0% 0%","muted":"210 20% 40%","muted_foreground":"0 0% 90%","primary":"200 80% 50%","primary_foreground":"200 100% 10%","secondary":"210 30% 40%","secondary_foreground":"0 0% 98%"}', 'a1790a52-7308-45e5-b45c-0dba668cefdb', '2026-01-19 10:18:58', '2026-01-19 10:18:58'),
('6db7cf7c-0f3b-46d3-aa3b-f5d2c5fc994c', 'الافتراضي', '{"accent":"350 60% 20%","accent_foreground":"350 70% 75%","background":"0 20% 8%","foreground":"0 0% 98%","muted":"0 20% 40%","muted_foreground":"0 0% 90%","primary":"0 0% 100%","primary_foreground":"0 100% 95%","secondary":"0 30% 40%","secondary_foreground":"0 0% 98%"}', 'a1790a52-7308-45e5-b45c-0dba668cefdb', '2026-01-20 19:59:43', '2026-01-20 19:59:43');

-- =============================================
-- Data: pages (Terms, Privacy Policy, About Us)
-- =============================================
INSERT INTO `pages` (`id`, `slug`, `title`, `title_ar`, `content`, `content_ar`, `is_published`, `order_index`, `created_at`, `updated_at`) VALUES
('958002fb-37ae-4385-be42-b67a19459571', 'terms', 'terms of use', 'شروط الإستخدام',
'<p>Terms and Conditions</p><p>Last Updated: [2026]</p><p>Welcome to Scout Gate. Please read these Terms and Conditions (&quot;Terms&quot;) carefully before using the website [<a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-gold underline\" href=\"https://www.scoutgate.io\">https://www.scoutgate.io</a>] (&quot;Site&quot;) or any of our services.</p><p>By accessing or using the Site, or creating an account (whether as a player or a club), you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, please do not use the Site.</p><p>1. Definitions</p><p>&quot;Agency&quot; or &quot;we&quot; refers to Scout Gate, the owner and operator of the Site.</p><p>&quot;User&quot; refers to any person who visits or uses the Site, including &quot;Players,&quot; &quot;Clubs,&quot; and regular visitors.</p><p>&quot;Player&quot; refers to a user who registers on the Site to showcase their talent and athletic profile.</p><p>&quot;Club&quot; refers to the entity or official representative of a sports club that registers to search for players.</p><p>&quot;Services&quot;: All services offered through the website, including profile creation, skill assessments, and player databases.</p><p>2. Eligibility and Registration</p><p>Eligibility: You must be at least 18 years old to use the website independently. If you are under the legal age of majority, you must use the website under the supervision of a parent or legal guardian.</p><p>Accuracy of Information: The user (player or club) warrants that all information provided during registration (personal data, athletic record, videos, photos) is accurate, up-to-date, and complete.</p><p>Account Security: You are responsible for maintaining the confidentiality of your login credentials and are fully responsible for any activity that occurs under your account.</p><p>3. Player Services and Obligations</p><p>Profile Creation: The website allows players to create profiles and upload photos and videos of their skills.</p><p>Content Submitted: The player retains ownership of the content they upload but grants the agency a non-exclusive, worldwide, and free license to use, display, and publish this content for marketing and recruitment purposes.</p><p>Credibility: The player acknowledges that the videos and data accurately reflect their true skill level, and that any manipulation or falsification may result in immediate banning and disqualification from the agency\\''s services.</p><p>Guarantees: The agency strives to provide opportunities and market players, but registration on the site does not guarantee a professional contract or trial, as this is subject to club decisions and the player\\''s skill level.</p><p>4. Club Services and Subscriptions</p><p>Access to the Database: Clubs and player scouts may require paid subscriptions (if available) to access complete contact information or detailed player information.</p><p>Authorized Use: Clubs agree to use player data solely for sports contracting and scouting purposes. Selling or using this data for other commercial purposes without permission is prohibited.</p><p>5. Intellectual Property</p><p>All intellectual property rights pertaining to the site and its content (text, designs, &quot;Stars Agency&quot; logos, software) are the exclusive property of the agency. Copying or redistributing any part of the site without prior written permission is prohibited.</p><p>6. Prohibited Conduct</p><p>Users are prohibited from:</p><p>Using the site for any illegal purpose.</p><p>Posting offensive, defamatory, or infringing content that violates the rights of others.</p><p>Attempting to hack the site or collect data illegally (data scraping).</p><p>Providing false contact information or impersonating other clubs or agents.</p><p>7. Disclaimer</p><p>The site is provided &quot;as is,&quot; and the agency makes no express or implied warranties regarding the accuracy of content submitted by other users or the uninterrupted operation of the site.</p><p>The agency is not responsible for any agreements or contracts made outside its official framework between players and clubs unless it is a signatory and legally represented party to the contract.</p><p>8. Subscriptions and Payments (if applicable)</p><p>In the case of paid services (such as club subscriptions or premium rating services):</p><p>All fees are non-refundable except as stipulated by law or the agency\\''s refund policy.</p><p>The agency reserves the right to modify service prices at any time and will notify users accordingly.</p><p>9. Termination of Service</p><p>Scout Gate reserves the right to suspend or terminate the account of any user who violates these Terms or provides false information, without prior notice and without any liability.</p><p>10. Applicable Law</p><p>These Terms and Conditions are governed by the laws of the Republic of Romania, and the courts of Bucharest and FIFA shall have exclusive jurisdiction over any dispute arising from the use of this website.</p><p>11. Contact Information</p><p>If you have any questions regarding these Terms, please contact us via:</p><p>Email: <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-gold underline\" href=\"mailto:info@scoutgate.io\">info@scoutgate.io</a></p><p>Phone: +40733811219 (or the number listed on the website)</p><p>Address: Bucharest,Romania.</p>',
'<p></p><h1>الشروط والأحكام</h1><p><strong>تاريخ آخر تحديث:</strong> [2026]</p><p>مرحباً بكم في موقع<strong> (</strong>scoutgate.io<strong>)</strong>. يرجى قراءة هذه الشروط والأحكام (&quot;الشروط&quot;) بعناية قبل استخدام الموقع الإلكتروني <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-gold underline\" href=\"https://scoutgate.io\">scoutgate.io</a> أو الاستفادة من أي من خدماتنا.</p><p>بمجرد الوصول إلى الموقع أو استخدامه، أو إنشاء حساب (سواء كلاعب أو كنادٍ)، فإنك تقر بأنك قد قرأت وفهمت ووافقت على الالتزام بهذه الشروط. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام الموقع.</p><h2>1. تعريفات</h2><ul><li><p><strong>&quot;الوكالة&quot; أو &quot;نحن&quot;:</strong> يقصد بها &quot;Scout Gate&quot;، مالكة الموقع والمشغلة له.</p></li><li><p><strong>&quot;المستخدم&quot;:</strong> يقصد به أي شخص يقوم بزيارة الموقع أو استخدامه، ويشمل ذلك &quot;اللاعبين&quot; و&quot;الأندية&quot; والزوار العاديين.</p></li><li><p><strong>&quot;اللاعب&quot;:</strong> المستخدم الذي يقوم بالتسجيل في الموقع بغرض عرض موهبته وسيرته الذاتية الرياضية.</p></li><li><p><strong>&quot;النادي&quot;:</strong> الجهة أو الممثل الرسمي لنادٍ رياضي يقوم بالتسجيل للبحث عن لاعبين.</p></li><li><p><strong>&quot;الخدمات&quot;:</strong> كافة الخدمات المقدمة عبر الموقع، بما في ذلك إنشاء الملفات الشخصية، تقييم المهارات، وقواعد بيانات اللاعبين.</p></li></ul><h2>2. الأهلية والتسجيل</h2><ol><li><p><strong>الأهلية:</strong> يجب أن يكون عمرك 18 عاماً على الأقل لاستخدام الموقع بمفردك. إذا كنت دون سن الرشد القانوني، يجب استخدام الموقع تحت إشراف ولي الأمر أو الوصي القانوني.</p></li><li><p><strong>دقة المعلومات:</strong> يتعهد المستخدم (لاعب أو نادٍ) بأن جميع المعلومات المقدمة أثناء التسجيل (البيانات الشخصية، السجل الرياضي، الفيديوهات، الصور) هي معلومات دقيقة، حديثة، وكاملة.</p></li><li><p><strong>أمن الحساب:</strong> أنت مسؤول عن الحفاظ على سرية بيانات الدخول الخاصة بك، وتتحمل المسؤولية الكاملة عن أي نشاط يحدث تحت حسابك.</p></li></ol><h2>3. خدمات والتزامات اللاعبين</h2><ol><li><p><strong>إنشاء الملف الشخصي:</strong> يتيح الموقع للاعبين إنشاء ملفات تعريفية، رفع صور، وفيديوهات لمهاراتهم.</p></li><li><p><strong>المحتوى المقدم:</strong> يحتفظ اللاعب بملكية المحتوى الذي يرفعه، ولكنه يمنح الوكالة رخصة غير حصرية، عالمية، ومجانية لاستخدام هذا المحتوى، وعرضه، ونشره بغرض التسويق له وجلب العروض.</p></li><li><p><strong>المصداقية:</strong> يقر اللاعب بأن الفيديوهات والبيانات تعكس مستواه الحقيقي، وأن أي تلاعب أو تزييف قد يؤدي إلى الحظر الفوري والحرمان من خدمات الوكالة.</p></li><li><p><strong>الضمانات:</strong> تسعى الوكالة لتوفير الفرص وتسويق اللاعب، لكن التسجيل في الموقع <strong>لا يضمن</strong> حتمية الحصول على عقد احترافي أو تجربة معينة، حيث يخضع ذلك لقرارات الأندية ومستواك الفني.</p></li></ol><h2>4. خدمات واشتراكات الأندية</h2><ol><li><p><strong>الوصول لقاعدة البيانات:</strong> قد يتطلب وصول الأندية وكشافة اللاعبين إلى بيانات الاتصال الكاملة أو التفاصيل الدقيقة للاعبين الاشتراك في باقات مدفوعة (إذا توفرت).</p></li><li><p><strong>الاستخدام المصرح به:</strong> تتعهد الأندية باستخدام بيانات اللاعبين لأغراض التعاقد الرياضي والاستكشاف فقط، ويمنع بيع هذه البيانات أو استخدامها لأغراض تجارية أخرى دون إذن.</p></li></ol><h2>5. الملكية الفكرية</h2><p>جميع حقوق الملكية الفكرية الخاصة بالموقع ومحتوياته (النصوص، التصاميم، الشعارات &quot;Stars Agency&quot;، البرمجيات) هي ملك حصري للوكالة. يمنع نسخ أو إعادة توزيع أي جزء من الموقع دون إذن كتابي مسبق.</p><h2>6. السلوك المحظور</h2><p>يحظر على المستخدمين:</p><ul><li><p>استخدام الموقع لأي غرض غير قانوني.</p></li><li><p>نشر محتوى مسيء، تشهيري، أو ينتهك حقوق الآخرين.</p></li><li><p>محاولة اختراق الموقع أو جمع البيانات بطرق غير مشروعة (Data Scraping).</p></li><li><p>تقديم بيانات اتصال وهمية أو انتحال صفة أندية أو وكلاء آخرين.</p></li></ul><h2>7. إخلاء المسؤولية</h2><ol><li><p>الموقع يقدم &quot;كما هو&quot;، ولا تقدم الوكالة أي ضمانات صريحة أو ضمنية بخصوص دقة المحتوى المقدم من المستخدمين الآخرين أو استمرارية عمل الموقع دون انقطاع.</p></li><li><p>الوكالة غير مسؤولة عن أي اتفاقيات أو عقود تتم خارج إطارها الرسمي بين اللاعبين والأندية ما لم تكن طرفاً موقعاً وممثلاً قانونياً في العقد.</p></li></ol><h2>8. الاشتراكات والمدفوعات (إن وجدت)</h2><p>في حال وجود خدمات مدفوعة (مثل اشتراكات الأندية أو خدمات التقييم المميزة):</p><ul><li><p>جميع الرسوم غير قابلة للاسترداد إلا في الحالات التي ينص عليها القانون أو سياسة الاسترجاع الخاصة بالوكالة.</p></li><li><p>تحتفظ الوكالة بالحق في تعديل أسعار الخدمات في أي وقت مع إشعار المستخدمين بذلك.</p></li></ul><h2>9. إنهاء الخدمة</h2><p>تحتفظ &quot;Scout Gate&quot; بالحق في تعليق أو إنهاء حساب أي مستخدم ينتهك هذه الشروط، أو يقدم معلومات كاذبة، دون سابق إنذار ودون أدنى مسؤولية عليها.</p><h2>10. القانون الواجب التطبيق</h2><p>تخضع هذه الشروط والأحكام لقوانين <strong>جمهورية رومانيا</strong>، وتختص محاكم بوخارست والفيفا بالفصل في أي نزاع ينشأ عن استخدام هذا الموقع.</p><h2>11. معلومات الاتصال</h2><p>إذا كان لديك أي استفسار بخصوص هذه الشروط، يرجى التواصل معنا عبر:</p><ul><li><p>البريد الإلكتروني: <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-gold underline\" href=\"mailto:info@scoutgate.io\">info@scoutgate.io</a></p></li><li><p>الهاتف: +40733811219 (أو الرقم المذكور على الموقع)</p></li><li><p>العنوان: بوخارست،رومانيا.</p></li></ul><hr><p></p>',
1, 0, NOW(), NOW()),

('6721b685-ac8f-4445-8ed6-f9d21e34a29a', 'privacypolicy', 'privacy policy', 'سياسة الخصوصية',
'<p>Privacy Policy</p><p>Last Updated: [2026]</p><p>Welcome to the Scout Gate website (&quot;we,&quot; &quot;the Agency,&quot; or &quot;the Site&quot;) available at [<a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-gold underline\" href=\"https://www.scoutgate.io\">https://www.scoutgate.io</a>].</p><p>We take your privacy seriously, and this Privacy Policy explains how we collect, use, and protect your personal information when you use our Site or services, whether you are a player seeking professional opportunities or a club looking for talent.</p><p>1. Information We Collect</p><p>We collect various types of information to effectively provide our services:</p><p>A. Information You Provide Directly to Us:</p><p>Registration Data: Full name, date of birth, email address, phone number, and country/city.</p><p>Sports Profile (for players): Position, height, weight, preferred foot, past and present clubs, awards, and achievements.</p><p>Multimedia: Personal photos and videos showcasing your skills (which you upload or provide us with links to).</p><p>Club Data (for Clubs/Scouts): Club name, representative\\''s job title, and official contact information.</p><p>B. Information We Collect Automatically:</p><p>Device and browser data, IP address, visit time, and pages visited, for performance analysis and website improvement purposes.</p><p>2. How We Use Your Information</p><p>We use the data we collect for the following purposes:</p><p>Providing the Basic Service: Creating your player profile and displaying it to clubs and player agents registered with us.</p><p>Sports Marketing: Analyzing your data and skills to match you with suitable opportunities and send your profile to partner clubs.</p><p>Communication: Sending notifications about offers, tryouts, or updates about your account.</p><p>Website Improvement: Understanding how visitors use the website to improve our technical services.</p><p>Security: Identity verification and preventing fraud or the creation of fake accounts.</p><p>3. Sharing and Disclosure of Information</p><p>As a player marketing agency, sharing your data is central to our business, but we do so within specific limits:</p><p>With Clubs and Scouts: Your profile (including photos, videos, and athletic data) is shared with clubs and sporting directors registered on our platform or our partners worldwide for the purpose of evaluating and potentially signing you.</p><p>With the Public (Optional): Certain parts of your profile (such as your name, position, and introductory video) may be publicly available to increase your chances of being discovered, depending on the site\\''s settings.</p><p>Service Providers: We may share technical data with hosting and analytics providers to ensure the website functions correctly.</p><p>Legal Compliance: We may disclose your information if required to do so by law or in response to applicable legal proceedings.</p><p>We do not sell your personal data (such as email address or phone number) to third-party marketing agencies outside of football.</p><p>4. Privacy of Minors (Under 18)</p><p>Since many football talents are under the age of majority:</p><p>Any user under the age of 18 must be registered under the supervision of a parent or legal guardian.</p><p>We reserve the right to request proof of parental consent before activating an account or marketing a player.</p><p>If we discover that personal data has been collected from a child without parental consent, we will delete that data immediately.</p><p>5. Data Security</p><p>We use appropriate technical and administrative security measures (such as SSL encryption) to protect your information from unauthorized access, alteration, or disclosure. However, please be aware that no method of transmission over the Internet is 100% secure.</p><p>6. Your Rights as a User</p><p>Access and Correction: You can access your account at any time to modify your personal or sports data or update videos.</p><p>Deletion: You have the right to request the permanent deletion of your account and data from our database by contacting us directly.</p><p>Unsubscribe: You can unsubscribe from our marketing emails at any time via the link provided in the emails.</p><p>7. Cookies</p><p>Our website uses cookies to enhance your experience (such as remembering to log in). You can configure your browser to refuse cookies, but this may affect the functionality of some website features.</p><p>8. Links to External Websites</p><p>Our website may contain links to other websites (such as YouTube or club websites). We are not responsible for the privacy practices of those websites, and we encourage you to read their respective policies.</p><p>9. Policy Amendments</p><p>We may update this Privacy Policy from time to time to reflect changes in our services or applicable laws. Any changes will be posted on this page, and your continued use of the website constitutes acceptance of those changes.</p><p>10. Contact Us</p><p>If you have any questions or concerns regarding our Privacy Policy or your data, please contact us:</p><p>Email: <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-gold underline\" href=\"mailto:info@scoutgate.io\">info@scoutgate.io</a></p><p>Address: Bucharest,Romania</p><p>Phone: +40733811219</p><p>Scout Gate - Protecting your privacy while helping you achieve your dreams.</p>',
'<h1>سياسة الخصوصية</h1><p><strong>تاريخ آخر تحديث:</strong> [2026]</p><p>مرحباً بك في موقع <strong>(Scout Gate)</strong> (&quot;نحن&quot;، &quot;الوكالة&quot;، أو &quot;الموقع&quot;) المتاح عبر الرابط <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-gold underline\" href=\"https://www.scoutgate.io/\">[https://www.scoutgate.io</a>].</p><p>نحن نأخذ خصوصيتك على محمل الجد، وتوضح سياسة الخصوصية هذه كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك الشخصية عند استخدامك لموقعنا أو خدماتنا، سواء كنت <strong>لاعباً</strong> تبحث عن فرص احترافية، أو <strong>نادياً</strong> يبحث عن مواهب.</p><h2>1. المعلومات التي نجمعها</h2><p>نحن نجمع أنواعاً مختلفة من المعلومات لتقديم خدماتنا بفعالية:</p><h3>أ. المعلومات التي تقدمها لنا مباشرة:</h3><ul><li><p><strong>بيانات التسجيل:</strong> الاسم الكامل، تاريخ الميلاد، البريد الإلكتروني، رقم الهاتف، والدولة/المدينة.</p></li><li><p><strong>الملف الرياضي (للاعبين):</strong> المركز في الملعب، الطول، الوزن، القدم المفضلة، الأندية السابقة والحالية، الجوائز، والإنجازات.</p></li><li><p><strong>الوسائط المتعددة:</strong> الصور الشخصية، ومقاطع الفيديو التي تظهر مهاراتك (والتي تقوم برفعها أو تزويدنا بروابط لها).</p></li><li><p><strong>بيانات الأندية (للأندية/الكشافة):</strong> اسم النادي، المسمى الوظيفي للممثل، وبيانات الاتصال الرسمية.</p></li></ul><h3>ب. المعلومات التي نجمعها تلقائياً:</h3><ul><li><p>بيانات الجهاز والمتصفح، عنوان الـ IP، ووقت الزيارة، والصفحات التي تمت زيارتها، وذلك لأغراض تحليل الأداء وتحسين الموقع.</p></li></ul><h2>2. كيف نستخدم معلوماتك</h2><p>نستخدم البيانات التي نجمعها للأغراض التالية:</p><ol><li><p><strong>تقديم الخدمة الأساسية:</strong> إنشاء ملفك الشخصي كلاعب وعرضه أمام الأندية ووكلاء اللاعبين المسجلين لدينا.</p></li><li><p><strong>التسويق الرياضي:</strong> تحليل بياناتك ومهاراتك لترشيحك للفرص المناسبة وإرسال ملفك للأندية الشريكة.</p></li><li><p><strong>التواصل:</strong> لإرسال إشعارات حول العروض، تجارب الأداء، أو تحديثات حول حسابك.</p></li><li><p><strong>تحسين الموقع:</strong> فهم كيفية استخدام الزوار للموقع لتطوير خدماتنا التقنية.</p></li><li><p><strong>الأمان:</strong> التحقق من الهوية ومنع الاحتيال أو إنشاء حسابات وهمية.</p></li></ol><h2>3. مشاركة المعلومات والإفصاح عنها</h2><p>بصفتنا وكالة تسويق لاعبين، فإن <strong>مشاركة بياناتك هي جوهر عملنا</strong>، ولكننا نقوم بذلك ضمن حدود محددة:</p><ul><li><p><strong>مع الأندية والكشافة:</strong> يتم عرض ملفك الشخصي (بما في ذلك الصور، الفيديوهات، والبيانات الرياضية) للأندية والمدراء الرياضيين المسجلين في منصتنا أو شركائنا حول العالم لغرض تقييمك والتعاقد معك.</p></li><li><p><strong>مع الجمهور (اختياري):</strong> قد تكون بعض أجزاء ملفك الشخصي (مثل الاسم، المركز، والفيديو التعريفي) متاحة للعامة لزيادة فرص اكتشافك، وذلك بناءً على إعدادات الموقع.</p></li><li><p><strong>مقدمو الخدمات:</strong> قد نشارك بيانات تقنية مع مزودي خدمات الاستضافة والتحليل التقني لضمان عمل الموقع.</p></li><li><p><strong>الامتثال القانوني:</strong> قد نفصح عن معلوماتك إذا طلب منا ذلك بموجب القانون أو استجابة لإجراءات قانونية سارية.</p></li></ul><p><strong>نحن لا نقوم ببيع بياناتك الشخصية (مثل البريد الإلكتروني أو رقم الهاتف) لجهات تسويقية خارجية غير متعلقة بكرة القدم.</strong></p><h2>4. خصوصية القاصرين (أقل من 18 عاماً)</h2><p>نظراً لأن العديد من المواهب الكروية هم دون سن الرشد القانوني:</p><ul><li><p>يجب أن يتم تسجيل أي مستخدم يقل عمره عن 18 عاماً تحت إشراف <strong>ولي الأمر أو الوصي القانوني</strong>.</p></li><li><p>نحتفظ بالحق في طلب إثبات موافقة ولي الأمر قبل تفعيل الحساب أو تسويق اللاعب.</p></li><li><p>إذا اكتشفنا أنه تم جمع بيانات شخصية من طفل دون موافقة ولي الأمر، فسنقوم بحذف تلك البيانات فوراً.</p></li></ul><h2>5. أمن البيانات</h2><p>نحن نستخدم تدابير أمنية تقنية وإدارية مناسبة (مثل بروتوكول التشفير SSL) لحماية معلوماتك من الوصول غير المصرح به أو التغيير أو الكشف. ومع ذلك، يرجى العلم أنه لا توجد وسيلة نقل عبر الإنترنت آمنة بنسبة 100%.</p><h2>6. حقوقك كمستخدم</h2><ul><li><p><strong>الوصول والتصحيح:</strong> يمكنك الدخول إلى حسابك في أي وقت لتعديل بياناتك الشخصية أو الرياضية أو تحديث الفيديوهات.</p></li><li><p><strong>الحذف:</strong> يحق لك طلب حذف حسابك وبياناتك نهائياً من قاعدة بياناتنا عبر التواصل معنا مباشرة.</p></li><li><p><strong>إلغاء الاشتراك:</strong> يمكنك إلغاء الاشتراك في رسائلنا التسويقية في أي وقت عبر الرابط المرفق في الرسائل.</p></li></ul><h2>7. ملفات تعريف الارتباط (Cookies)</h2><p>يستخدم موقعنا ملفات تعريف الارتباط لتحسين تجربتك (مثل تذكر تسجيل دخولك). يمكنك ضبط متصفحك لرفض ملفات تعريف الارتباط، ولكن قد يؤثر ذلك على عمل بعض ميزات الموقع.</p><h2>8. روابط لمواقع خارجية</h2><p>قد يحتوي موقعنا على روابط لمواقع أخرى (مثل يوتيوب أو مواقع أندية). نحن غير مسؤولين عن ممارسات الخصوصية الخاصة بتلك المواقع، وننصحك بقراءة سياساتهم الخاصة.</p><h2>9. التعديلات على السياسة</h2><p>قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر لتعكس التغييرات في خدماتنا أو القوانين المعمول بها. سيتم نشر أي تغييرات في هذه الصفحة، ويعد استمرارك في استخدام الموقع موافقة عليها.</p><h2>10. اتصل بنا</h2><p>إذا كانت لديك أي أسئلة أو مخاوف بخصوص سياسة الخصوصية أو بياناتك، يرجى التواصل معنا:</p><ul><li><p><strong>البريد الإلكتروني:</strong> <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-gold underline\" href=\"mailto:info@scoutgate.io\">info@scoutgate.io</a></p></li><li><p><strong>العنوان:</strong> بوخارست،رومانيا.</p></li><li><p><strong>الهاتف:</strong> +40733811219</p></li></ul><hr><p><strong>(Scout Gate)</strong> - نحمي خصوصيتك بينما نحقق حلمك.</p>',
1, 1, NOW(), NOW()),

('77931b42-bc2b-4f76-bebd-849f2cf584c6', 'about', 'about us', 'معلومات عنا',
'<p>About Us | Scout Gate</p><p>Your First Partner on Your Professional Journey</p><p>At Scout Gate, we don\\''t see football as just a game; we see it as an opportunity, a dream, and a future. We are the leading platform and agency specializing in discovering and marketing football talent. We strive to bridge the gap between talented players seeking an opportunity and clubs looking for the stars of tomorrow.</p><p>Our agency (based in Bucharest) was founded to be the bridge that players cross from amateur to professional, relying on a broad international network and a team of legal and sports experts.</p><p>Our Vision</p><p>To be the premier destination and the most trusted source for discovering football talent in the Middle East, Africa, and the world. We aspire to build a digital sports community that ensures every genuine talent is seen and fairly assessed, regardless of where they are located.</p><p>Our Mission</p><p>To empower young footballers by providing them with the necessary tools to develop their careers, from accurate technical assessments and legal contract protection to professional marketing with partner clubs. Why Choose Scout Gate?</p><p>We understand that the road to professionalism is full of challenges, which is why we offer comprehensive solutions:</p><p>Global Network: We are proud of our partnerships with over 250 clubs in Europe, Asia, and Africa, opening up vast opportunities for our players.</p><p>Professional Assessment: We don\\''t rely on luck; we use data analysis and expert assessments to highlight your true strengths to scouts.</p><p>Comprehensive Legal Protection: Our legal team ensures your rights are protected in all contracts and agreements, so you can focus on the pitch while we focus on protecting you.</p><p>Technology in the Service of Sport: Through our website, we make it easy for players to create professional profiles (athlete CVs) that reach recruitment managers with the click of a button.</p><p>Numbers Speak for Themselves</p><p>We believe in the language of numbers and achievements:</p><p>+50000 talented players registered in our database.</p><p>+250 partner clubs trust our recommendations.</p><p>+5000 successful professional deals and contracts concluded.</p><p>Our Team</p><p>Behind every great player is a great team. At Scout Gate, our team includes a select group of:</p><p>Licensed player agents.</p><p>Experienced professional scouts.</p><p>Legal advisors specializing in FIFA regulations.</p><p>Digital marketing experts to showcase your talent to the world.</p><p>Join us today.</p><p>Whether you\\''re a player dreaming of playing in the top leagues, or a club looking for the missing piece in its squad, Scout Gate is the place for you.</p><p>Don\\''t wait for the opportunity... create it with us.</p><p><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-gold underline\" href=\"/player-registration\">Register as a player</a> <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-gold underline\" href=\"/club-registration\">Register as a club</a></p>',
'<h1>من نحن | Scout Gate</h1><h3>شريكك الأول في رحلة الاحتراف</h3><p>في <strong>Scout Gate</strong> نحن لا نرى كرة القدم مجرد لعبة، بل نراها فرصة، حلماً، ومستقبلاً. نحن المنصة الرائدة والوكالة المتخصصة في اكتشاف وتسويق مواهب كرة القدم، نسعى لسد الفجوة بين اللاعبين الموهوبين الباحثين عن فرصة، والأندية التي تبحث عن نجوم المستقبل.</p><p>تأسست وكالتنا (ومقرها بوخارست) لتكون الجسر الذي يعبر عليه اللاعبون من الهواية إلى الاحتراف، معتمدين في ذلك على شبكة علاقات دولية واسعة، وفريق من الخبراء القانونيين والرياضيين.</p><hr><h3>رؤيتنا (Our Vision)</h3><p>أن نكون الوجهة الأولى والمصدر الأكثر موثوقية لاكتشاف المواهب الكروية في الشرق الأوسط، أفريقيا، والعالم. نطمح لبناء مجتمع رياضي رقمي يضمن لكل موهبة حقيقية أن تُرى وتُقيم بإنصاف، بغض النظر عن مكان تواجدها.</p><h3>رسالتنا (Our Mission)</h3><p>تمكين لاعبي كرة القدم الشباب من خلال تزويدهم بالأدوات اللازمة لتطوير مسيرتهم المهنية، بدءاً من التقييم الفني الدقيق، مروراً بالحماية القانونية للعقود، وصولاً إلى التسويق الاحترافي لدى الأندية الشريكة.</p><hr><h3>لماذا تختار Scout Gate ؟</h3><p>نحن ندرك أن الطريق إلى الاحتراف مليء بالتحديات، ولهذا نقدم حلولاً متكاملة:</p><ol><li><p><strong>شبكة علاقات عالمية:</strong> نفخر بشراكتنا مع أكثر من <strong>250 نادياً</strong> في أوروبا، آسيا، وأفريقيا، مما يفتح آفاقاً واسعة للاعبينا.</p></li><li><p><strong>تقييم احترافي:</strong> لا نعتمد على الحظ؛ بل نستخدم تحليلات البيانات وتقييمات الخبراء لإبراز نقاط قوتك الحقيقية أمام الكشافة.</p></li><li><p><strong>حماية قانونية شاملة:</strong> فريقنا القانوني يضمن حماية حقوقك في كافة العقود والاتفاقيات، لتركز أنت على الملعب ونركز نحن على حمايتك.</p></li><li><p><strong>التكنولوجيا في خدمة الرياضة:</strong> من خلال موقعنا الإلكتروني، نسهل على اللاعبين إنشاء ملفات احترافية (CV رياضي) تصل لمديري التعاقدات بضغطة زر.</p></li></ol><hr><h3>أرقام تتحدث عنا</h3><p>نحن نؤمن لغة الأرقام والإنجازات:</p><ul><li><p><strong>+50000</strong> لاعب موهوب مسجل في قاعدة بياناتنا.</p></li><li><p><strong>+250</strong> نادي شريك يثقون في ترشيحاتنا.</p></li><li><p><strong>+5000</strong> صفقة وعقد احتراف ناجح تم إبرامها.</p></li></ul><hr><h3>فريقنا</h3><p>وراء كل لاعب عظيم فريق عظيم. في <strong>Scout Gate </strong>، يضم فريقنا نخبة من:</p><ul><li><p>وكلاء لاعبين معتمدين.</p></li><li><p>كشافين محترفين ذوي خبرة في الملاعب.</p></li><li><p>مستشارين قانونيين متخصصين في اللوائح الرياضية (FIFA).</p></li><li><p>خبراء تسويق رقمي لإبراز موهبتك للعالم.</p></li></ul><hr><h3>انضم إلينا اليوم</h3><p>سواء كنت لاعباً يحلم باللعب في الدوريات الكبرى، أو نادياً يبحث عن القطعة المفقودة في تشكيلته، فإن <strong>Scout Gate</strong> هي وجهتك.</p><p><strong>لا تنتظر الفرصة.. اصنعها معنا.</strong></p><h1><a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-gold underline\" href=\"/player-registration\">التسجيل كلاعب</a> <a target=\"_blank\" rel=\"noopener noreferrer nofollow\" class=\"text-gold underline\" href=\"/club-registration\">التسجيل كنادي</a></h1><p></p>',
1, 2, NOW(), NOW());

-- =============================================
-- Re-enable foreign key checks
-- =============================================
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- NOTES:
-- 1. Row Level Security (RLS) is NOT available in MariaDB
--    You must implement access control in your application layer
-- 2. Supabase Auth is NOT included - you need a separate auth system
--    Create a `users` table with password hashing for authentication
-- 3. Storage buckets (player-images, player-documents, etc.) 
--    are NOT included - use a file storage service
-- 4. Realtime subscriptions - Use polling or WebSocket solutions
-- 5. The google_api_settings in site_settings contains sensitive API keys
--    Make sure to secure them properly in your environment
-- =============================================
