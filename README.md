# Saudi Speak

أنشئ لي تطبيق ويب من صفحة واحدة باللغة العربية واتجاه RTL، وتحويل النص إلى صوت.

غالباً:

مربع نص كبير (منطقة النص) يكتب فيه النص المستخدم، مع تعدد أحرف (الحد 2000 حرف).

الزر الرئيسي "استمتع" يولّد الصوت، مع مؤشر تحميل واضح.

مشغّل صوت آلة تشغيل تلقائية بعد التوليد + زر "تنزيل الملف الصوتي".

قائمة اختيار الصوت (4 أصوات رجالية شابة) ومتزلّجَين: صمت الكلام، ومستوى الحماسة/الود.

عرض النص بعد إعادة صياغته، وخانة اختيار "أرسل نصي كما هو بدون تعديل".

رسائل خطأ تخصيص بالعربية (نص كامل، انتهاء الصلاحية 402، تجاوز حتى طلبات 429، خطأ المتحكم 5xx).

المطلوب من الصوت (الأهم): الصوت لشاب سعودي عمره 19–20 سنة، بوضوح بالعربية بلهجة سعودية عامة (لهجة الرياض/نجد)، بنبرة واثقة وواضحة ومهذّبة، وبعد يشرحها مصرفي أمام لجنة في بنك : أسلوب عرض تقديمي رئيس انهاء وغير جامد، مع وقفات فنية عند النقاط المهمة، وتشديد خفيف على الأرقام والكلمات المفتاحية (المشروع، متعددة، قطع متعددة، الجدوى).

خطوة إعادة الصياغة قبل الوليد: مرقس نصي يعيد صياغته كما يشرحه شاب سعودي لإنشاءه: جمل قصير فكرة، تسلسل منطقي (الفكرة ← المشكلة ← الحل ← التحفيز للبنك ← الخلاصة)، مفردات سعودية دارجة جديدة بدون خطوة (وش، شلون، زين، خسارة، عادي)، مع ضمان كل الأرقام والأسماء والمصطلحات الأساسية كما هي، دون إضافة مقدمات أو تعليقات — يرجع النص المعاد صياغته فقط.

ذرة:

استخدم Lovable AI للتحويل: نموذج نصي google/gemini-3.7-flash لإعادة الصياغة، ونموذج google/gemini-2.5-pro-tts التحكم الصوتي عبر /v1/audio/speech .

كل النداءات من جهة غرض فقط باستخدام LOVABLE_API_KEY (لا تُستدعى من إصدار الحرية).

بدون قاعدة بيانات.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://saudi-accent-tts.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f95b5c58-f651-4075-a6bf-63658d15f4fa).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
