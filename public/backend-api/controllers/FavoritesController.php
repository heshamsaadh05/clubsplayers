<?php
/**
 * Favorites Controller
 */

class FavoritesController {
    public static function index(): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        $stmt = $db->prepare("
            SELECT f.*, p.full_name, p.position, p.nationality, p.profile_image_url
            FROM favorites f
            JOIN players p ON p.id = f.player_id
            WHERE f.club_user_id = ?
            ORDER BY f.created_at DESC
        ");
        $stmt->execute([$authUser['user_id']]);
        Response::success($stmt->fetchAll());
    }

    public static function store(): void {
        $authUser = Auth::require();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT IGNORE INTO favorites (id, club_user_id, player_id, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        $id = self::uuid();
        $stmt->execute([$id, $authUser['user_id'], $data['player_id']]);

        Response::success(['id' => $id], 'تمت الإضافة للمفضلة');
    }

    public static function destroy(array $params): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        $stmt = $db->prepare("DELETE FROM favorites WHERE id = ? AND club_user_id = ?");
        $stmt->execute([$params['id'], $authUser['user_id']]);

        Response::success(null, 'تمت الإزالة من المفضلة');
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
