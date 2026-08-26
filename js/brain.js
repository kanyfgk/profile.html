/* =========================================================
   VAERO BRAIN
   Cross-App Intelligence / Runtime Coordinator
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

            /* fallback */
        }


        return (
            window.Engine ||
            null
        );

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
                typeof structuredClone === "function"
            ){

                return structuredClone(
                    value
                );

            }

        } catch(error){

            /* JSON fallback */
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
            typeof crypto.randomUUID === "function"
        ){

            return crypto.randomUUID();

        }


        return `brain_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       SAFE ALL
    ===================================================== */

    safeAll(
        service,
        options = undefined
    ){

        if(
            !service ||
            typeof service.all !== "function"
        ){
            return [];
        }


        try{

            const result =
                options === undefined
                    ? service.all()
                    : service.all(
                        options
                    );


            return Array.isArray(
                result
            )
                ? result
                : [];

        } catch(error){

            return [];

        }

    },


    /* =====================================================
       SYSTEM REPORT
    ===================================================== */

    report(){

        const services = {

            identity:
                this.getService("identity"),

            profile:
                this.getService("profile"),

            memory:
                this.getService("memorySystem"),

            timeline:
                this.getService("timeline"),

            guardian:
                this.getService("guardian"),

            bridge:
                this.getService("bridge"),

            evolution:
                this.getService("evolution"),

            world:
                this.getService("world"),

            entityManager:
                this.getService("entityManager"),

            appRegistry:
                this.getService("appRegistry"),

            organSystem:
                this.getService("organSystem"),

            organStatus:
                this.getService("organStatus"),

            brainIntent:
                this.getService("brainIntent"),

            brainActions:
                this.getService("brainActions"),

            brainPolicy:
                this.getService("brainActionPolicy"),

            brainContext:
                this.getService("brainContext"),

            brainAwareness:
                this.getService("brainAwareness"),

            brainSkills:
                this.getService("brainSkills"),

            brainMode:
                this.getService("brainMode"),

            brainService:
                this.getService("brainService"),

            brainCore:
                this.getService("brainCore")

        };


        const result = {};


        Object.entries(
            services
        ).forEach(
            ([key,service]) => {

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
                    ready / total * 100
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
            .replaceAll("ı","i")
            .replaceAll("ğ","g")
            .replaceAll("ü","u")
            .replaceAll("ş","s")
            .replaceAll("ö","o")
            .replaceAll("ç","c")
            .replace(/[?.!,;:]/g," ")
            .replace(/\s+/g," ")
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
       HISTORY
    ===================================================== */

    sanitizeContext(context){

        if(
            !context ||
            typeof context !== "object"
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
            typeof route !== "object"
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
                    route.requiresConfirmation
                ),

            actionType:
                route.actionType ||
                route.policy?.actionType ||
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

        this.history = [];

        return true;

    },


    /* =====================================================
       LOCAL RECEIVE
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
            typeof brainCore.route === "function"
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
            typeof route !== "object"
        ){

            route = {

                intent:{
                    type:"chat",
                    target:null,
                    operation:"general"
                },

                policy:{
                    allowed:false,
                    executable:false
                },

                executed:false,

                blocked:false,

                requiresConfirmation:false,

                executionReason:
                    "brain-core-unavailable"

            };

        }


        const intent =
            route.intent ||
            {
                type:"chat",
                target:null,
                operation:"general"
            };


        this.addHistoryRecord({

            role:"user",

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

            role:"brain",

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
            typeof brainService.ask !== "function"
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

                localFallback:true

            };

        }


        const response =
            await brainService.ask(
                cleanMessage,
                options
            );


        const context =
            response?.context ||
            this.getContext();


        const intent =
            response?.intent ||
            null;


        this.addHistoryRecord({

            role:"user",

            text:
                cleanMessage,

            context,

            intent,

            route:
                response

        });


        this.addHistoryRecord({

            role:"brain",

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
            typeof contextService.build === "function"
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
                engine?.currentEntityPage ||
                engine?.currentView ||
                "home",

            screen:
                engine?.currentView ||
                "home",

            page:
                engine?.currentEntityPage ||
                null,

            entity:
                engine?.currentOpenedEntity ||
                engine?.currentEntity ||
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
                topic:"applications",
                words:[
                    "applications",
                    "uygulamalar",
                    "uygulama",
                    "app"
                ]
            },

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
                topic:"vaero",
                words:[
                    "vaero",
                    "engine durumu",
                    "engine health"
                ]
            },

            {
                topic:"brain",
                words:[
                    "brain",
                    "beyin",
                    "sistem butunlugu"
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
                            normalizedMessage.includes(
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
                normalizedMessage.startsWith("ne ") ||
                normalizedMessage.startsWith("nasil ") ||
                normalizedMessage.startsWith("neden ") ||
                normalizedMessage.startsWith("hangi ") ||
                normalizedMessage.startsWith("kac ") ||
                normalizedMessage.includes("var mi")
            )
        ){

            messageType =
                "question";

        }


        return {

            rawMessage:
                String(
                    message ?? ""
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
            intent.type === "clarify"
        ){

            return (
                "Ne yapmak istediğini biraz daha açık yazarsan bulunduğun bağlama göre doğru işlemi belirleyebilirim."
            );

        }


        if(
            analysis.messageType === "question"
        ){

            return this.getQuestionReply(
                analysis,
                context
            );

        }


        if(
            analysis.messageType === "request"
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

            home:"Ana ekran",
            worlds:"Dünyalar",
            world:"Dünya",
            create:"Yarat",
            entities:"Varlıklar",
            identity:"Kimlik",
            profile:"Profil",
            discovery:"Discovery",
            memory:"Hafıza",
            timeline:"Zaman Çizelgesi",
            bridge:"Bridge",
            evolution:"Evolution",
            organs:"Organlar",
            applications:"Applications",
            settings:"Ayarlar",
            vaero:"VAERO",
            brain:"Brain"

        };


        if(
            intent.type === "resume:save"
        ){

            return (
                "Bulunduğun noktayı kaydettim. Daha sonra buradan devam edebiliriz."
            );

        }


        if(
            intent.type === "resume:restore"
        ){

            return (
                "Kaydettiğin devam noktasına dönüyorum."
            );

        }


        if(
            intent.type === "create" &&
            intent.target === "world"
        ){

            return (
                "Yarat ekranını açtım. Dünya adını ve amacını belirleyerek oluşturabilirsin."
            );

        }


        if(
            intent.type === "create" &&
            intent.target === "entity"
        ){

            return (
                "Varlık oluşturma akışını açtım. Önce varlık türünü seçebilirsin."
            );

        }


        if(
            intent.type === "navigate"
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


        const bridge =
            this.getService(
                "bridge"
            );


        const appRegistry =
            this.getService(
                "appRegistry"
            );


        const organStatus =
            this.getService(
                "organStatus"
            );


        const engine =
            this.getEngine();


        const worlds =
            this.safeAll(
                worldService
            );


        const entities =
            this.safeAll(
                entityManager
            );


        const evolutionEvents =
            this.safeAll(
                evolution
            );


        const memories =
            this.safeAll(
                memory
            );


        const timelineEvents =
            this.safeAll(
                timeline
            );


        const bridgeLinks =
            this.safeAll(
                bridge
            );


        const applications =
            this.safeAll(
                appRegistry
            );


        let organHealth =
            null;


        try{

            organHealth =
                organStatus?.health?.() ||
                null;

        } catch(error){

            organHealth =
                null;

        }


        return {

            worlds,

            worldCount:
                worlds.length,

            entities,

            entityCount:
                entities.length,

            evolutionEvents,

            memories,

            timelineEvents,

            bridgeLinks,

            applications,

            applicationCount:
                applications.length,

            organHealth,

            currentWorld:
                context.world ||
                engine?.currentWorld ||
                null,

            currentEntity:
                context.entity ||
                engine?.currentOpenedEntity ||
                engine?.currentEntity ||
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

        let result = null;


        try{

            if(
                window.DiscoveryApp &&
                typeof window.DiscoveryApp.getResult === "function"
            ){

                result =
                    window.DiscoveryApp.getResult();

            }

        } catch(error){

            result =
                null;

        }


        if(!result){

            try{

                const saved =
                    localStorage.getItem(
                        "vaero:discovery:result:v2"
                    );


                result =
                    saved
                        ? JSON.parse(
                            saved
                        )
                        : null;

            } catch(error){

                result =
                    null;

            }

        }


        let answers =
            result?.answers ||
            {};


        if(
            !answers ||
            typeof answers !== "object"
        ){

            answers = {};

        }


        if(
            Object.keys(
                answers
            ).length === 0
        ){

            try{

                const saved =
                    localStorage.getItem(
                        "vaero:discovery:answers"
                    );


                const parsed =
                    saved
                        ? JSON.parse(
                            saved
                        )
                        : null;


                if(
                    parsed &&
                    typeof parsed === "object" &&
                    !Array.isArray(
                        parsed
                    )
                ){

                    answers =
                        parsed;

                }

            } catch(error){

                /* ignore */
            }

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

            direction:
                result?.primaryDirection
                    ?.label ||
                null,

            directionId:
                result?.primaryDirection
                    ?.id ||
                null,

            brainMode:
                result?.signals
                    ?.brainMode ||
                null,

            recommendedApps:
                Array.isArray(
                    result?.signals
                        ?.recommendedApps
                )
                    ? [
                        ...result.signals
                            .recommendedApps
                    ]
                    : [],

            answers:
                this.clone(
                    answers
                ) || {},

            result:
                this.clone(
                    result
                )

        };

    },

   /* =====================================================
       LOCAL ENGINE KNOWLEDGE
    ===================================================== */

    getBrainKnowledge(){

        return {

            home:{
                label:"Ana ekran",
                purpose:
                    "Engine’in genel durumunu, aktif dünyanı, kısayolları ve son aktiviteleri tek merkezde gösterir."
            },

            worlds:{
                label:"Dünyalar",
                purpose:
                    "Projeleri, toplulukları ve dijital yaşam alanlarını birbirinden ayırarak yönetir."
            },

            world:{
                label:"Dünya",
                purpose:
                    "Varlıkların birlikte yaşadığı bağımsız bir proje veya topluluk alanıdır."
            },

            entities:{
                label:"Varlıklar",
                purpose:
                    "Kişi, şirket, cihaz, bilgi, topluluk veya başka bir dijital yapıyı temsil eder."
            },

            identity:{
                label:"Kimlik",
                purpose:
                    "VAERO ID, görünürlük ve kimlik doğrulama durumunu taşır."
            },

            profile:{
                label:"Profil",
                purpose:
                    "Görünen isim, bio, yetenekler, ilgi alanları ve Discovery yönünü yönetir."
            },

            discovery:{
                label:"Discovery",
                purpose:
                    "Amaç, ilgi, güçlü yön, hedef ve bağlantı sinyallerinden kişisel başlangıç yönü üretir."
            },

            memory:{
                label:"Hafıza",
                purpose:
                    "Notları, kararları, fikirleri, olayları ve önemli kalıcı bağlamları saklar."
            },

            timeline:{
                label:"Zaman Çizelgesi",
                purpose:
                    "Memory, Evolution ve sistem olaylarını kronolojik yaşam akışında birleştirir."
            },

            bridge:{
                label:"Bridge",
                purpose:
                    "İnsanlar, varlıklar ve dünyalar arasındaki kontrollü ilişki ağını temsil eder."
            },

            evolution:{
                label:"Evolution",
                purpose:
                    "Hedefleri, kararları, başarıları, kilometre taşlarını ve XP gelişimini takip eder."
            },

            organs:{
                label:"Organlar",
                purpose:
                    "Engine organlarının health, capability, permission ve dependency durumlarını gösterir."
            },

            applications:{
                label:"Applications",
                purpose:
                    "Uygulamaları keşfetme, kurma, güncelleme, izin inceleme ve kaldırma yaşam döngüsünü yönetir."
            },

            settings:{
                label:"Ayarlar",
                purpose:
                    "Privacy, Brain, Memory, Notifications, Applications, Security ve görünüm tercihlerini yönetir."
            },

            vaero:{
                label:"VAERO",
                purpose:
                    "Worlds, Entities, Memory, Evolution, Bridge, Applications, Brain ve Engine sürekliliğini tek merkezde birleştirir."
            },

            brain:{
                label:"Brain",
                purpose:
                    "Kullanıcının isteğini, mevcut bağlamı, kişisel hafızayı ve izin verilen Engine işlemlerini koordine eder."
            }

        };

    },


    /* =====================================================
       IDENTITY SNAPSHOT
    ===================================================== */

    getIdentitySnapshot(entity){

        if(!entity){
            return null;
        }


        const identityService =
            this.getService(
                "identity"
            );


        let identity =
            null;


        try{

            if(
                identityService &&
                typeof identityService.get === "function"
            ){

                identity =
                    identityService.get(
                        entity
                    ) ||
                    identityService.get(
                        entity.id
                    );

            }

        } catch(error){

            identity =
                null;

        }


        identity =
            identity ||
            entity.identity ||
            null;


        return identity;

    },


    /* =====================================================
       PROFILE SNAPSHOT
    ===================================================== */

    getProfileSnapshot(entity){

        if(!entity){
            return null;
        }


        const profileService =
            this.getService(
                "profile"
            );


        let profile =
            null;


        try{

            if(
                profileService &&
                typeof profileService.get === "function"
            ){

                profile =
                    profileService.get(
                        entity
                    ) ||
                    profileService.get(
                        entity.id
                    );

            }

        } catch(error){

            profile =
                null;

        }


        return (
            profile ||
            entity.profile ||
            null
        );

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
            analysis.topic === "worlds"
        ){

            if(
                snapshot.worldCount === 0
            ){

                return (
                    "Henüz oluşturulmuş bir dünyan yok. Yarat ekranından ilk dünyanı oluşturabilirsin."
                );

            }


            const names =
                snapshot.worlds
                    .map(
                        world =>
                            world?.name
                    )
                    .filter(Boolean)
                    .slice(0,10)
                    .join(", ");


            return names
                ? `${snapshot.worldCount} dünyan var: ${names}.`
                : `${snapshot.worldCount} dünyan var.`;

        }


        if(
            analysis.topic === "world"
        ){

            const world =
                snapshot.currentWorld;


            if(!world){

                return (
                    "Şu anda açık bir dünya yok. Dünyalar ekranından bir dünya seçebilirsin."
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
            analysis.topic === "entities"
        ){

            return (
                `Engine içinde ${snapshot.entityCount} aktif varlık kayıtlı.`
            );

        }


        if(
            analysis.topic === "identity"
        ){

            const entity =
                snapshot.currentEntity ||
                this.getEngine()
                    ?.rootEntity ||
                null;


            const identity =
                this.getIdentitySnapshot(
                    entity
                );


            if(!identity){

                return (
                    "Bu varlık için bağlı bir kimlik kaydı bulunamadı."
                );

            }


            const status =
                identity.verificationStatus ||
                (
                    identity.verified
                        ? "verified"
                        : "unverified"
                );


            const labels = {

                verified:"doğrulanmış",
                pending:"doğrulama bekliyor",
                rejected:"doğrulama reddedilmiş",
                unverified:"henüz doğrulanmamış"

            };


            return (
                `VAERO kimliği ${identity.vaId || identity.id || "tanımsız"} olarak kayıtlı ve ` +
                `${labels[status] || status} durumda.`
            );

        }


        if(
            analysis.topic === "profile"
        ){

            const entity =
                snapshot.currentEntity ||
                this.getEngine()
                    ?.rootEntity ||
                null;


            const profile =
                this.getProfileSnapshot(
                    entity
                );


            if(!profile){

                return (
                    "Bu varlık için profil kaydı bulunamadı."
                );

            }


            const displayName =
                profile.displayName ||
                entity?.name ||
                "İsimsiz profil";


            const bio =
                profile.bio ||
                "";


            return (
                `${displayName} profili aktif. ` +
                (
                    bio
                        ? `Bio: ${bio}`
                        : "Bio henüz eklenmedi."
                )
            );

        }


        if(
            analysis.topic === "discovery"
        ){

            const discovery =
                this.getDiscoveryContext();


            if(
                !discovery.completed
            ){

                return (
                    "Discovery Journey henüz tamamlanmadı. Tamamlandığında hedeflerini ve yönünü birlikte değerlendirebilirim."
                );

            }


            const lines = [

                "Discovery sonuçlarına göre:",

                "",

                `• Geliş amacın: ${discovery.purpose}`,

                `• İlgi alanların: ${discovery.interests}`,

                `• Güçlü yönlerin: ${discovery.strengths}`,

                `• Şu anki hedefin: ${discovery.goal}`,

                `• Aradığın bağlantılar: ${discovery.connections}`,

                `• VAERO tercihin: ${discovery.guidance}`

            ];


            if(
                discovery.direction
            ){

                lines.push(
                    `• İlk yönün: ${discovery.direction}`
                );

            }


            if(
                discovery.brainMode
            ){

                lines.push(
                    `• Brain modu: ${discovery.brainMode}`
                );

            }


            return lines.join(
                "\n"
            );

        }


        if(
            analysis.topic === "memory"
        ){

            const entity =
                snapshot.currentEntity;


            let records =
                snapshot.memories;


            const memory =
                this.getService(
                    "memorySystem"
                );


            if(
                entity?.id &&
                memory &&
                typeof memory.forEntity === "function"
            ){

                try{

                    records =
                        memory.forEntity(
                            entity.id
                        );

                } catch(error){

                    /* global fallback */
                }

            }


            return (
                `Hafızada ${records.length} kayıt bulunuyor.`
            );

        }


        if(
            analysis.topic === "timeline"
        ){

            const entity =
                snapshot.currentEntity;


            let events =
                snapshot.timelineEvents;


            const timeline =
                this.getService(
                    "timeline"
                );


            if(
                entity?.id &&
                timeline &&
                typeof timeline.forEntity === "function"
            ){

                try{

                    events =
                        timeline.forEntity(
                            entity.id
                        );

                } catch(error){

                    /* fallback */
                }

            }


            return (
                `Zaman Çizelgesi'nde ${events.length} olay bulunuyor.`
            );

        }


        if(
            analysis.topic === "bridge"
        ){

            const entity =
                snapshot.currentEntity;


            let links =
                snapshot.bridgeLinks;


            const bridge =
                this.getService(
                    "bridge"
                );


            if(
                entity?.id &&
                bridge &&
                typeof bridge.forEntity === "function"
            ){

                try{

                    links =
                        bridge.forEntity(
                            entity.id
                        );

                } catch(error){

                    /* fallback */
                }

            }


            return (
                `Bridge ağında ${links.length} bağlantı bulunuyor.`
            );

        }


        if(
            analysis.topic === "evolution"
        ){

            const entity =
                snapshot.currentEntity;


            let events =
                snapshot.evolutionEvents;


            const evolution =
                this.getService(
                    "evolution"
                );


            if(
                entity?.id &&
                evolution &&
                typeof evolution.forEntity === "function"
            ){

                try{

                    events =
                        evolution.forEntity(
                            entity.id
                        );

                } catch(error){

                    /* fallback */
                }

            }


            const xp =
                events.reduce(
                    (
                        total,
                        event
                    ) =>
                        total +
                        (
                            Number(
                                event?.xp
                            ) ||
                            0
                        ),
                    0
                );


            return (
                `Evolution geçmişinde ${events.length} olay ve toplam ${xp} XP bulunuyor.`
            );

        }


        if(
            analysis.topic === "applications"
        ){

            const apps =
                snapshot.applications;


            const organSystem =
                this.getService(
                    "organSystem"
                );


            const installed =
                apps.filter(
                    app => {

                        if(
                            app.system === true ||
                            app.distribution === "built-in"
                        ){
                            return true;
                        }


                        try{

                            return Boolean(
                                organSystem?.get?.(
                                    app.id
                                )?.installed
                            );

                        } catch(error){

                            return false;

                        }

                    }
                );


            return (
                `Applications kataloğunda ${apps.length} uygulama var. ` +
                `${installed.length} tanesi Engine içinde kullanılabilir durumda.`
            );

        }


        if(
            analysis.topic === "organs"
        ){

            const health =
                snapshot.organHealth;


            if(!health){

                return (
                    "Organ health servisi şu anda kullanılabilir değil."
                );

            }


            return (
                `Engine organ durumu ${health.status}. ` +
                `Ortalama health ${health.averageHealth ?? "—"}%. ` +
                `${health.active}/${health.total} organ aktif.`
            );

        }


        if(
            analysis.topic === "vaero"
        ){

            const health =
                snapshot.organHealth;


            return (
                `VAERO Engine'de ${snapshot.worldCount} world, ` +
                `${snapshot.entityCount} entity, ` +
                `${snapshot.applicationCount} application kayıtlı. ` +
                `Organ durumu ${health?.status || "bilinmiyor"}.`
            );

        }


        if(
            analysis.topic === "brain"
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

    getRequestReply(analysis){

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
            analysis.operation === "delete"
        ){

            return (
                `${knowledge.label} ile ilgili silme işlemi kullanıcı onayı olmadan uygulanmaz.`
            );

        }


        if(
            analysis.operation === "edit"
        ){

            return (
                `${knowledge.label} düzenleme isteğini anladım. Güvenli düzenleme yüzeyi üzerinden ilerlemelisin.`
            );

        }


        if(
            analysis.operation === "search"
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
                typeof mode.snapshot === "function"
                    ? mode.snapshot()
                    : null,

            provider:
                providerCore &&
                typeof providerCore.getProviderInfo === "function"
                    ? providerCore.getProviderInfo()
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
            typeof events.on === "function"
        ){

            try{

                events.on(
                    "engine.started",
                    () => {

                        const awareness =
                            this.getService(
                                "brainAwareness"
                            );


                        if(
                            awareness &&
                            typeof awareness.enter === "function"
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


            try{

                events.on(
                    "discovery:completed",
                    payload => {

                        const awareness =
                            this.getService(
                                "brainAwareness"
                            );


                        awareness?.enter?.(
                            "discovery",
                            {
                                source:
                                    "discovery:completed",

                                direction:
                                    payload
                                        ?.result
                                        ?.primaryDirection
                                        ?.id ||
                                    null,

                                brainMode:
                                    payload
                                        ?.result
                                        ?.signals
                                        ?.brainMode ||
                                    null
                            }
                        );

                    }
                );

            } catch(error){

                /* optional */
            }

        }


        if(
            events &&
            typeof events.emit === "function"
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
