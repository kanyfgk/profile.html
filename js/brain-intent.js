const BrainIntent = {

    normalize(message){

        return String(message || "")
            .toLocaleLowerCase("tr-TR")
            .trim()
            .replaceAll("ı", "i")
            .replaceAll("ğ", "g")
            .replaceAll("ü", "u")
            .replaceAll("ş", "s")
            .replaceAll("ö", "o")
            .replaceAll("ç", "c")
            .replace(
                /[?.!,;:()[\]{}"'`]/g,
                " "
            )
            .replace(
                /[-_/\\]/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    },

    tokenize(text){

        return this
            .normalize(text)
            .split(" ")
            .filter(Boolean);

    },

    phraseMatches(
        text,
        phrase
    ){

        const normalizedText =
            this.normalize(text);

        const normalizedPhrase =
            this.normalize(phrase);

        if(
            !normalizedText ||
            !normalizedPhrase
        ){
            return false;
        }

        if(
            normalizedPhrase.includes(" ")
        ){

            return (
                ` ${normalizedText} `
            ).includes(
                ` ${normalizedPhrase} `
            );

        }

        return this
            .tokenize(normalizedText)
            .includes(
                normalizedPhrase
            );

    },

    includesPhrase(
        text,
        phrases
    ){

        return phrases.some(
            phrase =>
                this.phraseMatches(
                    text,
                    phrase
                )
        );

    },

    getTargetDefinitions(){

        return [

            {
                target: "home",

                names: [
                    "ana ekran",
                    "ana sayfa",
                    "baslangic",
                    "home",
                    "ev"
                ]
            },

            {
                target: "worlds",

                names: [
                    "dunyalar",
                    "dunyalarim",
                    "dunyalarimi",
                    "dunya listesi",
                    "worlds"
                ]
            },

            {
                target: "world",

                names: [
                    "aktif dunya",
                    "dunyam",
                    "dunyami",
                    "dunyaya",
                    "dunyama",
                    "dunya",
                    "world"
                ]
            },

            {
                target: "create",

                names: [
                    "olusturma ekrani",
                    "yarat ekrani",
                    "yarat"
                ]
            },

            {
                target: "entities",

                names: [
                    "varliklar",
                    "varliklarim",
                    "varliklarimi",
                    "varligim",
                    "varligimi",
                    "varlik",
                    "entities",
                    "entity"
                ]
            },

            {
                target: "identity",

                names: [
                    "kimligim",
                    "kimligimi",
                    "kimligime",
                    "kimlik",
                    "identity",
                    "id"
                ]
            },

            {
                target: "profile",

                names: [
                    "profilim",
                    "profilimi",
                    "profilime",
                    "profilimde",
                    "profil",
                    "profile"
                ]
            },

            {
                target: "discovery",

                names: [
                    "discovery journey",
                    "kesif yolculugu",
                    "discovery",
                    "kesif"
                ]
            },

            {
                target: "memory",

                names: [
                    "hafizam",
                    "hafizami",
                    "hafizama",
                    "hafizaya",
                    "hafiza",
                    "memory"
                ]
            },

            {
                target: "timeline",

                names: [
                    "zaman cizelgem",
                    "zaman cizelgemi",
                    "zaman cizelgesi",
                    "zaman akisi",
                    "gecmis olaylar",
                    "timeline"
                ]
            },

            {
                target: "bridge",

                names: [
                    "baglantilarim",
                    "baglantilarimi",
                    "baglantilar",
                    "baglanti",
                    "kopruler",
                    "koprum",
                    "kopru",
                    "bridge"
                ]
            },

            {
                target: "evolution",

                names: [
                    "gelisim olaylari",
                    "yasam olaylari",
                    "gelisimim",
                    "gelisim",
                    "evrimim",
                    "evrim",
                    "evolution"
                ]
            },

            {
                target: "organs",

                names: [
                    "organlarim",
                    "organlarimi",
                    "organlar",
                    "organ"
                ]
            },

            {
                target: "settings",

                names: [
                    "ayarlarim",
                    "ayarlarimi",
                    "ayarlar",
                    "ayar",
                    "settings"
                ]
            },

            {
                target: "brain",

                names: [
                    "brain durumu",
                    "sistem durumu",
                    "brain",
                    "beyin"
                ]
            }

        ];

    },

    detectSemanticTarget(text){

        /*
         * Bazı doğal cümlelerde tekil kelime
         * yanlış hedef üretebilir.
         *
         * Örnek:
         * "Kaç dünyam var?"
         *
         * Buradaki amaç aktif dünyayı değil,
         * dünya koleksiyonunu sormaktır.
         */

        const rules = [

            {
                target: "worlds",

                phrases: [
                    "kac dunyam var",
                    "kac dunya var",
                    "dunya sayisi",
                    "dunyalarin sayisi",
                    "dunyalarimin sayisi"
                ]
            },

            {
                target: "entities",

                phrases: [
                    "kac varligim var",
                    "kac varlik var",
                    "varlik sayisi",
                    "varliklarin sayisi",
                    "varliklarimin sayisi"
                ]
            },

            {
                target: "brain",

                phrases: [
                    "sistem durumu",
                    "brain durumu",
                    "brain status"
                ]
            }

        ];

        const match =
            rules.find(
                rule =>
                    this.includesPhrase(
                        text,
                        rule.phrases
                    )
            );

        if(!match){
            return null;
        }

        return {
            target:
                match.target,

            phrase:
                "semantic",

            length:
                Number.MAX_SAFE_INTEGER,

            semantic:
                true
        };

    },

    detectTarget(text){

        const semanticMatch =
            this.detectSemanticTarget(
                text
            );

        if(semanticMatch){
            return semanticMatch;
        }

        const definitions =
            this.getTargetDefinitions();

        const matches = [];

        definitions.forEach(
            definition => {

                definition.names.forEach(
                    name => {

                        const normalizedName =
                            this.normalize(
                                name
                            );

                        if(
                            normalizedName &&
                            this.phraseMatches(
                                text,
                                normalizedName
                            )
                        ){

                            matches.push({

                                target:
                                    definition.target,

                                phrase:
                                    normalizedName,

                                length:
                                    normalizedName
                                        .length,

                                semantic:
                                    false

                            });

                        }

                    }
                );

            }
        );

        /*
         * En uzun eşleşme kazanır.
         *
         * Örnek:
         * "ana ekran" ifadesi yalnızca
         * "ekran" gibi daha genel bir
         * eşleşmeye yenilmez.
         */

        matches.sort(
            (a, b) =>
                b.length -
                a.length
        );

        return (
            matches[0] ||
            null
        );

    },

    getOperationDefinitions(){

        return [

            {
                operation:
                    "delete",

                words: [
                    "sil",
                    "siler misin",
                    "silebilir misin",
                    "kaldir",
                    "kaldirir misin",
                    "kaldirabilir misin",
                    "yok et",
                    "temizle"
                ]
            },

            {
                operation:
                    "restore",

                words: [
                    "geri getir",
                    "geri yukle",
                    "kurtar",
                    "kaldigim yere don",
                    "kaldigimiz yere don",
                    "nerede kalmistik",
                    "kaldigimiz yer",
                    "devam et"
                ]
            },

            {
                operation:
                    "save",

                words: [
                    "kaydet",
                    "kaydeder misin",
                    "kaydedebilir misin",
                    "burada kaldik",
                    "burda kaldik",
                    "kaldigimiz yeri kaydet",
                    "devam noktasi"
                ]
            },

            {
                operation:
                    "create",

                words: [
                    "olustur",
                    "olusturur musun",
                    "olusturabilir misin",
                    "olusturmak istiyorum",
                    "yarat",
                    "yaratir misin",
                    "yaratabilir misin",
                    "ekle",
                    "ekler misin",
                    "ekleyebilir misin",
                    "baslat",
                    "baslatir misin"
                ]
            },

            {
                operation:
                    "edit",

                words: [
                    "duzenle",
                    "duzenler misin",
                    "duzenleyebilir misin",
                    "duzenlemek istiyorum",
                    "degistir",
                    "degistirir misin",
                    "degistirebilir misin",
                    "degistirmek istiyorum",
                    "guncelle",
                    "gunceller misin",
                    "guncelleyebilir misin",
                    "yenile"
                ]
            },

            {
                operation:
                    "search",

                words: [
                    "ara",
                    "arar misin",
                    "arayabilir misin",
                    "bul",
                    "bulur musun",
                    "bulabilir misin",
                    "listele",
                    "listeler misin",
                    "nerede"
                ]
            },

            {
                operation:
                    "open",

                words: [
                    "ac",
                    "acar misin",
                    "acabilir misin",
                    "acmani istiyorum",
                    "acmak istiyorum",
                    "goster",
                    "gosterir misin",
                    "gosterebilir misin",
                    "gormek istiyorum",
                    "goruntule",
                    "goruntuler misin",
                    "goruntulemek istiyorum",
                    "git",
                    "gitmek istiyorum",
                    "gec",
                    "gecer misin",
                    "beni gotur",
                    "goturur musun",
                    "goturebilir misin",
                    "don"
                ]
            },

            {
                operation:
                    "explain",

                words: [
                    "nedir",
                    "ne ise yarar",
                    "ne yapiyor",
                    "anlat",
                    "anlatir misin",
                    "acikla",
                    "aciklar misin",
                    "bilgi ver",
                    "hakkinda"
                ]
            }

        ];

    },

    detectOperation(text){

        const definitions =
            this.getOperationDefinitions();

        const match =
            definitions.find(
                definition =>
                    this.includesPhrase(
                        text,
                        definition.words
                    )
            );

        return (
            match?.operation ||
            "general"
        );

    },

    detectImplicitCreate(
        text,
        target
    ){

        /*
         * "Yeni" tek başına oluşturma
         * komutu değildir.
         *
         * "Yeni bir gün oldu"
         * create tetiklememelidir.
         *
         * Ancak:
         * "yeni dünya"
         * "yeni varlık"
         *
         * desteklenen oluşturma hedefleridir.
         */

        if(
            !this.includesPhrase(
                text,
                ["yeni"]
            )
        ){
            return false;
        }

        return (
            target === "world" ||
            target === "worlds" ||
            target === "entities"
        );

    },

    isClarification(text){

        const normalized =
            this.normalize(text);

        const exact = [
            "ne",
            "anlamadim",
            "nasil yani",
            "ne demek",
            "bu ne demek",
            "anlamadim ne demek"
        ];

        if(
            exact.includes(
                normalized
            )
        ){
            return true;
        }

        return (
            normalized.startsWith(
                "anlamadim "
            ) &&
            this.tokenize(
                normalized
            ).length <= 4
        );

    },

    isResumeSave(text){

        return this.includesPhrase(
            text,
            [
                "burada kaldik",
                "burda kaldik",
                "kaldigimiz yeri kaydet",
                "devam noktasi",
                "bunu kaydet",
                "burayi kaydet"
            ]
        );

    },

    isResumeRestore(text){

        return this.includesPhrase(
            text,
            [
                "nerede kalmistik",
                "kaldigim yere don",
                "kaldigimiz yere don",
                "kaldigimiz yer",
                "devam et"
            ]
        );

    },

    isUserCapabilityQuestion(text){

        /*
         * Kullanıcının kendisi için izin /
         * olasılık sorduğu cümleler işlem
         * çalıştırmaz.
         *
         * "Profilimi açabilir miyim?"
         * -> soru
         *
         * "Profilimi açabilir misin?"
         * -> Brain'e verilen komut
         */

        return this.includesPhrase(
            text,
            [
                "bilir miyim",
                "abilir miyim",
                "ebilir miyim",
                "miyim",
                "miyiz",
                "mumkun mu"
            ]
        );

    },

    isAssistantDirectedQuestion(text){

        /*
         * Soru biçiminde yazılmış olsa bile
         * Brain'den eylem isteyen doğal
         * komutlar.
         *
         * "Açar mısın?"
         * "Oluşturabilir misin?"
         */

        return this.includesPhrase(
            text,
            [
                "misin",
                "misiniz",
                "musun",
                "musunuz"
            ]
        );

    },

    isQuestion(text){

        const normalized =
            this.normalize(text);

        return (

            normalized.startsWith(
                "ne "
            ) ||

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
                "kac "
            ) ||

            normalized.startsWith(
                "nerede "
            ) ||

            normalized.includes(
                " nedir"
            ) ||

            normalized.endsWith(
                "nedir"
            ) ||

            normalized.includes(
                "ne ise yarar"
            ) ||

            normalized.includes(
                "bilir miyim"
            ) ||

            normalized.includes(
                "mumkun mu"
            ) ||

            normalized.includes(
                "var mi"
            ) ||

            normalized.includes(
                "yok mu"
            )

        );

    },

    createResult({
        type,
        target = null,
        detectedTarget = null,
        operation = "general",
        confidence = .35,
        explicit = false,
        raw,
        normalizedText
    }){

        const result = {

            type,
            target,
            operation,
            confidence,
            explicit,
            raw,
            normalizedText

        };

        if(detectedTarget){

            result.detectedTarget =
                detectedTarget;

        }

        return result;

    },

    detect(message){

        const raw =
            String(
                message || ""
            ).trim();

        const text =
            this.normalize(
                raw
            );

        if(!text){

            return {

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

                raw

            };

        }

        /*
         * 1.
         * Açıklama / anlamama mesajları.
         */

        if(
            this.isClarification(
                text
            )
        ){

            return this.createResult({

                type:
                    "clarify",

                operation:
                    "clarify",

                confidence:
                    .96,

                explicit:
                    true,

                raw,

                normalizedText:
                    text

            });

        }

        /*
         * 2.
         * Hedef ve operasyon tespiti.
         */

        const targetMatch =
            this.detectTarget(
                text
            );

        const target =
            targetMatch?.target ||
            null;

        let operation =
            this.detectOperation(
                text
            );

        /*
         * "yeni dünya"
         * "yeni varlık"
         *
         * fiil yazılmasa bile anlam
         * yeterince açıksa create.
         */

        if(
            operation ===
                "general" &&
            this.detectImplicitCreate(
                text,
                target
            )
        ){

            operation =
                "create";

        }

        /*
         * 3.
         * Resume komutları diğer bütün
         * aksiyonlardan önce çözülür.
         */

        if(
            operation === "save" &&
            this.isResumeSave(
                text
            )
        ){

            return this.createResult({

                type:
                    "resume:save",

                target:
                    target || null,

                operation:
                    "save",

                confidence:
                    .99,

                explicit:
                    true,

                raw,

                normalizedText:
                    text

            });

        }

        if(
            operation ===
                "restore" &&
            this.isResumeRestore(
                text
            )
        ){

            return this.createResult({

                type:
                    "resume:restore",

                operation:
                    "restore",

                confidence:
                    .99,

                explicit:
                    true,

                raw,

                normalizedText:
                    text

            });

        }

        /*
         * 4.
         * Kullanıcının kendisinin bir şeyi
         * yapıp yapamayacağını sorduğu
         * cümleler ASLA otomatik işlem
         * çalıştırmaz.
         */

        if(
            this.isUserCapabilityQuestion(
                text
            )
        ){

            return this.createResult({

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
                        ? .92
                        : .66,

                explicit:
                    true,

                raw,

                normalizedText:
                    text

            });

        }

        const question =
            this.isQuestion(
                text
            );

        const assistantDirected =
            this.isAssistantDirectedQuestion(
                text
            );

        /*
         * 5.
         * Normal bilgi sorusu.
         *
         * Ancak:
         * "Profilimi açabilir misin?"
         *
         * teknik olarak soru formunda olsa
         * da Brain'e yöneltilmiş açık bir
         * aksiyon talebidir.
         */

        if(
            question &&
            !assistantDirected
        ){

            return this.createResult({

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
                        ? .9
                        : .62,

                explicit:
                    true,

                raw,

                normalizedText:
                    text

            });

        }

        /*
         * 6.
         * Dünya oluşturma.
         */

        if(
            operation ===
                "create" &&
            (
                target ===
                    "world" ||
                target ===
                    "worlds" ||
                target ===
                    "create"
            )
        ){

            return this.createResult({

                type:
                    "create",

                target:
                    "world",

                operation:
                    "create",

                confidence:
                    .98,

                explicit:
                    true,

                raw,

                normalizedText:
                    text

            });

        }

        /*
         * 7.
         * Varlık oluşturma.
         */

        if(
            operation ===
                "create" &&
            target ===
                "entities"
        ){

            return this.createResult({

                type:
                    "create",

                target:
                    "entity",

                operation:
                    "create",

                confidence:
                    .97,

                explicit:
                    true,

                raw,

                normalizedText:
                    text

            });

        }

        /*
         * 8.
         * Açık navigasyon.
         */

        if(
            operation ===
                "open" &&
            target
        ){

            return this.createResult({

                type:
                    "navigate",

                target,

                operation:
                    "open",

                confidence:
                    .98,

                explicit:
                    true,

                raw,

                normalizedText:
                    text

            });

        }

        /*
         * 9.
         * Brain sistem durumu gibi
         * salt-okuma durum sorguları.
         */

        if(
            target === "brain" &&
            this.includesPhrase(
                text,
                [
                    "sistem durumu",
                    "brain durumu",
                    "brain status"
                ]
            )
        ){

            return this.createResult({

                type:
                    "question",

                target:
                    "brain",

                operation:
                    "status",

                confidence:
                    .98,

                explicit:
                    true,

                raw,

                normalizedText:
                    text

            });

        }

        /*
         * 10.
         * Açıklama isteyen hedefli mesaj.
         *
         * "Profil hakkında bilgi ver"
         * "Hafızayı anlat"
         */

        if(
            operation ===
                "explain" &&
            target
        ){

            return this.createResult({

                type:
                    "question",

                target,

                operation:
                    "explain",

                confidence:
                    .9,

                explicit:
                    true,

                raw,

                normalizedText:
                    text

            });

        }

        /*
         * 11.
         * Düzenle / sil / ara / geri getir
         * gibi hedefli işlemler.
         *
         * Bunların uygulanıp uygulanmayacağı
         * BrainIntent'ın işi değildir.
         *
         * BrainCore ->
         * BrainActionPolicy ->
         * BrainActions
         *
         * zinciri karar verir.
         */

        if(
            operation !==
                "general" &&
            target
        ){

            return this.createResult({

                type:
                    "request",

                target,

                operation,

                confidence:
                    .87,

                explicit:
                    true,

                raw,

                normalizedText:
                    text

            });

        }

        /*
         * 12.
         * Kullanıcı yalnızca Engine alanının
         * adını konuşmada kullandıysa ekran
         * açılmaz.
         *
         * Örnek:
         * "Profil konusu önemli."
         *
         * detectedTarget Brain'e konuşma
         * bağlamı sağlar fakat sistem
         * aksiyonu üretmez.
         */

        return this.createResult({

            type:
                "chat",

            target:
                null,

            detectedTarget:
                target,

            operation:
                "general",

            confidence:
                target
                    ? .65
                    : .35,

            explicit:
                false,

            raw,

            normalizedText:
                text

        });

    }

};

VAERO.register(
    "brainIntent",
    BrainIntent
);
