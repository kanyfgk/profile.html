const Brain = {

    history: [],
    sessions: [],
    resumePoint: null,

    maxHistoryItems: 100,
    booted: false,

    createId(){

        if(
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID ===
                "function"
        ){
            return crypto.randomUUID();
        }

        return `brain_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;

    },

    report(){

        const services = {
            identity:
                VAERO.get("identity"),

            profile:
                VAERO.get("profile"),

            memory:
                VAERO.get("memorySystem"),

            timeline:
                VAERO.get("timeline"),

            guardian:
                VAERO.get("guardian"),

            bridge:
                VAERO.get("bridge"),

            evolution:
                VAERO.get("evolution"),

            world:
                VAERO.get("world"),

            entityManager:
                VAERO.get("entityManager"),

            brainIntent:
                VAERO.get("brainIntent"),

            brainActions:
                VAERO.get("brainActions"),

            brainPolicy:
                VAERO.get(
                    "brainActionPolicy"
                ),

            brainCore:
                VAERO.get("brainCore")
        };

        const result = {};

        Object.entries(
            services
        ).forEach(
            ([key, service]) => {

                result[key] =
                    service
                        ? "OK"
                        : "MISSING";

            }
        );

        const total =
            Object.keys(result).length;

        const ready =
            Object.values(result)
                .filter(
                    value =>
                        value === "OK"
                ).length;

        result.integrity =
            total > 0
                ? `${Math.round(
                    ready / total * 100
                )}%`
                : "0%";

        return result;

    },

    normalizeMessage(message){

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

    addHistoryRecord(record = {}){

        this.history.push({
            id:
                this.createId(),

            ...record,

            createdAt:
                record.createdAt ||
                Date.now()
        });

        if(
            this.history.length >
            this.maxHistoryItems
        ){
            this.history =
                this.history.slice(
                    -this.maxHistoryItems
                );
        }

    },

    receive(message, context = {}){

        const cleanMessage =
            String(message || "")
                .trim();

        if(!cleanMessage){
            return null;
        }

        const brainCore =
            VAERO.get("brainCore");

        const route =
            brainCore &&
            typeof brainCore.route ===
                "function"
                ? brainCore.route(
                    cleanMessage,
                    context
                )
                : {
                    intent: {
                        type: "chat",
                        target: null,
                        operation:
                            "general"
                    },

                    policy: {
                        allowed: false,
                        executable: false
                    },

                    executed: false,
                    blocked: false,
                    requiresConfirmation:
                        false
                };

        const intent =
            route.intent || {
                type: "chat",
                target: null,
                operation:
                    "general"
            };

        this.addHistoryRecord({
            role: "user",
            text:
                cleanMessage,
            context:
                context || null,
            intent,
            route
        });

        const reply =
            this.reply(
                cleanMessage,
                context,
                intent,
                route
            );

        this.addHistoryRecord({
            role: "brain",
            text:
                reply,
            context:
                context || null,
            intent,
            route
        });

        console.log(
            "Brain received:",
            cleanMessage
        );

        console.log(
            "Brain intent:",
            intent
        );

        console.log(
            "Brain route:",
            route
        );

        console.log(
            "Brain reply:",
            reply
        );

        return reply;

    },

    analyzeMessage(
        message,
        context = {},
        intent = {}
    ){

        const normalizedMessage =
            this.normalizeMessage(
                message
            );

        const topicDefinitions = [
            {
                topic: "discovery",
                words: [
                    "discovery",
                    "kesif",
                    "kesif yolculugu",
                    "gelis amacim",
                    "ilgi alanlarim",
                    "guclu yonlerim",
                    "hedefim"
                ]
            },
            {
                topic: "worlds",
                words: [
                    "dunyalar",
                    "dunyalarim",
                    "dunya listesi"
                ]
            },
            {
                topic: "world",
                words: [
                    "dunya",
                    "aktif dunya"
                ]
            },
            {
                topic: "entities",
                words: [
                    "varlik",
                    "varliklar",
                    "entity"
                ]
            },
            {
                topic: "profile",
                words: [
                    "profil",
                    "profile"
                ]
            },
            {
                topic: "identity",
                words: [
                    "kimlik",
                    "identity"
                ]
            },
            {
                topic: "memory",
                words: [
                    "hafiza",
                    "memory"
                ]
            },
            {
                topic: "timeline",
                words: [
                    "timeline",
                    "zaman cizelgesi",
                    "zaman akisi"
                ]
            },
            {
                topic: "bridge",
                words: [
                    "kopru",
                    "bridge",
                    "baglanti"
                ]
            },
            {
                topic: "evolution",
                words: [
                    "evrim",
                    "evolution",
                    "yasam olayi",
                    "gelisim"
                ]
            },
            {
                topic: "organs",
                words: [
                    "organ",
                    "organlar"
                ]
            },
            {
                topic: "settings",
                words: [
                    "ayar",
                    "ayarlar",
                    "settings"
                ]
            },
            {
                topic: "brain",
                words: [
                    "brain",
                    "beyin",
                    "sistem durumu"
                ]
            },
            {
                topic: "home",
                words: [
                    "ana ekran",
                    "ana sayfa",
                    "home"
                ]
            }
        ];

        const mentionedTopic =
            topicDefinitions.find(
                definition =>
                    definition.words.some(
                        word =>
                            normalizedMessage
                                .includes(word)
                    )
            )?.topic ||
            null;

        const contextTopic =
            context.page ||
            context.screen ||
            context.app ||
            null;

        const topic =
            intent.target ||
            intent.detectedTarget ||
            mentionedTopic ||
            contextTopic ||
            "unknown";

        const operation =
            intent.operation ||
            "general";

        let messageType =
            intent.type ||
            "chat";

        if(
            [
                "question",
                "request",
                "navigate",
                "create",
                "resume:save",
                "resume:restore",
                "clarify"
            ].includes(intent.type)
        ){
            messageType =
                intent.type;
        }else if(
            normalizedMessage.startsWith(
                "ne "
            ) ||
            normalizedMessage.startsWith(
                "nasil "
            ) ||
            normalizedMessage.startsWith(
                "neden "
            ) ||
            normalizedMessage.startsWith(
                "hangi "
            ) ||
            normalizedMessage.startsWith(
                "kac "
            ) ||
            normalizedMessage.includes(
                "var mi"
            )
        ){
            messageType =
                "question";
        }

        return {
            rawMessage:
                String(message || ""),

            normalizedMessage,
            messageType,
            topic,
            mentionedTopic,
            contextTopic,
            operation,

            target:
                intent.target ||
                mentionedTopic ||
                null,

            confidence:
                Number(
                    intent.confidence
                ) || .35
        };

    },

    reply(
        message,
        context,
        intent,
        route
    ){

        const analysis =
            this.analyzeMessage(
                message,
                context,
                intent
            );

        if(route.blocked){

            return (
                route.policy?.reason ||
                "Bu işlem güvenlik nedeniyle Brain tarafından uygulanamaz."
            );

        }

        if(
            route.requiresConfirmation
        ){

            return (
                route.policy?.reason ||
                "Bu işlemi uygulamadan önce onayın gerekiyor."
            );

        }

        if(route.executed){

            return this.getExecutedReply(
                intent,
                route
            );

        }

        if(
            intent.type === "clarify"
        ){

            return "Ne yapmak istediğini biraz daha açık yazarsan bulunduğun ekrana göre doğru işlemi belirleyebilirim.";

        }

        if(
            analysis.messageType ===
                "question"
        ){

            return this.getQuestionReply(
                analysis,
                context
            );

        }

        if(
            analysis.messageType ===
                "request"
        ){

            return this.getRequestReply(
                analysis
            );

        }

        return this.getContextualGuidance(
            analysis.topic,
            context
        );

    },

    getExecutedReply(intent, route){

        const targetNames = {
            home:
                "Ana ekran",

            worlds:
                "Dünyalar",

            world:
                "Dünya",

            create:
                "Yarat",

            entities:
                "Varlıklar",

            identity:
                "Kimlik",

            profile:
                "Profil",

            discovery:
                "Discovery",

            memory:
                "Hafıza",

            timeline:
                "Zaman Çizelgesi",

            bridge:
                "Köprü",

            evolution:
                "Evrim",

            organs:
                "Organlar",

            settings:
                "Ayarlar",

            brain:
                "Brain"
        };

        if(
            intent.type ===
                "resume:save"
        ){
            return "Bulunduğun noktayı kaydettim. Daha sonra buradan devam edebiliriz.";
        }

        if(
            intent.type ===
                "resume:restore"
        ){
            return "Kaydettiğin devam noktasına dönüyorum.";
        }

        if(
            intent.type === "create" &&
            intent.target === "world"
        ){
            return "Yarat ekranını açtım. Dünya adını ve amacını belirleyerek oluşturabilirsin.";
        }

        if(
            intent.type === "create" &&
            intent.target === "entity"
        ){
            return "Varlık oluşturma akışını açtım. Önce varlık türünü seçebilirsin.";
        }

        if(intent.type === "navigate"){

            const label =
                targetNames[
                    intent.target
                ] ||
                intent.target ||
                "Hedef ekran";

            return `${label} açıldı.`;

        }

        return (
            route.actionResult?.reason ||
            "İşlem uygulandı."
        );

    },

    getSystemSnapshot(context = {}){

        const worldService =
            VAERO.get("world");

        const entityManager =
            VAERO.get(
                "entityManager"
            );

        const evolution =
            VAERO.get("evolution");

        const memory =
            VAERO.get(
                "memorySystem"
            );

        const timeline =
            VAERO.get("timeline");

        const worlds =
            worldService &&
            typeof worldService.all ===
                "function"
                ? worldService.all()
                : [];

        const worldEntities =
            worlds.flatMap(world =>
                Array.isArray(
                    world.entities
                )
                    ? world.entities
                    : []
            );

        return {
            worlds,
            worldCount:
                worlds.length,

            entities:
                worldEntities,

            entityCount:
                worldEntities.length,

            registeredEntityCount:
                entityManager &&
                typeof entityManager.all ===
                    "function"
                    ? entityManager.all()
                        .length
                    : 0,

            evolutionEvents:
                evolution &&
                typeof evolution.all ===
                    "function"
                    ? evolution.all()
                    : [],

            memories:
                memory &&
                typeof memory.all ===
                    "function"
                    ? memory.all()
                    : [],

            timelineEvents:
                timeline &&
                typeof timeline.all ===
                    "function"
                    ? timeline.all()
                    : [],

            currentWorld:
                context.world ||
                VAERO.engine
                    ?.currentWorld ||
                null,

            currentEntity:
                context.entity ||
                VAERO.engine
                    ?.currentOpenedEntity ||
                null,

            currentScreen:
                context.screen ||
                VAERO.engine
                    ?.currentView ||
                "home"
        };

    },

    getDiscoveryContext(){

        let answers = {};

        try {

            const evolution =
                VAERO.get(
                    "evolution"
                );

            const event =
                evolution &&
                typeof evolution.all ===
                    "function"
                    ? evolution
                        .all()
                        .find(item =>
                            item.source ===
                                "discovery" &&
                            item.payload
                                ?.discoveryAnswers
                        )
                    : null;

            if(event){

                answers = {
                    ...event.payload
                        .discoveryAnswers
                };

            }

            if(
                Object.keys(answers)
                    .length === 0
            ){

                const saved =
                    localStorage.getItem(
                        "vaero:discovery:answers"
                    );

                if(saved){

                    const parsed =
                        JSON.parse(saved);

                    if(
                        parsed &&
                        typeof parsed ===
                            "object" &&
                        !Array.isArray(
                            parsed
                        )
                    ){
                        answers = parsed;
                    }

                }

            }

        } catch(error){

            console.warn(
                "Brain Discovery bağlamını okuyamadı:",
                error
            );

        }

        const format = value => {

            if(Array.isArray(value)){
                return value.join(", ");
            }

            return String(
                value ||
                "Henüz belirlenmedi"
            );

        };

        return {
            completed:
                Object.keys(answers)
                    .length > 0,

            purpose:
                format(
                    answers.purpose
                ),

            interests:
                format(
                    answers.interest
                ),

            strengths:
                format(
                    answers.strength
                ),

            goal:
                format(
                    answers.goal
                ),

            connections:
                format(
                    answers.connection
                ),

            guidance:
                format(
                    answers.guidance
                ),

            answers
        };

    },

    getBrainKnowledge(){

        return {
            home: {
                label:
                    "Ana ekran",

                purpose:
                    "Engine’in genel durumunu, aktif dünyanı, kısayolları ve son aktiviteleri tek merkezde gösterir."
            },

            worlds: {
                label:
                    "Dünyalar",

                purpose:
                    "Projeleri, toplulukları ve dijital yaşam alanlarını birbirinden ayırarak yönetir."
            },

            world: {
                label:
                    "Dünya",

                purpose:
                    "Varlıkların birlikte yaşadığı bağımsız bir proje veya topluluk alanıdır."
            },

            entities: {
                label:
                    "Varlıklar",

                purpose:
                    "Kişi, şirket, cihaz, bilgi, topluluk veya başka bir dijital yapıyı temsil eder."
            },

            identity: {
                label:
                    "Kimlik",

                purpose:
                    "Varlığın VAERO içindeki değişmez temel kaydını, doğrulama durumunu ve yetkilerini taşır."
            },

            profile: {
                label:
                    "Profil",

                purpose:
                    "Varlığın görünen adını, açıklamasını, yönünü ve Discovery bilgilerini yönetir."
            },

            discovery: {
                label:
                    "Discovery",

                purpose:
                    "Hedeflerini, ilgi alanlarını, güçlü yönlerini ve bağlantı beklentilerini belirler."
            },

            memory: {
                label:
                    "Hafıza",

                purpose:
                    "Kalıcı kayıtları, devam noktalarını ve önemli sistem bilgilerini saklar."
            },

            timeline: {
                label:
                    "Zaman Çizelgesi",

                purpose:
                    "Varlığın olaylarını ve değişimlerini kronolojik sırayla gösterir."
            },

            bridge: {
                label:
                    "Köprü",

                purpose:
                    "Varlıklar, dünyalar ve sistemler arasındaki kontrollü bağlantıları yönetir."
            },

            evolution: {
                label:
                    "Evrim",

                purpose:
                    "Başarı, karar, hedef ve diğer yaşam olaylarının gelişime etkisini kaydeder."
            },

            organs: {
                label:
                    "Organlar",

                purpose:
                    "Kimlik, Profil, Hafıza, Timeline, Köprü ve Evrim gibi bağımsız Engine uygulamalarını yönetir."
            },

            settings: {
                label:
                    "Ayarlar",

                purpose:
                    "Sistem davranışlarını, görünümü, güvenliği ve kullanıcı tercihlerini yönetir."
            },

            brain: {
                label:
                    "Brain",

                purpose:
                    "Kullanıcının isteğini, bulunduğu ekranı ve Engine verilerini birlikte yorumlayan koordinasyon katmanıdır."
            }
        };

    },

    getQuestionReply(
        analysis,
        context
    ){

        const snapshot =
            this.getSystemSnapshot(
                context
            );

        const knowledge =
            this.getBrainKnowledge()[
                analysis.topic
            ];

        if(
            analysis.topic ===
                "worlds"
        ){

            if(
                snapshot.worldCount === 0
            ){
                return "Henüz oluşturulmuş bir dünyan yok. Yarat ekranından ilk dünyanı oluşturabilirsin.";
            }

            const names =
                snapshot.worlds
                    .map(world =>
                        world.name
                    )
                    .filter(Boolean)
                    .join(", ");

            return `${snapshot.worldCount} dünyan var: ${names}.`;

        }

        if(
            analysis.topic ===
                "world"
        ){

            const world =
                snapshot.currentWorld;

            if(!world){
                return "Şu anda açık bir dünya yok. Dünyalar ekranından bir dünya seçebilirsin.";
            }

            const entityCount =
                Array.isArray(
                    world.entities
                )
                    ? world.entities.length
                    : 0;

            return `${world.name} açık. Bu dünyada ${entityCount} varlık bulunuyor.`;

        }

        if(
            analysis.topic ===
                "entities"
        ){

            return `Dünyalarında toplam ${snapshot.entityCount} varlık bulunuyor.`;

        }

        if(
            analysis.topic ===
                "identity"
        ){

            const entity =
                snapshot.currentEntity ||
                VAERO.engine
                    ?.rootEntity;

            const identity =
                entity?.identity;

            if(!identity){
                return "Bu varlık için bağlı bir kimlik kaydı bulunamadı.";
            }

            return `Kimlik ${identity.id} numarasıyla kayıtlı ve ${
                identity.verified
                    ? "doğrulanmış"
                    : "henüz doğrulanmamış"
            } durumda.`;

        }

        if(
            analysis.topic ===
                "profile"
        ){

            let userProfile = null;

            try {

                const saved =
                    localStorage.getItem(
                        "vaero:user:profile:v1"
                    );

                userProfile =
                    saved
                        ? JSON.parse(saved)
                        : null;

            } catch(error){

                userProfile = null;

            }

            if(userProfile?.name){

                return `Profil adı ${userProfile.name}. ${
                    userProfile.description
                        ? `Açıklama: ${userProfile.description}`
                        : "Profil açıklaması henüz eklenmedi."
                }`;

            }

            return "Profil adı henüz kişiselleştirilmedi. Profil ekranından adını ve açıklamanı ekleyebilirsin.";

        }

        if(
            analysis.topic ===
                "discovery"
        ){

            const discovery =
                this.getDiscoveryContext();

            if(!discovery.completed){

                return "Discovery Journey henüz tamamlanmadı. Tamamlandığında hedeflerini ve yönünü birlikte değerlendirebilirim.";

            }

            return [
                "Discovery sonuçlarına göre:",
                "",
                `• Geliş amacın: ${discovery.purpose}`,
                `• İlgi alanların: ${discovery.interests}`,
                `• Güçlü yönlerin: ${discovery.strengths}`,
                `• Şu anki hedefin: ${discovery.goal}`,
                `• Aradığın bağlantılar: ${discovery.connections}`,
                `• VAERO tercihin: ${discovery.guidance}`
            ].join("\n");

        }

        if(
            analysis.topic ===
                "memory"
        ){

            return `Hafızada ${snapshot.memories.length} kayıt bulunuyor.`;

        }

        if(
            analysis.topic ===
                "timeline"
        ){

            return `Zaman çizelgesinde ${snapshot.timelineEvents.length} olay bulunuyor.`;

        }

        if(
            analysis.topic ===
                "evolution"
        ){

            return `Evrim geçmişinde ${snapshot.evolutionEvents.length} yaşam olayı bulunuyor.`;

        }

        if(
            analysis.topic ===
                "brain"
        ){

            const status =
                this.report();

            return `Brain sistem bütünlüğü ${status.integrity}. Intent, Policy, Actions ve Context katmanları bağlı.`;

        }

        if(knowledge){

            return `${knowledge.label}: ${knowledge.purpose}`;

        }

        return "Sorunun bağlamını aldım ancak hangi Engine alanını sorduğunu biraz daha açık belirtmelisin.";

    },

    getRequestReply(analysis){

        const knowledge =
            this.getBrainKnowledge()[
                analysis.topic
            ];

        if(!knowledge){

            return "İsteğini anladım ancak bu alan için bağlı bir işlem bulunmuyor.";

        }

        if(
            analysis.operation ===
                "delete"
        ){

            return `${knowledge.label} ile ilgili silme işlemi kullanıcı onayı olmadan uygulanmaz.`;

        }

        if(
            analysis.operation ===
                "edit"
        ){

            return `${knowledge.label} düzenleme isteğini anladım. Güvenli düzenleme ekranı üzerinden ilerlemelisin.`;

        }

        if(
            analysis.operation ===
                "search"
        ){

            return `${knowledge.label} içinde arama isteğini anladım; ilgili ekran açıldığında mevcut kayıtları inceleyebilirsin.`;

        }

        return `${knowledge.label} ile ilgili isteğini aldım. ${knowledge.purpose}`;

    },

    getContextualGuidance(
        topic,
        context = {}
    ){

        const knowledge =
            this.getBrainKnowledge()[
                topic
            ];

        if(knowledge){

            return `${knowledge.label} bağlamındasın. ${knowledge.purpose}`;

        }

        const currentScreen =
            context.screen ||
            VAERO.engine
                ?.currentView ||
            "home";

        const screenKnowledge =
            this.getBrainKnowledge()[
                currentScreen
            ];

        if(screenKnowledge){

            return `${screenKnowledge.label} ekranındasın. ${screenKnowledge.purpose}`;

        }

        return "VAERO Brain aktif. Bir ekran açabilir, sistem durumunu sorabilir veya yapmak istediğin işlemi yazabilirsin.";

    },

    boot(){

        if(this.booted){
            return this.report();
        }

        this.booted = true;

        const status =
            this.report();

        console.log(
            "VAERO Brain Online"
        );

        console.log(status);

        const events =
            VAERO.get("events");

        if(events){

            events.on(
                "engine.started",
                data => {

                    console.log(
                        "Brain received engine event:",
                        data
                    );

                }
            );

            events.emit(
                "brain.online",
                status
            );

        }

        return status;

    }

};

VAERO.register(
    "brain",
    Brain
); 
