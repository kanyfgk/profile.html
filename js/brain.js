/* =========================================================
   VAERO BRAIN
   Local Intelligence / Runtime Coordinator
========================================================= */

const Brain = {

    history: [],

    sessions: [],

    resumePoint: null,

    maxHistoryItems: 100,

    maxMessageLength: 8000,

    booted: false,

    bootedAt: null,


    /* =====================================================
       SAFE SERVICE ACCESS
    ===================================================== */

    getService(name){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !== "function"
            ){
                return null;
            }

            return (
                VAERO.get(name) ||
                null
            );

        } catch(error){

            console.warn(
                `Brain servisi okunamadı: ${name}`,
                error
            );

            return null;

        }

    },


    getEngine(){

        try{

            if(
                typeof VAERO !== "undefined" &&
                VAERO.engine
            ){
                return VAERO.engine;
            }

        } catch(error){

            /* fallback below */

        }


        if(
            typeof window !== "undefined" &&
            window.Engine
        ){
            return window.Engine;
        }


        return null;

    },


    /* =====================================================
       SAFE CLONE
    ===================================================== */

    clone(value){

        if(
            value === null ||
            value === undefined
        ){
            return value;
        }


        try{

            if(
                typeof structuredClone ===
                "function"
            ){

                return structuredClone(
                    value
                );

            }

        } catch(error){

            /* JSON fallback below */

        }


        try{

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       ID
    ===================================================== */

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


    /* =====================================================
       SYSTEM REPORT
    ===================================================== */

    report(){

        const services = {

            identity:
                this.getService(
                    "identity"
                ),

            profile:
                this.getService(
                    "profile"
                ),

            memory:
                this.getService(
                    "memorySystem"
                ),

            timeline:
                this.getService(
                    "timeline"
                ),

            guardian:
                this.getService(
                    "guardian"
                ),

            bridge:
                this.getService(
                    "bridge"
                ),

            evolution:
                this.getService(
                    "evolution"
                ),

            world:
                this.getService(
                    "world"
                ),

            entityManager:
                this.getService(
                    "entityManager"
                ),

            brainIntent:
                this.getService(
                    "brainIntent"
                ),

            brainActions:
                this.getService(
                    "brainActions"
                ),

            brainPolicy:
                this.getService(
                    "brainActionPolicy"
                ),

            brainContext:
                this.getService(
                    "brainContext"
                ),

            brainAwareness:
                this.getService(
                    "brainAwareness"
                ),

            brainSkills:
                this.getService(
                    "brainSkills"
                ),

            brainMode:
                this.getService(
                    "brainMode"
                ),

            brainService:
                this.getService(
                    "brainService"
                ),

            brainCore:
                this.getService(
                    "brainCore"
                )

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
            Object.keys(
                result
            ).length;


        const ready =
            Object.values(
                result
            ).filter(
                value =>
                    value === "OK"
            ).length;


        result.integrity =
            total > 0
                ? `${Math.round(
                    ready /
                    total *
                    100
                )}%`
                : "0%";


        result.ready =
            ready;


        result.total =
            total;


        result.booted =
            this.booted;


        result.bootedAt =
            this.bootedAt;


        return result;

    },


    /* =====================================================
       MESSAGE NORMALIZATION
    ===================================================== */

    normalizeMessage(message){

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
            .replace(/[?.!,;:]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    },


    prepareMessage(message){

        const clean =
            String(
                message ?? ""
            ).trim();


        if(!clean){
            return "";
        }


        return clean.slice(
            0,
            this.maxMessageLength
        );

    },


    /* =====================================================
       HISTORY SANITIZATION
    ===================================================== */

    sanitizeContext(context){

        if(
            !context ||
            typeof context !==
                "object"
        ){
            return null;
        }


        return {

            app:
                context.app ||
                null,

            screen:
                context.screen ||
                null,

            page:
                context.page ||
                null,

            previousApp:
                context.previousApp ||
                null,

            entity:
                context.entity
                    ? {
                        id:
                            context.entity.id ||
                            null,

                        name:
                            context.entity.name ||
                            null,

                        type:
                            context.entity.type ||
                            null
                    }
                    : null,

            world:
                context.world
                    ? {
                        id:
                            context.world.id ||
                            null,

                        name:
                            context.world.name ||
                            null
                    }
                    : null,

            builtAt:
                context.builtAt ||
                null

        };

    },


    sanitizeRoute(route){

        if(
            !route ||
            typeof route !==
                "object"
        ){
            return null;
        }


        return {

            executed:
                Boolean(
                    route.executed
                ),

            blocked:
                Boolean(
                    route.blocked
                ),

            requiresConfirmation:
                Boolean(
                    route
                        .requiresConfirmation
                ),

            actionType:
                route.actionType ||
                route.policy
                    ?.actionType ||
                null,

            executionReason:
                route.executionReason ||
                null,

            actionResult:
                route.actionResult
                    ? this.clone(
                        route.actionResult
                    )
                    : null

        };

    },


    addHistoryRecord(record = {}){

        const historyRecord = {

            id:
                this.createId(),

            role:
                record.role ||
                "system",

            text:
                String(
                    record.text ??
                    ""
                ).slice(
                    0,
                    this.maxMessageLength
                ),

            context:
                this.sanitizeContext(
                    record.context
                ),

            intent:
                record.intent
                    ? this.clone(
                        record.intent
                    )
                    : null,

            route:
                this.sanitizeRoute(
                    record.route
                ),

            createdAt:
                record.createdAt ||
                Date.now()

        };


        this.history.push(
            historyRecord
        );


        if(
            this.history.length >
            this.maxHistoryItems
        ){

            this.history =
                this.history.slice(
                    -this.maxHistoryItems
                );

        }


        return historyRecord;

    },


    getHistory(limit = 20){

        const safeLimit =
            Math.max(
                1,
                Math.min(
                    this.maxHistoryItems,
                    Number(limit) || 20
                )
            );


        return this.clone(
            this.history.slice(
                -safeLimit
            )
        ) || [];

    },


    clearHistory(){

        this.history =
            [];

        return true;

    },


    /* =====================================================
       LOCAL RECEIVE
       SYNCHRONOUS API - BACKWARD COMPATIBILITY
    ===================================================== */

    receive(
        message,
        context = {},
        options = {}
    ){

        const cleanMessage =
            this.prepareMessage(
                message
            );


        if(!cleanMessage){
            return null;
        }


        const brainCore =
            this.getService(
                "brainCore"
            );


        let route = null;


        if(
            brainCore &&
            typeof brainCore.route ===
                "function"
        ){

            try{

                route =
                    brainCore.route(
                        cleanMessage,
                        context,
                        options
                    );

            } catch(error){

                console.error(
                    "Brain route error:",
                    error
                );

            }

        }


        if(
            !route ||
            typeof route !==
                "object"
        ){

            route = {

                intent: {

                    type:
                        "chat",

                    target:
                        null,

                    operation:
                        "general"

                },

                policy: {

                    allowed:false,

                    executable:false

                },

                executed:false,

                blocked:false,

                requiresConfirmation:
                    false,

                executionReason:
                    "brain-core-unavailable"

            };

        }


        const intent =
            route.intent ||
            {

                type:
                    "chat",

                target:
                    null,

                operation:
                    "general"

            };


        this.addHistoryRecord({

            role:
                "user",

            text:
                cleanMessage,

            context,

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

            role:
                "brain",

            text:
                reply,

            context,

            intent,

            route

        });


        return reply;

    },


    /* =====================================================
       ASYNC ASK
       PROVIDER / AI PATH
    ===================================================== */

    async ask(
        message,
        options = {}
    ){

        const cleanMessage =
            this.prepareMessage(
                message
            );


        if(!cleanMessage){

            return {

                reply:
                    "Ne yapmak istediğini yazabilirsin.",

                error:false

            };

        }


        const brainService =
            this.getService(
                "brainService"
            );


        if(
            !brainService ||
            typeof brainService.ask !==
                "function"
        ){

            const fallbackContext =
                this.getContext();


            const reply =
                this.receive(
                    cleanMessage,
                    fallbackContext,
                    options
                );


            return {

                reply:
                    reply ||
                    "Brain şu anda yanıt üretemedi.",

                localFallback:
                    true

            };

        }


        const response =
            await brainService.ask(
                cleanMessage,
                options
            );


        /*
         * BrainService / BrainCore kendi route ve intent
         * sonucunu döndürüyorsa history içine güvenli
         * biçimde eklenir.
         */

        const context =
            response?.context ||
            this.getContext();


        const intent =
            response?.intent ||
            null;


        this.addHistoryRecord({

            role:
                "user",

            text:
                cleanMessage,

            context,

            intent,

            route:
                response

        });


        this.addHistoryRecord({

            role:
                "brain",

            text:
                response?.reply ||
                "Brain yanıt üretemedi.",

            context,

            intent,

            route:
                response

        });


        return response;

    },


    /* =====================================================
       CURRENT CONTEXT
    ===================================================== */

    getContext(){

        const contextService =
            this.getService(
                "brainContext"
            );


        if(
            contextService &&
            typeof contextService.build ===
                "function"
        ){

            try{

                return contextService.build();

            } catch(error){

                console.warn(
                    "Brain context alınamadı:",
                    error
                );

            }

        }


        const engine =
            this.getEngine();


        return {

            app:
                "home",

            screen:
                engine?.currentView ||
                "home",

            page:
                engine?.currentEntityPage ||
                null,

            entity:
                engine?.currentOpenedEntity ||
                null,

            world:
                engine?.currentWorld ||
                null

        };

    },


    /* =====================================================
       MESSAGE ANALYSIS
    ===================================================== */

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
                topic:"discovery",
                words:[
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
                topic:"worlds",
                words:[
                    "dunyalar",
                    "dunyalarim",
                    "dunya listesi"
                ]
            },

            {
                topic:"world",
                words:[
                    "dunya",
                    "aktif dunya"
                ]
            },

            {
                topic:"entities",
                words:[
                    "varlik",
                    "varliklar",
                    "entity"
                ]
            },

            {
                topic:"profile",
                words:[
                    "profil",
                    "profile"
                ]
            },

            {
                topic:"identity",
                words:[
                    "kimlik",
                    "identity"
                ]
            },

            {
                topic:"memory",
                words:[
                    "hafiza",
                    "memory"
                ]
            },

            {
                topic:"timeline",
                words:[
                    "timeline",
                    "zaman cizelgesi",
                    "zaman akisi"
                ]
            },

            {
                topic:"bridge",
                words:[
                    "kopru",
                    "bridge",
                    "baglanti"
                ]
            },

            {
                topic:"evolution",
                words:[
                    "evrim",
                    "evolution",
                    "yasam olayi",
                    "gelisim"
                ]
            },

            {
                topic:"organs",
                words:[
                    "organ",
                    "organlar"
                ]
            },

            {
                topic:"settings",
                words:[
                    "ayar",
                    "ayarlar",
                    "settings"
                ]
            },

            {
                topic:"brain",
                words:[
                    "brain",
                    "beyin",
                    "sistem durumu"
                ]
            },

            {
                topic:"home",
                words:[
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
                                .includes(
                                    word
                                )
                    )
            )?.topic ||
            null;


        const contextTopic =
            context.page ||
            context.app ||
            context.screen ||
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
            !intent.type &&
            (
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
            )
        ){

            messageType =
                "question";

        }


        return {

            rawMessage:
                String(
                    message ??
                    ""
                ),

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
                Number.isFinite(
                    Number(
                        intent.confidence
                    )
                )
                    ? Number(
                        intent.confidence
                    )
                    : .35

        };

    },


    /* =====================================================
       LOCAL REPLY
    ===================================================== */

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
                route.executionReason ||
                "Bu işlem güvenlik nedeniyle Brain tarafından uygulanamaz."
            );

        }


        if(
            route.requiresConfirmation &&
            !route.executed
        ){

            return (
                route.policy?.reason ||
                route.executionReason ||
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
            intent.type ===
            "clarify"
        ){

            return (
                "Ne yapmak istediğini biraz daha açık yazarsan " +
                "bulunduğun bağlama göre doğru işlemi belirleyebilirim."
            );

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


    /* =====================================================
       EXECUTED REPLY
    ===================================================== */

    getExecutedReply(
        intent,
        route
    ){

        const actionResult =
            route.actionResult ||
            null;


        if(
            actionResult?.message
        ){

            return String(
                actionResult.message
            );

        }


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

            return (
                "Bulunduğun noktayı kaydettim. " +
                "Daha sonra buradan devam edebiliriz."
            );

        }


        if(
            intent.type ===
            "resume:restore"
        ){

            return (
                "Kaydettiğin devam noktasına dönüyorum."
            );

        }


        if(
            intent.type ===
                "create" &&
            intent.target ===
                "world"
        ){

            return (
                "Yarat ekranını açtım. " +
                "Dünya adını ve amacını belirleyerek oluşturabilirsin."
            );

        }


        if(
            intent.type ===
                "create" &&
            intent.target ===
                "entity"
        ){

            return (
                "Varlık oluşturma akışını açtım. " +
                "Önce varlık türünü seçebilirsin."
            );

        }


        if(
            intent.type ===
            "navigate"
        ){

            const label =
                targetNames[
                    intent.target
                ] ||
                intent.target ||
                "Hedef ekran";


            return `${label} açıldı.`;

        }


        return (
            actionResult?.reason ||
            route.executionReason ||
            "İşlem uygulandı."
        );

    },


    /* =====================================================
       SYSTEM SNAPSHOT
    ===================================================== */

    getSystemSnapshot(
        context = {}
    ){

        const worldService =
            this.getService(
                "world"
            );


        const entityManager =
            this.getService(
                "entityManager"
            );


        const evolution =
            this.getService(
                "evolution"
            );


        const memory =
            this.getService(
                "memorySystem"
            );


        const timeline =
            this.getService(
                "timeline"
            );


        let worlds = [];


        try{

            worlds =
                worldService &&
                typeof worldService.all ===
                    "function"
                    ? worldService.all() || []
                    : [];

        } catch(error){

            worlds = [];

        }


        const safeWorlds =
            Array.isArray(
                worlds
            )
                ? worlds
                : [];


        const worldEntities =
            safeWorlds.flatMap(
                world =>
                    Array.isArray(
                        world?.entities
                    )
                        ? world.entities
                        : []
            );


        const safeAll =
            service => {

                try{

                    const data =
                        service &&
                        typeof service.all ===
                            "function"
                            ? service.all()
                            : [];


                    return Array.isArray(data)
                        ? data
                        : [];

                } catch(error){

                    return [];

                }

            };


        const engine =
            this.getEngine();


        return {

            worlds:
                safeWorlds,

            worldCount:
                safeWorlds.length,

            entities:
                worldEntities,

            entityCount:
                worldEntities.length,

            registeredEntityCount:
                entityManager &&
                typeof entityManager.all ===
                    "function"
                    ? safeAll(
                        entityManager
                    ).length
                    : 0,

            evolutionEvents:
                safeAll(
                    evolution
                ),

            memories:
                safeAll(
                    memory
                ),

            timelineEvents:
                safeAll(
                    timeline
                ),

            currentWorld:
                context.world ||
                engine?.currentWorld ||
                null,

            currentEntity:
                context.entity ||
                engine?.currentOpenedEntity ||
                null,

            currentScreen:
                context.screen ||
                engine?.currentView ||
                "home"

        };

    },


    /* =====================================================
       DISCOVERY CONTEXT
    ===================================================== */

    getDiscoveryContext(){

        let answers = {};


        try{

            const evolution =
                this.getService(
                    "evolution"
                );


            const events =
                evolution &&
                typeof evolution.all ===
                    "function"
                    ? evolution.all()
                    : [];


            const event =
                Array.isArray(events)
                    ? events.find(
                        item =>
                            item?.source ===
                                "discovery" &&
                            item?.payload
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
                Object.keys(
                    answers
                ).length === 0 &&
                typeof localStorage !==
                    "undefined"
            ){

                const saved =
                    localStorage.getItem(
                        "vaero:discovery:answers"
                    );


                if(saved){

                    const parsed =
                        JSON.parse(
                            saved
                        );


                    if(
                        parsed &&
                        typeof parsed ===
                            "object" &&
                        !Array.isArray(
                            parsed
                        )
                    ){

                        answers =
                            parsed;

                    }

                }

            }

        } catch(error){

            console.warn(
                "Brain Discovery bağlamını okuyamadı:",
                error
            );

        }


        const format =
            value => {

                if(
                    Array.isArray(
                        value
                    )
                ){

                    return (
                        value.join(", ") ||
                        "Henüz belirlenmedi"
                    );

                }


                return String(
                    value ||
                    "Henüz belirlenmedi"
                );

            };


        return {

            completed:
                Object.keys(
                    answers
                ).length > 0,

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

            answers:
                this.clone(
                    answers
                ) || {}

        };

    },


    /* =====================================================
       LOCAL ENGINE KNOWLEDGE
    ===================================================== */

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
                    "Varlığın VAERO içindeki temel kimlik kaydını, doğrulama durumunu ve yetki bağlamını taşır."

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
                    "Hedefleri, ilgi alanlarını, güçlü yönleri ve bağlantı beklentilerini belirleyen başlangıç yolculuğudur."

            },

            memory: {

                label:
                    "Hafıza",

                purpose:
                    "Kalıcı kayıtları, devam noktalarını ve önemli sistem bağlamlarını saklar."

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
                    "Varlıklar, dünyalar ve sistemler arasındaki kontrollü bağlantıları temsil eder."

            },

            evolution: {

                label:
                    "Evrim",

                purpose:
                    "Başarı, karar, hedef ve diğer yaşam olaylarının zaman içindeki gelişim etkisini kaydeder."

            },

            organs: {

                label:
                    "Organlar",

                purpose:
                    "Kimlik, Profil, Hafıza, Timeline, Köprü ve Evrim gibi Engine organlarını tek merkezde gösterir."

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
                    "Kullanıcının isteğini, mevcut bağlamı ve izin verilen Engine işlemlerini birlikte koordine eder."

            }

        };

    },


    /* =====================================================
       LOCAL QUESTIONS
    ===================================================== */

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
                snapshot.worldCount ===
                0
            ){

                return (
                    "Henüz oluşturulmuş bir dünyan yok. " +
                    "Yarat ekranından ilk dünyanı oluşturabilirsin."
                );

            }


            const names =
                snapshot.worlds
                    .map(
                        world =>
                            world?.name
                    )
                    .filter(
                        Boolean
                    )
                    .slice(
                        0,
                        10
                    )
                    .join(
                        ", "
                    );


            return names
                ? `${snapshot.worldCount} dünyan var: ${names}.`
                : `${snapshot.worldCount} dünyan var.`;

        }


        if(
            analysis.topic ===
            "world"
        ){

            const world =
                snapshot.currentWorld;


            if(!world){

                return (
                    "Şu anda açık bir dünya yok. " +
                    "Dünyalar ekranından bir dünya seçebilirsin."
                );

            }


            const entityCount =
                Array.isArray(
                    world.entities
                )
                    ? world.entities.length
                    : 0;


            return (
                `${world.name || "Aktif dünya"} açık. ` +
                `Bu dünyada ${entityCount} varlık bulunuyor.`
            );

        }


        if(
            analysis.topic ===
            "entities"
        ){

            return (
                `Dünyalarında toplam ${snapshot.entityCount} varlık bulunuyor.`
            );

        }


        if(
            analysis.topic ===
            "identity"
        ){

            const engine =
                this.getEngine();


            const entity =
                snapshot.currentEntity ||
                engine?.rootEntity ||
                null;


            const identity =
                entity?.identity;


            if(!identity){

                return (
                    "Bu varlık için bağlı bir kimlik kaydı bulunamadı."
                );

            }


            return (
                `Kimlik ${identity.id || "tanımsız"} numarasıyla kayıtlı ve ` +
                `${
                    identity.verified
                        ? "doğrulanmış"
                        : "henüz doğrulanmamış"
                } durumda.`
            );

        }


        if(
            analysis.topic ===
            "profile"
        ){

            let userProfile =
                null;


            try{

                if(
                    typeof localStorage !==
                    "undefined"
                ){

                    const saved =
                        localStorage.getItem(
                            "vaero:user:profile:v1"
                        );


                    userProfile =
                        saved
                            ? JSON.parse(
                                saved
                            )
                            : null;

                }

            } catch(error){

                userProfile =
                    null;

            }


            if(
                userProfile?.name
            ){

                return (
                    `Profil adı ${userProfile.name}. ` +
                    `${
                        userProfile.description
                            ? `Açıklama: ${userProfile.description}`
                            : "Profil açıklaması henüz eklenmedi."
                    }`
                );

            }


            return (
                "Profil adı henüz kişiselleştirilmedi. " +
                "Profil ekranından adını ve açıklamanı ekleyebilirsin."
            );

        }


        if(
            analysis.topic ===
            "discovery"
        ){

            const discovery =
                this.getDiscoveryContext();


            if(
                !discovery.completed
            ){

                return (
                    "Discovery Journey henüz tamamlanmadı. " +
                    "Tamamlandığında hedeflerini ve yönünü birlikte değerlendirebilirim."
                );

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

            ].join(
                "\n"
            );

        }


        if(
            analysis.topic ===
            "memory"
        ){

            return (
                `Hafızada ${snapshot.memories.length} kayıt bulunuyor.`
            );

        }


        if(
            analysis.topic ===
            "timeline"
        ){

            return (
                `Zaman çizelgesinde ${snapshot.timelineEvents.length} olay bulunuyor.`
            );

        }


        if(
            analysis.topic ===
            "evolution"
        ){

            return (
                `Evrim geçmişinde ${snapshot.evolutionEvents.length} yaşam olayı bulunuyor.`
            );

        }


        if(
            analysis.topic ===
            "brain"
        ){

            const status =
                this.report();


            return (
                `Brain sistem bütünlüğü ${status.integrity}. ` +
                `${status.ready}/${status.total} temel servis bağlı.`
            );

        }


        if(knowledge){

            return (
                `${knowledge.label}: ${knowledge.purpose}`
            );

        }


        return (
            "Sorunun bağlamını aldım ancak hangi Engine alanını sorduğunu biraz daha açık belirtmelisin."
        );

    },


    /* =====================================================
       LOCAL REQUEST REPLY
    ===================================================== */

    getRequestReply(
        analysis
    ){

        const knowledge =
            this.getBrainKnowledge()[
                analysis.topic
            ];


        if(!knowledge){

            return (
                "İsteğini anladım ancak bu alan için bağlı bir işlem bulunmuyor."
            );

        }


        if(
            analysis.operation ===
            "delete"
        ){

            return (
                `${knowledge.label} ile ilgili silme işlemi kullanıcı onayı olmadan uygulanmaz.`
            );

        }


        if(
            analysis.operation ===
            "edit"
        ){

            return (
                `${knowledge.label} düzenleme isteğini anladım. Güvenli düzenleme yüzeyi üzerinden ilerlemelisin.`
            );

        }


        if(
            analysis.operation ===
            "search"
        ){

            return (
                `${knowledge.label} içinde arama isteğini anladım. Bağlı arama yeteneği varsa Brain onu kullanabilir.`
            );

        }


        return (
            `${knowledge.label} ile ilgili isteğini aldım. ${knowledge.purpose}`
        );

    },


    /* =====================================================
       CONTEXTUAL GUIDANCE
    ===================================================== */

    getContextualGuidance(
        topic,
        context = {}
    ){

        const knowledge =
            this.getBrainKnowledge()[
                topic
            ];


        if(knowledge){

            return (
                `${knowledge.label} bağlamındasın. ${knowledge.purpose}`
            );

        }


        const engine =
            this.getEngine();


        const currentScreen =
            context.screen ||
            engine?.currentView ||
            "home";


        const screenKnowledge =
            this.getBrainKnowledge()[
                currentScreen
            ];


        if(screenKnowledge){

            return (
                `${screenKnowledge.label} ekranındasın. ${screenKnowledge.purpose}`
            );

        }


        return (
            "VAERO Brain aktif. Bir ekran açabilir, sistem durumunu sorabilir veya yapmak istediğin işlemi yazabilirsin."
        );

    },


    /* =====================================================
       STATUS
    ===================================================== */

    status(){

        const mode =
            this.getService(
                "brainMode"
            );


        const providerCore =
            this.getService(
                "brainCore"
            );


        return {

            booted:
                this.booted,

            bootedAt:
                this.bootedAt,

            historyItems:
                this.history.length,

            sessions:
                this.sessions.length,

            mode:
                mode &&
                typeof mode.snapshot ===
                    "function"
                    ? mode.snapshot()
                    : null,

            provider:
                providerCore &&
                typeof providerCore
                    .getProviderInfo ===
                    "function"
                    ? providerCore
                        .getProviderInfo()
                    : null,

            integrity:
                this.report()
                    .integrity

        };

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(this.booted){

            return this.report();

        }


        this.booted =
            true;


        this.bootedAt =
            Date.now();


        const status =
            this.report();


        const events =
            this.getService(
                "events"
            );


        if(
            events &&
            typeof events.on ===
                "function"
        ){

            try{

                events.on(
                    "engine.started",
                    data => {

                        const awareness =
                            this.getService(
                                "brainAwareness"
                            );


                        if(
                            awareness &&
                            typeof awareness.enter ===
                                "function"
                        ){

                            const engine =
                                this.getEngine();


                            awareness.enter(
                                engine?.currentView ||
                                "home",
                                {
                                    source:
                                        "engine.started"
                                }
                            );

                        }

                    }
                );

            } catch(error){

                console.warn(
                    "Brain engine event bağlantısı kurulamadı:",
                    error
                );

            }

        }


        if(
            events &&
            typeof events.emit ===
                "function"
        ){

            try{

                events.emit(
                    "brain.online",
                    status
                );

            } catch(error){

                console.warn(
                    "brain.online olayı gönderilemedi:",
                    error
                );

            }

        }


        return status;

    }

};


VAERO.register(
    "brain",
    Brain
);


window.Brain =
    Brain;
