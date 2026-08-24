const Actions = {

    brainOutsideHandler: null,

    createId(prefix = "item"){

        if(
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ){
            return crypto.randomUUID();
        }

        return `${prefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;

    },

    openHome(){

        return VAERO.engine.openHome();

    },

    openIdentity(){

        const entity =
            VAERO.engine.rootEntity ||
            VAERO.engine.currentEntity;

        if(!entity){
            return false;
        }

        VAERO.engine.currentOpenedEntity =
            entity;

        VAERO.engine.currentEntityPage =
            "identity";

        return VAERO.engine.setView(
            "identity",
            {
                entity,
                page: "identity",
                world: null,
                entityCreateMode: false,
                entityType: null
            }
        );

    },

openVaeroApp(){

    VAERO.engine.currentWorld = null;
    VAERO.engine.currentOpenedEntity = null;
    VAERO.engine.currentEntityPage = "vaero";

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

}, 

openProfile(){
        const entity =
            VAERO.engine.rootEntity ||
            VAERO.engine.currentEntity;

        if(!entity){
            return false;
        }

        VAERO.engine.currentOpenedEntity =
            entity;

        VAERO.engine.currentEntityPage =
            "profile";

        return VAERO.engine.setView(
            "profile",
            {
                entity,
                page: "profile",
                world: null,
                entityCreateMode: false,
                entityType: null
            }
        );

    },

    openCreate(){

        return VAERO.engine.setView(
            "create",
            {
                entity: null,
                page: null,
                world: null,
                entityCreateMode: false,
                entityType: null
            }
        );

},

openVaeroDevice(){

    VAERO.engine.currentEntityPage =
        "vaero-device";

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

},

openVaeroCollection(){

    VAERO.engine.currentEntityPage =
        "vaero-collection";

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

},

openVaeroProduct(productId){

    VAERO.engine.currentEntityPage =
        "vaero-product";

    VAERO.engine.currentVaeroProduct =
        productId;

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

},

    selectVaeroProductVariant(
    productId,
    variantId
){

    if(
        !window.VaeroApp ||
        !VaeroApp.getProductVariant(
            productId,
            variantId
        )
    ){
        return false;
    }

    VAERO.engine.currentVaeroProduct =
        productId;

    VAERO.engine.currentVaeroVariant =
        variantId;

    VAERO.engine.currentEntityPage =
        "vaero-product";

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

    return true;

},

addVaeroProductToCart(
    productId,
    variantId = null
){

    if(
        !window.VaeroApp ||
        typeof VaeroApp.addToCart !== "function"
    ){
        console.error(
            "VAERO sepet sistemi bulunamadı."
        );

        return false;
    }

    const cart =
        VaeroApp.addToCart(
            productId,
            variantId,
            1
        );

    if(!cart){
        return false;
    }

    VAERO.engine.currentVaeroCart =
        cart;

    console.log(
        "VAERO ürünü sepete eklendi:",
        {
            productId,
            cart
        }
    );

    return true;

},

openVaeroCart(){

    if(!window.VaeroApp){
        return false;
    }

    VAERO.engine.currentVaeroCart =
        VaeroApp.loadCart();

    VAERO.engine.currentEntityPage =
        "vaero-cart";

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

    return true;

},

increaseVaeroCartItem(
    productId,
    variantId = null
){

    const cart =
        VaeroApp.increaseCartItem(
    productId,
    variantId
);

    if(!cart){
        return false;
    }

    VAERO.engine.currentVaeroCart =
        cart;

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

    return true;

},

decreaseVaeroCartItem(
    productId,
    variantId = null
){

    const cart =
        VaeroApp.decreaseCartItem(
    productId,
    variantId
);

    if(!cart){
        return false;
    }

    VAERO.engine.currentVaeroCart =
        cart;

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

    return true;

},

removeVaeroCartItem(
    productId,
    variantId = null
){

    const cart =
        VaeroApp.removeFromCart(
            productId,
            variantId
        );

    if(!cart){
        return false;
    }

    VAERO.engine.currentVaeroCart =
        cart;

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

    return true;

},

clearVaeroCart(){

    const cart =
        VaeroApp.clearCart();

    if(!cart){
        return false;
    }

    VAERO.engine.currentVaeroCart =
        cart;

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

    return true;

},

    startVaeroCheckout(){

    if(
        !window.VaeroApp ||
        typeof VaeroApp.createCheckoutDraft !==
            "function"
    ){
        return false;
    }

    const checkout =
        VaeroApp.createCheckoutDraft();

    if(!checkout){
        return false;
    }

    VAERO.engine.currentVaeroCheckout =
        checkout;
        VAERO.engine.currentEntityPage =
    "vaero-checkout";

VAERO.engine.mount(
    VAERO.engine.currentEntity
);

    console.log(
        "VAERO checkout taslağı oluşturuldu:",
        checkout
    );

    return true;

},

    selectVaeroPaymentMethod(method){

    if(
        !window.VaeroApp ||
        typeof VaeroApp.setCheckoutPaymentMethod !==
            "function"
    ){
        return false;
    }

    const checkout =
        VaeroApp.setCheckoutPaymentMethod(
            method
        );

    if(!checkout){
        return false;
    }

    VAERO.engine.currentVaeroCheckout =
        checkout;

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

    return true;

},

    startVaeroPayment(){

    if(
        !window.VaeroApp ||
        typeof VaeroApp.startCheckoutPayment !==
            "function"
    ){
        return false;
    }

    const checkout =
        VaeroApp.startCheckoutPayment();

    if(!checkout){
        return false;
    }

    VAERO.engine.currentVaeroCheckout =
        checkout;

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

    console.log(
        "VAERO ödeme süreci başlatıldı:",
        checkout
    );

    return true;

},

    completeVaeroPayment(successful){

    if(
        !window.VaeroApp ||
        typeof VaeroApp.completeCheckoutPayment !==
            "function"
    ){
        return false;
    }

    const checkout =
        VaeroApp.completeCheckoutPayment(
            Boolean(successful)
        );

    if(!checkout){
        return false;
    }

    VAERO.engine.currentVaeroCheckout =
        checkout;

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

    return true;

},

    createVaeroOrder(){

    if(
        !window.VaeroApp ||
        typeof VaeroApp.createOrderFromCheckout !==
            "function"
    ){
        return false;
    }

    const order =
        VaeroApp.createOrderFromCheckout();

    if(!order){
        return false;
    }

    VaeroApp.clearCart();

    VAERO.engine.currentVaeroOrder =
        order;

    VAERO.engine.currentEntityPage =
        "vaero-order-success";

    VAERO.engine.mount(
        VAERO.engine.currentEntity
    );

    return true;

},

    openWorlds(){

        return VAERO.engine.setView(
            "worlds",
            {
                entity: null,
                page: null,
                world: null,
                entityCreateMode: false,
                entityType: null
            }
        );

    },

    openEntities(){

        const worldService =
            VAERO.get("world");

        const worlds =
            worldService &&
            typeof worldService.all === "function"
                ? worldService.all()
                : [];

        const targetWorld =
            VAERO.engine.currentWorld ||
            worlds.find(
                world =>
                    world.status === "active"
            ) ||
            worlds[0] ||
            null;

        if(!targetWorld){
            return this.openWorlds();
        }

        return this.openWorld(
            targetWorld.id
        );

    },

    openWorld(worldId){

        const worldService =
            VAERO.get("world");

        if(!worldService){
            console.error(
                "World service not found."
            );

            return false;
        }

        const world =
            typeof worldService.get === "function"
                ? worldService.get(worldId)
                : worldService
                    .all()
                    .find(
                        item =>
                            item.id === worldId
                    );

        if(!world){

            console.error(
                "World not found:",
                worldId
            );

            return false;

        }

        if(!Array.isArray(world.entities)){
            world.entities = [];
        }

        return VAERO.engine.setView(
            "world",
            {
                world,
                entity: null,
                page: null,
                entityCreateMode: false,
                entityType: null
            }
        );

    },

    createWorld(){

        const nameInput =
            document.getElementById(
                "worldNameInput"
            );

        const descriptionInput =
            document.getElementById(
                "worldDescriptionInput"
            );

        const name =
            String(
                nameInput?.value || ""
            ).trim();

        if(!name){

            nameInput?.focus();

            return false;

        }

        const worldService =
            VAERO.get("world");

        if(!worldService){

            console.error(
                "World service not found."
            );

            return false;

        }

        const world =
            worldService.create({
                id:
                    this.createId("world"),

                name,

                description:
                    String(
                        descriptionInput?.value ||
                        ""
                    ).trim(),

                type:
                    "custom-world",

                owner:
                    VAERO.engine.currentEntity?.id ||
                    null,

                entities: []
            });

        const evolution =
            VAERO.get("evolution");

        if(
            evolution &&
            typeof evolution.record === "function"
        ){
            evolution.record(
                "milestone",
                `${name} dünyası oluşturuldu`,
                {
                    title:
                        `${name} dünyası oluşturuldu`,

                    source:
                        "world",

                    status:
                        "completed",

                    importance:
                        "medium",

                    relatedWorldId:
                        world.id,

                    tags: [
                        "world",
                        "creation"
                    ]
                }
            );
        }

        return VAERO.engine.setView(
            "world",
            {
                world,
                entity: null,
                page: null,
                entityCreateMode: false,
                entityType: null
            }
        );

    },

    startEntityCreate(){

        const world =
            VAERO.engine.currentWorld;

        if(!world){
            return this.openWorlds();
        }

        return VAERO.engine.setView(
            "world",
            {
                world,
                entity: null,
                page: null,
                entityCreateMode: true,
                entityType: null
            }
        );

    },

    selectEntityType(type){

        if(!type){
            return false;
        }

        return VAERO.engine.setView(
            "world",
            {
                entityCreateMode: true,
                entityType: type
            }
        );

    },

    clearEntityType(){

        return VAERO.engine.setView(
            "world",
            {
                entityCreateMode: true,
                entityType: null
            }
        );

    },

    cancelEntityCreate(){

        return VAERO.engine.setView(
            "world",
            {
                entity: null,
                page: null,
                entityCreateMode: false,
                entityType: null
            }
        );

    },

    createEntity(){

        const world =
            VAERO.engine.currentWorld;

        if(!world){

            console.error(
                "No world selected."
            );

            return false;

        }

        const nameInput =
            document.getElementById(
                "entityNameInput"
            );

        const descriptionInput =
            document.getElementById(
                "entityDescriptionInput"
            );

        const name =
            String(
                nameInput?.value || ""
            ).trim();

        const type =
            VAERO.engine.entityType;

        if(!name){

            nameInput?.focus();

            return false;

        }

        if(!type){
            return false;
        }

        const entityManager =
            VAERO.get("entityManager");

        const identityService =
            VAERO.get("identity");

        const profileService =
            VAERO.get("profile");

        const worldService =
            VAERO.get("world");

        if(
            !entityManager ||
            !identityService ||
            !profileService ||
            !worldService
        ){
            console.error(
                "Entity creation services are missing."
            );

            return false;
        }

        const entity =
            entityManager.create({
                id:
                    this.createId("entity"),

                name,

                type,

                description:
                    String(
                        descriptionInput?.value ||
                        ""
                    ).trim(),

                status:
                    "active",

                organs: [],
                bridges: []
            });

        entity.identity =
            identityService.create(
                entity
            );

        entity.profile =
            profileService.create(
                entity
            );

        if(
            typeof worldService.addEntity ===
            "function"
        ){
            worldService.addEntity(
                world.id,
                entity
            );
        }else{

            if(!Array.isArray(world.entities)){
                world.entities = [];
            }

            world.entities.push(entity);

            if(
                typeof worldService.save ===
                "function"
            ){
                worldService.save();
            }

        }

        const evolution =
            VAERO.get("evolution");

        if(
            evolution &&
            typeof evolution.record === "function"
        ){
            evolution.record(
                "milestone",
                `${name} varlığı oluşturuldu`,
                {
                    title:
                        `${name} varlığı oluşturuldu`,

                    source:
                        "entity",

                    status:
                        "completed",

                    importance:
                        "medium",

                    relatedEntityId:
                        entity.id,

                    relatedWorldId:
                        world.id,

                    tags: [
                        "entity",
                        "creation"
                    ],

                    organs: [
                        "identity",
                        "profile"
                    ]
                }
            );
        }

        return VAERO.engine.setView(
            "entity",
            {
                world,
                entity,
                page: null,
                entityCreateMode: false,
                entityType: null
            }
        );

    },

    openEntity(entityId){

        const world =
            VAERO.engine.currentWorld;

        if(
            !world ||
            !Array.isArray(world.entities)
        ){
            return false;
        }

        const savedEntity =
            world.entities.find(
                item =>
                    item?.id === entityId
            );

        if(!savedEntity){

            console.error(
                "Entity not found:",
                entityId
            );

            return false;

        }

        const entityManager =
            VAERO.get("entityManager");

        const entity =
            entityManager &&
            typeof entityManager.hydrate ===
                "function"
                ? entityManager.hydrate(
                    savedEntity
                )
                : savedEntity;

        return VAERO.engine.setView(
            "entity",
            {
                world,
                entity,
                page: null,
                entityCreateMode: false,
                entityType: null
            }
        );

    },

    backToWorld(){

        const world =
            VAERO.engine.currentWorld;

        if(!world){
            return this.openWorlds();
        }

        return VAERO.engine.setView(
            "world",
            {
                world,
                entity: null,
                page: null,
                entityCreateMode: false,
                entityType: null
            }
        );

    },

    openEntityPage(page){

        const allowedPages = [
            "identity",
            "profile",
            "organs",
            "timeline",
            "memory",
            "bridge",
            "evolution",
            "settings",
            "discovery"
        ];

        if(!allowedPages.includes(page)){
            return false;
        }

        const entity =
            VAERO.engine.currentOpenedEntity ||
            VAERO.engine.rootEntity ||
            VAERO.engine.currentEntity;

        if(!entity){
            return false;
        }

        VAERO.engine.currentOpenedEntity =
            entity;

        VAERO.engine.currentEntityPage =
            page;

        let view = "entity";

        if(
            entity.id ===
                VAERO.engine.rootEntity?.id &&
            page === "identity"
        ){
            view = "identity";
        }

        if(
            entity.id ===
                VAERO.engine.rootEntity?.id &&
            page === "profile"
        ){
            view = "profile";
        }

        const opened =
            VAERO.engine.setView(
                view,
                {
                    entity,
                    page,
                    entityCreateMode: false,
                    entityType: null
                }
            );

        if(opened){
            this.trackBrainSession(page);
        }

        return opened;

    },

    openEntityDashboard(){

        const entity =
            VAERO.engine.currentOpenedEntity;

        if(!entity){
            return this.openIdentity();
        }

        return VAERO.engine.setView(
            "entity",
            {
                entity,
                page: null,
                entityCreateMode: false,
                entityType: null
            }
        );

    },

    saveProfile(){

        const nameInput =
            document.getElementById(
                "profileNameInput"
            );

        const descriptionInput =
            document.getElementById(
                "profileDescriptionInput"
            );

        const name =
            String(
                nameInput?.value || ""
            ).trim();

        if(!name){

            nameInput?.focus();

            return false;

        }

        const description =
            String(
                descriptionInput?.value || ""
            ).trim();

        const entity =
            VAERO.engine.currentOpenedEntity ||
            VAERO.engine.rootEntity;

        if(!entity){
            return false;
        }

        const isRoot =
            entity.id ===
            VAERO.engine.rootEntity?.id;

        if(isRoot){

            const userProfile = {
                name,
                description,
                updatedAt:
                    Date.now()
            };

            try {

                localStorage.setItem(
                    "vaero:user:profile:v1",
                    JSON.stringify(
                        userProfile
                    )
                );

            } catch(error){

                console.error(
                    "Profil kaydedilemedi:",
                    error
                );

                return false;

            }

            if(entity.profile){
                entity.profile.name = name;
                entity.profile.description =
                    description;
                entity.profile.updatedAt =
                    Date.now();
            }

        }else{

            entity.update({
                name,
                description
            });

            const profileService =
                VAERO.get("profile");

            if(
                profileService &&
                entity.profile
            ){
                profileService.update(
                    entity.profile,
                    {
                        name,
                        description
                    }
                );
            }

            const worldService =
                VAERO.get("world");

            if(
                worldService &&
                typeof worldService.save ===
                    "function"
            ){
                worldService.save();
            }

        }

        const feedback =
            document.getElementById(
                "profileSaveFeedback"
            );

        if(feedback){
            feedback.textContent =
                "Profil kaydedildi.";
        }

        return true;

    },

    restartDiscovery(){

        localStorage.removeItem(
            "vaero:discovery:completed"
        );

        localStorage.removeItem(
            "vaero:discovery:draft:v2"
        );

        const engineRoot =
            document.getElementById(
                "engine"
            );

        if(
            engineRoot &&
            window.DiscoveryApp &&
            typeof window.DiscoveryApp.render ===
                "function"
        ){
            window.DiscoveryApp.currentStep = 0;
            window.DiscoveryApp.answers = {};
            window.DiscoveryApp.render(
                engineRoot
            );

            return true;
        }

        return false;

    },

    getBrainStorageKey(){

        return "vaero:brain:global";

    },

    getBrainDayKey(timestamp = Date.now()){

        const date =
            new Date(timestamp);

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;

    },

    normalizeBrainSessions(sessions){

        if(!Array.isArray(sessions)){
            return [];
        }

        return sessions
            .filter(session =>
                session &&
                typeof session === "object"
            )
            .map(session => {

                const startedAt =
                    Number(session.startedAt) ||
                    Number(session.updatedAt) ||
                    Date.now();

                const updatedAt =
                    Number(session.updatedAt) ||
                    startedAt;

                const actions =
                    Array.isArray(session.actions)
                        ? session.actions
                            .map(action => {

                                if(
                                    typeof action ===
                                    "string"
                                ){
                                    return {
                                        id:
                                            this.createId(
                                                "brain-action"
                                            ),
                                        role: "user",
                                        type: "message",
                                        content:
                                            action,
                                        createdAt:
                                            updatedAt,
                                        context: null,
                                        appLinks: []
                                    };
                                }

                                if(
                                    !action ||
                                    typeof action !==
                                        "object"
                                ){
                                    return null;
                                }

                                const content =
                                    String(
                                        action.content ||
                                        action.fullContent ||
                                        action.text ||
                                        action.message ||
                                        ""
                                    ).trim();

                                if(!content){
                                    return null;
                                }

                                return {
                                    ...action,
                                    id:
                                        action.id ||
                                        this.createId(
                                            "brain-action"
                                        ),
                                    content,
                                    createdAt:
                                        Number(
                                            action.createdAt
                                        ) ||
                                        updatedAt,
                                    appLinks:
                                        Array.isArray(
                                            action.appLinks
                                        )
                                            ? action.appLinks
                                            : []
                                };

                            })
                            .filter(Boolean)
                        : [];

                return {
                    id:
                        session.id ||
                        this.createId(
                            "brain-session"
                        ),

                    title:
                        String(
                            session.title ||
                            "Brain Sohbeti · Bugün"
                        ),

                    kind:
                        "conversation",

                    target: null,

                    status:
                        session.status ===
                            "error"
                            ? "error"
                            : session.status ===
                                "done" ||
                              session.status ===
                                "closed"
                                ? "done"
                                : "progress",

                    startedAt,
                    updatedAt,
                    actions,

                    favorite:
                        Boolean(
                            session.favorite
                        ),

                    summary:
                        session.summary ||
                        null,

                    topic:
                        session.topic ||
                        "daily-brain",

                    dayKey:
                        session.dayKey ||
                        this.getBrainDayKey(
                            startedAt
                        )
                };

            })
            .sort(
                (a, b) =>
                    b.updatedAt -
                    a.updatedAt
            );

    },

    loadBrainState(){

        const brain =
            VAERO.get("brain");

        if(!brain){
            return false;
        }

        const saved =
            localStorage.getItem(
                this.getBrainStorageKey()
            );

        if(!saved){

            brain.sessions = [];
            brain.resumePoint = null;

            return true;

        }

        try {

            const parsed =
                JSON.parse(saved);

            brain.sessions =
                this.normalizeBrainSessions(
                    parsed.sessions
                );

            brain.resumePoint =
                parsed.resumePoint ||
                null;

            return true;

        } catch(error){

            console.error(
                "Brain geçmişi okunamadı:",
                error
            );

            brain.sessions = [];
            brain.resumePoint = null;

            return false;

        }

    },

    saveBrainState(){

        const brain =
            VAERO.get("brain");

        if(!brain){
            return false;
        }

        try {

            localStorage.setItem(
                this.getBrainStorageKey(),
                JSON.stringify({
                    sessions:
                        Array.isArray(
                            brain.sessions
                        )
                            ? brain.sessions
                            : [],

                    resumePoint:
                        brain.resumePoint ||
                        null,

                    savedAt:
                        Date.now()
                })
            );

            return true;

        } catch(error){

            console.error(
                "Brain geçmişi kaydedilemedi:",
                error
            );

            return false;

        }

    },

    getTodayBrainConversationSession(brain){

        if(
            !brain ||
            !Array.isArray(brain.sessions)
        ){
            return null;
        }

        const todayKey =
            this.getBrainDayKey();

        return (
            brain.sessions.find(session =>
                session.kind ===
                    "conversation" &&
                session.dayKey ===
                    todayKey
            ) ||
            null
        );

    },

    createTodayBrainConversation(brain){

        const now =
            Date.now();

        const session = {
            id:
                this.createId(
                    "brain-session"
                ),

            title:
                "Brain Sohbeti · Bugün",

            kind:
                "conversation",

            target: null,
            status: "progress",
            startedAt: now,
            updatedAt: now,
            actions: [],
            favorite: false,
            summary: null,
            topic: "daily-brain",
            dayKey:
                this.getBrainDayKey(now)
        };

        brain.sessions.unshift(
            session
        );

        return session;

    },

    trackBrainSession(page){

        const brain =
            VAERO.get("brain");

        if(!brain){
            return;
        }

        if(!Array.isArray(brain.sessions)){
            brain.sessions = [];
        }

        const labels = {
            profile:
                "Profil ekranı açıldı",

            identity:
                "Kimlik ekranı açıldı",

            organs:
                "Organlar ekranı açıldı",

            timeline:
                "Zaman Çizelgesi açıldı",

            memory:
                "Hafıza ekranı açıldı",

            bridge:
                "Köprü ekranı açıldı",

            evolution:
                "Evrim ekranı açıldı",

            settings:
                "Ayarlar ekranı açıldı",

            discovery:
                "Discovery ekranı açıldı"
        };

        const content =
            labels[page];

        if(!content){
            return;
        }

        const session =
            this.getTodayBrainConversationSession(
                brain
            ) ||
            this.createTodayBrainConversation(
                brain
            );

        const now =
            Date.now();

        session.actions.push({
            id:
                this.createId(
                    "brain-action"
                ),
            role: "system",
            type: "navigation",
            content,
            createdAt: now,
            target: page,
            context: {
                page
            }
        });

        session.updatedAt =
            now;

        this.saveBrainState();
        this.renderBrainHistory();

    },

    openBrain(){

        this.loadBrainState();

        let panel =
            document.getElementById(
                "brainPanel"
            );

        if(!panel){

            if(
                !window.BrainApp ||
                typeof BrainApp.render !==
                    "function"
            ){
                return false;
            }

            document.body.insertAdjacentHTML(
                "beforeend",
                BrainApp.render()
            );

            panel =
                document.getElementById(
                    "brainPanel"
                );

        }

        if(!panel){
            return false;
        }

        panel.classList.remove(
            "is-expanded"
        );

        panel.classList.add(
            "is-compact"
        );

        panel.style.display =
            "flex";

        const contextService =
            VAERO.get(
                "brainContext"
            );

        const context =
            contextService &&
            typeof contextService.build ===
                "function"
                ? contextService.build()
                : {
                    screen: "home",
                    app: "home"
                };

        const contextKey =
            context.page ||
            context.screen ||
            context.app ||
            "home";

        const names = {
            home: "Ana Ekran",
            identity: "Kimlik",
            profile: "Profil",
            create: "Yarat",
            worlds: "Dünyalar",
            world: "Dünya",
            entity: "Varlık",
            organs: "Organlar",
            timeline:
                "Zaman Çizelgesi",
            memory: "Hafıza",
            bridge: "Köprü",
            evolution: "Evrim",
            settings: "Ayarlar",
            discovery: "Discovery"
        };

        const suggestions = {
            home:
                "Dünyalarını açabilir, profilini görüntüleyebilir veya yeni bir yapı oluşturabilirsin.",

            identity:
                "Kimlik bilgilerini inceleyebilir veya Profil ekranına geçebilirsin.",

            profile:
                "Profil bilgilerini güncelleyebilir veya Discovery yönünü inceleyebilirsin.",

            create:
                "Yeni dünyanın amacını belirleyerek başlayabilirsin.",

            worlds:
                "Mevcut dünyalarını açabilir veya yeni bir dünya oluşturabilirsin.",

            world:
                "Bu dünyadaki varlıkları inceleyebilir veya yeni bir varlık ekleyebilirsin.",

            entity:
                "Varlığın kimlik, profil ve organlarına geçebilirsin."
        };

        const contextText =
            document.getElementById(
                "brainContextText"
            );

        if(contextText){

            contextText.textContent =
                `Şu an ${
                    names[contextKey] ||
                    contextKey
                } ekranındasın.`;

        }

        const suggestion =
            document.getElementById(
                "brainSuggestion"
            );

        if(suggestion){

            suggestion.textContent =
                suggestions[contextKey] ||
                "Bir ekran açabilir veya ne yapmak istediğini yazabilirsin.";

        }

        const input =
            document.getElementById(
                "brainInput"
            );

        input?.addEventListener(
            "focus",
            () => {

                panel.classList.remove(
                    "is-compact"
                );

                panel.classList.add(
                    "is-expanded"
                );

            },
            {
                once: true
            }
        );

        if(this.brainOutsideHandler){

            document.removeEventListener(
                "pointerdown",
                this.brainOutsideHandler
            );

        }

        this.brainOutsideHandler =
            event => {

                const currentPanel =
                    document.getElementById(
                        "brainPanel"
                    );

                if(
                    !currentPanel ||
                    currentPanel.contains(
                        event.target
                    ) ||
                    event.target.closest(
                        '[data-action="brain:open"]'
                    )
                ){
                    return;
                }

                currentPanel.classList.remove(
                    "is-expanded"
                );

                currentPanel.classList.add(
                    "is-compact"
                );

            };

        document.addEventListener(
            "pointerdown",
            this.brainOutsideHandler
        );

        this.renderBrainHistory();

        return true;

    },

    closeBrain(){

        this.saveBrainState();

        if(this.brainOutsideHandler){

            document.removeEventListener(
                "pointerdown",
                this.brainOutsideHandler
            );

            this.brainOutsideHandler =
                null;

        }

        document
            .querySelectorAll(
                "#brainPanel"
            )
            .forEach(
                panel =>
                    panel.remove()
            );

        return true;

    },

    getBrainAppDefinitions(){

        return [
            {
                id: "profile",
                label: "Profil",
                words: [
                    "profil",
                    "profile"
                ]
            },
            {
                id: "identity",
                label: "Kimlik",
                words: [
                    "kimlik",
                    "identity"
                ]
            },
            {
                id: "memory",
                label: "Hafıza",
                words: [
                    "hafıza",
                    "hafiza",
                    "memory"
                ]
            },
            {
                id: "timeline",
                label:
                    "Zaman Çizelgesi",
                words: [
                    "timeline",
                    "zaman çizelgesi",
                    "zaman cizelgesi"
                ]
            },
            {
                id: "bridge",
                label: "Köprü",
                words: [
                    "köprü",
                    "kopru",
                    "bridge"
                ]
            },
            {
                id: "organs",
                label: "Organlar",
                words: [
                    "organ",
                    "organlar"
                ]
            },
            {
                id: "settings",
                label: "Ayarlar",
                words: [
                    "ayar",
                    "ayarlar",
                    "settings"
                ]
            }
        ];

    },

    extractBrainAppMentions(text){

        const normalized =
            String(text || "")
                .toLocaleLowerCase(
                    "tr-TR"
                );

        return this
            .getBrainAppDefinitions()
            .filter(app =>
                app.words.some(word =>
                    normalized.includes(
                        word
                    )
                )
            )
            .map(app => ({
                app:
                    app.id,
                label:
                    app.label
            }));

    },

    sendBrainMessage(){

        const input =
            document.getElementById(
                "brainInput"
            );

        if(!input){
            return false;
        }

        const text =
            input.value.trim();

        if(!text){
            return false;
        }

        const brain =
            VAERO.get("brain");

        if(
            !brain ||
            typeof brain.receive !==
                "function"
        ){
            return false;
        }

        if(!Array.isArray(brain.sessions)){
            brain.sessions = [];
        }

        const contextService =
            VAERO.get(
                "brainContext"
            );

        const context =
            contextService &&
            typeof contextService.build ===
                "function"
                ? contextService.build()
                : null;

        const session =
            this.getTodayBrainConversationSession(
                brain
            ) ||
            this.createTodayBrainConversation(
                brain
            );

        const now =
            Date.now();

        session.actions.push({
            id:
                this.createId(
                    "brain-action"
                ),

            role: "user",
            type: "message",
            content: text,
            createdAt: now,

            context: {
                page:
                    context?.page ||
                    context?.screen ||
                    null
            },

            appLinks:
                this.extractBrainAppMentions(
                    text
                )
        });

        session.updatedAt =
            now;

        input.value = "";

        const reply =
            brain.receive(
                text,
                context
            );

        const replyText =
            typeof reply === "string"
                ? reply
                : reply?.reply ||
                  reply?.message ||
                  reply?.text ||
                  "";

        if(replyText){

            session.actions.push({
                id:
                    this.createId(
                        "brain-action"
                    ),

                role: "brain",
                type: "reply",

                content:
                    String(replyText),

                createdAt:
                    Date.now(),

                context: {
                    page:
                        context?.page ||
                        context?.screen ||
                        null
                },

                appLinks:
                    this.extractBrainAppMentions(
                        replyText
                    )
            });

        }

        session.updatedAt =
            Date.now();

        this.updateBrainConversationSummary(
            session
        );

        this.saveBrainState();

        const handled =
            this.dispatchBrainIntent(
                text
            );

        if(!handled){

            this.renderBrainHistory();

        const panel =
            document.getElementById(
                "brainPanel"
            );

        if(panel){

            panel.classList.remove(
                "is-compact"
            );

            panel.classList.add(
                "is-expanded"
            );

        }

        }

        return true;

    },

    updateBrainConversationSummary(
        session
    ){

        if(
            !session ||
            !Array.isArray(
                session.actions
            )
        ){
            return;
        }

        const messages =
            session.actions
                .filter(
                    action =>
                        action?.role ===
                            "user" &&
                        action.content
                )
                .map(
                    action =>
                        String(
                            action.content
                        ).trim()
                )
                .filter(Boolean)
                .slice(-3);

        const summary =
            messages.join(" · ");

        session.summary =
            summary.length > 160
                ? `${summary
                    .slice(0, 160)
                    .trim()}…`
                : summary || null;

    },

    dispatchBrainIntent(text){

        const command =
            String(text || "")
                .toLocaleLowerCase(
                    "tr-TR"
                )
                .replaceAll("ı", "i")
                .replaceAll("ğ", "g")
                .replaceAll("ü", "u")
                .replaceAll("ş", "s")
                .replaceAll("ö", "o")
                .replaceAll("ç", "c")
                .replace(/[?.!,;:]/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        if(
            [
                "burada kaldik",
                "burda kaldik",
                "kaldigimiz yeri kaydet",
                "bunu kaydet"
            ].some(
                item =>
                    command.includes(item)
            )
        ){
            return this.saveBrainResumePoint(
                text
            );
        }

        if(
            [
                "nerede kalmistik",
                "kaldigimiz yer",
                "devam et"
            ].some(
                item =>
                    command.includes(item)
            )
        ){
            return this.restoreBrainResumePoint();
        }

        const navigationRequested =
            [
                "ac",
                "goster",
                "goruntule",
                "git",
                "gec",
                "gotur"
            ].some(word =>
                command.includes(word)
            );

        if(!navigationRequested){
            return false;
        }

        const targets = [
            {
                page: "profile",
                words: [
                    "profil",
                    "profile"
                ]
            },
            {
                page: "identity",
                words: [
                    "kimlik",
                    "identity"
                ]
            },
            {
                page: "memory",
                words: [
                    "hafiza",
                    "memory"
                ]
            },
            {
                page: "timeline",
                words: [
                    "timeline",
                    "zaman cizelgesi"
                ]
            },
            {
                page: "bridge",
                words: [
                    "kopru",
                    "bridge"
                ]
            },
            {
                page: "organs",
                words: [
                    "organ",
                    "organlar"
                ]
            },
            {
                page: "settings",
                words: [
                    "ayar",
                    "ayarlar",
                    "settings"
                ]
            }
        ];

        const target =
            targets.find(item =>
                item.words.some(word =>
                    command.includes(
                        word
                    )
                )
            );

        if(!target){
            return false;
        }

        this.closeBrain();

        return this.openEntityPage(
            target.page
        );

    },

    saveBrainResumePoint(note){

        const brain =
            VAERO.get("brain");

        const contextService =
            VAERO.get(
                "brainContext"
            );

        if(!brain){
            return false;
        }

        const context =
            contextService &&
            typeof contextService.build ===
                "function"
                ? contextService.build()
                : null;

        brain.resumePoint = {
            id:
                this.createId(
                    "resume"
                ),

            app:
                context?.app ||
                null,

            screen:
                context?.screen ||
                null,

            page:
                context?.page ||
                null,

            worldId:
                context?.world?.id ||
                null,

            entityId:
                context?.entity?.id ||
                null,

            note:
                String(note || ""),

            savedAt:
                Date.now()
        };

        this.saveBrainState();
        this.renderBrainHistory();

        return true;

    },

    restoreBrainResumePoint(){

        const brain =
            VAERO.get("brain");

        const point =
            brain?.resumePoint;

        if(!point){
            return false;
        }

        if(point.worldId){

            const opened =
                this.openWorld(
                    point.worldId
                );

            if(
                opened &&
                point.entityId
            ){
                this.openEntity(
                    point.entityId
                );
            }

            if(
                point.page &&
                point.entityId
            ){
                this.openEntityPage(
                    point.page
                );
            }

            return true;

        }

        if(point.page){

            return this.openEntityPage(
                point.page
            );

        }

        if(
            point.screen === "create"
        ){
            return this.openCreate();
        }

        if(
            point.screen === "worlds"
        ){
            return this.openWorlds();
        }

        return this.openHome();

    },

    getBrainActionText(action){

        if(typeof action === "string"){
            return action;
        }

        if(
            action &&
            typeof action === "object"
        ){
            return String(
                action.content ||
                action.text ||
                action.message ||
                ""
            );
        }

        return "";

    },

    escapeBrainHTML(value){

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    },

    renderBrainHistory(){

        const history =
            document.getElementById(
                "brainHistory"
            );

        const miniHistory =
            document.getElementById(
                "brainMiniHistory"
            );

        const brain =
            VAERO.get("brain");

        if(!history || !brain){
            return;
        }

        history.innerHTML = "";

        if(miniHistory){
            miniHistory.innerHTML = "";
        }

        const todaySession =
            this.getTodayBrainConversationSession(
                brain
            );

        const actions =
            Array.isArray(
                todaySession?.actions
            )
                ? [...todaySession.actions]
                    .filter(
                        action =>
                            this
                                .getBrainActionText(
                                    action
                                )
                                .trim()
                    )
                    .sort(
                        (a, b) =>
                            (
                                a?.createdAt ||
                                0
                            ) -
                            (
                                b?.createdAt ||
                                0
                            )
                    )
                : [];

        const flow =
            document.createElement(
                "div"
            );

        flow.className =
            "brain-chat-flow";

        if(actions.length === 0){

            flow.innerHTML = `
                <div class="brain-chat-empty">
                    <strong>
                        Bugünün sohbeti
                    </strong>

                    <span>
                        Brain’e bir şey yazarak başlayabilirsin.
                    </span>
                </div>
            `;

        }else{

            actions.forEach(action => {

                const content =
                    this.getBrainActionText(
                        action
                    );

                const time =
                    new Date(
                        action.createdAt ||
                        Date.now()
                    ).toLocaleTimeString(
                        "tr-TR",
                        {
                            hour:
                                "2-digit",
                            minute:
                                "2-digit"
                        }
                    );

                if(
                    action.role ===
                        "system" ||
                    action.type ===
                        "navigation"
                ){

                    const systemRow =
                        document.createElement(
                            "div"
                        );

                    systemRow.className =
                        "brain-chat-system";

                    systemRow.innerHTML = `
                        <span class="brain-chat-system-time">
                            ${time}
                        </span>

                        <span>
                            ${this.escapeBrainHTML(content)}
                        </span>
                    `;

                    flow.appendChild(
                        systemRow
                    );

                    return;

                }

                const message =
                    document.createElement(
                        "div"
                    );

                message.className =
                    action.role === "user"
                        ? "brain-chat-message brain-chat-user"
                        : "brain-chat-message brain-chat-brain";

                const links =
                    Array.isArray(
                        action.appLinks
                    )
                        ? action.appLinks
                            .filter(
                                (link, index, all) =>
                                    link?.app &&
                                    all.findIndex(
                                        item =>
                                            item?.app ===
                                            link.app
                                    ) === index
                            )
                        : [];

                message.innerHTML = `
                    <div class="brain-chat-meta">
                        <span>${time}</span>

                        ${
                            action?.context?.page
                                ? `
                                    <span class="brain-chat-context">
                                        ${this.escapeBrainHTML(
                                            action.context.page
                                        )}
                                    </span>
                                  `
                                : ""
                        }
                    </div>

                    <div class="brain-chat-content">
                        ${this.escapeBrainHTML(content)}

                        ${
                            links.length
                                ? `
                                    <span class="brain-message-app-links">

                                        ${links
                                            .map(link => `
                                                <button
                                                    type="button"
                                                    class="brain-message-app-link"
                                                    data-brain-app="${this.escapeBrainHTML(link.app)}"
                                                >
                                                    ${this.escapeBrainHTML(link.label)}
                                                </button>
                                            `)
                                            .join("")}

                                    </span>
                                  `
                                : ""
                        }
                    </div>
                `;

                flow.appendChild(
                    message
                );

            });

        }

        history.appendChild(
            flow
        );

        history
            .querySelectorAll(
                "[data-brain-app]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const app =
                            button.dataset
                                .brainApp;

                        this.closeBrain();
                        this.openEntityPage(
                            app
                        );

                    }
                );

            });

        if(miniHistory){

            const recent =
                actions
                    .filter(
                        action =>
                            action.role ===
                                "user" ||
                            action.role ===
                                "brain"
                    )
                    .slice(-3);

            const miniFlow =
                document.createElement(
                    "div"
                );

            miniFlow.className =
                "brain-mini-chat-flow";

            recent.forEach(action => {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "brain-mini-chat-message";

                row.innerHTML = `
                    <strong>
                        ${
                            action.role ===
                                "user"
                                ? "Sen:"
                                : "Brain:"
                        }
                    </strong>

                    <span>
                        ${this.escapeBrainHTML(
                            this.getBrainActionText(
                                action
                            )
                        )}
                    </span>
                `;

                miniFlow.appendChild(
                    row
                );

            });

            miniFlow.addEventListener(
                "click",
                () => {

                    const panel =
                        document.getElementById(
                            "brainPanel"
                        );

                    if(panel){

                        panel.classList.remove(
                            "is-compact"
                        );

                        panel.classList.add(
                            "is-expanded"
                        );

                    }

                }
            );

            miniHistory.appendChild(
                miniFlow
            );

        }

        requestAnimationFrame(
            () => {

                history.scrollTop =
                    history.scrollHeight;

            }
        );

    },

    handleEvolutionAction(
        action,
        button
    ){

        if(
            action ===
                "evolution:filter" &&
            window.EvolutionApp &&
            typeof EvolutionApp.setFilter ===
                "function"
        ){
            EvolutionApp.setFilter(
                button.dataset.filter
            );

            VAERO.engine.mount();

            return true;
        }

        if(
            action ===
                "evolution:event:open" &&
            window.EvolutionApp &&
            typeof EvolutionApp.selectEvent ===
                "function"
        ){
            EvolutionApp.selectEvent(
                button.dataset.eventId
            );

            VAERO.engine.mount();

            return true;
        }

        if(
            action ===
                "evolution:event:close" &&
            window.EvolutionApp &&
            typeof EvolutionApp.clearSelectedEvent ===
                "function"
        ){
            EvolutionApp.clearSelectedEvent();
            VAERO.engine.mount();

            return true;
        }

        if(
            action ===
                "evolution:linked:open"
        ){

            const target =
                String(
                    button.dataset.target ||
                    ""
                )
                    .trim()
                    .toLowerCase();

            if(
                target !== "timeline" &&
                target !== "memory"
            ){
                return false;
            }

            if(
                window.EvolutionApp &&
                typeof EvolutionApp.clearSelectedEvent ===
                    "function"
            ){
                EvolutionApp.clearSelectedEvent();
            }

            return this.openEntityPage(
                target
            );

        }

        return false;

    }

};

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-action]"
            );

        if(!button){
            return;
        }

        const action =
            button.dataset.action;

        if(
            action ===
                "world:create:submit" ||
            action ===
                "entity:create:submit"
        ){
            event.preventDefault();
        }

        switch(action){

            case "home:open":
                Actions.openHome();
                break;

            case "identity:open":
                Actions.openIdentity();
                break;

            case "profile:open":
                Actions.openProfile();
                break;

            case "create:open":
                Actions.openCreate();
                break;

            case "worlds:open":
                Actions.openWorlds();
                break;

            case "entities:open":
                Actions.openEntities();
                break;

            case "world:open":
                Actions.openWorld(
                    button.dataset.worldId
                );
                break;

            case "world:create:submit":
                Actions.createWorld();
                break;

            case "world:back":
                Actions.backToWorld();
                break;

            case "entity:create:first":
                Actions.startEntityCreate();
                break;

case "entity:type:select":
    Actions.selectEntityType(
        button.dataset.entityType
    );
    break;

            case "entity:type:clear":
                Actions.clearEntityType();
                break;

                case "vaero:order:create":
    Actions.createVaeroOrder();
    break;

            case "entity:create:cancel":
                Actions.cancelEntityCreate();
                break;

            case "entity:create:submit":
                Actions.createEntity();
                break;

            case "entity:open":
                Actions.openEntity(
                    button.dataset.entityId
                );
                break;

            case "entity:dashboard":
                Actions.openEntityDashboard();
                break;

            case "entity:identity":
                Actions.openEntityPage(
                    "identity"
                );
                break;

            case "entity:profile":
                Actions.openEntityPage(
                    "profile"
                );
                break;

            case "entity:organs":
                Actions.openEntityPage(
                    "organs"
                );
                break;

            case "entity:timeline":
                Actions.openEntityPage(
                    "timeline"
                );
                break;

            case "entity:memory":
                Actions.openEntityPage(
                    "memory"
                );
                break;

            case "entity:bridge":
                Actions.openEntityPage(
                    "bridge"
                );
                break;

            case "entity:evolution":
                Actions.openEntityPage(
                    "evolution"
                );
                break;

            case "entity:settings":
                Actions.openEntityPage(
                    "settings"
                );
                break;

            case "entity:discovery":
                Actions.openEntityPage(
                    "discovery"
                );
                break;

            case "profile:save":
                Actions.saveProfile();
                break;

case "app:vaero":
    Actions.openVaeroApp();
    break;

case "discovery:restart":
    Actions.restartDiscovery();
    break;
            
            case "vaero:device":
    Actions.openVaeroDevice();
    break;

case "vaero:collection":
    Actions.openVaeroCollection();
    break;

case "vaero:product":
    Actions.openVaeroProduct(
        button.dataset.product
    );
    break;

                case "vaero:variant":
    Actions.selectVaeroProductVariant(
        button.dataset.product,
        button.dataset.variant
    );
    break;

case "vaero:buy":
    Actions.addVaeroProductToCart(
        button.dataset.product,
        button.dataset.variant || null
    );
    break;

case "vaero:cart":
    Actions.openVaeroCart();
    break;

case "vaero:cart:increase":
    Actions.increaseVaeroCartItem(
        button.dataset.product,
        button.dataset.variant || null
    );
    break;

case "vaero:cart:decrease":
    Actions.decreaseVaeroCartItem(
        button.dataset.product,
        button.dataset.variant || null
    );
    break;
                
case "vaero:cart:remove":
    Actions.removeVaeroCartItem(
        button.dataset.product,
        button.dataset.variant || null
    );
    break;

case "vaero:cart:clear":
    Actions.clearVaeroCart();
    break;

                case "vaero:checkout":
    Actions.startVaeroCheckout();
    break;

                case "vaero:payment:method":
    Actions.selectVaeroPaymentMethod(
        button.dataset.paymentMethod
    );
    break;

                case "vaero:payment:start":
    Actions.startVaeroPayment();
    break;

                case "vaero:payment:success":
    Actions.completeVaeroPayment(
        true
    );
    break;

case "vaero:payment:fail":
    Actions.completeVaeroPayment(
        false
    );
    break;

            case "brain:open":
                Actions.openBrain();
                break;

            case "brain:close":
                Actions.closeBrain();
                break;

            case "brain:send":
                Actions.sendBrainMessage();
                break;

            default:
                Actions.handleEvolutionAction(
                    action,
                    button
                );

        }

    }
);

document.addEventListener(
    "submit",
    event => {

        const form =
            event.target.closest(
                "[data-engine-form]"
            );

        if(!form){
            return;
        }

        event.preventDefault();

        if(
            form.dataset.engineForm ===
                "world-create"
        ){
            Actions.createWorld();
        }

        if(
            form.dataset.engineForm ===
                "entity-create"
        ){
            Actions.createEntity();
        }

    }
);

document.addEventListener(
    "keydown",
    event => {

        if(
            event.target.id !==
                "brainInput" ||
            event.key !== "Enter" ||
            event.shiftKey
        ){
            return;
        }

event.preventDefault();
Actions.sendBrainMessage();

    }
);

VAERO.register(
    "actions",
    Actions
);
