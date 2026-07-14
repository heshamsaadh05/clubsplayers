UPDATE page_sections
SET settings = jsonb_build_object(
  'badge', 'لماذا نحن؟',
  'badge_en', 'Why Us?',
  'title_part1', 'خدمات ',
  'title_part1_en', 'Professional ',
  'title_part2', 'احترافية متكاملة',
  'title_part2_en', 'Integrated Services',
  'subtitle', 'نقدم لك مجموعة شاملة من الخدمات التي تضمن لك مسيرة احترافية ناجحة',
  'subtitle_en', 'We offer you a comprehensive range of services that guarantee a successful professional career',
  'features', jsonb_build_array(
    jsonb_build_object('icon','Globe','title','شبكة عالمية','title_en','Global Network','description','نملك علاقات قوية مع أندية في أوروبا وآسيا وأفريقيا','description_en','We have strong relationships with clubs in Europe, Asia and Africa'),
    jsonb_build_object('icon','Shield','title','حماية حقوقك','title_en','Protect Your Rights','description','فريق قانوني متخصص لضمان حقوقك في جميع العقود','description_en','Specialized legal team to protect your rights in all contracts'),
    jsonb_build_object('icon','Zap','title','استجابة سريعة','title_en','Quick Response','description','نتابع ملفك بشكل مستمر ونوفر لك الفرص المناسبة','description_en','We follow up on your file continuously and provide you with opportunities'),
    jsonb_build_object('icon','Award','title','تقييم احترافي','title_en','Professional Evaluation','description','نقدم تقييماً شاملاً لمهاراتك ونساعدك في تطويرها','description_en','We provide a comprehensive evaluation of your skills'),
    jsonb_build_object('icon','Users','title','دعم متكامل','title_en','Full Support','description','فريق متخصص لمساعدتك في جميع الجوانب','description_en','Specialized team to help you in all aspects'),
    jsonb_build_object('icon','TrendingUp','title','تطوير مستمر','title_en','Continuous Development','description','برامج تدريبية وإرشادية لتحسين أدائك','description_en','Training and guidance programs to improve your performance')
  )
),
updated_at = now()
WHERE page_key='home' AND section_key='features';