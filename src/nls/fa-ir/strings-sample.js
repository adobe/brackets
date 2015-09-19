/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */

define({
    // HEAD
    TITLE: "شروع به کار با براکتس",
    DESCRIPTION: "تعاملی برای شروع به کار با براکتس.",

    // BODY
    GETTING_STARTED: "شروع به کار با براکتس",
    GETTING_STARTED_GUIDE: "این راهنمایی برای شماست!",

    // MADE WITH <3 AND JAVASCRIPT
    WELCOME_COMMENT: "MADE WITH <3 AND JAVASCRIPT",
    WELCOME: "به براکتس، ویرایشگر کد منبع باز پیشرفته  که طراحی وب را درک می کند، خوش آمدید.  آن یک چیز سبک و در عین حال قدرتمند است .ویرایشگر کد که ابزارهای بصری را در درون ویرایش گر ترکیب میکند تا  به اندازه کافی  کمک دریافت کنید زمانی که آن را می خواهید .",

    // WHAT IS BRACKETS?
    EDITOR_COMMENT: "WHAT IS BRACKETS?",
    EDITOR: "براکتس یک نوع متفاوت از ویرایشگر می باشد.",
    EDITOR_DESCRIPTION:
        "براکتس برخی ویژگی های منحصر به فردی دارد مانند ویرایش سریع ،پیشنمایش زنده،و چیزها دیگری  که ممکن است شما آن را در ویرایشگر های دیگر پیدا نکنید. و براکتس با جاوا اسکریپت ،اچ تی ام ال و سی اس اس نوشته شده است. به این معنا که اکثر کاربران براکتس مهارت های لازم برای توسعه و گسترش ویرایشگر را دارند. در حقیقت ما هر روز از براکتس استفاده می کنیم تا براکتس را درست کنیم. برای یادگیری بیشتر درباره اینکه چطور از ویژه گی های کلیدی استفاده کنید بر روی آن مطالعه داشته باشید.",

    // GET STARTED WITH YOUR OWN FILES
    PROJECTS_COMMENT: "GET STARTED WITH YOUR OWN FILES",
    PROJECTS: "پروژه ها در براکتس",
    PROJECTS_DESCRIPTION:
        "به منظور ویرایش کد با استفاده از براکتس،شما می توانید فقط پوشه ای که شامل فایلها یتان می باشد را باز کنید. براکتس با پوشه جاری باز شده به عنوان یک \"پروژه\" رفتار می کند; ویژه گی نکات کد،پیشنمایش زنده و ویرایش سریع فقط  در پوشه جاری باز شده قابل استفاده است.",
    PROJECTS_SAMP:
        "هنگامی که شما قصد خارج شدن از پروژه را دارید و کد را ویرایش می کنید، شما می توانید از منوی باز شوند در نوار کناری سمت چپ جهت تغییر پوشه ها استفاده کنید. اکنون،منوی باز شونده نشان می دهد \"Getting Started\" - پوشه ای است که فایلهای که اکنون در حال مشاهده آن هستید را شامل می شود. کلیک کنید بر روی منوی باز شونده و انتخاب کنید \"باز کردن پوشه\"را.\n" +
        "برای باز کردن پوشه خودتان.شما می توانید همچنین بعداً استفاده کنید جهت برگشتن به پوشه های که قبلا باز کرده اید شامل همین پروژه نمونه نیز می شود.",

    // THE RELATIONSHIP BETWEEN HTML, CSS AND JAVASCRIPT
    QUICK_EDIT_COMMENT: "THE RELATIONSHIP BETWEEN HTML, CSS AND JAVASCRIPT",
    QUICK_EDIT: "ویرایش سریع برای سی اس اس و جاوا اسکریپت",
    QUICK_EDIT_DESCRIPTION:
        "تعویض نه چندان زیاد بین اسناد و از دست دادن متن محتوا وقتی در حال ویرایش \"اچ تی ام ال\" هستید از کلید میانبر <kbd>Cmd/Ctrl + E</kbd> استفاده کنید تا یک ویرایشگر سطری سریع باز شود که تمام سی اس اس مربوطه را نشان دهد.\n" +
        " یک کنترل برای سی اس اس تان بسازید و کلید <kbd>ESC</kbd> را فشار دهید تا به ویرایش اچ تی ام ال تان برگردید، یا فقط قواعد باز شده ی سی اس اس را ترک کنید در نتیجه آنها به بخشی از ویرایشگر اچ تی ام ال تان وارد خواهند شد.\n" +
        "اگر شما کلید  <kbd>ESC</kbd> کناری از یک  ویرایشگر سطری سریع را فشار دهید آنها از بین می رود. ویرایش سریع همچنین قوانین تعریف شده در فایلهای LESS وSCSS که شامل قوانین تو در تو می باشند پیدا خواهد کرد.",

    QUICK_EDIT_SAMP:
        "Want to see it in action? Place your cursor on the <!-- <samp> --> tag above and press\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. You should see a CSS quick editor appear above, showing the CSS rule that\n" +
        "applies to it. Quick Edit works in class and id attributes as well. You can use it with your\n" +
        "LESS and SCSS files also.\n" +
        "You can create new rules the same way. Click in one of the <!-- <p> --> tags above and press\n" +
        "<kbd>Cmd/Ctrl + E</kbd>. There are no rules for it right now, but you can click the New Rule\n" +
        "button to add a new rule for <!-- <p> -->.",
    QUICK_EDIT_SCREENSHOT: "A screenshot showing CSS Quick Edit",
    QUICK_EDIT_OTHERS:
        "شما می توانید استفاده کنید از میانبر ثابتی تا چیزهای دیگری را، همچنین ویرایش کنید مثل توابع در جاوااسکریپت، رنگها و توابع زمانی انیمیشن و بیش از هر زمانی استفاده می کنید.",
    QUICK_EDIT_NOTE:
        "در حال حاضر ویرایشگر های سطری نمی توانند تودرتو باشند بنابراین شما می توانید تنها ویرایشگر سریع را استفاده کنید زمانی که مکان نما در یک ویرایش تمام صفحه است.",

    // LIVE PREVIEW
    LIVE_PREVIEW_COMMENT: "LIVE PREVIEW",
    LIVE_PREVIEW: "پیش نمایش تغیرات اچ تی ام ال و سی اس اس به صورت زنده در مرورگر",
    LIVE_PREVIEW_INTRO:
        "شما میدانید که ما فرآیند ذخیره /بازنگری را سالهاست انجام می دهیم در ویرایشتان جای را که تغیری ایجاد می کنید ذخیره می کنید و به مرورگر می روید و سپس نو سازی، سرانجام نتیجه را مشاهده کنید؟ با براکتس شما نیازی به آن کار ندارید.",
    LIVE_PREVIEW_DESCRIPTION:
        "براکتس یک ارتباط زنده با مرورگر محلی تان ایجاد می کند و یک نوع  بروز رسانی اچ تی ام ال و سی اس اس را قرار می دهد در داخل آن. شما همچنین ممکن است چیزهای را که امروزه انجام می دهید با  ابزار های مرورگرهای رایج، اما با براکتس شما نیازی به کپی و جایگزاری و در نهایت بازگشت به ویرایشگر کد ندارید. ویرایش کدهای تان اجرا خواهند شد در مرورگر ،اما  به صورت زنده .\n" +
        "براکتس یک <em>ارتباط زنده</em> با مرورگر محلی تان ایجاد می کند و یک نوع  بروز رسانی اچ تی ام ال و سی اس اس را قرار می دهد در داخل آن. شما همچنین ممکن است چیزهای را که امروزه انجام می دهید با  ابزار های مرورگرهای رایج، اما با براکتس شما نیازی به کپی و جایگزاری و در نهایت بازگشت به ویرایشگر کد ندارید. ویرایش کدهای تان اجرا خواهند شد در مرورگر ،اما  به صورت زنده .",
    LIVE_PREVIEW_HIGHLIGHT: "هایلایت زنده عناصر اچ تی ام ال و قوانین سی اس اس",
    LIVE_PREVIEW_HIGHLIGHT_DESCRIPTION:
        "براکتس تغیرات ایجاد شده در اچ تی ام ال و سی اس اس و چگونگی تاثیر آن بر روی صفحه را به آسانی نشان می دهد. زمانی که نشانگر ماوس بر روی یک قانون سی اس اس قرار می گیرد براکتس تمام عناصر تحت تاثیر را مشخص می کند. مشابهاً زمانی که یک فایل html در حال ویرایش است براکتس عناصر مربوط به اچ تی ام ال را در مرورگر مشخص می کند. امروزه براکتس فقط از پیشنمایش زنده برای اچ تی ام ال و سی اس اس پشتیبانی می کند. اگر چه در نسخه جاری تغییرات در فایلهای جاوااسکریپت به طور خودکار، زمانی که شما ذخیره می کنید مجدّداً بار گذاری می شود. ما در حال کارکردن بر روی پیشنمایش زنده جهت پشتیبانی از جاوا اسکریپت هستیم. پیشنمایش زنده تنها با گوگل کروم ممکن هست، اما ما امیدواریم این قابلیت درآینده برای همه عمده مرورگرهای به کار گرفته شود.",
    LIVE_PREVIEW_HIGHLIGHT_SAMP:
        "If you have Google Chrome installed, you can try this out yourself. Click on the lightning bolt\n" +
        "icon in the top right corner of your Brackets window or hit <kbd>Cmd/Ctrl + Alt + P</kbd>. When\n" +
        "Live Preview is enabled on an HTML document, all linked CSS documents can be edited in real-time.\n" +
        "The icon will change from gray to gold when Brackets establishes a connection to your browser.\n" +
        "Now, place your cursor on the <!-- <img> --> tag above. Notice the blue highlight that appears\n" +
        "around the image in Chrome. Next, use <kbd>Cmd/Ctrl + E</kbd> to open up the defined CSS rules.\n" +
        "Try changing the size of the border from 10px to 20px or change the background\n" +
        "color from \"transparent\" to \"hotpink\". If you have Brackets and your browser running side-by-side, you\n" +
        "will see your changes instantly reflected in your browser. Cool, right?",
    LIVE_PREVIEW_NOTE:
        "Today, Brackets only supports Live Preview for HTML and CSS. However, in the current version, changes to\n" +
        "JavaScript files are automatically reloaded when you save. We are currently working on Live Preview\n" +
        "support for JavaScript. Live previews are also only possible with Google Chrome, but we hope\n" +
        "to bring this functionality to all major browsers in the future.",

    // QUICK VIEW
    QUICK_VIEW: "نمایش سریع",
    QUICK_VIEW_DESCRIPTION:
        "برای برخی از ما که هنوز رنگ معادل برچسب های HEX ,rgbرا حفظ نیستیم، براکتس آن را سریع و راحت ایجاد میکند تا ببینی که دقیقاً کدام رنگ است که استفاده می شود. در هر سی اس اس به سادگی نشانگر ماوس را روی هر مقدار رنگ یا گرادینت در براکتس ببریم، یک پیش نمایش از رنگ/ گرادینت به صورت خودکار نمایش داده خواهد شد. به صورت مشابه برای تصاویر هم بکار می رود. به سادگی زمانی که نشانگر بر روی /آدرس تصویر در ویرایشگر براکتس قرار گیرد به عنوان پیش نمایش تصویر بند انگشتی از عکس نشان خواهد داد.",
    QUICK_VIEW_SAMP:
        "To try out Quick View for yourself, place your cursor on the <!-- <body> --> tag at the top of this\n" +
        "document and press <kbd>Cmd/Ctrl + E</kbd> to open a CSS quick editor. Now simply hover over any of the\n" +
        "color values within the CSS. You can also see it in action on gradients by opening a CSS quick editor\n" +
        "on the <!-- <html> --> tag and hovering over any of the background image values. To try out the image\n" +
        "preview, place your cursor over the screenshot image included earlier in this document.",

    // EXTENSIONS
    EXTENSIONS: "به چیز دیگری نیاز دارید? تلاش یک افزونه!",
    EXTENSIONS_DESCRIPTION:
        "علاوه بر تمام مزایای که در براکتس ایجاد شده است جامعه بزرگ و در حال رشد ما که متشکل از توسعه دهنده افزونه هاست هزاران افزونه برای اضافه شدن قابلیت های بسیار مفید ساخته شده است. اگر نیاز به موارد دیگری دارید که در براکتس ارائه نشده است به احتمال زیاد شخصی افزونه ای را برای آن ایجاد کرده است به فهرست و یا جستجو لیست افزونه های در دسترس رجوع کنید در پرونده ، مدیریت افزونه ها را انتخاب کنید و بر روی برگه در دسترس کلیک کنید. زمانی که افزونه ای را که می خواهید پیدا کردید کافیست بر روی \"نصب\" کلیک کنید و ادامه دهید.",

    // LET US KNOW WHAT YOU THINK
    GET_INVOLVED_COMMENT: "LET US KNOW WHAT YOU THINK",
    GET_INVOLVED: "درگیر شدن",
    GET_INVOLVED_DESCRIPTION:
        "براکتس یک پروژه منبع باز می باشد. توسعه دهندگان وب در سرتاسر جهان در حال مشارکت جهت ساخت یک ویرایشگر بهتر می باشند. بسیاری در حال ساخت افزونه های هستند که توانایی براکتس را افزایش می دهد. آنچه را که به آن فکر می کنید را به ما اطلاع دهید ،ایده های خود را به اشتراک بگزارید یا به صورت مستقیم در پروژه مشارکت کنید.",

    URLNAME_BRACKETS: "سایت اصلی براکتس",
    URLNAME_BRACKETS_BLOG: "وبلاگ تیم براکتس",
    URLNAME_BRACKETS_GITHUB: "براکتس در  GitHub",
    URLNAME_BRACKETS_EXTENSIONS_REGISTRY: "ثبت افزونه براکتس",
    URLNAME_BRACKETS_WIKI: "دانشنامه براکتس",
    URLNAME_BRACKETS_MAILING_LIST: "فهرست ایمیل توسعه دهنده براکتس",
    URLNAME_BRACKETS_TWITTER: "@براکتس در تویترr",
    BRACKETS_CHAT_INFO_BEFORE: "گفتگوه با توسعه دهندگان براکتس در IRC",
    BRACKETS_CHAT_FREENODE: "#براکتس در فرینود",
    BRACKETS_CHAT_INFO_AFTER: ""
});

// Last translated for 558502495dddd25974af9f4487f00a35e47dcfec
