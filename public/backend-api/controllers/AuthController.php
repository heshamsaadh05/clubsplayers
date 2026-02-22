<?php
/**
 * Authentication Controller
 */

class AuthController {
    /**
     * POST /auth/register
     */
    public static function register(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator();
        if (!$validator->validate($data, [
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:6|max:128',
        ])) {
            Response::error('بيانات غير صالحة', 422, $validator->errors());
        }

        $db = Database::getInstance();
        $userId = self::generateUuid();

        $db->beginTransaction();
        try {
            // Create user
            $stmt = $db->prepare("
                INSERT INTO users (id, email, password_hash, is_active, created_at, updated_at)
                VALUES (?, ?, ?, 1, NOW(), NOW())
            ");
            $stmt->execute([
                $userId,
                strtolower(trim($data['email'])),
                Auth::hashPassword($data['password']),
            ]);

            // Create profile
            $stmt = $db->prepare("
                INSERT INTO profiles (id, user_id, email, created_at, updated_at)
                VALUES (?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([self::generateUuid(), $userId, $data['email']]);

            // Assign role if provided
            $role = $data['role'] ?? null;
            if ($role && in_array($role, ['player', 'club'])) {
                $stmt = $db->prepare("
                    INSERT INTO user_roles (id, user_id, role)
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([self::generateUuid(), $userId, $role]);
            }

            $db->commit();

            $token = Auth::generateToken([
                'user_id' => $userId,
                'email'   => $data['email'],
            ]);

            Response::success([
                'user'  => ['id' => $userId, 'email' => $data['email']],
                'token' => $token,
            ], 'تم إنشاء الحساب بنجاح');

        } catch (Exception $e) {
            $db->rollBack();
            Response::error('فشل في إنشاء الحساب: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /auth/login
     */
    public static function login(): void {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator();
        if (!$validator->validate($data, [
            'email'    => 'required|email',
            'password' => 'required',
        ])) {
            Response::error('بيانات غير صالحة', 422, $validator->errors());
        }

        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1");
        $stmt->execute([strtolower(trim($data['email']))]);
        $user = $stmt->fetch();

        if (!$user || !Auth::verifyPassword($data['password'], $user['password_hash'])) {
            Response::error('البريد الإلكتروني أو كلمة المرور غير صحيحة', 401);
        }

        // Get roles
        $stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        $roles = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $token = Auth::generateToken([
            'user_id' => $user['id'],
            'email'   => $user['email'],
            'roles'   => $roles,
        ]);

        // Update last login
        $stmt = $db->prepare("UPDATE users SET last_login_at = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);

        Response::success([
            'user'  => [
                'id'    => $user['id'],
                'email' => $user['email'],
                'roles' => $roles,
            ],
            'token' => $token,
        ], 'تم تسجيل الدخول بنجاح');
    }

    /**
     * GET /auth/me
     */
    public static function me(): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        $stmt = $db->prepare("SELECT id, email, created_at FROM users WHERE id = ?");
        $stmt->execute([$authUser['user_id']]);
        $user = $stmt->fetch();

        $stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = ?");
        $stmt->execute([$authUser['user_id']]);
        $roles = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $stmt = $db->prepare("SELECT * FROM profiles WHERE user_id = ?");
        $stmt->execute([$authUser['user_id']]);
        $profile = $stmt->fetch();

        Response::success([
            'user'    => $user,
            'roles'   => $roles,
            'profile' => $profile,
        ]);
    }

    /**
     * POST /auth/change-password
     */
    public static function changePassword(): void {
        $authUser = Auth::require();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator();
        if (!$validator->validate($data, [
            'current_password' => 'required',
            'new_password'     => 'required|min:6|max:128',
        ])) {
            Response::error('بيانات غير صالحة', 422, $validator->errors());
        }

        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$authUser['user_id']]);
        $user = $stmt->fetch();

        if (!Auth::verifyPassword($data['current_password'], $user['password_hash'])) {
            Response::error('كلمة المرور الحالية غير صحيحة', 401);
        }

        $stmt = $db->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([Auth::hashPassword($data['new_password']), $authUser['user_id']]);

        Response::success(null, 'تم تغيير كلمة المرور بنجاح');
    }

    private static function generateUuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
