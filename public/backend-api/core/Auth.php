<?php
/**
 * Authentication & JWT Handler
 */

class Auth {
    /**
     * Generate JWT token
     */
    public static function generateToken(array $payload): string {
        $config = require __DIR__ . '/../config/app.php';
        $secret = $config['jwt_secret'];
        
        $header = self::base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        
        $payload['iat'] = time();
        $payload['exp'] = time() + $config['jwt_expiry'];
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));
        
        $signature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payloadEncoded", $secret, true)
        );
        
        return "$header.$payloadEncoded.$signature";
    }

    /**
     * Verify and decode JWT token
     */
    public static function verifyToken(string $token): ?array {
        $config = require __DIR__ . '/../config/app.php';
        $secret = $config['jwt_secret'];
        
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;
        
        [$header, $payload, $signature] = $parts;
        
        $expectedSignature = self::base64UrlEncode(
            hash_hmac('sha256', "$header.$payload", $secret, true)
        );
        
        if (!hash_equals($expectedSignature, $signature)) return null;
        
        $data = json_decode(self::base64UrlDecode($payload), true);
        
        if (!$data || ($data['exp'] ?? 0) < time()) return null;
        
        return $data;
    }

    /**
     * Get authenticated user from request
     */
    public static function user(): ?array {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        
        if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
            return null;
        }
        
        return self::verifyToken($matches[1]);
    }

    /**
     * Require authentication - returns user or sends 401
     */
    public static function require(): array {
        $user = self::user();
        if (!$user) {
            Response::error('غير مصرح - يرجى تسجيل الدخول', 401);
        }
        return $user;
    }

    /**
     * Require admin role
     */
    public static function requireAdmin(): array {
        $user = self::require();
        $db = Database::getInstance();
        
        $stmt = $db->prepare("SELECT role FROM user_roles WHERE user_id = ? AND role = 'admin'");
        $stmt->execute([$user['user_id']]);
        
        if (!$stmt->fetch()) {
            Response::error('غير مصرح - صلاحيات المسؤول مطلوبة', 403);
        }
        return $user;
    }

    /**
     * Hash password
     */
    public static function hashPassword(string $password): string {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /**
     * Verify password
     */
    public static function verifyPassword(string $password, string $hash): bool {
        return password_verify($password, $hash);
    }

    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
    }
}
