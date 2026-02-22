<?php
/**
 * Subscriptions Controller
 */

class SubscriptionsController {
    /**
     * GET /subscription-plans
     */
    public static function plans(): void {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price ASC");
        $stmt->execute();
        Response::success($stmt->fetchAll());
    }

    /**
     * GET /subscriptions/my
     */
    public static function mySubscription(): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        $stmt = $db->prepare("
            SELECT s.*, sp.name, sp.name_ar, sp.duration_days, sp.features
            FROM subscriptions s
            JOIN subscription_plans sp ON sp.id = s.plan_id
            WHERE s.user_id = ?
            ORDER BY s.created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$authUser['user_id']]);
        Response::success($stmt->fetch());
    }

    /**
     * POST /subscriptions
     */
    public static function subscribe(): void {
        $authUser = Auth::require();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator();
        if (!$validator->validate($data, ['plan_id' => 'required'])) {
            Response::error('بيانات غير صالحة', 422, $validator->errors());
        }

        $db = Database::getInstance();

        // Get plan
        $stmt = $db->prepare("SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1");
        $stmt->execute([$data['plan_id']]);
        $plan = $stmt->fetch();
        if (!$plan) Response::error('الخطة غير موجودة', 404);

        $subId = self::uuid();
        $endDate = date('Y-m-d H:i:s', strtotime("+{$plan['duration_days']} days"));

        $stmt = $db->prepare("
            INSERT INTO subscriptions (id, user_id, plan_id, status, start_date, end_date, 
                payment_method, payment_reference, proof_url, auto_renew, created_at, updated_at)
            VALUES (?, ?, ?, 'pending', NOW(), ?, ?, ?, ?, 0, NOW(), NOW())
        ");
        $stmt->execute([
            $subId, $authUser['user_id'], $data['plan_id'], $endDate,
            $data['payment_method'] ?? null,
            $data['payment_reference'] ?? null,
            $data['proof_url'] ?? null,
        ]);

        Response::success(['id' => $subId], 'تم إنشاء الاشتراك بنجاح - في انتظار الموافقة');
    }

    /**
     * PUT /subscriptions/{id}/approve (Admin)
     */
    public static function approve(array $params): void {
        Auth::requireAdmin();
        $db = Database::getInstance();
        $authUser = Auth::user();

        $stmt = $db->prepare("
            UPDATE subscriptions 
            SET status = 'active', approved_at = NOW(), approved_by = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$authUser['user_id'], $params['id']]);

        Response::success(null, 'تم تفعيل الاشتراك');
    }

    /**
     * GET /subscriptions (Admin)
     */
    public static function index(): void {
        Auth::requireAdmin();
        $db = Database::getInstance();

        $status = $_GET['status'] ?? null;
        $query = "SELECT s.*, sp.name as plan_name, sp.name_ar as plan_name_ar, 
                  u.email as user_email
                  FROM subscriptions s
                  JOIN subscription_plans sp ON sp.id = s.plan_id
                  JOIN users u ON u.id = s.user_id";
        $bindings = [];

        if ($status) {
            $query .= " WHERE s.status = ?";
            $bindings[] = $status;
        }
        $query .= " ORDER BY s.created_at DESC";

        $stmt = $db->prepare($query);
        $stmt->execute($bindings);
        Response::success($stmt->fetchAll());
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
