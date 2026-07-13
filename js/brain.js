const Brain = {

    /*
     * Brain’in çalışma anındaki teknik mesaj geçmişidir.
     * Kullanıcıya gösterilen kalıcı geçmiş actions-v2.js içindeki
     * brain.sessions üzerinden yönetilir.
     */
    history: [],

    maxHistoryItems: 100,

    report(){
        const identity = VAERO.get("identity");
        const memory = VAERO.get("memorySystem");
        const guardian = VAERO.get("guardian");
        const bridge = VAERO.get("bridge");
        const evolution = VAERO.get("evolution");

        return {
            identity: identity ? "OK" : "MISSING",
            memory: memory ? "OK" : "MISSING",
            guardian: guardian ? "OK" : "MISSING",
            bridge: bridge ? "OK" : "MISSING",
            evolution: evolution ? "OK" : "MISSING",
            integrity: "100%"
        };
    },

    normalizeMessage(message){
        return String(message || "")
            .toLowerCase()
            .trim()
            .replaceAll("ı", "i")
            .replaceAll("ğ", "g")
            .replaceAll("ü", "u")
            .replaceAll("ş", "s")
            .replaceAll("ö", "o")
            .replaceAll("ç", "c")
            .replace(/[?.!,;:]+$/g, "")
            .replace(/\s+/g, " ");
    },

    /*
     * brainIntent servisi yalnızca hedef önerir.
     * Bir kelimenin cümlede geçmesi navigasyon için yeterli değildir.
     */
    isExplicitNavigationCommand(message, intent){
        if(!intent || intent.type !== "navigate" || !intent.target){
            return false;
        }

        const command = this.normalizeMessage(message);

        const navigationVerbs = [
            "ac",
            "goster",
            "goruntule",
            "git",
            "gec",
            "beni gotur"
        ];

        return navigationVerbs.some(verb =>
            command === verb ||
            command.startsWith(`${verb} `) ||
            command.endsWith(` ${verb}`) ||
            command.includes(` ${verb} `)
        );
    },

    addHistoryRecord(record){
        this.history.push({
            id: crypto.randomUUID(),
            ...record,
            createdAt: record.createdAt || Date.now()
        });

        if(this.history.length > this.maxHistoryItems){
            this.history = this.history.slice(
                this.history.length - this.maxHistoryItems
            );
        }
    },

    receive(message, context){
        const cleanMessage = String(message || "").trim();

        if(cleanMessage === ""){
            return null;
        }

        const intentService = VAERO.get("brainIntent");

        const detectedIntent = intentService
            ? intentService.detect(cleanMessage)
            : {
                type: "chat",
                target: null
            };

        /*
         * brainIntent yanlışlıkla normal bir soruyu navigate olarak
         * algılayabilir. Yalnızca açık komutsa navigate kabul edilir.
         */
        const intent =
            detectedIntent.type === "navigate" &&
            !this.isExplicitNavigationCommand(
                cleanMessage,
                detectedIntent
            )
                ? {
                    type: "chat",
                    target: null,
                    detectedTarget: detectedIntent.target
                }
                : detectedIntent;

        this.addHistoryRecord({
            role: "user",
            text: cleanMessage,
            context: context || null,
            intent
        });

        const reply = this.reply(
            cleanMessage,
            context,
            intent
        );

        this.addHistoryRecord({
            role: "brain",
            text: reply,
            context: context || null,
            intent
        });

        console.log("Brain received:", cleanMessage);
        console.log("Brain intent:", intent);
        console.log("Brain reply:", reply);
        console.log(
            "Brain runtime history count:",
            this.history.length
        );

        return reply;
    },

    reply(message, context, intent){
        const normalizedMessage =
    this.normalizeMessage(message);

/*
 * Mesajda açıkça bir uygulamadan söz ediliyorsa,
 * cevap bağlamında açık ekran yerine o uygulama kullanılır.
 */
const messageAppMap = [
    {
        app: "profile",
        words: ["profil", "profile"]
    },
    {
        app: "identity",
        words: ["kimlik", "identity"]
    },
    {
        app: "memory",
        words: ["hafiza", "memory"]
    },
    {
        app: "timeline",
        words: [
            "timeline",
            "zaman cizelgesi",
            "zaman akisi"
        ]
    },
    {
        app: "bridge",
        words: ["kopru", "bridge"]
    },
    {
        app: "organs",
        words: ["organ", "organlar", "organs"]
    },
    {
        app: "settings",
        words: ["ayar", "ayarlar", "settings"]
    }
];

const mentionedApp =
    messageAppMap.find(item =>
        item.words.some(word =>
            normalizedMessage.includes(word)
        )
    )?.app || null;

/*
 * Öncelik:
 * 1. Mesajda adı geçen uygulama
 * 2. Açık olan ekran
 * 3. Bilinmeyen bağlam
 */
const app =
    mentionedApp ||
    context?.app ||
    "unknown";

        if(
            intent &&
            intent.type === "navigate" &&
            intent.target
        ){
            const targetNameMap = {
                profile: "Profil",
                identity: "Kimlik",
                memory: "Hafıza",
                timeline: "Timeline",
                bridge: "Bridge",
                organs: "Organlar",
                settings: "Ayarlar"
            };

            const targetName =
                targetNameMap[intent.target] ||
                intent.target;

            return `${targetName} açılıyor.`;
        }

        if(intent && intent.type === "clarify"){
            return "Ne yapmak istediğini biraz daha açık yazarsan bulunduğun bağlama göre yardımcı olabilirim.";
        }

        /*
         * Henüz gerçek düşünme motoru olmadığı için normal sorular
         * navigasyon komutu gibi cevaplanmaz.
         */
        const isQuestion =
            normalizedMessage.includes(" ne ") ||
            normalizedMessage.startsWith("ne ") ||
            normalizedMessage.includes(" nasil") ||
            normalizedMessage.startsWith("nasil") ||
            normalizedMessage.includes(" neden") ||
            normalizedMessage.startsWith("neden") ||
            normalizedMessage.includes(" sence") ||
            normalizedMessage.includes(" oner") ||
            normalizedMessage.includes(" hakkinda");

        if(isQuestion){
            return this.getContextualQuestionReply(app);
        }

        return this.getContextualGuidance(app);
    },

    getContextualQuestionReply(app){
        const replyMap = {
            organs:
                "Organlar bağlamındaki sorunu aldım. Gerçek düşünme katmanı henüz bağlı olmadığı için şu an yalnızca bağlamı kaydedebiliyorum.",

            identity:
                "Kimlik bağlamındaki sorunu aldım. Kimlik kayıtları, doğrulamalar ve güvenlik katmanı üzerinden ilerleyeceğiz.",

            profile:
                "Profil bağlamındaki sorunu aldım. Profilin görünen bilgiler ve varlığın kendini ifade etme katmanı olduğunu dikkate alacağım.",

            memory:
                "Hafıza bağlamındaki sorunu aldım. Kayıtlar ve devam noktaları üzerinden ilerleyeceğiz.",

            timeline:
                "Timeline bağlamındaki sorunu aldım. Olayların sırası ve geçmiş gelişmeler üzerinden değerlendirme yapılacak.",

            bridge:
                "Bridge bağlamındaki sorunu aldım. Varlıklar, dünyalar ve sistemler arasındaki bağlantıları dikkate alacağım.",

            settings:
                "Ayarlar bağlamındaki sorunu aldım. Sistem tercihleri ve davranış kuralları üzerinden ilerleyeceğiz.",

            unknown:
                "Sorunu aldım. Gerçek düşünme katmanı henüz bağlı olmadığı için şu an mesajı kaydediyor ve bulunduğun bağlamı koruyorum."
        };

        return replyMap[app] || replyMap.unknown;
    },

    getContextualGuidance(app){
        const guidanceMap = {
            organs:
                "Organ Launcher ekranındasın. Buradan Kimlik, Profil, Hafıza, Timeline, Bridge ve Ayarlar uygulamalarına geçebilirsin.",

            identity:
                "Kimlik ekranındasın. Bu alan varlığın VAERO Evreni içindeki temel kimlik kaydını gösterir.",

            profile:
                "Profil ekranındasın. Burada varlığın görünen adı, türü ve tanımı yönetilir.",

            memory:
                "Hafıza ekranındasın. Bu alan varlığın geçmiş kayıtlarını ve hatırlamalarını taşır.",

            timeline:
                "Timeline ekranındasın. Burada varlığın zaman içindeki olay akışı görüntülenir.",

            bridge:
                "Bridge ekranındasın. Bu alan varlıklar ve dünyalar arasındaki bağlantıları yönetir.",

            settings:
                "Ayarlar ekranındasın. Burada sistem davranışları ve varlık tercihleri yönetilir.",

            unknown:
                "VAERO Brain aktif. Bir uygulama açabilir veya ne yapmak istediğini yazabilirsin."
        };

        return guidanceMap[app] || guidanceMap.unknown;
    },

    boot(){
        const status = this.report();

        console.log("VAERO Brain Online");
        console.log(status);

        const events = VAERO.get("events");

        if(events){
            events.on("engine.started", data => {
                console.log("Brain received engine event:", data);
            });

            events.emit("brain.online", status);
        }

        return status;
    }

};

VAERO.register("brain", Brain); 
