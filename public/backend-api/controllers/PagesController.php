<?php
/**
 * Pages & Settings Controller (Public)
 */

class PagesController {
    /**
     * GET /pages - Published pages
     */
    public static function index(): void {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT id, slug, title, title_ar FROM pages WHERE is_published = 1 ORDER BY order_index");
        $stmt->execute();
        Response::success($stmt->fetchAll());
    }

    /**
     * GET /pages/{slug}
     */
    public static function show(array $params): void {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM pages WHERE slug = ? AND is_published = 1");
        $stmt->execute([$params['slug']]);
        $page = $stmt->fetch();
        if (!$page) Response::error('الصفحة غير موجودة', 404);
        Response::success($page);
    }

    /**
     * GET /settings/{key}
     */
    public static function getSetting(array $params): void {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM site_settings WHERE `key` = ?");
        $stmt->execute([$params['key']]);
        $setting = $stmt->fetch();
        Response::success($setting ? json_decode($setting['value'], true) : null);
    }

    /**
     * GET /theme-settings
     */
    public static function themeSettings(): void {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT `key`, value FROM theme_settings");
        $stmt->execute();
        $settings = [];
        foreach ($stmt->fetchAll() as $row) {
            $settings[$row['key']] = json_decode($row['value'], true);
        }
        Response::success($settings);
    }

    /**
     * GET /menu-items
     */
    public static function menuItems(): void {
        $db = Database::getInstance();
        $location = $_GET['location'] ?? 'header';
        $stmt = $db->prepare("SELECT * FROM menu_items WHERE is_active = 1 AND location = ? ORDER BY order_index");
        $stmt->execute([$location]);
        Response::success($stmt->fetchAll());
    }

    /**
     * GET /translations
     */
    public static function translations(): void {
        $db = Database::getInstance();
        $lang = $_GET['lang'] ?? 'ar';
        $stmt = $db->prepare("SELECT `key`, value, category FROM translations WHERE language_code = ?");
        $stmt->execute([$lang]);
        Response::success($stmt->fetchAll());
    }

    /**
     * GET /slider-items
     */
    public static function sliderItems(): void {
        $db = Database::getInstance();
        $key = $_GET['key'] ?? 'players';
        $stmt = $db->prepare("SELECT * FROM slider_items WHERE slider_key = ? AND is_active = 1 ORDER BY order_index");
        $stmt->execute([$key]);
        Response::success($stmt->fetchAll());
    }
}
