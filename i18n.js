/* Everything on this site that differs by language, and nothing else.
 *
 * This file is the only place any of it is written by hand. The ten pages
 * under / are generated from it by scripts/build.js and committed; editing a
 * page directly will be overwritten the next time that script runs, and CI
 * fails if the committed pages and this file disagree.
 *
 * ---- What is NOT here, on purpose ----
 *
 * The name, the statement, the eyebrow "elsewhere", the exit hostnames, the
 * email address, the "contact"/"soon" labels and the copyright line are the
 * same English in all ten languages. They are the page's frame and its
 * signature rather than information it is delivering: the statement is the
 * one sentence the owner actually wrote, and a word like "colophon" or
 * "elsewhere" has no everyday equivalent in most of these languages — the
 * Chinese page used to say 版本記, a term invented for the occasion.
 *
 * So the only prose that varies is the two exit descriptions, plus the
 * metadata nobody reads on the page itself.
 *
 * ---- Why the eight unverifiable languages are noun phrases ----
 *
 * The owner reads English and Traditional Chinese. Nobody will proofread the
 * other eight, and the owner's instruction was that "reads oddly" is not an
 * acceptable outcome. Sentences are where translationese lives — word order,
 * tense, register, how clauses join. A noun phrase has none of those
 * surfaces: it is either right or it uses the wrong word, and a wrong word is
 * something you can look up. So en and zh-Hant get sentences (someone can
 * check them) and the rest get noun phrases.
 *
 * If a language ever can't be written with confidence even as a phrase, put
 * the English there instead. One language falling back is fine; the rest of
 * the page is English anyway.
 */

export const SITE = {
  origin: "https://siao.ai",
  name: "Siao",
  email: "hello@siao.ai",
  /* Never translated. See above. */
  statement: "The summit is a lie. The boulder is real.",
  eyebrow: "elsewhere",
  copyright: "© 2026 Siao",
};

/* The exits. Add a subdomain by adding one entry here and one line to each
 * language below. live: false renders as grey text with no link, so a place
 * that isn't up yet can't send anyone to a 404. */
export const PLACES = [
  { key: "git", name: "git.siao.ai", url: "https://git.siao.ai", live: true },
  { key: "apps", name: "apps.siao.ai", url: "https://apps.siao.ai", live: true },
  { key: "blog", name: "blog.siao.ai", url: "https://blog.siao.ai", live: true },
  { key: "ccvs", name: "ccvs.siao.ai", url: "https://ccvs.siao.ai", live: true },
];

/* Order matters twice: it is the order of the menu, and the first entry is the
 * default the front door falls back to.
 *
 * font: which self-hosted face this language's own text needs beyond Latin.
 * Only that one is preloaded on that page. The menu's own scripts are handled
 * separately — see styles.css. */
export const LANGUAGES = [
  {
    code: "en",
    path: "/",
    htmlLang: "en",
    dir: "ltr",
    endonym: "English",
    ogLocale: "en_US",
    font: null,
    description:
      "Siao — student, self-taught developer, working in Python and AI. The summit is a lie. The boulder is real.",
    bio: "Student, self-taught developer, working in Python and AI.",
    places: {
      git: "a self-hosted git server, and a front end written for it",
      apps: "web applications, running on the same machine",
      blog: "writing about the work, with the journals it came from attached",
      ccvs: "a school rhythm-game club's site",
    },
  },
  {
    code: "zh-Hant",
    path: "/zh-hant/",
    htmlLang: "zh-Hant",
    dir: "ltr",
    endonym: "繁體中文",
    ogLocale: "zh_TW",
    font: "tc",
    description:
      "Siao — 學生，自學寫程式，做 Python 與 AI。The summit is a lie. The boulder is real.",
    bio: "學生，自學寫程式，做 Python 與 AI。",
    /* Rewritten, not the old translation. The previous copy read
     * 自架的 git 伺服器，以及為它寫的前台 — correct words in English word
     * order, which is exactly the thing this whole change exists to fix. */
    places: {
      git: "自己架的 git 伺服器，前台也是自己寫的",
      apps: "幾個網頁應用，跑在同一台機器上",
      blog: "關於這些工作的文章，附上它們的原始日誌",
      ccvs: "一個學生音遊社的網站",
    },
  },
  {
    code: "zh-Hans",
    path: "/zh-hans/",
    htmlLang: "zh-Hans",
    dir: "ltr",
    endonym: "简体中文",
    ogLocale: "zh_CN",
    font: "sc",
    description:
      "Siao — 学生，自学写程序，做 Python 与 AI。The summit is a lie. The boulder is real.",
    bio: "学生，自学写程序，做 Python 与 AI。",
    places: {
      git: "自己搭的 git 服务器，前端也是自己写的",
      apps: "几个网页应用，跑在同一台机器上",
      blog: "关于这些工作的文章，附上它们的原始日志",
      ccvs: "一个学生音游社的网站",
    },
  },
  {
    code: "ja",
    path: "/ja/",
    htmlLang: "ja",
    dir: "ltr",
    endonym: "日本語",
    ogLocale: "ja_JP",
    font: "jp",
    description:
      "Siao — 学生、独学の開発者。Python と AI。The summit is a lie. The boulder is real.",
    bio: "学生、独学の開発者。Python と AI。",
    places: {
      git: "セルフホストの git サーバーと、自作のフロントエンド",
      apps: "同じマシンで動く Web アプリケーション",
      blog: "作業についての文章と、その元になった作業ログ",
      ccvs: "高校の音楽ゲーム部のサイト",
    },
  },
  {
    code: "ko",
    path: "/ko/",
    htmlLang: "ko",
    dir: "ltr",
    endonym: "한국어",
    ogLocale: "ko_KR",
    font: "kr",
    description:
      "Siao — 학생, 독학 개발자. Python과 AI. The summit is a lie. The boulder is real.",
    bio: "학생, 독학 개발자. Python과 AI.",
    places: {
      git: "직접 운영하는 git 서버와 직접 만든 프런트엔드",
      apps: "같은 머신에서 돌아가는 웹 애플리케이션",
      blog: "작업에 대한 글과, 그 바탕이 된 작업 일지",
      ccvs: "고등학교 리듬게임 동아리의 사이트",
    },
  },
  {
    code: "es",
    path: "/es/",
    htmlLang: "es",
    dir: "ltr",
    endonym: "Español",
    ogLocale: "es_ES",
    font: null,
    description:
      "Siao — estudiante, desarrollador autodidacta, Python e IA. The summit is a lie. The boulder is real.",
    bio: "Estudiante, desarrollador autodidacta, Python e IA.",
    places: {
      git: "un servidor git autoalojado y una interfaz hecha para él",
      apps: "aplicaciones web en la misma máquina",
      blog: "textos sobre el trabajo, con los cuadernos de los que salieron",
      ccvs: "el sitio de un club escolar de videojuegos rítmicos",
    },
  },
  {
    code: "fr",
    path: "/fr/",
    htmlLang: "fr",
    dir: "ltr",
    endonym: "Français",
    ogLocale: "fr_FR",
    font: null,
    description:
      "Siao — étudiant, développeur autodidacte, Python et IA. The summit is a lie. The boulder is real.",
    bio: "Étudiant, développeur autodidacte, Python et IA.",
    places: {
      git: "un serveur git auto-hébergé et son interface dédiée",
      apps: "des applications web sur la même machine",
      blog: "des textes sur le travail, avec les carnets dont ils sont issus",
      ccvs: "le site d'un club scolaire de jeux rythmiques",
    },
  },
  {
    code: "de",
    path: "/de/",
    htmlLang: "de",
    dir: "ltr",
    endonym: "Deutsch",
    ogLocale: "de_DE",
    font: null,
    description:
      "Siao — Student, autodidaktischer Entwickler, Python und KI. The summit is a lie. The boulder is real.",
    bio: "Student, autodidaktischer Entwickler, Python und KI.",
    places: {
      git: "ein selbst gehosteter git-Server mit eigenem Frontend",
      apps: "Webanwendungen auf derselben Maschine",
      blog: "Texte über die Arbeit, mit den Journalen, aus denen sie stammen",
      ccvs: "die Seite eines schulischen Rhythmusspiel-Clubs",
    },
  },
  {
    code: "ru",
    path: "/ru/",
    htmlLang: "ru",
    dir: "ltr",
    endonym: "Русский",
    ogLocale: "ru_RU",
    font: "cyrillic",
    description:
      "Siao — студент, разработчик-самоучка, Python и ИИ. The summit is a lie. The boulder is real.",
    bio: "Студент, разработчик-самоучка, Python и ИИ.",
    places: {
      git: "свой git-сервер и написанный для него интерфейс",
      apps: "веб-приложения на той же машине",
      blog: "тексты о работе и рабочие журналы, из которых они выросли",
      ccvs: "сайт школьного клуба ритм-игр",
    },
  },
  {
    code: "ar",
    path: "/ar/",
    htmlLang: "ar",
    dir: "rtl",
    endonym: "العربية",
    ogLocale: "ar_AR",
    font: "arabic",
    description:
      "Siao — طالب، مطوّر عصامي، Python والذكاء الاصطناعي. The summit is a lie. The boulder is real.",
    bio: "طالب، مطوّر عصامي، Python والذكاء الاصطناعي.",
    places: {
      git: "خادم git مُستضاف ذاتيًا وواجهة مكتوبة له",
      apps: "تطبيقات ويب على الجهاز نفسه",
      blog: "كتابات عن العمل، مع دفاتر العمل التي انبثقت عنها",
      ccvs: "موقع لنادي ألعاب إيقاعية مدرسي",
    },
  },
];

/* Left in English in every language on purpose: these are entity names for a
 * machine, not prose for a reader, and a consumer of this markup is better
 * served by the stable English terms than by ten translations of them. */
export const KNOWS_ABOUT = [
  "Python",
  "Artificial Intelligence",
  "self-hosted infrastructure",
  "git hosting",
  "identity and authentication",
  "web applications",
];

/* Browser language tag → our language code. Checked longest-first, so
 * zh-TW resolves to Traditional before the bare "zh" prefix is considered.
 * Anything unlisted falls through to English rather than guessing. */
export const LANGUAGE_GUESSES = [
  ["zh-hant", "zh-Hant"],
  ["zh-tw", "zh-Hant"],
  ["zh-hk", "zh-Hant"],
  ["zh-mo", "zh-Hant"],
  ["zh-hans", "zh-Hans"],
  ["zh-cn", "zh-Hans"],
  ["zh-sg", "zh-Hans"],
  ["zh", "zh-Hant"],
  ["ja", "ja"],
  ["ko", "ko"],
  ["es", "es"],
  ["fr", "fr"],
  ["de", "de"],
  ["ru", "ru"],
  ["ar", "ar"],
];
