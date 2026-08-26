/* =========================================================
   VAERO BRAIN INTENT
   Natural Language Intent Detection
========================================================= */

const BrainIntent = {

    /* =====================================================
       NORMALIZE
    ===================================================== */

    normalize(message){

        return String(
            message ?? ""
        )
            .toLocaleLowerCase(
                "tr-TR"
            )
            .trim()
            .replaceAll("ı", "i")
            .replaceAll("ğ", "g")
            .replaceAll("ü", "u")
            .replaceAll("ş", "s")
            .replaceAll("ö", "o")
            .replaceAll("ç", "c")
            .replace(/[?.!,;:()[\]{}"'`]/g, " ")
            .replace(/[-_/\\]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    },


    /* =====================================================
       TOKEN HELPERS
    ===================================================== */

    tokenize(text){

        const normalized =
            this.normalize(
                text
            );


        return normalized
            ? normalized.split(" ")
            : [];

    },


    includesPhrase(
        text,
        phrases = []
    ){

        const normalizedText =
            this.normalize(
                text
            );


        if(!normalizedText){
            return false;
        }


        const tokens =
            this.tokenize(
                normalizedText
            );


        return phrases.some(
            phrase => {

                const normalizedPhrase =
                    this.normalize(
                        phrase
                    );


                if(!normalizedPhrase){
                    return false;
                }


                if(
                    normalizedPhrase.includes(
                        " "
                    )
                ){

                    return normalizedText.includes(
                        normalizedPhrase
                    );

                }


                return tokens.includes(
                    normalizedPhrase
                );

            }
        );

    },


    /* =====================================================
       TARGET DEFINITIONS
    ===================================================== */

    getTargetDefinitions(){

        return [

            {
                target:"applications",
                names:[
                    "applications",
                    "uygulamalar",
                    "uygulama magazasi",
                    "uygulama merkezi",
                    "app store"
                ]
            },

            {
                target:"vaero",
                names:[
                    "vaero",
                    "vaero engine",
                    "engine merkezi",
                    "living engine"
                ]
            },

            {
                target:"home",
                names:[
                    "ana ekran",
                    "ana sayfa",
                    "ev",
                    "home",
                    "baslangic"
                ]
            },

            {
                target:"worlds",
                names:[
                    "dunyalar",
                    "dunyalarim",
                    "dunya listesi",
                    "worlds"
                ]
            },

            {
                target:"world",
                names:[
                    "aktif dunya",
                    "bu dunya",
                    "dunya",
                    "world"
                ]
            },

            {
                target:"create",
                names:[
                    "olusturma ekrani",
                    "yarat"
                ]
            },

            {
                target:"entities",
                names:[
                    "varliklar",
                    "varliklarim",
                    "entities"
                ]
            },

            {
                target:"entity",
                names:[
                    "bu varlik",
                    "aktif varlik",
                    "varlik",
                    "entity"
                ]
            },

            {
                target:"identity",
                names:[
                    "kimlik",
                    "kimligim",
                    "identity",
                    "va id",
                    "ae id",
                    "ea id"
                ]
            },

            {
                target:"profile",
                names:[
                    "profil",
                    "profilim",
                    "profile"
                ]
            },

            {
                target:"discovery",
                names:[
                    "discovery",
                    "kesif",
                    "kesif yolculugu"
                ]
            },

            {
                target:"memory",
                names:[
                    "hafiza",
                    "hafizam",
                    "memory",
                    "notlar",
                    "kayitlar"
                ]
            },

            {
                target:"timeline",
                names:[
                    "timeline",
                    "zaman cizelgesi",
                    "zaman akisi",
                    "gecmis olaylar",
                    "kronoloji"
                ]
            },

            {
                target:"bridge",
                names:[
                    "bridge",
                    "baglanti",
                    "baglantilar",
                    "kopru"
                ]
            },

            {
                target:"evolution",
                names:[
                    "evolution",
                    "evrim",
                    "gelisim olaylari",
                    "yasam olaylari"
                ]
            },

            {
                target:"organs",
                names:[
                    "organ",
                    "organlar",
                    "organ launcher"
                ]
            },

            {
                target:"settings",
                names:[
                    "ayar",
                    "ayarlar",
                    "settings"
                ]
            },

            {
                target:"notification",
                names:[
                    "bildirim",
                    "bildirimler",
                    "notification",
                    "notifications"
                ]
            },

            {
                target:"message",
                names:[
                    "mesaj",
                    "mesajlar",
                    "message",
                    "messages"
                ]
            },

            {
                target:"call",
                names:[
                    "arama",
                    "sesli arama",
                    "goruntulu arama",
                    "video arama",
                    "call"
                ]
            },

            {
                target:"brain",
                names:[
                    "brain",
                    "beyin"
                ]
            }

        ];

    },


    /* =====================================================
       TARGET DETECTION
    ===================================================== */

    detectTarget(text){

        const normalizedText =
            this.normalize(
                text
            );


        if(!normalizedText){
            return null;
        }


        const tokens =
            this.tokenize(
                normalizedText
            );


        const matches = [];


        this
            .getTargetDefinitions()
            .forEach(
                definition => {

                    definition.names.forEach(
                        name => {

                            const normalizedName =
                                this.normalize(
                                    name
                                );


                            if(!normalizedName){
                                return;
                            }


                            let matched =
                                false;


                            if(
                                normalizedName.includes(
                                    " "
                                )
                            ){

                                matched =
                                    normalizedText.includes(
                                        normalizedName
                                    );

                            } else {

                                matched =
                                    tokens.includes(
                                        normalizedName
                                    );

                            }


                            if(!matched){
                                return;
                            }


                            matches.push({

                                target:
                                    definition.target,

                                phrase:
                                    normalizedName,

                                length:
                                    normalizedName.length,

                                tokenCount:
                                    normalizedName
                                        .split(" ")
                                        .length

                            });

                        }
                    );

                }
            );


        matches.sort(
            (a,b) => {

                if(
                    b.tokenCount !==
                    a.tokenCount
                ){

                    return (
                        b.tokenCount -
                        a.tokenCount
                    );

                }


                return (
                    b.length -
                    a.length
                );

            }
        );


        return (
            matches[0] ||
            null
        );

    },


    /* =====================================================
       OPERATION DETECTION
    ===================================================== */

    detectOperation(text){

        const operationDefinitions = [

            {
                operation:"archive",
                words:[
                    "arsivle",
                    "arsive al"
                ]
            },

            {
                operation:"restore",
                words:[
                    "geri getir",
                    "geri yukle",
                    "arsivden cikar",
                    "kurtar",
                    "kaldigim yere don",
                    "kaldigimiz yere don",
                    "nerede kalmistik",
                    "devam et",
                    "devam edelim"
                ]
            },

            {
                operation:"delete",
                words:[
                    "sil",
                    "yok et",
                    "kalici sil",
                    "tamamen sil"
                ]
            },

            {
                operation:"remove",
                words:[
                    "kaldir",
                    "uninstall",
                    "uygulamayi kaldir"
                ]
            },

            {
                operation:"install",
                words:[
                    "yukle",
                    "install",
                    "uygulamayi kur"
                ]
            },

            {
                operation:"save",
                words:[
                    "kaydet",
                    "burada kaldik",
                    "burda kaldik",
                    "kaldigimiz yeri kaydet",
                    "devam noktasi",
                    "bunu hatirla"
                ]
            },

            {
                operation:"create",
                words:[
                    "olustur",
                    "yarat",
                    "ekle",
                    "yeni",
                    "baslat"
                ]
            },

            {
                operation:"update",
                words:[
                    "guncelle",
                    "update"
                ]
            },

            {
                operation:"edit",
                words:[
                    "duzenle",
                    "degistir",
                    "yenile",
                    "duzelt"
                ]
            },

            {
                operation:"search",
                words:[
                    "ara",
                    "bul",
                    "listele",
                    "goster bana",
                    "hangileri"
                ]
            },

            {
                operation:"open",
                words:[
                    "ac",
                    "acar misin",
                    "acabilir misin",
                    "acmani istiyorum",
                    "goster",
                    "gosterir misin",
                    "goruntule",
                    "git",
                    "gec",
                    "beni gotur",
                    "buraya git"
                ]
            },

            {
                operation:"send",
                words:[
                    "gonder",
                    "yolla",
                    "mesaj at"
                ]
            },

            {
                operation:"grant",
                words:[
                    "izin ver",
                    "yetki ver",
                    "permission ver"
                ]
            },

            {
                operation:"revoke",
                words:[
                    "izni kaldir",
                    "yetkiyi kaldir",
                    "izni geri al",
                    "permission kaldir"
                ]
            },

            {
                operation:"explain",
                words:[
                    "nedir",
                    "ne ise yarar",
                    "anlat",
                    "acikla",
                    "bilgi ver",
                    "hakkinda",
                    "ne demek"
                ]
            }

        ];


        for(
            const definition of
            operationDefinitions
        ){

            if(
                this.includesPhrase(
                    text,
                    definition.words
                )
            ){

                return definition.operation;

            }

        }


        return "general";

    },


    /* =====================================================
       QUESTION DETECTION
    ===================================================== */

    isQuestion(text){

        const normalized =
            this.normalize(
                text
            );


        return (
            normalized.startsWith("ne ") ||
            normalized === "ne" ||
            normalized.startsWith("nasil ") ||
            normalized.startsWith("neden ") ||
            normalized.startsWith("niye ") ||
            normalized.startsWith("hangi ") ||
            normalized.startsWith("kim ") ||
            normalized.startsWith("nerede ") ||
            normalized.startsWith("ne zaman ") ||
            normalized.includes("bilir miyim") ||
            normalized.includes("bilir misin") ||
            normalized.includes("mumkun mu") ||
            normalized.includes("var mi") ||
            normalized.includes("olur mu")
        );

    },


    /* =====================================================
       CONTEXT TARGET
    ===================================================== */

    getContextTarget(context = {}){

        if(
            !context ||
            typeof context !== "object"
        ){
            return null;
        }


        const candidates = [

            context.page,
            context.app,
            context.screen

        ]
            .filter(Boolean)
            .map(
                value =>
                    this.normalize(
                        value
                    )
            );


        const allowedTargets =
            new Set(
                this
                    .getTargetDefinitions()
                    .map(
                        definition =>
                            definition.target
                    )
            );


        return (
            candidates.find(
                candidate =>
                    allowedTargets.has(
                        candidate
                    )
            ) ||
            null
        );

    },


    /* =====================================================
       CONTEXTUAL REFERENCES
    ===================================================== */

    usesContextReference(text){

        return this.includesPhrase(
            text,
            [
                "burasi",
                "burayi",
                "burada",
                "bu ekran",
                "bu sayfa",
                "bunu",
                "buraya",
                "mevcut ekran",
                "mevcut sayfa",
                "bu kayit",
                "bu varlik",
                "bu dunya"
            ]
        );

    },


    /* =====================================================
       APPLICATION ID EXTRACTION
    ===================================================== */

    extractApplicationId(
        text,
        context = {}
    ){

        const direct =
            context.appId ||
            context.applicationId ||
            null;


        if(
            typeof direct === "string" &&
            direct.trim()
        ){

            return direct.trim();

        }


        const registry =
            (
                typeof VAERO !== "undefined" &&
                typeof VAERO.get === "function"
            )
                ? (
                    VAERO.get("appRegistry") ||
                    null
                )
                : null;


        if(
            !registry ||
            typeof registry.all !== "function"
        ){
            return null;
        }


        let apps = [];


        try{

            apps =
                registry.all({
                    includeDisabled:true
                });

        } catch(error){

            try{

                apps =
                    registry.all();

            } catch(secondError){

                apps = [];

            }

        }


        if(
            !Array.isArray(apps)
        ){
            return null;
        }


        const normalizedText =
            this.normalize(
                text
            );


        const matches =
            apps
                .map(
                    app => {

                        const candidates = [

                            app.id,
                            app.title

                        ]
                            .filter(Boolean)
                            .map(
                                value =>
                                    this.normalize(
                                        value
                                    )
                            )
                            .filter(Boolean);


                        const matched =
                            candidates.find(
                                candidate =>
                                    candidate.includes(" ")
                                        ? normalizedText.includes(
                                            candidate
                                        )
                                        : this.tokenize(
                                            normalizedText
                                        ).includes(
                                            candidate
                                        )
                            );


                        if(!matched){
                            return null;
                        }


                        return {

                            id:
                                app.id,

                            score:
                                matched.length

                        };

                    }
                )
                .filter(Boolean)
                .sort(
                    (a,b) =>
                        b.score -
                        a.score
                );


        return (
            matches[0]?.id ||
            null
        );

    },


    /* =====================================================
       PERMISSION EXTRACTION
    ===================================================== */

    extractPermission(
        text,
        context = {}
    ){

        if(
            typeof context.permission ===
                "string" &&
            context.permission.trim()
        ){

            return context.permission.trim();

        }


        const normalizedText =
            this.normalize(
                text
            );


        /*
         * permission.name gibi açık permission ID
         * metin içinde bulunuyorsa koru.
         */

        const match =
            String(
                text ?? ""
            ).match(
                /\b[a-z0-9_-]+\.[a-z0-9_.:-]+\b/i
            );


        if(match?.[0]){
            return match[0];
        }


        const known = [

            "microphone",
            "camera",
            "location",
            "notifications",
            "memory.read",
            "memory.write",
            "profile.read",
            "profile.write",
            "identity.read"

        ];


        return (
            known.find(
                permission =>
                    normalizedText.includes(
                        this.normalize(
                            permission
                        )
                    )
            ) ||
            null
        );

    },

   /* =====================================================
       DETECT
    ===================================================== */

    detect(
        message,
        context = {}
    ){

        const raw =
            String(
                message ?? ""
            ).trim();


        const text =
            this.normalize(
                raw
            );


        if(!text){

            return {

                type:"empty",

                target:null,

                operation:null,

                confidence:1,

                explicit:false,

                raw,

                normalizedText:""

            };

        }


        const targetMatch =
            this.detectTarget(
                text
            );


        const detectedTarget =
            targetMatch?.target ||
            null;


        const contextTarget =
            this.getContextTarget(
                context
            );


        const contextualReference =
            this.usesContextReference(
                text
            );


        const target =
            detectedTarget ||
            (
                contextualReference
                    ? contextTarget
                    : null
            );


        const operation =
            this.detectOperation(
                text
            );


        const question =
            this.isQuestion(
                text
            );


        const words =
            this.tokenize(
                text
            );


        /* =================================================
           CLARIFY
        ================================================= */

        if(
            words.length <= 3 &&
            [
                "ne",
                "anlamadim",
                "nasil yani",
                "ne demek",
                "anlamadim ben"
            ].includes(
                text
            )
        ){

            return {

                type:"clarify",

                target:
                    contextTarget,

                operation:"clarify",

                confidence:.94,

                explicit:true,

                raw,

                normalizedText:text,

                contextTarget

            };

        }


        /* =================================================
           RESUME SAVE
        ================================================= */

        if(
            operation === "save" &&
            this.includesPhrase(
                text,
                [
                    "burada kaldik",
                    "burda kaldik",
                    "kaldigimiz yeri kaydet",
                    "devam noktasi",
                    "bunu hatirla"
                ]
            )
        ){

            return {

                type:"resume:save",

                target:
                    target ||
                    contextTarget ||
                    null,

                operation:"save",

                confidence:.98,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        /* =================================================
           RESUME RESTORE
        ================================================= */

        if(
            operation === "restore" &&
            this.includesPhrase(
                text,
                [
                    "nerede kalmistik",
                    "kaldigim yere don",
                    "kaldigimiz yere don",
                    "kaldigimiz yer",
                    "devam et",
                    "devam edelim"
                ]
            )
        ){

            return {

                type:"resume:restore",

                target:
                    target ||
                    null,

                operation:"restore",

                confidence:.98,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        /* =================================================
           APPLICATION LIFECYCLE
        ================================================= */

        const applicationContext =
            target === "applications" ||
            contextTarget === "applications" ||
            this.includesPhrase(
                text,
                [
                    "uygulama",
                    "application",
                    "app"
                ]
            );


        if(
            applicationContext &&
            operation === "install"
        ){

            const appId =
                this.extractApplicationId(
                    raw,
                    context
                );


            return {

                type:"application:install",

                target:"application",

                operation:"install",

                appId,

                applicationId:
                    appId,

                confidence:
                    appId
                        ? .98
                        : .82,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        if(
            applicationContext &&
            operation === "update"
        ){

            const appId =
                this.extractApplicationId(
                    raw,
                    context
                );


            return {

                type:"application:update",

                target:"application",

                operation:"update",

                appId,

                applicationId:
                    appId,

                confidence:
                    appId
                        ? .98
                        : .82,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        if(
            applicationContext &&
            operation === "remove"
        ){

            const appId =
                this.extractApplicationId(
                    raw,
                    context
                );


            return {

                type:"application:remove",

                target:"application",

                operation:"remove",

                appId,

                applicationId:
                    appId,

                confidence:
                    appId
                        ? .98
                        : .82,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        /* =================================================
           PERMISSIONS
        ================================================= */

        if(
            operation === "grant" ||
            operation === "revoke"
        ){

            const appId =
                this.extractApplicationId(
                    raw,
                    context
                );


            const permission =
                this.extractPermission(
                    raw,
                    context
                );


            return {

                type:
                    operation === "grant"
                        ? "permission:grant"
                        : "permission:revoke",

                target:"application",

                operation,

                appId,

                applicationId:
                    appId,

                permission,

                confidence:
                    appId &&
                    permission
                        ? .98
                        : .76,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        /* =================================================
           COMMUNICATION
        ================================================= */

        if(
            target === "message" &&
            operation === "send"
        ){

            return {

                type:"message:send",

                target:"message",

                operation:"send",

                confidence:.96,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        if(
            target === "call" &&
            this.includesPhrase(
                text,
                [
                    "ara",
                    "arama baslat",
                    "sesli ara",
                    "goruntulu ara",
                    "video ara",
                    "call baslat"
                ]
            )
        ){

            return {

                type:"call:start",

                target:"call",

                operation:"start",

                callType:
                    this.includesPhrase(
                        text,
                        [
                            "goruntulu",
                            "video"
                        ]
                    )
                        ? "video"
                        : "voice",

                confidence:.96,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        if(
            this.includesPhrase(
                text,
                [
                    "ekran paylas",
                    "ekranimi paylas",
                    "screen share",
                    "ekran paylasimi baslat"
                ]
            )
        ){

            return {

                type:"screen-share:start",

                target:"call",

                operation:"start",

                confidence:.98,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        /* =================================================
           CREATE WORLD
        ================================================= */

        if(
            operation === "create" &&
            (
                target === "world" ||
                target === "worlds" ||
                target === "create" ||
                this.includesPhrase(
                    text,
                    [
                        "yeni dunya",
                        "dunya olustur",
                        "dunya yarat"
                    ]
                )
            )
        ){

            return {

                type:"create",

                target:"world",

                operation:"create",

                confidence:.97,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        /* =================================================
           CREATE ENTITY
        ================================================= */

        if(
            operation === "create" &&
            (
                target === "entity" ||
                target === "entities" ||
                this.includesPhrase(
                    text,
                    [
                        "varlik olustur",
                        "yeni varlik",
                        "varlik ekle",
                        "entity olustur"
                    ]
                )
            )
        ){

            return {

                type:"create",

                target:"entity",

                operation:"create",

                confidence:.97,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        /* =================================================
           EXPLICIT ARCHIVE / RESTORE / DELETE
        ================================================= */

        if(
            operation === "archive" &&
            target
        ){

            return {

                type:"request",

                target,

                operation:"archive",

                confidence:.94,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        if(
            operation === "restore" &&
            target
        ){

            return {

                type:"request",

                target,

                operation:"restore",

                confidence:.94,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        if(
            operation === "delete" &&
            target
        ){

            return {

                type:"request",

                target,

                operation:"delete",

                confidence:.95,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        /* =================================================
           NAVIGATION
        ================================================= */

        if(
            operation === "open" &&
            target
        ){

            return {

                type:"navigate",

                target,

                operation:"open",

                confidence:
                    detectedTarget
                        ? .97
                        : .88,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget,

                contextual:
                    !detectedTarget &&
                    Boolean(
                        contextTarget
                    )

            };

        }


        /* =================================================
           QUESTION
        ================================================= */

        if(question){

            return {

                type:"question",

                target,

                operation:
                    operation === "general"
                        ? "explain"
                        : operation,

                confidence:
                    target
                        ? .9
                        : .64,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget

            };

        }


        /* =================================================
           DIRECT REQUEST
        ================================================= */

        if(
            operation !== "general"
        ){

            return {

                type:"request",

                target:
                    target ||
                    contextTarget ||
                    null,

                operation,

                confidence:
                    target
                        ? .88
                        : contextTarget
                            ? .72
                            : .54,

                explicit:true,

                raw,

                normalizedText:text,

                detectedTarget,

                contextTarget,

                contextual:
                    !detectedTarget &&
                    Boolean(
                        contextTarget
                    )

            };

        }


        /* =================================================
           CHAT
        ================================================= */

        return {

            type:"chat",

            target:
                detectedTarget ||
                null,

            detectedTarget,

            contextTarget,

            operation:"general",

            confidence:
                detectedTarget
                    ? .62
                    : .38,

            explicit:false,

            raw,

            normalizedText:text

        };

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        return {

            targets:
                this.getTargetDefinitions()
                    .length,

            supportedOperations:[
                "open",
                "search",
                "create",
                "edit",
                "update",
                "archive",
                "restore",
                "delete",
                "install",
                "remove",
                "save",
                "send",
                "grant",
                "revoke",
                "explain"
            ],

            explicitIntents:[
                "navigate",
                "create",
                "resume:save",
                "resume:restore",
                "application:install",
                "application:update",
                "application:remove",
                "permission:grant",
                "permission:revoke",
                "message:send",
                "call:start",
                "screen-share:start",
                "request",
                "question",
                "clarify",
                "chat"
            ]

        };

    }

};


VAERO.register(
    "brainIntent",
    BrainIntent
);


window.BrainIntent =
    BrainIntent;
