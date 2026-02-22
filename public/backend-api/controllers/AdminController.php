<?php
/**
 * Admin Controller - Dashboard & Management
 */

class AdminController {
    /**
     * GET /admin/dashboard
     */
    public static function dashboard(): void {
        Auth::requireAdmin();
        $db = Database::getInstance();

        $stats = [];

        $stmt = $db->query("SELECT COUNT(*) FROM players");
        $stats['total_players'] = (int)$stmt->fetchColumn();

        $stmt = $db->query("SELECT COUNT(*) FROM players WHERE status = 'pending'");
        $stats['pending_players'] = (int)$stmt->fetchColumn();

        $stmt = $db->query("SELECT COUNT(*) FROM clubs");
        $stats['total_clubs'] = (int)$stmt->fetchColumn();

        $stmt = $db->query("SELECT COUNT(*) FROM subscriptions WHERE status = 'active'");
        $stats['active_subscriptions'] = (int)$stmt->fetchColumn();

        $stmt = $db->query("SELECT COUNT(*) FROM subscriptions WHERE status = 'pending'");
        $stats['pending_subscriptions'] = (int)$stmt->fetchColumn();

        $stmt = $db->query("SELECT COUNT(*) FROM consultation_bookings WHERE status = 'pending'");
        $stats['pending_consultations'] = (int)$stmt->fetchColumn();

        $stmt = $db->query("SELECT COUNT(*) FROM messages WHERE is_read = 0");
        $stats['unread_messages'] = (int)$stmt->fetchColumn();

        Response::success($stats);
    }

    /**
     * PUT /admin/players/{id}/status
     */
    public static function updatePlayerStatus(array $params): void {
        Auth::requireAdmin();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $db = Database::getInstance();

        $fields = ['status = ?', 'updated_at = NOW()'];
        $values = [$data['status']];

        $values[] = $params['id'];
        $db->prepare("UPDATE players SET " . implode(', ', $fields) . " WHERE id = ?")->execute($values);

        // If rejected, store reason
        if ($data['status'] === 'rejected' && isset($data['rejection_reason'])) {
            $stmt = $db->prepare("SELECT user_id FROM players WHERE id = ?");
            $stmt->execute([$params['id']]);
            $player = $stmt->fetch();
            if ($player) {
                $db->prepare("UPDATE player_private SET rejection_reason = ? WHERE user_id = ?")
                    ->execute([$data['rejection_reason'], $player['user_id']]);
            }
        }

        Response::success(null, 'تم تحديث حالة اللاعب');
    }

    /**
     * PUT /admin/settings/{key}
     */
    public static function updateSetting(array $params): void {
        Auth::requireAdmin();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $db = Database::getInstance();

        $stmt = $db->prepare("
            INSERT INTO site_settings (id, `key`, value, updated_at) 
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()
        ");
        $stmt->execute([self::uuid(), $params['key'], json_encode($data['value'] ?? $data)]);

        Response::success(null, 'تم تحديث الإعداد');
    }

    /**
     * PUT /admin/theme/{key}
     */
    public static function updateTheme(array $params): void {
        Auth::requireAdmin();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $db = Database::getInstance();

        $stmt = $db->prepare("
            INSERT INTO theme_settings (id, `key`, value, updated_at) 
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()
        ");
        $stmt->execute([self::uuid(), $params['key'], json_encode($data['value'] ?? $data)]);

        Response::success(null, 'تم تحديث إعداد التصميم');
    }

    /**
     * CRUD /admin/pages
     */
    public static function createPage(): void {
        Auth::requireAdmin();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $db = Database::getInstance();

        $pageId = self::uuid();
        $stmt = $db->prepare("
            INSERT INTO pages (id, slug, title, title_ar, content, content_ar, is_published, order_index, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $pageId, $data['slug'], $data['title'], $data['title_ar'] ?? null,
            $data['content'] ?? null, $data['content_ar'] ?? null,
            $data['is_published'] ?? 0, $data['order_index'] ?? 0,
        ]);

        Response::success(['id' => $pageId], 'تم إنشاء الصفحة');
    }

    public static function updatePage(array $params): void {
        Auth::requireAdmin();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $db = Database::getInstance();

        $fields = [];
        $values = [];
        foreach (['slug', 'title', 'title_ar', 'content', 'content_ar', 'is_published', 'order_index'] as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "`$f` = ?";
                $values[] = $data[$f];
            }
        }
        $fields[] = "updated_at = NOW()";
        $values[] = $params['id'];

        $db->prepare("UPDATE pages SET " . implode(', ', $fields) . " WHERE id = ?")->execute($values);
        Response::success(null, 'تم تحديث الصفحة');
    }

    public static function deletePage(array $params): void {
        Auth::requireAdmin();
        $db = Database::getInstance();
        $db->prepare("DELETE FROM pages WHERE id = ?")->execute([$params['id']]);
        Response::success(null, 'تم حذف الصفحة');
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
