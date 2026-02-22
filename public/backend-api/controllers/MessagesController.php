<?php
/**
 * Messages Controller
 */

class MessagesController {
    /**
     * GET /messages
     */
    public static function index(): void {
        $authUser = Auth::require();
        $db = Database::getInstance();
        $type = $_GET['type'] ?? 'inbox'; // inbox | sent

        if ($type === 'sent') {
            $stmt = $db->prepare("
                SELECT m.*, p.full_name as receiver_name, p.email as receiver_email
                FROM messages m
                LEFT JOIN profiles p ON p.user_id = m.receiver_id
                WHERE m.sender_id = ?
                ORDER BY m.created_at DESC
            ");
        } else {
            $stmt = $db->prepare("
                SELECT m.*, p.full_name as sender_name, p.email as sender_email
                FROM messages m
                LEFT JOIN profiles p ON p.user_id = m.sender_id
                WHERE m.receiver_id = ?
                ORDER BY m.created_at DESC
            ");
        }
        $stmt->execute([$authUser['user_id']]);
        Response::success($stmt->fetchAll());
    }

    /**
     * POST /messages
     */
    public static function store(): void {
        $authUser = Auth::require();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $validator = new Validator();
        if (!$validator->validate($data, [
            'receiver_id' => 'required',
            'content'     => 'required|max:5000',
        ])) {
            Response::error('بيانات غير صالحة', 422, $validator->errors());
        }

        $db = Database::getInstance();
        $msgId = self::uuid();

        $stmt = $db->prepare("
            INSERT INTO messages (id, sender_id, receiver_id, subject, content, is_read, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())
        ");
        $stmt->execute([
            $msgId, $authUser['user_id'], $data['receiver_id'],
            $data['subject'] ?? null, $data['content'],
        ]);

        Response::success(['id' => $msgId], 'تم إرسال الرسالة');
    }

    /**
     * PUT /messages/{id}/read
     */
    public static function markRead(array $params): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        $stmt = $db->prepare("UPDATE messages SET is_read = 1, updated_at = NOW() WHERE id = ? AND receiver_id = ?");
        $stmt->execute([$params['id'], $authUser['user_id']]);

        Response::success(null, 'تم تحديث حالة القراءة');
    }

    /**
     * GET /messages/unread-count
     */
    public static function unreadCount(): void {
        $authUser = Auth::require();
        $db = Database::getInstance();

        $stmt = $db->prepare("SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND is_read = 0");
        $stmt->execute([$authUser['user_id']]);

        Response::success(['count' => (int)$stmt->fetchColumn()]);
    }

    private static function uuid(): string {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
