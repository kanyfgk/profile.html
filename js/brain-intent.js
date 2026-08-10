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
            .replace(/[?.!,;:]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    },

    includesPhrase(text, phrases){

        return phrases.some(phrase => {

            const normalizedPhrase =
                this.normalize(phrase);

            if(!normalizedPhrase){
                return false;
            }

            if(normalizedPhrase.includes(" ")){
                return text.includes(
                    normalizedPhrase
                );
            }

            return text
                .split(" ")
                .includes(
                    normalizedPhrase
                );

        });

    },

    getTargetDefinitions(){

        return [
            {
                target: "home",
                names: [
                    "ana ekran",
                    "ana sayfa",
                    "ev",
                    "home",
                    "baslangic"
                ]
            },
            {
                target: "worlds",
                names: [
                    "dunyalar",
                    "dunyalarim",
                    "dunya listesi",
                    "worlds"
                ]
            },
            {
                target: "world",
                names: [
                    "dunya",
                    "aktif dunya",
                    "world"
                ]
            },
            {
                target: "create",
                names: [
                    "yarat",
                    "olusturma ekrani",
                    "yeni dunya"
                ]
            },
            {
                target: "entities",
                names: [
                    "varliklar",
                    "varliklarim",
                    "entity",
                    "entities"
                ]
            },
            {
                target: "identity",
                names: [
                    "kimlik",
                    "kimligim",
                    "identity",
                    "id"
                ]
            },
            {
                target: "profile",
                names: [
                    "profil",
                    "profilim",
                    "profile"
                ]
            },
            {
                target: "discovery",
                names: [
                    "discovery",
                    "kesif",
                    "kesif yolculugu"
                ]
            },
            {
                target: "memory",
                names: [
                    "hafiza",
                    "hafizam",
                    "memory"
                ]
            },
            {
                target: "timeline",
                names: [
                    "timeline",
                    "zaman cizelgesi",
                    "zaman akisi",
                    "gecmis olaylar"
                ]
            },
            {
                target: "bridge",
                names: [
                    "bridge",
                    "baglanti",
                    "baglantilar",
                    "kopru"
                ]
            },
            {
                target: "evolution",
                names: [
                    "evolution",
                    "evrim",
                    "gelisim olaylari",
                    "yasam olaylari"
                ]
            },
            {
                target: "organs",
                names: [
                    "organ",
                    "organlar",
                    "uygulamalar"
                ]
            },
            {
                target: "settings",
                names: [
                    "ayar",
                    "ayarlar",
                    "settings"
                ]
            },
            {
                target: "brain",
                names: [
                    "brain",
                    "beyin"
                ]
            }
        ];

    },

    detectTarget(text){

        const definitions =
            this.getTargetDefinitions();

        /*
         * Daha uzun ifadeler önce aranır.
         * Böylece “yeni dünya”, yalnızca “dünya”
         * hedefi olarak algılanmaz.
         */
        const matches = [];

        definitions.forEach(definition => {

            definition.names.forEach(name => {

                const normalizedName =
                    this.normalize(name);

                if(
                    normalizedName &&
                    text.includes(normalizedName)
                ){
                    matches.push({
                        target:
                            definition.target,

                        phrase:
                            normalizedName,

                        length:
                            normalizedName.length
                    });
                }

            });

        });

        matches.sort(
            (a, b) =>
                b.length - a.length
        );

        return matches[0] || null;

    },

    detectOperation(text){

        const operationDefinitions = [
            {
                operation: "delete",
                words: [
                    "sil",
                    "kaldir",
                    "yok et",
                    "temizle"
                ]
            },
            {
                operation: "restore",
                words: [
                    "geri getir",
                    "geri yukle",
                    "kurtar",
                    "kaldigim yere don",
                    "nerede kalmistik",
                    "devam et"
                ]
            },
            {
                operation: "save",
                words: [
                    "kaydet",
                    "burada kaldik",
                    "burda kaldik",
                    "kaldigimiz yeri kaydet",
                    "devam noktasi"
                ]
            },
            {
                operation: "create",
                words: [
                    "olustur",
                    "yarat",
                    "ekle",
                    "yeni",
                    "baslat"
                ]
            },
            {
                operation: "edit",
                words: [
                    "duzenle",
                    "degistir",
                    "guncelle",
                    "yenile"
                ]
            },
            {
                operation: "search",
                words: [
                    "ara",
                    "bul",
                    "nerede",
                    "listele"
                ]
            },
            {
                operation: "open",
                words: [
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
                    "don"
                ]
            },
            {
                operation: "explain",
                words: [
                    "nedir",
                    "ne ise yarar",
                    "anlat",
                    "acikla",
                    "bilgi ver",
                    "hakkinda"
                ]
            }
        ];

        return (
            operationDefinitions.find(
                definition =>
                    this.includesPhrase(
                        text,
                        definition.words
                    )
            )?.operation ||
            "general"
        );

    },

    isQuestion(text){

        return (
            text.startsWith("ne ") ||
            text.startsWith("nasil ") ||
            text.startsWith("neden ") ||
            text.startsWith("niye ") ||
            text.startsWith("hangi ") ||
            text.startsWith("kim ") ||
            text.includes("bilir miyim") ||
            text.includes("mumkun mu") ||
            text.includes("var mi")
        );

    },

    detect(message){

        const raw =
            String(message || "").trim();

        const text =
            this.normalize(raw);

        if(!text){

            return {
                type: "empty",
                target: null,
                operation: null,
                confidence: 1,
                explicit: false,
                raw
            };

        }

        const targetMatch =
            this.detectTarget(text);

        const target =
            targetMatch?.target ||
            null;

        const operation =
            this.detectOperation(text);

        const question =
            this.isQuestion(text);

        const words =
            text.split(" ");

        if(
            words.length <= 2 &&
            [
                "ne",
                "anlamadim",
                "nasil yani",
                "ne demek"
            ].includes(text)
        ){

            return {
                type: "clarify",
                target: null,
                operation:
                    "clarify",
                confidence: .9,
                explicit: true,
                raw,
                normalizedText:
                    text
            };

        }

        if(
            operation === "save" &&
            this.includesPhrase(
                text,
                [
                    "burada kaldik",
                    "burda kaldik",
                    "kaldigimiz yeri kaydet",
                    "devam noktasi"
                ]
            )
        ){

            return {
                type: "resume:save",
                target:
                    target || null,
                operation: "save",
                confidence: .98,
                explicit: true,
                raw,
                normalizedText:
                    text
            };

        }

        if(
            operation === "restore" &&
            this.includesPhrase(
                text,
                [
                    "nerede kalmistik",
                    "kaldigim yere don",
                    "kaldigimiz yer",
                    "devam et"
                ]
            )
        ){

            return {
                type: "resume:restore",
                target: null,
                operation: "restore",
                confidence: .98,
                explicit: true,
                raw,
                normalizedText:
                    text
            };

        }

        if(
            operation === "create" &&
            (
                target === "world" ||
                target === "worlds" ||
                target === "create"
            )
        ){

            return {
                type: "create",
                target: "world",
                operation: "create",
                confidence: .96,
                explicit: true,
                raw,
                normalizedText:
                    text
            };

        }

        if(
            operation === "create" &&
            target === "entities"
        ){

            return {
                type: "create",
                target: "entity",
                operation: "create",
                confidence: .94,
                explicit: true,
                raw,
                normalizedText:
                    text
            };

        }

        if(
            operation === "open" &&
            target
        ){

            return {
                type: "navigate",
                target,
                operation: "open",
                confidence: .96,
                explicit: true,
                raw,
                normalizedText:
                    text
            };

        }

        if(question){

            return {
                type: "question",
                target,
                operation:
                    operation === "general"
                        ? "explain"
                        : operation,
                confidence:
                    target ? .86 : .58,
                explicit: true,
                raw,
                normalizedText:
                    text
            };

        }

        if(
            operation !== "general" &&
            target
        ){

            return {
                type: "request",
                target,
                operation,
                confidence: .84,
                explicit: true,
                raw,
                normalizedText:
                    text
            };

        }

        /*
         * Uygulamanın adının yalnızca konuşmada geçmesi,
         * ekranı açmak için yeterli değildir.
         */
        return {
            type: "chat",
            target: null,
            detectedTarget:
                target,
            operation: "general",
            confidence:
                target ? .62 : .35,
            explicit: false,
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
