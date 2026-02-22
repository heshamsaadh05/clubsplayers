<?php
/**
 * Notifications Controller
 */

class NotificationsController {
    public static function index(): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        $stmt = $db->prepare("
            SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
        ");
        $stmt->execute([$authUser['user_id']]);
        Response::success($stmt->fetchAll());
    }

    public static function markRead(array $params): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
        $stmt->execute([$params['id'], $authUser['user_id']]);

        Response::success(null, 'تم التحديث');
    }

    public static function markAllRead(): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0");
        $stmt->execute([$authUser['user_id']]);

        Response::success(null, 'تم تحديث جميع الإشعارات');
    }

    public static function unreadCount(): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        $stmt = $db->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0");
        $stmt->execute([$authUser['user_id']]);

        Response::success(['count' => (int)$stmt->fetchColumn()]);
    }
}
