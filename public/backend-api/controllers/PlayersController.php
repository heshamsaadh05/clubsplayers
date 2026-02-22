<?php
/**
 * Players Controller
 */

class PlayersController {
    /**
     * GET /players - List approved players (requires active subscription)
     */
    public static function index(): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        // Check subscription or admin
        $isAdmin = self::isAdmin($authUser['user_id']);
        if (!$isAdmin && !self::hasActiveSubscription($authUser['user_id'])) {
            Response::error('يتطلب اشتراك فعّال', 403);
        }

        $page    = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(50, max(1, (int)($_GET['per_page'] ?? 20)));
        $offset  = ($page - 1) * $perPage;

        $where = $isAdmin ? "1=1" : "p.status = 'approved'";
        $search = $_GET['search'] ?? '';
        $position = $_GET['position'] ?? '';
        $nationality = $_GET['nationality'] ?? '';
        $bindings = [];

        if ($search) {
            $where .= " AND p.full_name LIKE ?";
            $bindings[] = "%$search%";
        }
        if ($position) {
            $where .= " AND p.position = ?";
            $bindings[] = $position;
        }
        if ($nationality) {
            $where .= " AND p.nationality = ?";
            $bindings[] = $nationality;
        }

        // Count
        $stmt = $db->prepare("SELECT COUNT(*) FROM players p WHERE $where");
        $stmt->execute($bindings);
        $total = (int)$stmt->fetchColumn();

        // Fetch
        $stmt = $db->prepare("
            SELECT p.*, pp.date_of_birth
            FROM players p
            LEFT JOIN player_private pp ON pp.user_id = p.user_id
            WHERE $where
            ORDER BY p.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $allBindings = array_merge($bindings, [$perPage, $offset]);
        $stmt->execute($allBindings);
        $players = $stmt->fetchAll();

        Response::paginated($players, $total, $page, $perPage);
    }

    /**
     * GET /players/{id}
     */
    public static function show(array $params): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        $stmt = $db->prepare("
            SELECT p.*, pp.date_of_birth 
            FROM players p 
            LEFT JOIN player_private pp ON pp.user_id = p.user_id 
            WHERE p.id = ?
        ");
        $stmt->execute([$params['id']]);
        $player = $stmt->fetch();

        if (!$player) {
            Response::error('اللاعب غير موجود', 404);
        }

        // Log view if club
        $roles = self::getUserRoles($authUser['user_id']);
        if (in_array('club', $roles)) {
            $stmt = $db->prepare("
                INSERT INTO player_views (id, club_user_id, player_id, viewed_at)
                VALUES (?, ?, ?, NOW())
            ");
            $stmt->execute([self::uuid(), $authUser['user_id'], $params['id']]);
        }

        // Get ratings
        $stmt = $db->prepare("
            SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings
            FROM player_ratings WHERE player_id = ?
        ");
        $stmt->execute([$params['id']]);
        $ratings = $stmt->fetch();

        $player['avg_rating'] = round($ratings['avg_rating'] ?? 0, 1);
        $player['total_ratings'] = (int)$ratings['total_ratings'];

        Response::success($player);
    }

    /**
     * POST /players - Create player profile
     */
    public static function store(): void {
        $authUser = Auth::require();
        $db = Database::getInstance();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator();
        if (!$validator->validate($data, [
            'full_name'   => 'required|max:255',
            'position'    => 'required',
            'nationality' => 'required',
        ])) {
            Response::error('بيانات غير صالحة', 422, $validator->errors());
        }

        $playerId = self::uuid();
        $stmt = $db->prepare("
            INSERT INTO players (id, user_id, full_name, position, nationality, current_club, 
                height_cm, weight_kg, bio, profile_image_url, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
        ");
        $stmt->execute([
            $playerId,
            $authUser['user_id'],
            $data['full_name'],
            $data['position'],
            $data['nationality'],
            $data['current_club'] ?? null,
            $data['height_cm'] ?? null,
            $data['weight_kg'] ?? null,
            $data['bio'] ?? null,
            $data['profile_image_url'] ?? null,
        ]);

        // Store private data
        if (isset($data['email']) || isset($data['phone']) || isset($data['date_of_birth'])) {
            $stmt = $db->prepare("
                INSERT INTO player_private (user_id, email, phone, date_of_birth, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([
                $authUser['user_id'],
                $data['email'] ?? $authUser['email'],
                $data['phone'] ?? null,
                $data['date_of_birth'] ?? null,
            ]);
        }

        // Assign player role
        $stmt = $db->prepare("
            INSERT IGNORE INTO user_roles (id, user_id, role) VALUES (?, ?, 'player')
        ");
        $stmt->execute([self::uuid(), $authUser['user_id']]);

        Response::success(['id' => $playerId], 'تم إنشاء ملف اللاعب بنجاح');
    }

    /**
     * PUT /players/{id}
     */
    public static function update(array $params): void {
        $authUser = Auth::require();
        $db = Database::getInstance();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Verify ownership or admin
        $stmt = $db->prepare("SELECT user_id FROM players WHERE id = ?");
        $stmt->execute([$params['id']]);
        $player = $stmt->fetch();

        if (!$player) Response::error('اللاعب غير موجود', 404);
        if ($player['user_id'] !== $authUser['user_id'] && !self::isAdmin($authUser['user_id'])) {
            Response::error('غير مصرح', 403);
        }

        $fields = [];
        $values = [];
        $allowed = ['full_name', 'position', 'nationality', 'current_club', 'height_cm', 'weight_kg', 'bio', 'profile_image_url', 'status'];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                // Only admin can change status
                if ($field === 'status' && !self::isAdmin($authUser['user_id'])) continue;
                $fields[] = "$field = ?";
                $values[] = $data[$field];
            }
        }

        if (!empty($fields)) {
            $fields[] = "updated_at = NOW()";
            $values[] = $params['id'];
            $stmt = $db->prepare("UPDATE players SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($values);
        }

        Response::success(null, 'تم تحديث بيانات اللاعب');
    }

    // ---- Helpers ----
    private static function isAdmin(string $userId): bool {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'");
        $stmt->execute([$userId]);
        return (bool)$stmt->fetch();
    }

    private static function hasActiveSubscription(string $userId): bool {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT 1 FROM subscriptions WHERE user_id = ? AND status = 'active' AND end_date >= NOW()");
        $stmt->execute([$userId]);
        return (bool)$stmt->fetch();
    }

    private static function getUserRoles(string $userId): array {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
