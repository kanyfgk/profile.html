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
                    "yeni dunya",
                    "yarat"
                ]
            },

            {
                target:"entities",
                names:[
                    "varliklar",
                    "varliklarim",
                    "entity",
                    "entities"
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
            (a, b) => {

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
                operation:"delete",
                words:[
                    "sil",
                    "kaldir",
                    "yok et",
                    "temizle",
                    "iptal et"
                ]
            },

            {
                operation:"restore",
                words:[
                    "geri getir",
                    "geri yukle",
                    "kurtar",
                    "kaldigim yere don",
                    "kaldigimiz yere don",
                    "nerede kalmistik",
                    "devam et",
                    "devam edelim"
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
                    "baslat",
                    "kur"
                ]
            },

            {
                operation:"edit",
                words:[
                    "duzenle",
                    "degistir",
                    "guncelle",
                    "yenile",
                    "duzelt"
                ]
            },

            {
                operation:"search",
                words:[
                    "ara",
                    "bul",
                    "nerede",
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
                    "don",
                    "buraya git"
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
                "object"
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
                "mevcut sayfa"
            ]
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

                normalizedText:
                    text,

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

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            };

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

            return {

                type:"resume:restore",

                target:
                    target ||
                    null,

                operation:"restore",

                confidence:.98,

                explicit:true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            };

        }


        /* =================================================
           CREATE WORLD
        ================================================= */

        if(
            operation ===
                "create" &&
            (
                target === "world" ||
                target === "worlds" ||
                target === "create"
            )
        ){

            return {

                type:"create",

                target:"world",

                operation:"create",

                confidence:.97,

                explicit:true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            };

        }


        /* =================================================
           CREATE ENTITY
        ================================================= */

        if(
            operation ===
                "create" &&
            (
                target ===
                    "entities" ||
                this.includesPhrase(
                    text,
                    [
                        "varlik olustur",
                        "yeni varlik",
                        "varlik ekle"
                    ]
                )
            )
        ){

            return {

                type:"create",

                target:"entity",

                operation:"create",

                confidence:.96,

                explicit:true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            };

        }


        /* =================================================
           NAVIGATION
        ================================================= */

        if(
            operation ===
                "open" &&
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

                normalizedText:
                    text,

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
                    operation ===
                        "general"
                        ? "explain"
                        : operation,

                confidence:
                    target
                        ? .9
                        : .64,

                explicit:true,

                raw,

                normalizedText:
                    text,

                detectedTarget,

                contextTarget

            };

        }


        /* =================================================
           DIRECT REQUEST
        ================================================= */

        if(
            operation !==
                "general"
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

                normalizedText:
                    text,

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

            target:null,

            detectedTarget,

            contextTarget,

            operation:"general",

            confidence:
                detectedTarget
                    ? .62
                    : .38,

            explicit:false,

            raw,

            normalizedText:
                text

        };

    }

};


VAERO.register(
    "brainIntent",
    BrainIntent
);


window.BrainIntent =
    BrainIntent;
