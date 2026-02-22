<?php
/**
 * File Upload Handler
 */

class Upload {
    private static array $allowedImages = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    private static array $allowedDocs   = ['pdf', 'doc', 'docx'];
    private static array $allowedVideos = ['mp4', 'webm', 'mov'];

    /**
     * Upload a file
     */
    public static function store(array $file, string $folder, array $allowedTypes = []): ?string {
        $config = require __DIR__ . '/../config/app.php';

        if ($file['error'] !== UPLOAD_ERR_OK) {
            return null;
        }

        if ($file['size'] > $config['upload_max_size']) {
            Response::error('حجم الملف كبير جداً', 400);
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = $allowedTypes ?: array_merge(self::$allowedImages, self::$allowedDocs, self::$allowedVideos);

        if (!in_array($ext, $allowed)) {
            Response::error('نوع الملف غير مسموح', 400);
        }

        $uploadDir = $config['upload_path'] . $folder . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $ext;
        $filepath = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            Response::error('فشل في رفع الملف', 500);
        }

        return "/uploads/$folder/$filename";
    }

    /**
     * Upload image
     */
    public static function storeImage(array $file, string $folder): ?string {
        return self::store($file, $folder, self::$allowedImages);
    }

    /**
     * Delete a file
     */
    public static function delete(string $path): bool {
        $config = require __DIR__ . '/../config/app.php';
        $fullPath = $config['upload_path'] . ltrim($path, '/uploads/');
        if (file_exists($fullPath)) {
            return unlink($fullPath);
        }
        return false;
    }
}
