<?php
/**
 * Consultations Controller
 */

class ConsultationsController {
    /**
     * GET /consultation-settings
     */
    public static function settings(): void {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM consultation_settings LIMIT 1");
        $stmt->execute();
        Response::success($stmt->fetch());
    }

    /**
     * GET /consultation-slots
     */
    public static function slots(): void {
        $db = Database::getInstance();
        $stmt = $db->prepare("SELECT * FROM consultation_slots WHERE is_active = 1 ORDER BY day_of_week, start_time");
        $stmt->execute();
        Response::success($stmt->fetchAll());
    }

    /**
     * GET /consultations/my
     */
    public static function myBookings(): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        $stmt = $db->prepare("SELECT * FROM consultation_bookings WHERE player_user_id = ? ORDER BY booking_date DESC");
        $stmt->execute([$authUser['user_id']]);
        Response::success($stmt->fetchAll());
    }

    /**
     * POST /consultations
     */
    public static function book(): void {
        $authUser = Auth::require();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator();
        if (!$validator->validate($data, [
            'booking_date' => 'required',
            'start_time'   => 'required',
            'end_time'     => 'required',
            'fee_amount'   => 'required|numeric',
        ])) {
            Response::error('بيانات غير صالحة', 422, $validator->errors());
        }

        $db = Database::getInstance();
        $bookingId = self::uuid();

        $stmt = $db->prepare("
            INSERT INTO consultation_bookings 
            (id, player_user_id, booking_date, start_time, end_time, fee_amount, fee_currency,
             payment_method, player_notes, status, payment_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', NOW(), NOW())
        ");
        $stmt->execute([
            $bookingId, $authUser['user_id'], $data['booking_date'],
            $data['start_time'], $data['end_time'], $data['fee_amount'],
            $data['fee_currency'] ?? 'USD', $data['payment_method'] ?? null,
            $data['player_notes'] ?? null,
        ]);

        Response::success(['id' => $bookingId], 'تم حجز الاستشارة بنجاح');
    }

    /**
     * GET /consultations (Admin)
     */
    public static function index(): void {
        Auth::requireAdmin();
        $db = Database::getInstance();

        $stmt = $db->prepare("
            SELECT cb.*, p.full_name as player_name
            FROM consultation_bookings cb
            LEFT JOIN players p ON p.user_id = cb.player_user_id
            ORDER BY cb.booking_date DESC
        ");
        $stmt->execute();
        Response::success($stmt->fetchAll());
    }

    /**
     * PUT /consultations/{id}/status (Admin)
     */
    public static function updateStatus(array $params): void {
        Auth::requireAdmin();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $db = Database::getInstance();

        $fields = ['status = ?', 'updated_at = NOW()'];
        $values = [$data['status']];

        if (isset($data['admin_notes'])) {
            $fields[] = 'admin_notes = ?';
            $values[] = $data['admin_notes'];
        }
        if (isset($data['meet_link'])) {
            $fields[] = 'meet_link = ?';
            $values[] = $data['meet_link'];
        }
        if ($data['status'] === 'confirmed') {
            $fields[] = 'confirmed_at = NOW()';
        }

        $values[] = $params['id'];
        $db->prepare("UPDATE consultation_bookings SET " . implode(', ', $fields) . " WHERE id = ?")->execute($values);

        Response::success(null, 'تم تحديث حالة الاستشارة');
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
