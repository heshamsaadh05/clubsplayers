<?php
/**
 * Stars Agency API - Main Entry Point
 * ====================================
 * API Base URL: https://yourdomain.com/api/
 */

// Error handling
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// CORS Headers
$config = require __DIR__ . '/config/app.php';
header('Access-Control-Allow-Origin: ' . ($config['cors_origins'][0] ?? '*'));
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Autoload core classes
require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/core/Response.php';
require_once __DIR__ . '/core/Auth.php';
require_once __DIR__ . '/core/Router.php';
require_once __DIR__ . '/core/Validator.php';
require_once __DIR__ . '/core/Upload.php';

// Autoload controllers
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/PlayersController.php';
require_once __DIR__ . '/controllers/ClubsController.php';
require_once __DIR__ . '/controllers/SubscriptionsController.php';
require_once __DIR__ . '/controllers/MessagesController.php';
require_once __DIR__ . '/controllers/FavoritesController.php';
require_once __DIR__ . '/controllers/NotificationsController.php';
require_once __DIR__ . '/controllers/PagesController.php';
require_once __DIR__ . '/controllers/ConsultationsController.php';
require_once __DIR__ . '/controllers/UploadController.php';
require_once __DIR__ . '/controllers/AdminController.php';

// Initialize Router
$router = new Router();

// ========================
// Auth Routes
// ========================
$router->post('/auth/register',        [AuthController::class, 'register']);
$router->post('/auth/login',           [AuthController::class, 'login']);
$router->get('/auth/me',               [AuthController::class, 'me']);
$router->post('/auth/change-password', [AuthController::class, 'changePassword']);

// ========================
// Players Routes
// ========================
$router->get('/players',      [PlayersController::class, 'index']);
$router->get('/players/{id}', [PlayersController::class, 'show']);
$router->post('/players',     [PlayersController::class, 'store']);
$router->put('/players/{id}', [PlayersController::class, 'update']);

// ========================
// Clubs Routes
// ========================
$router->get('/clubs',        [ClubsController::class, 'index']);
$router->get('/clubs/{id}',   [ClubsController::class, 'show']);
$router->post('/clubs',       [ClubsController::class, 'store']);
$router->put('/clubs/{id}',   [ClubsController::class, 'update']);

// ========================
// Subscriptions Routes
// ========================
$router->get('/subscription-plans',          [SubscriptionsController::class, 'plans']);
$router->get('/subscriptions/my',            [SubscriptionsController::class, 'mySubscription']);
$router->post('/subscriptions',              [SubscriptionsController::class, 'subscribe']);
$router->get('/subscriptions',               [SubscriptionsController::class, 'index']);
$router->put('/subscriptions/{id}/approve',  [SubscriptionsController::class, 'approve']);

// ========================
// Messages Routes
// ========================
$router->get('/messages',              [MessagesController::class, 'index']);
$router->post('/messages',             [MessagesController::class, 'store']);
$router->put('/messages/{id}/read',    [MessagesController::class, 'markRead']);
$router->get('/messages/unread-count', [MessagesController::class, 'unreadCount']);

// ========================
// Favorites Routes
// ========================
$router->get('/favorites',           [FavoritesController::class, 'index']);
$router->post('/favorites',          [FavoritesController::class, 'store']);
$router->delete('/favorites/{id}',   [FavoritesController::class, 'destroy']);

// ========================
// Notifications Routes
// ========================
$router->get('/notifications',                [NotificationsController::class, 'index']);
$router->put('/notifications/{id}/read',      [NotificationsController::class, 'markRead']);
$router->put('/notifications/mark-all-read',  [NotificationsController::class, 'markAllRead']);
$router->get('/notifications/unread-count',   [NotificationsController::class, 'unreadCount']);

// ========================
// Public Content Routes
// ========================
$router->get('/pages',              [PagesController::class, 'index']);
$router->get('/pages/{slug}',       [PagesController::class, 'show']);
$router->get('/settings/{key}',     [PagesController::class, 'getSetting']);
$router->get('/theme-settings',     [PagesController::class, 'themeSettings']);
$router->get('/menu-items',         [PagesController::class, 'menuItems']);
$router->get('/translations',       [PagesController::class, 'translations']);
$router->get('/slider-items',       [PagesController::class, 'sliderItems']);

// ========================
// Consultations Routes
// ========================
$router->get('/consultation-settings',     [ConsultationsController::class, 'settings']);
$router->get('/consultation-slots',        [ConsultationsController::class, 'slots']);
$router->get('/consultations/my',          [ConsultationsController::class, 'myBookings']);
$router->post('/consultations',            [ConsultationsController::class, 'book']);
$router->get('/consultations',             [ConsultationsController::class, 'index']);
$router->put('/consultations/{id}/status', [ConsultationsController::class, 'updateStatus']);

// ========================
// Upload Routes
// ========================
$router->post('/upload/image',         [UploadController::class, 'image']);
$router->post('/upload/document',      [UploadController::class, 'document']);
$router->post('/upload/video',         [UploadController::class, 'video']);
$router->post('/upload/payment-proof', [UploadController::class, 'paymentProof']);

// ========================
// Admin Routes
// ========================
$router->get('/admin/dashboard',              [AdminController::class, 'dashboard']);
$router->put('/admin/players/{id}/status',    [AdminController::class, 'updatePlayerStatus']);
$router->put('/admin/settings/{key}',         [AdminController::class, 'updateSetting']);
$router->put('/admin/theme/{key}',            [AdminController::class, 'updateTheme']);
$router->post('/admin/pages',                 [AdminController::class, 'createPage']);
$router->put('/admin/pages/{id}',             [AdminController::class, 'updatePage']);
$router->delete('/admin/pages/{id}',          [AdminController::class, 'deletePage']);

// ========================
// Health Check
// ========================
$router->get('/health', function() {
    Response::success([
        'status'  => 'ok',
        'version' => '1.0.0',
        'time'    => date('Y-m-d H:i:s'),
    ]);
});

// Dispatch
$router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
