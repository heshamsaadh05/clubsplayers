<?php
/**
 * File Upload Controller
 */

class UploadController {
    /**
     * POST /upload/image
     */
    public static function image(): void {
        Auth::require();

        if (!isset($_FILES['file'])) {
            Response::error('لم يتم تحديد ملف', 400);
        }

        $folder = $_POST['folder'] ?? 'images';
        $allowedFolders = ['player-images', 'club-logos', 'page-images', 'slider-images', 'site-assets'];
        
        if (!in_array($folder, $allowedFolders)) {
            $folder = 'images';
        }

        $url = Upload::storeImage($_FILES['file'], $folder);
        
        if (!$url) {
            Response::error('فشل في رفع الصورة', 500);
        }

        Response::success(['url' => $url], 'تم رفع الصورة بنجاح');
    }

    /**
     * POST /upload/document
     */
    public static function document(): void {
        Auth::require();

        if (!isset($_FILES['file'])) {
            Response::error('لم يتم تحديد ملف', 400);
        }

        $url = Upload::store($_FILES['file'], 'documents', ['pdf', 'doc', 'docx']);

        if (!$url) {
            Response::error('فشل في رفع المستند', 500);
        }

        Response::success(['url' => $url], 'تم رفع المستند بنجاح');
    }

    /**
     * POST /upload/video
     */
    public static function video(): void {
        Auth::require();

        if (!isset($_FILES['file'])) {
            Response::error('لم يتم تحديد ملف', 400);
        }

        $url = Upload::store($_FILES['file'], 'videos', ['mp4', 'webm', 'mov']);

        if (!$url) {
            Response::error('فشل في رفع الفيديو', 500);
        }

        Response::success(['url' => $url], 'تم رفع الفيديو بنجاح');
    }

    /**
     * POST /upload/payment-proof
     */
    public static function paymentProof(): void {
        Auth::require();

        if (!isset($_FILES['file'])) {
            Response::error('لم يتم تحديد ملف', 400);
        }

        $url = Upload::store($_FILES['file'], 'payment-proofs', ['jpg', 'jpeg', 'png', 'pdf']);

        if (!$url) {
            Response::error('فشل في رفع إثبات الدفع', 500);
        }

        Response::success(['url' => $url], 'تم رفع إثبات الدفع بنجاح');
    }
}
