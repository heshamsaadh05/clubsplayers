<?php
/**
 * Application Configuration
 */

return [
    'name'        => 'Stars Agency API',
    'debug'       => false, // اجعلها true أثناء التطوير فقط
    'url'         => 'https://yourdomain.com', // ← غيّر هذا
    'frontend_url' => 'https://yourdomain.com', // ← غيّر هذا
    'timezone'    => 'UTC',
    
    // JWT Secret Key - غيّر هذا لمفتاح عشوائي طويل
    'jwt_secret'  => 'CHANGE_THIS_TO_A_RANDOM_64_CHAR_STRING',
    'jwt_expiry'  => 86400 * 7, // 7 days
    
    // Upload settings
    'upload_max_size' => 10 * 1024 * 1024, // 10MB
    'upload_path'     => __DIR__ . '/../uploads/',
    
    // Allowed origins for CORS
    'cors_origins' => ['*'],
];
