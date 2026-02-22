<?php
/**
 * Clubs Controller
 */

class ClubsController {
    /**
     * GET /clubs
     */
    public static function index(): void {
        Auth::requireAdmin();
        $db = Database::getInstance();

        $stmt = $db->prepare("SELECT * FROM clubs ORDER BY created_at DESC");
        $stmt->execute();
        Response::success($stmt->fetchAll());
    }

    /**
     * GET /clubs/{id}
     */
    public static function show(array $params): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        $stmt = $db->prepare("SELECT * FROM clubs WHERE id = ?");
        $stmt->execute([$params['id']]);
        $club = $stmt->fetch();

        if (!$club) Response::error('النادي غير موجود', 404);
        if ($club['user_id'] !== $authUser['user_id'] && !self::isAdmin($authUser['user_id'])) {
            Response::error('غير مصرح', 403);
        }

        Response::success($club);
    }

    /**
     * POST /clubs
     */
    public static function store(): void {
        $authUser = Auth::require();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator();
        if (!$validator->validate($data, [
            'name'  => 'required|max:255',
            'email' => 'required|email',
        ])) {
            Response::error('بيانات غير صالحة', 422, $validator->errors());
        }

        $db = Database::getInstance();
        $clubId = self::uuid();

        $stmt = $db->prepare("
            INSERT INTO clubs (id, user_id, name, email, phone, country, city, description, website, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            $clubId, $authUser['user_id'], $data['name'], $data['email'],
            $data['phone'] ?? null, $data['country'] ?? null, $data['city'] ?? null,
            $data['description'] ?? null, $data['website'] ?? null,
        ]);

        // Assign club role
        $stmt = $db->prepare("INSERT IGNORE INTO user_roles (id, user_id, role) VALUES (?, ?, 'club')");
        $stmt->execute([self::uuid(), $authUser['user_id']]);

        Response::success(['id' => $clubId], 'تم إنشاء النادي بنجاح');
    }

    /**
     * PUT /clubs/{id}
     */
    public static function update(array $params): void {
        $authUser = Auth::require();
        $db = Database::getInstance();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $stmt = $db->prepare("SELECT user_id FROM clubs WHERE id = ?");
        $stmt->execute([$params['id']]);
        $club = $stmt->fetch();

        if (!$club) Response::error('النادي غير موجود', 404);
        if ($club['user_id'] !== $authUser['user_id'] && !self::isAdmin($authUser['user_id'])) {
            Response::error('غير مصرح', 403);
        }

        $fields = [];
        $values = [];
        foreach (['name', 'email', 'phone', 'country', 'city', 'description', 'website', 'logo_url'] as $f) {
            if (array_key_exists($f, $data)) {
                $fields[] = "$f = ?";
                $values[] = $data[$f];
            }
        }

        if (!empty($fields)) {
            $fields[] = "updated_at = NOW()";
            $values[] = $params['id'];
            $db->prepare("UPDATE clubs SET " . implode(', ', $fields) . " WHERE id = ?")->execute($values);
        }

        Response::success(null, 'تم تحديث بيانات النادي');
    }

    private static function isAdmin(string $userId): bool {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'");
        $stmt->execute([$userId]);
        return (bool)$stmt->fetch();
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
