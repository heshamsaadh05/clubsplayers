<?php
/**
 * JSON Response Helper
 */

class Response {
    public static function json($data, int $status = 200): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function success($data = null, string $message = 'Success'): void {
        self::json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ]);
    }

    public static function error(string $message, int $status = 400, $errors = null): void {
        $response = [
            'success' => false,
            'message' => $message,
        ];
        if ($errors) $response['errors'] = $errors;
        self::json($response, $status);
    }

    public static function paginated(array $data, int $total, int $page, int $perPage): void {
        self::json([
            'success' => true,
            'data'    => $data,
            'meta'    => [
                'total'        => $total,
                'page'         => $page,
                'per_page'     => $perPage,
                'total_pages'  => ceil($total / $perPage),
            ],
        ]);
    }
}
