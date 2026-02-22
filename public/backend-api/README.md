# Stars Agency - Backend API (cPanel)

## 📁 هيكل المجلدات

```
backend-api/
├── .htaccess              # توجيه الطلبات + حماية الملفات
├── index.php              # نقطة الدخول الرئيسية + تعريف المسارات
├── config/
│   ├── app.php            # إعدادات التطبيق (JWT, CORS, uploads)
│   └── database.php       # إعدادات قاعدة البيانات
├── core/
│   ├── Auth.php           # نظام JWT للمصادقة
│   ├── Database.php       # اتصال PDO
│   ├── Response.php       # مساعد JSON Response
│   ├── Router.php         # نظام التوجيه
│   ├── Upload.php         # رفع الملفات
│   └── Validator.php      # التحقق من المدخلات
├── controllers/
│   ├── AdminController.php
│   ├── AuthController.php
│   ├── ClubsController.php
│   ├── ConsultationsController.php
│   ├── FavoritesController.php
│   ├── MessagesController.php
│   ├── NotificationsController.php
│   ├── PagesController.php
│   ├── PlayersController.php
│   ├── SubscriptionsController.php
│   └── UploadController.php
└── uploads/               # مجلد الملفات المرفوعة (يُنشأ تلقائياً)
```

## 🚀 خطوات التثبيت على cPanel

### 1. رفع الملفات
- ارفع مجلد `backend-api` إلى `public_html/api/`
- ارفع ملفات الفرونت إند (`dist/`) إلى `public_html/`

### 2. إعداد قاعدة البيانات
- أنشئ قاعدة بيانات MariaDB من phpMyAdmin
- استورد ملف `database_mariadb.sql`
- عدّل `config/database.php` ببيانات الاتصال

### 3. إعداد التطبيق
- عدّل `config/app.php`:
  - `url` → رابط موقعك
  - `jwt_secret` → مفتاح عشوائي طويل (64 حرف)
  - `cors_origins` → رابط الفرونت إند

### 4. صلاحيات المجلدات
```bash
chmod 755 uploads/
chmod 644 config/*
```

### 5. إنشاء مسؤول (Admin)
```sql
-- أدخل من phpMyAdmin بعد تسجيل مستخدم عادي
INSERT INTO user_roles (id, user_id, role) 
VALUES (UUID(), 'USER_ID_HERE', 'admin');
```

## 📡 نقاط API الرئيسية

### المصادقة
| Method | Endpoint | الوصف |
|--------|----------|-------|
| POST | `/api/auth/register` | تسجيل حساب جديد |
| POST | `/api/auth/login` | تسجيل الدخول |
| GET | `/api/auth/me` | بيانات المستخدم الحالي |

### اللاعبون
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/players` | قائمة اللاعبين |
| GET | `/api/players/{id}` | تفاصيل لاعب |
| POST | `/api/players` | إنشاء ملف لاعب |
| PUT | `/api/players/{id}` | تحديث بيانات لاعب |

### الاشتراكات
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/subscription-plans` | الخطط المتاحة |
| POST | `/api/subscriptions` | إنشاء اشتراك |
| PUT | `/api/subscriptions/{id}/approve` | تفعيل (مسؤول) |

### الرسائل
| Method | Endpoint | الوصف |
|--------|----------|-------|
| GET | `/api/messages?type=inbox` | صندوق الوارد |
| POST | `/api/messages` | إرسال رسالة |

## 🔐 المصادقة
كل الطلبات المحمية تحتاج Header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## ⚠️ ملاحظات مهمة
1. غيّر `jwt_secret` في `config/app.php` لقيمة عشوائية فريدة
2. تأكد من أن PHP >= 7.4 مع إضافات: `pdo_mysql`, `json`, `mbstring`
3. المجلد `uploads/` يجب أن يكون قابلاً للكتابة
4. لا ترفع مجلد `config/` في مستودع عام
