-- =============================================
-- Database Schema for MariaDB
-- Converted from PostgreSQL (Supabase)
-- =============================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';

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
-- View: players_public (as a regular view)
-- =============================================
CREATE OR REPLACE VIEW `players_public` AS
SELECT
  p.`id`,
  p.`user_id`,
  p.`full_name`,
  p.`position`,
  p.`nationality`,
  p.`bio`,
  p.`profile_image_url`,
  p.`video_urls`,
  p.`height_cm`,
  p.`weight_kg`,
  p.`status`,
  p.`created_at`,
  p.`updated_at`,
  pp.`date_of_birth`
FROM `players` p
LEFT JOIN `player_private` pp ON p.`user_id` = pp.`user_id`
WHERE p.`status` = 'approved';

-- =============================================
-- View: payment_methods_public
-- =============================================
CREATE OR REPLACE VIEW `payment_methods_public` AS
SELECT
  `id`,
  `name`,
  `name_ar`,
  `type`,
  `instructions`,
  `instructions_ar`,
  `is_active`,
  `config`,
  `created_at`,
  `updated_at`
FROM `payment_methods`
WHERE `is_active` = 1;

-- =============================================
-- View: custom_color_templates_public
-- =============================================
CREATE OR REPLACE VIEW `custom_color_templates_public` AS
SELECT
  `id`,
  `name`,
  `colors`,
  `created_at`,
  `updated_at`
FROM `custom_color_templates`;

-- =============================================
-- Helper Functions
-- =============================================

DELIMITER //

-- Function: Check if user has active subscription
CREATE FUNCTION IF NOT EXISTS `has_active_subscription`(uid CHAR(36))
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE result TINYINT(1) DEFAULT 0;
  SELECT 1 INTO result
  FROM `subscriptions`
  WHERE `user_id` = uid
    AND `status` = 'active'
    AND `end_date` >= NOW()
  LIMIT 1;
  RETURN COALESCE(result, 0);
END //

-- Function: Check if user has a specific role
CREATE FUNCTION IF NOT EXISTS `has_role`(uid CHAR(36), role_name VARCHAR(20))
RETURNS TINYINT(1)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE result TINYINT(1) DEFAULT 0;
  SELECT 1 INTO result
  FROM `user_roles`
  WHERE `user_id` = uid
    AND `role` = role_name
  LIMIT 1;
  RETURN COALESCE(result, 0);
END //

DELIMITER ;

-- =============================================
-- NOTE: PostgreSQL-specific features NOT included:
-- 1. Row Level Security (RLS) - Not available in MariaDB
--    You must implement access control in your application layer
-- 2. Supabase Auth - You need a separate auth system
-- 3. Storage buckets - Use a file storage service
-- 4. Realtime subscriptions - Use polling or WebSocket solutions
-- =============================================
