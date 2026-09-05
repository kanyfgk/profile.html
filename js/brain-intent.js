/* =========================================================
   VAERO BRAIN INTENT
   Natural Language Intent Detection
========================================================= */

const BrainIntent = {

    version:
        "3.0.0",


    /* =====================================================
       NORMALIZE
    ===================================================== */

    normalize(message){

        return String(
            message ??
                ""
        )
            .toLocaleLowerCase(
                "tr-TR"
            )
            .trim()
            .replaceAll(
                "ı",
                "i"
            )
            .replaceAll(
                "ğ",
                "g"
            )
            .replaceAll(
                "ü",
                "u"
            )
            .replaceAll(
                "ş",
                "s"
            )
            .replaceAll(
                "ö",
                "o"
            )
            .replaceAll(
                "ç",
                "c"
            )
            .replace(
                /[?.!,;:()[\]{}"'`]/g,
                " "
            )
            .replace(
                /[-_/\\]+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
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
            ? normalized.split(
                " "
            )
            : [];

    },

   getTargetTokenVariants(token){

        const value =
            this.normalize(
                token
            );


        if(!value){

            return [];

        }


        const variants =
            new Set([
                value
            ]);


        const suffixes = [

            "larimi",
            "lerimi",
            "larim",
            "lerim",

            "imizi",
            "umuzu",
            "inizi",
            "unuzu",

            "lari",
            "leri",

            "sini",
            "sunu",

            "imi",
            "umu",
            "ini",
            "unu",

            "dan",
            "den",
            "tan",
            "ten",

            "miz",
            "muz",
            "niz",
            "nuz",

            "yi",
            "yu",

            "ya",
            "ye",

            "da",
            "de",
            "ta",
            "te",

            "im",
            "um",
            "in",
            "un",

            "si",
            "su",

            "mi",
            "mu",

            "i",
            "u",

            "a",
            "e",

            "m",
            "n"

        ];


        suffixes.forEach(
            suffix => {

                if(
                    value.length >
                        suffix.length + 2 &&
                    value.endsWith(
                        suffix
                    )
                ){

                    variants.add(
                        value.slice(
                            0,
                            -suffix.length
                        )
                    );

                }

            }
        );


        /*
         * Türkçedeki ünsüz yumuşamasını da hesaba kat.
         *
         * kimlik → kimliği → kimligi
         * kitap → kitabı → kitabi
         * kanat → kanadı → kanadi
         */

        Array.from(
            variants
        ).forEach(
            candidate => {

                if(
                    candidate.endsWith(
                        "g"
                    )
                ){

                    variants.add(
                        candidate.slice(
                            0,
                            -1
                        ) + "k"
                    );

                }


                if(
                    candidate.endsWith(
                        "b"
                    )
                ){

                    variants.add(
                        candidate.slice(
                            0,
                            -1
                        ) + "p"
                    );

                }


                if(
                    candidate.endsWith(
                        "d"
                    )
                ){

                    variants.add(
                        candidate.slice(
                            0,
                            -1
                        ) + "t"
                    );

                }

            }
        );


        return Array.from(
            variants
        );

    },


    matchesTargetPhrase(
        text,
        phrase
    ){

        const textTokens =
            this.tokenize(
                text
            );


        const phraseTokens =
            this.tokenize(
                phrase
            );


        if(
            !textTokens.length ||
            !phraseTokens.length ||
            phraseTokens.length >
                textTokens.length
        ){

            return false;

        }


        for(
            let start = 0;
            start <=
                textTokens.length -
                phraseTokens.length;
            start++
        ){

            let matched =
                true;


            for(
                let index = 0;
                index <
                    phraseTokens.length;
                index++
            ){

                const variants =
                    this.getTargetTokenVariants(
                        textTokens[
                            start + index
                        ]
                    );


                if(
                    !variants.includes(
                        phraseTokens[
                            index
                        ]
                    )
                ){

                    matched =
                        false;

                    break;

                }

            }


            if(matched){

                return true;

            }

        }


        return false;

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

                    return (
                        ` ${normalizedText} `
                            .includes(
                                ` ${normalizedPhrase} `
                            )
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
    target:
        "applications",

    names:[
        "applications",
        "uygulamalar",
        "uygulamaları",
        "uygulamayı",
        "uygulama",
        "uygulama magazasi",
        "uygulama merkezi",
        "app store"
    ]
},

            {
                target:
                    "vaero",

                names:[
                    "vaero",
                    "vaero engine",
                    "engine merkezi",
                    "living engine"
                ]
            },

            {
                target:
                    "home",

                names:[
                    "ana ekran",
                    "ana sayfa",
                    "ev",
                    "home",
                    "baslangic"
                ]
            },

            {
                target:
                    "worlds",

                names:[
                    "dunyalar",
                    "dunyalarim",
                    "dunya listesi",
                    "worlds"
                ]
            },

            {
                target:
                    "world",

                names:[
                    "aktif dunya",
                    "bu dunya",
                    "dunya",
                    "world"
                ]
            },

            {
                target:
                    "create",

                names:[
                    "olusturma ekrani",
                    "yarat"
                ]
            },

            {
                target:
                    "entities",

                names:[
                    "varliklar",
                    "varliklarim",
                    "entities"
                ]
            },

            {
                target:
                    "entity",

                names:[
                    "bu varlik",
                    "aktif varlik",
                    "varlik",
                    "entity"
                ]
            },

            {
                target:
                    "identity",

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
                target:
                    "profile",

                names:[
                    "profil",
                    "profilim",
                    "profile"
                ]
            },

            {
                target:
                    "discovery",

                names:[
                    "discovery",
                    "kesif",
                    "kesif yolculugu"
                ]
            },

            {
                target:
                    "memory",

                names:[
                    "hafiza",
                    "hafizam",
                    "memory",
                    "notlar",
                    "kayitlar"
                ]
            },

            {
                target:
                    "timeline",

                names:[
                    "timeline",
                    "zaman cizelgesi",
                    "zaman akisi",
                    "gecmis olaylar",
                    "kronoloji"
                ]
            },

            {
                target:
                    "bridge",

                names:[
                    "bridge",
                    "baglanti",
                    "baglantilar",
                    "kopru"
                ]
            },

            {
                target:
                    "evolution",

                names:[
                    "evolution",
                    "evrim",
                    "gelisim olaylari",
                    "yasam olaylari"
                ]
            },

            {
                target:
                    "organs",

                names:[
                    "organ",
                    "organlar",
                    "organ launcher"
                ]
            },

            {
                target:
                    "settings",

                names:[
                    "ayar",
                    "ayarlar",
                    "settings"
                ]
            },

            {
                target:
                    "notification",

                names:[
                    "bildirim",
                    "bildirimler",
                    "notification",
                    "notifications"
                ]
            },

            {
                target:
                    "message",

                names:[
                    "mesaj",
                    "mesajlar",
                    "message",
                    "messages"
                ]
            },

            {
                target:
                    "call",

                names:[
                    "arama",
                    "sesli arama",
                    "goruntulu arama",
                    "video arama",
                    "call"
                ]
            },

            {
                target:
                    "brain",

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


        const matches =
            [];


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


                            matched =
    this.matchesTargetPhrase(
        normalizedText,
        normalizedName
    );


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
                                        .split(
                                            " "
                                        )
                                        .length

                            });

                        }
                    );

                }
            );


        matches.sort(
            (
                a,
                b
            ) => {

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
            matches[
                0
            ] ||
            null
        );

    },


    /* =====================================================
       OPERATION DEFINITIONS
    ===================================================== */

    getOperationDefinitions(){

        return [

            {
                operation:
                    "archive",

                words:[
                    "arsivle",
                    "arsive al"
                ]
            },

            {
                operation:
                    "restore",

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
                operation:
                    "delete",

                words:[
                    "kalici sil",
                    "tamamen sil",
                    "yok et",
                    "sil"
                ]
            },

            {
                operation:
                    "remove",

                words:[
                    "uygulamayi kaldir",
                    "uninstall",
                    "kaldir"
                ]
            },

            {
                operation:
                    "install",

                words:[
                    "uygulamayi kur",
                    "install",
                    "yukle"
                ]
            },

            {
                operation:
                    "save",

                words:[
                    "kaldigimiz yeri kaydet",
                    "burada kaldik",
                    "burda kaldik",
                    "devam noktasi",
                    "bunu hatirla",
                    "kaydet"
                ]
            },

            {
                operation:
                    "create",

                words:[
                    "olustur",
                    "yarat",
                    "ekle",
                    "yeni",
                    "baslat"
                ]
            },

            {
                operation:
                    "update",

                words:[
                    "guncelle",
                    "update"
                ]
            },

            {
                operation:
                    "edit",

                words:[
                    "duzenle",
                    "degistir",
                    "yenile",
                    "duzelt"
                ]
            },

            {
                operation:
                    "search",

                words:[
                    "goster bana",
                    "hangileri",
                    "listele",
                    "ara",
                    "bul"
                ]
            },

            {
                operation:
                    "open",

                words:[
                    "acabilir misin",
                    "acar misin",
                    "acmani istiyorum",
                    "gosterir misin",
                    "beni gotur",
                    "buraya git",
                    "goruntule",
                    "goster",
                    "ac",
                    "git",
                    "gec"
                ]
            },

            {
                operation:
                    "send",

                words:[
                    "mesaj at",
                    "gonder",
                    "yolla"
                ]
            },

            {
                operation:
                    "grant",

                words:[
                    "permission ver",
                    "yetki ver",
                    "izin ver"
                ]
            },

            {
                operation:
                    "revoke",

                words:[
                    "permission kaldir",
                    "yetkiyi kaldir",
                    "izni geri al",
                    "izni kaldir"
                ]
            },

            {
                operation:
                    "explain",

                words:[
                    "ne ise yarar",
                    "bilgi ver",
                    "ne demek",
                    "hakkinda",
                    "acikla",
                    "anlat",
                    "nedir"
                ]
            }

        ];

    },


    /* =====================================================
       OPERATION DETECTION
    ===================================================== */

    detectOperation(text){

        const definitions =
            this.getOperationDefinitions();


        for(
            const definition of
                definitions
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


        if(!normalized){

            return false;

        }


        return (
            normalized.startsWith(
                "ne "
            ) ||
            normalized ===
                "ne" ||
            normalized.startsWith(
                "nasil "
            ) ||
            normalized.startsWith(
                "neden "
            ) ||
            normalized.startsWith(
                "niye "
            ) ||
            normalized.startsWith(
                "hangi "
            ) ||
            normalized.startsWith(
                "kim "
            ) ||
            normalized.startsWith(
                "nerede "
            ) ||
            normalized.startsWith(
                "ne zaman "
            ) ||
            normalized.includes(
                "bilir miyim"
            ) ||
            normalized.includes(
                "bilir misin"
            ) ||
            normalized.includes(
                "mumkun mu"
            ) ||
            normalized.includes(
                "var mi"
            ) ||
            normalized.includes(
                "olur mu"
            )
        );

    },


    /* =====================================================
       CONTEXT TARGET
    ===================================================== */

    getContextTarget(context = {}){

        if(
            !context ||
            typeof context !==
                "object" ||
            Array.isArray(
                context
            )
        ){

            return null;

        }


        const candidates = [

            context.page,
            context.app,
            context.screen

        ]
            .filter(
                Boolean
            )
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
       REGISTRY ACCESS
    ===================================================== */

    getRegistry(){

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.get ===
                    "function"
            ){

                return (
                    VAERO.get(
                        "appRegistry"
                    ) ||
                    null
                );

            }

        } catch(error){

            /* unavailable */

        }


        return null;

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
            typeof direct ===
                "string" &&
            direct.trim()
        ){

            return direct
                .trim()
                .slice(
                    0,
                    240
                );

        }


        const registry =
            this.getRegistry();


        if(
            !registry ||
            typeof registry.all !==
                "function"
        ){

            return null;

        }


        let apps =
            [];


        try{

            apps =
                registry.all({
                    includeDisabled:
                        true
                });

        } catch(error){

            try{

                apps =
                    registry.all();

            } catch(secondError){

                apps =
                    [];

            }

        }


        if(
            !Array.isArray(
                apps
            )
        ){

            return null;

        }


        const normalizedText =
            this.normalize(
                text
            );


        const tokens =
            this.tokenize(
                normalizedText
            );


        const matches =
            apps
                .map(
                    app => {

                        if(
                            !app ||
                            !app.id
                        ){

                            return null;

                        }


                        const candidates = [

                            app.id,
                            app.title,
                            app.name

                        ]
                            .filter(
                                Boolean
                            )
                            .map(
                                value =>
                                    this.normalize(
                                        value
                                    )
                            )
                            .filter(
                                Boolean
                            );


                        const matched =
                            candidates.find(
                                candidate => {

                                    if(
                                        candidate.includes(
                                            " "
                                        )
                                    ){

                                        return (
                                            ` ${normalizedText} `
                                                .includes(
                                                    ` ${candidate} `
                                                )
                                        );

                                    }


                                    return tokens.includes(
                                        candidate
                                    );

                                }
                            );


                        if(!matched){

                            return null;

                        }


                        return {

                            id:
                                String(
                                    app.id
                                )
                                    .trim()
                                    .slice(
                                        0,
                                        240
                                    ),

                            score:
                                matched.length

                        };

                    }
                )
                .filter(
                    Boolean
                )
                .sort(
                    (
                        a,
                        b
                    ) =>
                        b.score -
                        a.score
                );


        return (
            matches[
                0
            ]?.id ||
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

            return context.permission
                .trim()
                .slice(
                    0,
                    240
                );

        }


        const raw =
            String(
                text ??
                    ""
            );


        /*
         * Preserve explicit permission identifiers such as:
         * memory.read
         * profile.write
         */

        const match =
            raw.match(
                /\b[a-z0-9_-]+\.[a-z0-9_.:-]+\b/i
            );


        if(match?.[0]){

            return match[
                0
            ].slice(
                0,
                240
            );

        }


        const normalizedText =
            this.normalize(
                text
            );


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
                permission => {

                    const normalizedPermission =
                        this.normalize(
                            permission
                        );


                    return (
                        normalizedText ===
                            normalizedPermission ||
                        ` ${normalizedText} `
                            .includes(
                                ` ${normalizedPermission} `
                            )
                    );

                }
            ) ||
            null
        );

    },


    /* =====================================================
       BASE RESULT
    ===================================================== */

    buildResult(
        data = {}
    ){

        return {

            type:
                data.type ||
                "chat",

            target:
                data.target ??
                null,

            operation:
                data.operation ??
                "general",

            confidence:
                Math.max(
                    0,
                    Math.min(
                        1,
                        Number(
                            data.confidence
                        ) ||
                        0
                    )
                ),

            explicit:
                data.explicit ===
                    true,

            raw:
                data.raw ||
                "",

            normalizedText:
                data.normalizedText ||
                "",

            detectedTarget:
                data.detectedTarget ??
                null,

            contextTarget:
                data.contextTarget ??
                null,

            contextual:
                data.contextual ===
                    true,

            ...data

        };

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
                message ??
                    ""
            ).trim();


        const text =
            this.normalize(
                raw
            );


        if(!text){

            return this.buildResult({

                type:
                    "empty",

                target:
                    null,

                operation:
                    null,

                confidence:
                    1,

                explicit:
                    false,

                raw,

                normalizedText:
                    ""

            });

        }


        const targetMatch =
            this.detectTarget(
                text
            );


        const detectedTarget =
            targetMatch
                ?.target ||
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
            words.length <=
                3 &&
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

            return this.buildResult({

                type:
                    "clarify",

                target:
                    contextTarget,

                operation:
                    "clarify",

                confidence:
                    0.94,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                contextTarget

            });

        }


        /* =================================================
           RESUME SAVE
        ================================================= */

        if(
            operation ===
                "save" &&
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

            return this.buildResult({

                type:
                    "resume:save",

                target:
                    target ||
                    contextTarget ||
                    null,

                operation:
                    "save",

                confidence:
                    0.98,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            });

        }


        /* =================================================
           RESUME RESTORE
        ================================================= */

        if(
            operation ===
                "restore" &&
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

            return this.buildResult({

                type:
                    "resume:restore",

                target:
                    target ||
                    null,

                operation:
                    "restore",

                confidence:
                    0.98,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            });

        }


        /* =================================================
           APPLICATION CONTEXT
        ================================================= */

        const applicationContext =
            target ===
                "applications" ||
            contextTarget ===
                "applications" ||
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
            [
                "install",
                "update",
                "remove"
            ].includes(
                operation
            )
        ){

            const appId =
                this.extractApplicationId(
                    raw,
                    context
                );


            return this.buildResult({

                type:
                    `application:${operation}`,

                target:
                    "application",

                operation,

                appId,

                applicationId:
                    appId,

                confidence:
                    appId
                        ? 0.98
                        : 0.82,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            });

        }


        /* =================================================
           PERMISSIONS
        ================================================= */

        if(
            operation ===
                "grant" ||
            operation ===
                "revoke"
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


            return this.buildResult({

                type:
                    operation ===
                        "grant"
                        ? "permission:grant"
                        : "permission:revoke",

                target:
                    "application",

                operation,

                appId,

                applicationId:
                    appId,

                permission,

                confidence:
                    appId &&
                    permission
                        ? 0.98
                        : 0.76,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            });

        }


        /* =================================================
           COMMUNICATION
        ================================================= */

        if(
            target ===
                "message" &&
            operation ===
                "send"
        ){

            return this.buildResult({

                type:
                    "message:send",

                target:
                    "message",

                operation:
                    "send",

                confidence:
                    0.96,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            });

        }


        if(
            target ===
                "call" &&
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

            return this.buildResult({

                type:
                    "call:start",

                target:
                    "call",

                operation:
                    "start",

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

                confidence:
                    0.96,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            });

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

            return this.buildResult({

                type:
                    "screen-share:start",

                target:
                    "call",

                operation:
                    "start",

                confidence:
                    0.98,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            });

        }


        /* =================================================
           CREATE WORLD
        ================================================= */

        if(
            operation ===
                "create" &&
            (
                target ===
                    "world" ||
                target ===
                    "worlds" ||
                target ===
                    "create" ||
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

            return this.buildResult({

                type:
                    "create",

                target:
                    "world",

                operation:
                    "create",

                confidence:
                    0.97,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            });

        }


        /* =================================================
           CREATE ENTITY
        ================================================= */

        if(
            operation ===
                "create" &&
            (
                target ===
                    "entity" ||
                target ===
                    "entities" ||
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

            return this.buildResult({

                type:
                    "create",

                target:
                    "entity",

                operation:
                    "create",

                confidence:
                    0.97,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            });

        }


        /* =================================================
           MUTATION REQUESTS
        ================================================= */

        if(
            [
                "archive",
                "restore",
                "delete",
                "remove"
            ].includes(
                operation
            ) &&
            target
        ){

            return this.buildResult({

                type:
                    "request",

                target,

                operation,

                confidence:
                    operation ===
                        "delete"
                        ? 0.95
                        : 0.94,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            });

        }


        /* =================================================
           NAVIGATION
        ================================================= */

        if(
            operation ===
                "open" &&
            target
        ){

            return this.buildResult({

                type:
                    "navigate",

                target,

                operation:
                    "open",

                confidence:
                    detectedTarget
                        ? 0.97
                        : 0.88,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget,

                contextual:
                    !detectedTarget &&
                    Boolean(
                        contextTarget
                    )

            });

        }


        /* =================================================
           QUESTION
        ================================================= */

        if(question){

            return this.buildResult({

                type:
                    "question",

                target,

                operation:
                    operation ===
                        "general"
                        ? "explain"
                        : operation,

                confidence:
                    target
                        ? 0.9
                        : 0.64,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            });

        }


        /* =================================================
           DIRECT REQUEST
        ================================================= */

        if(
            operation !==
                "general"
        ){

            return this.buildResult({

                type:
                    "request",

                target:
                    target ||
                    contextTarget ||
                    null,

                operation,

                confidence:
                    target
                        ? 0.88
                        : contextTarget
                            ? 0.72
                            : 0.54,

                explicit:
                    true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget,

                contextual:
                    !detectedTarget &&
                    Boolean(
                        contextTarget
                    )

            });

        }


        /* =================================================
           CHAT
        ================================================= */

        return this.buildResult({

            type:
                "chat",

            target:
                detectedTarget ||
                null,

            detectedTarget,

            contextTarget,

            operation:
                "general",

            confidence:
                detectedTarget
                    ? 0.62
                    : 0.38,

            explicit:
                false,

            raw,

            normalizedText:
                text

        });

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        return {

            version:
                this.version,

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


/* =========================================================
   REGISTER
========================================================= */

try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.register ===
            "function"
    ){

        VAERO.register(
            "brainIntent",
            BrainIntent
        );

    }

} catch(error){

    console.error(
        "BrainIntent register edilemedi:",
        error
    );

}


/* =========================================================
   GLOBAL
========================================================= */

if(
    typeof window !==
        "undefined"
){

    window.BrainIntent =
        BrainIntent;

}
