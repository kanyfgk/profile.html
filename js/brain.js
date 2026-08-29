const Brain = {

    history: [],
    sessions: [],
    resumePoint: null,

    maxHistoryItems: 100,
    booted: false,

    /*
     * =====================================================
     * ID
     * =====================================================
     */

    createId(){

        if(
            typeof crypto !==
                "undefined" &&
            typeof crypto.randomUUID ===
                "function"
        ){
            return crypto.randomUUID();
        }

        return `brain_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;

    },

    /*
     * =====================================================
     * SYSTEM REPORT
     * =====================================================
     */

    report(){

        const services = {

            identity:
                VAERO.get(
                    "identity"
                ),

            profile:
                VAERO.get(
                    "profile"
                ),

            memory:
                VAERO.get(
                    "memorySystem"
                ),

            timeline:
                VAERO.get(
                    "timeline"
                ),

            guardian:
                VAERO.get(
                    "guardian"
                ),

            bridge:
                VAERO.get(
                    "bridge"
                ),

            evolution:
                VAERO.get(
                    "evolution"
                ),

            world:
                VAERO.get(
                    "world"
                ),

            entityManager:
                VAERO.get(
                    "entityManager"
                ),

            brainIntent:
                VAERO.get(
                    "brainIntent"
                ),

            brainActions:
                VAERO.get(
                    "brainActions"
                ),

            brainPolicy:
                VAERO.get(
                    "brainActionPolicy"
                ),

            brainContext:
                VAERO.get(
                    "brainContext"
                ),

            brainCore:
                VAERO.get(
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

        const serviceKeys =
            Object.keys(
                services
            );

        const ready =
            serviceKeys.filter(
                key =>
                    result[key] ===
                    "OK"
            ).length;

        const total =
            serviceKeys.length;

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

        result.missing =
            serviceKeys.filter(
                key =>
                    result[key] ===
                    "MISSING"
            );

        return result;

    },

    /*
     * =====================================================
     * NORMALIZATION
     * =====================================================
     */

    normalizeMessage(message){

        return String(
            message || ""
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
                /[-_/\\]/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    },

    tokenizeMessage(message){

        return this
            .normalizeMessage(
                message
            )
            .split(" ")
            .filter(Boolean);

    },

    phraseMatches(
        message,
        phrase
    ){

        const text =
            this.normalizeMessage(
                message
            );

        const normalizedPhrase =
            this.normalizeMessage(
                phrase
            );

        if(
            !text ||
            !normalizedPhrase
        ){
            return false;
        }

        if(
            normalizedPhrase.includes(
                " "
            )
        ){

            return (
                ` ${text} `
            ).includes(
                ` ${normalizedPhrase} `
            );

        }

        return this
            .tokenizeMessage(
                text
            )
            .includes(
                normalizedPhrase
            );

    },

    /*
     * =====================================================
     * HISTORY
     * =====================================================
     */

    addHistoryRecord(
        record = {}
    ){

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

    /*
     * =====================================================
     * RECEIVE
     * =====================================================
     */

    receive(
        message,
        context = {}
    ){

        const cleanMessage =
            String(
                message || ""
            ).trim();

        if(!cleanMessage){
            return null;
        }

        const brainCore =
            VAERO.get(
                "brainCore"
            );

        let route = null;

        try {

            route =
                brainCore &&
                typeof brainCore.route ===
                    "function"
                    ? brainCore.route(
                        cleanMessage,
                        context
                    )
                    : this.createFallbackRoute();

        } catch(error){

            console.error(
                "Brain routing failed:",
                error
            );

            route =
                this.createFallbackRoute({
                    error:
                        true,

                    reason:
                        "Brain routing sırasında sistem hatası oluştu."
                });

        }

        const intent =
            route?.intent || {

                type:
                    "chat",

                target:
                    null,

                operation:
                    "general",

                confidence:
                    0,

                explicit:
                    false

            };

        this.addHistoryRecord({

            role:
                "user",

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

            role:
                "brain",

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

    createFallbackRoute(
        options = {}
    ){

        return {

            intent: {

                type:
                    "chat",

                target:
                    null,

                operation:
                    "general",

                confidence:
                    0,

                explicit:
                    false

            },

            policy: {

                allowed:
                    false,

                executable:
                    false,

                requiresConfirmation:
                    false,

                blocked:
                    false,

                actionType:
                    null,

                reason:
                    options.reason ||
                    "BrainCore kullanılamıyor."

            },

            executed:
                false,

            actionResult:
                null,

            blocked:
                false,

            requiresConfirmation:
                false,

            error:
                Boolean(
                    options.error
                )

        };

    },

    /*
     * =====================================================
     * MESSAGE ANALYSIS
     * =====================================================
     */

    getTopicDefinitions(){

        return [

            {
                topic:
                    "discovery",

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
                topic:
                    "worlds",

                words: [
                    "dunyalar",
                    "dunyalarim",
                    "dunya listesi"
                ]
            },

            {
                topic:
                    "world",

                words: [
                    "aktif dunya",
                    "dunyam",
                    "dunya"
                ]
            },

            {
                topic:
                    "entities",

                words: [
                    "varliklar",
                    "varliklarim",
                    "varlik",
                    "entities",
                    "entity"
                ]
            },

            {
                topic:
                    "profile",

                words: [
                    "profilim",
                    "profil",
                    "profile"
                ]
            },

            {
                topic:
                    "identity",

                words: [
                    "kimligim",
                    "kimlik",
                    "identity"
                ]
            },

            {
                topic:
                    "memory",

                words: [
                    "hafizam",
                    "hafiza",
                    "memory"
                ]
            },

            {
                topic:
                    "timeline",

                words: [
                    "timeline",
                    "zaman cizelgesi",
                    "zaman akisi"
                ]
            },

            {
                topic:
                    "bridge",

                words: [
                    "kopru",
                    "bridge",
                    "baglanti",
                    "baglantilar"
                ]
            },

            {
                topic:
                    "evolution",

                words: [
                    "evrim",
                    "evolution",
                    "yasam olayi",
                    "gelisim"
                ]
            },

            {
                topic:
                    "organs",

                words: [
                    "organ",
                    "organlar"
                ]
            },

            {
                topic:
                    "settings",

                words: [
                    "ayar",
                    "ayarlar",
                    "settings"
                ]
            },

            {
                topic:
                    "brain",

                words: [
                    "brain",
                    "beyin",
                    "sistem durumu"
                ]
            },

            {
                topic:
                    "home",

                words: [
                    "ana ekran",
                    "ana sayfa",
                    "home"
                ]
            }

        ];

    },

    detectMentionedTopic(
        message
    ){

        const definitions =
            this.getTopicDefinitions();

        const matches = [];

        definitions.forEach(
            definition => {

                definition.words.forEach(
                    word => {

                        if(
                            this.phraseMatches(
                                message,
                                word
                            )
                        ){

                            matches.push({

                                topic:
                                    definition.topic,

                                phrase:
                                    word,

                                length:
                                    this
                                        .normalizeMessage(
                                            word
                                        )
                                        .length

                            });

                        }

                    }
                );

            }
        );

        matches.sort(
            (a, b) =>
                b.length -
                a.length
        );

        return (
            matches[0]?.topic ||
            null
        );

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

        const mentionedTopic =
            this.detectMentionedTopic(
                normalizedMessage
            );

        const contextTopic =
            context?.page ||
            context?.screen ||
            context?.app ||
            null;

        /*
         * BrainIntent her zaman birinci
         * otoritedir.
         *
         * Brain yalnızca Intent'in hedef
         * üretmediği konuşmalarda kendi
         * topic fallback sistemini kullanır.
         */
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
            ![
                "question",
                "request",
                "navigate",
                "create",
                "resume:save",
                "resume:restore",
                "clarify",
                "chat",
                "empty"
            ].includes(
                messageType
            )
        ){
            messageType =
                "chat";
        }

        /*
         * BrainIntent yoksa veya eski bir
         * provider düşük bilgi döndürürse
         * yalnızca soru fallback'i çalışır.
         *
         * Bu fallback hiçbir sistem işlemi
         * üretmez.
         */
        if(
            messageType ===
                "chat" &&
            (
                normalizedMessage
                    .startsWith(
                        "ne "
                    ) ||
                normalizedMessage
                    .startsWith(
                        "nasil "
                    ) ||
                normalizedMessage
                    .startsWith(
                        "neden "
                    ) ||
                normalizedMessage
                    .startsWith(
                        "hangi "
                    ) ||
                normalizedMessage
                    .startsWith(
                        "kac "
                    ) ||
                normalizedMessage
                    .includes(
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
                    message || ""
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
                Number(
                    intent.confidence
                ) || .35

        };

    },

    /*
     * =====================================================
     * REPLY ROUTER
     * =====================================================
     */

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

        /*
         * =================================================
         * BLOCKED
         * =================================================
         */

        if(
            route?.blocked ||
            route?.policy?.blocked
        ){

            return (
                route?.policy?.reason ||
                "Bu işlem güvenlik nedeniyle Brain tarafından uygulanamaz."
            );

        }

        /*
         * =================================================
         * CONFIRMATION
         * =================================================
         */

        if(
            route
                ?.requiresConfirmation ||
            route
                ?.policy
                ?.requiresConfirmation
        ){

            return (
                route?.policy?.reason ||
                "Bu işlemi uygulamadan önce onayın gerekiyor."
            );

        }

        /*
         * =================================================
         * SUCCESSFUL EXECUTION
         * =================================================
         */

        if(
            route?.executed
        ){

            return this
                .getExecutedReply(
                    intent,
                    route
                );

        }

        /*
         * =================================================
         * FAILED EXECUTION
         * =================================================
         *
         * Policy işlemi güvenli bulmuş olabilir
         * fakat Actions katmanı çalışamamış
         * olabilir.
         *
         * Brain bu durumda işlem olmuş gibi
         * konuşmaz.
         */

        if(
            route?.policy?.allowed &&
            route?.policy?.executable &&
            (
                route?.actionResult ||
                route?.actionResult
                    ?.success === false
            )
        ){

            return this
                .getFailedExecutionReply(
                    intent,
                    route
                );

        }

        /*
         * Policy SAFE + executable olmasına
         * rağmen ActionResult hiç oluşmadıysa
         * action servisi eksik olabilir.
         */
        if(
            route?.policy?.allowed &&
            route?.policy?.executable &&
            !route?.executed &&
            !route?.actionResult
        ){

            return (
                route?.policy?.reason ||
                "İşlem tanındı ancak şu anda uygulanamadı."
            );

        }

        /*
         * =================================================
         * CLARIFY
         * =================================================
         */

        if(
            intent.type ===
                "clarify"
        ){

            return "Ne yapmak istediğini biraz daha açık yazarsan bulunduğun ekrana göre doğru işlemi belirleyebilirim.";

        }

        /*
         * =================================================
         * QUESTION
         * =================================================
         */

        if(
            analysis.messageType ===
                "question"
        ){

            return this
                .getQuestionReply(
                    analysis,
                    context
                );

        }

        /*
         * =================================================
         * REQUEST
         * =================================================
         */

        if(
            analysis.messageType ===
                "request"
        ){

            return this
                .getRequestReply(
                    analysis
                );

        }

        /*
         * =================================================
         * CHAT / CONTEXT
         * =================================================
         */

        return this
            .getContextualGuidance(
                analysis.topic,
                context
            );

    },

    /*
     * =====================================================
     * EXECUTED REPLIES
     * =====================================================
     */

    getExecutedReply(
        intent,
        route
    ){

        const result =
            route?.actionResult ||
            {};

        const meta =
            result?.meta ||
            {};

        const actualAction =
            result?.action ||
            null;

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

        /*
         * =================================================
         * RESUME
         * =================================================
         */

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

            return "Kaydettiğin devam noktasına döndüm.";

        }

        /*
         * =================================================
         * WORLD CREATE FLOW
         * =================================================
         */

        if(
            intent.type ===
                "create" &&
            intent.target ===
                "world"
        ){

            return "Yarat ekranını açtım. Dünya adını ve amacını belirleyerek oluşturabilirsin.";

        }

        /*
         * =================================================
         * ENTITY CREATE FLOW
         * =================================================
         */

        if(
            intent.type ===
                "create" &&
            intent.target ===
                "entity"
        ){

            /*
             * Aktif dünya olmadığı için
             * BrainActions Dünyalar ekranına
             * yönlendirdiyse gerçek yapılan
             * işlemi söyleriz.
             */
            if(
                meta.redirected &&
                meta.redirectTarget ===
                    "worlds"
            ){

                return "Önce varlığın ekleneceği dünyayı seçmen gerekiyor. Dünyalar ekranını açtım; bir dünya seçtikten sonra varlık oluşturma akışını başlatabilirsin.";

            }

            return "Varlık oluşturma akışını açtım. Önce varlık türünü seçebilirsin.";

        }

        /*
         * =================================================
         * NAVIGATION
         * =================================================
         */

        if(
            intent.type ===
                "navigate"
        ){

            /*
             * Kullanıcı aktif dünyayı aç dedi
             * fakat aktif dünya yoktu.
             *
             * BrainActions bu durumda Dünyalar
             * ekranına fallback yapar.
             */
            if(
                intent.target ===
                    "world" &&
                actualAction ===
                    "worlds:open"
            ){

                return "Şu anda açık bir dünya olmadığı için Dünyalar ekranını açtım.";

            }

            const label =
                targetNames[
                    intent.target
                ] ||
                intent.target ||
                "Hedef ekran";

            return `${label} açıldı.`;

        }

        /*
         * =================================================
         * EDIT FLOW
         * =================================================
         */

        if(
            intent.type ===
                "request" &&
            intent.operation ===
                "edit"
        ){

            const label =
                targetNames[
                    intent.target
                ] ||
                intent.target ||
                "İlgili";

            return `${label} ekranını açtım. Değişikliği buradan güvenli şekilde yapabilirsin.`;

        }

        /*
         * =================================================
         * SEARCH FLOW
         * =================================================
         */

        if(
            intent.type ===
                "request" &&
            intent.operation ===
                "search"
        ){

            if(
                intent.target ===
                    "world" ||
                intent.target ===
                    "worlds"
            ){

                return "Dünyalar ekranını açtım. Mevcut dünyalarını buradan inceleyebilirsin.";

            }

            if(
                intent.target ===
                    "entities"
            ){

                return "Varlıklar ekranını açtım. Mevcut varlıkları buradan inceleyebilirsin.";

            }

        }

        /*
         * BrainActions özel açıklama döndürdüyse
         * generic mesajdan önce onu kullan.
         */
        if(
            result.reason
        ){
            return result.reason;
        }

        return "İşlem uygulandı.";

    },

    /*
     * =====================================================
     * FAILED EXECUTION REPLY
     * =====================================================
     */

    getFailedExecutionReply(
        intent,
        route
    ){

        const result =
            route?.actionResult ||
            null;

        if(
            result?.reason
        ){
            return result.reason;
        }

        if(
            route?.policy?.reason
        ){
            return route.policy.reason;
        }

        if(
            intent.type ===
                "navigate"
        ){
            return "İstediğin ekran şu anda açılamadı.";
        }

        if(
            intent.type ===
                "create"
        ){
            return "Oluşturma akışı şu anda başlatılamadı.";
        }

        if(
            intent.type ===
                "resume:save"
        ){
            return "Devam noktası kaydedilemedi.";
        }

        if(
            intent.type ===
                "resume:restore"
        ){
            return "Kaydedilmiş devam noktası açılamadı.";
        }

        return "İşlem tanındı ancak şu anda uygulanamadı.";

    },

    /*
     * =====================================================
     * SYSTEM SNAPSHOT
     * =====================================================
     */

    toArray(value){

        return Array.isArray(
            value
        )
            ? value
            : [];

    },

    getSystemSnapshot(
        context = {}
    ){

        const worldService =
            VAERO.get(
                "world"
            );

        const entityManager =
            VAERO.get(
                "entityManager"
            );

        const evolution =
            VAERO.get(
                "evolution"
            );

        const memory =
            VAERO.get(
                "memorySystem"
            );

        const timeline =
            VAERO.get(
                "timeline"
            );

        const worlds =
            worldService &&
            typeof worldService.all ===
                "function"
                ? this.toArray(
                    worldService.all()
                )
                : [];

        const worldEntities =
            worlds.flatMap(
                world =>
                    this.toArray(
                        world?.entities
                    )
            );

        const registeredEntities =
            entityManager &&
            typeof entityManager.all ===
                "function"
                ? this.toArray(
                    entityManager.all()
                )
                : [];

        const evolutionEvents =
            evolution &&
            typeof evolution.all ===
                "function"
                ? this.toArray(
                    evolution.all()
                )
                : [];

        const memories =
            memory &&
            typeof memory.all ===
                "function"
                ? this.toArray(
                    memory.all()
                )
                : [];

        const timelineEvents =
            timeline &&
            typeof timeline.all ===
                "function"
                ? this.toArray(
                    timeline.all()
                )
                : [];

        return {

            worlds,

            worldCount:
                worlds.length,

            entities:
                worldEntities,

            entityCount:
                worldEntities.length,

            registeredEntityCount:
                registeredEntities.length,

            evolutionEvents,

            memories,

            timelineEvents,

            currentWorld:
                context?.world ||
                VAERO.engine
                    ?.currentWorld ||
                null,

            currentEntity:
                context?.entity ||
                VAERO.engine
                    ?.currentOpenedEntity ||
                null,

            currentScreen:
                context?.screen ||
                VAERO.engine
                    ?.currentView ||
                "home"

        };

    },

    /*
     * =====================================================
     * DISCOVERY
     * =====================================================
     */

    getDiscoveryContext(){

        let answers = {};

        try {

            const evolution =
                VAERO.get(
                    "evolution"
                );

            const events =
                evolution &&
                typeof evolution.all ===
                    "function"
                    ? this.toArray(
                        evolution.all()
                    )
                    : [];

            /*
             * En güncel Discovery kaydı
             * tercih edilir.
             */
            const event =
                [...events]
                    .reverse()
                    .find(
                        item =>
                            item?.source ===
                                "discovery" &&
                            item?.payload
                                ?.discoveryAnswers
                    ) ||
                null;

            if(event){

                answers = {
                    ...event
                        .payload
                        .discoveryAnswers
                };

            }

            if(
                Object.keys(
                    answers
                ).length === 0
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

                    const cleaned =
                        value
                            .map(
                                item =>
                                    String(
                                        item ||
                                        ""
                                    ).trim()
                            )
                            .filter(
                                Boolean
                            );

                    return (
                        cleaned.join(
                            ", "
                        ) ||
                        "Henüz belirlenmedi"
                    );

                }

                const clean =
                    String(
                        value ||
                        ""
                    ).trim();

                return (
                    clean ||
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

            answers

        };

    },

    /*
     * =====================================================
     * BRAIN KNOWLEDGE
     * =====================================================
     */

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

    /*
     * =====================================================
     * QUESTION REPLIES
     * =====================================================
     */

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

        /*
         * =================================================
         * WORLDS
         * =================================================
         */

        if(
            analysis.topic ===
                "worlds"
        ){

            if(
                snapshot.worldCount ===
                    0
            ){

                return "Henüz oluşturulmuş bir dünyan yok. Yarat ekranından ilk dünyanı oluşturabilirsin.";

            }

            const names =
                snapshot.worlds
                    .map(
                        world =>
                            String(
                                world?.name ||
                                ""
                            ).trim()
                    )
                    .filter(
                        Boolean
                    );

            if(
                names.length === 0
            ){

                return `${snapshot.worldCount} dünyan var.`;

            }

            return `${snapshot.worldCount} dünyan var: ${names.join(", ")}.`;

        }

        /*
         * =================================================
         * CURRENT WORLD
         * =================================================
         */

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
                this.toArray(
                    world.entities
                ).length;

            const worldName =
                world.name ||
                "Seçili dünya";

            return `${worldName} açık. Bu dünyada ${entityCount} varlık bulunuyor.`;

        }

        /*
         * =================================================
         * ENTITIES
         * =================================================
         */

        if(
            analysis.topic ===
                "entities"
        ){

            return `Dünyalarında toplam ${snapshot.entityCount} varlık bulunuyor.`;

        }

        /*
         * =================================================
         * IDENTITY
         * =================================================
         */

        if(
            analysis.topic ===
                "identity"
        ){

            const entity =
                snapshot.currentEntity ||
                VAERO.engine
                    ?.rootEntity ||
                null;

            const identity =
                entity?.identity ||
                null;

            if(!identity){

                return "Bu varlık için bağlı bir kimlik kaydı bulunamadı.";

            }

            const identityId =
                identity.id ||
                "bilinmeyen";

            return `Kimlik ${identityId} numarasıyla kayıtlı ve ${
                identity.verified
                    ? "doğrulanmış"
                    : "henüz doğrulanmamış"
            } durumda.`;

        }

        /*
         * =================================================
         * PROFILE
         * =================================================
         */

        if(
            analysis.topic ===
                "profile"
        ){

            const currentEntity =
                snapshot.currentEntity;

            const rootEntity =
                VAERO.engine
                    ?.rootEntity ||
                null;

            /*
             * Özel bir varlık açıksa onun
             * profil bilgisi kullanılır.
             */
            if(
                currentEntity &&
                currentEntity.id &&
                currentEntity.id !==
                    rootEntity?.id
            ){

                const profile =
                    currentEntity.profile ||
                    null;

                const entityName =
                    profile?.name ||
                    currentEntity.name ||
                    null;

                if(entityName){

                    const description =
                        profile
                            ?.description ||
                        currentEntity
                            ?.description ||
                        "";

                    return `Profil adı ${entityName}. ${
                        description
                            ? `Açıklama: ${description}`
                            : "Profil açıklaması henüz eklenmedi."
                    }`;

                }

                return "Bu varlığın profil bilgileri henüz tamamlanmadı.";

            }

            /*
             * Root kullanıcı profilinin
             * kişiselleştirilmiş local kaydı.
             */
            let userProfile =
                null;

            try {

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

            } catch(error){

                console.warn(
                    "Brain profil kaydını okuyamadı:",
                    error
                );

                userProfile =
                    null;

            }

            if(
                userProfile?.name
            ){

                return `Profil adı ${userProfile.name}. ${
                    userProfile.description
                        ? `Açıklama: ${userProfile.description}`
                        : "Profil açıklaması henüz eklenmedi."
                }`;

            }

            /*
             * Local kişiselleştirme yoksa
             * root entity profiline bak.
             */
            const rootProfile =
                rootEntity?.profile ||
                null;

            const rootName =
                rootProfile?.name ||
                rootEntity?.name ||
                null;

            if(rootName){

                const description =
                    rootProfile
                        ?.description ||
                    rootEntity
                        ?.description ||
                    "";

                return `Profil adı ${rootName}. ${
                    description
                        ? `Açıklama: ${description}`
                        : "Profil açıklaması henüz eklenmedi."
                }`;

            }

            return "Profil adı henüz kişiselleştirilmedi. Profil ekranından adını ve açıklamanı ekleyebilirsin.";

        }

        /*
         * =================================================
         * DISCOVERY
         * =================================================
         */

        if(
            analysis.topic ===
                "discovery"
        ){

            const discovery =
                this
                    .getDiscoveryContext();

            if(
                !discovery.completed
            ){

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

            ].join(
                "\n"
            );

        }

        /*
         * =================================================
         * MEMORY
         * =================================================
         */

        if(
            analysis.topic ===
                "memory"
        ){

            return `Hafızada ${snapshot.memories.length} kayıt bulunuyor.`;

        }

        /*
         * =================================================
         * TIMELINE
         * =================================================
         */

        if(
            analysis.topic ===
                "timeline"
        ){

            return `Zaman çizelgesinde ${snapshot.timelineEvents.length} olay bulunuyor.`;

        }

        /*
         * =================================================
         * EVOLUTION
         * =================================================
         */

        if(
            analysis.topic ===
                "evolution"
        ){

            return `Evrim geçmişinde ${snapshot.evolutionEvents.length} yaşam olayı bulunuyor.`;

        }

        /*
         * =================================================
         * BRAIN STATUS
         * =================================================
         */

        if(
            analysis.topic ===
                "brain"
        ){

            const status =
                this.report();

            if(
                status.missing
                    .length === 0
            ){

                return `Brain sistem bütünlüğü ${status.integrity}. Intent, Policy, Actions, Context ve Core katmanları bağlı.`;

            }

            return `Brain sistem bütünlüğü ${status.integrity}. Eksik servisler: ${status.missing.join(", ")}.`;

        }

        /*
         * =================================================
         * STATIC KNOWLEDGE
         * =================================================
         */

        if(knowledge){

            return `${knowledge.label}: ${knowledge.purpose}`;

        }

        return "Sorunun bağlamını aldım ancak hangi Engine alanını sorduğunu biraz daha açık belirtmelisin.";

    },

    /*
     * =====================================================
     * REQUEST REPLIES
     * =====================================================
     */

    getRequestReply(
        analysis
    ){

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
                "restore"
        ){

            return `${knowledge.label} ile ilgili geri yükleme işlemi kullanıcı onayı gerektiriyor.`;

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

    /*
     * =====================================================
     * CONTEXTUAL GUIDANCE
     * =====================================================
     */

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
            context?.screen ||
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

    /*
     * =====================================================
     * BOOT
     * =====================================================
     */

    boot(){

        if(this.booted){

            return this.report();

        }

        this.booted =
            true;

        const status =
            this.report();

        console.log(
            "VAERO Brain Online"
        );

        console.log(
            status
        );

        const events =
            VAERO.get(
                "events"
            );

        if(events){

            if(
                typeof events.on ===
                    "function"
            ){

                events.on(
                    "engine.started",
                    data => {

                        console.log(
                            "Brain received engine event:",
                            data
                        );

                    }
                );

            }

            if(
                typeof events.emit ===
                    "function"
            ){

                events.emit(
                    "brain.online",
                    status
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
