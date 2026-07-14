const Actions = {

    openProfile(entity){
        const memory = VAERO.get("memorySystem"); 

        memory.remember("profile:opened", {
            entityId: entity.id,
            profileName: entity.profile.name
        });
    },

    closeModal(){
        const modal = document.getElementById("profileModal");
        if(modal) modal.classList.remove("show");
    },

    createWorld(){
        const input = document.getElementById("worldNameInput");

        if(!input || input.value.trim() === ""){
            alert("Please enter a world name.");
            return;
        }

        const worldService = VAERO.get("world");

        worldService.create({
            id: crypto.randomUUID(),
            name: input.value,
            type: "custom-world",
            owner: VAERO.engine.currentEntity.id,
            entities: []
        });

        VAERO.engine.mount(VAERO.engine.currentEntity);
        input.value = "";
    },

    openWorld(worldId){
        const worldService = VAERO.get("world");
        const world = worldService.all().find(item => item.id === worldId);

        if(!world){
            alert("World not found.");
            return;
        }

        if(!world.entities) world.entities = [];

        VAERO.engine.currentWorld = world;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    },

    createEntity(){
        const input = document.getElementById("entityNameInput");

        if(!input || input.value.trim() === ""){
            alert("Please enter a name.");
            return;
        }

        const currentWorld = VAERO.engine.currentWorld;

        if(!currentWorld){
            alert("No world selected.");
            return;
        }

        if(!currentWorld.entities) currentWorld.entities = [];

        const entityManager = VAERO.get("entityManager");

        const entity = entityManager.create({
            id: crypto.randomUUID(),
            name: input.value,
            type: VAERO.engine.entityType
        });

        currentWorld.entities.push(entity);

        VAERO.engine.entityCreateMode = false;
        VAERO.engine.entityType = null;

        VAERO.engine.mount(VAERO.engine.currentEntity);
    },

    openEntity(entityId){
        const world = VAERO.engine.currentWorld;
        if(!world) return;

        const entity = (world.entities || []).find(item => item.id === entityId);

        if(!entity){
            alert("Entity not found.");
            return;
        }

        VAERO.engine.currentOpenedEntity = entity;
        VAERO.engine.currentEntityPage = null;

        VAERO.engine.mount(VAERO.engine.currentEntity);
    },

    openEntityPage(page){
    /*
     * Brain doğrudan bir uygulama açmak istediğinde
     * henüz currentOpenedEntity seçilmemiş olabilir.
     *
     * Bu durumda mevcut aktif entity'yi hedef olarak kullan.
     */
    if(page && !VAERO.engine.currentOpenedEntity){
        const activeEntity = VAERO.engine.currentEntity;

        if(!activeEntity){
            console.error(
                "Uygulama açılamadı: aktif entity bulunamadı.",
                page
            );

            return false;
        }

        VAERO.engine.currentOpenedEntity = activeEntity;
    }

    VAERO.engine.currentEntityPage = page;

    console.log("OPEN ENTITY PAGE:", page);
    console.log(
        "OPENED ENTITY:",
        VAERO.engine.currentOpenedEntity
    );

    VAERO.engine.mount(VAERO.engine.currentEntity);

    const trackablePages = [
        "profile",
        "identity",
        "organs",
        "timeline",
        "memory",
        "bridge",
        "settings"
    ];

    if(trackablePages.includes(page)){
        this.trackBrainSession(page);
    }

    return true;
},
    trackBrainSession(page){
    const brain = VAERO.get("brain");
    if(!brain) return;

    if(!Array.isArray(brain.sessions)){
        brain.sessions = [];
    }

    const pageMap = {
        profile: {
            label: "Profil",
            action: "Profil ekranı açıldı"
        },
        identity: {
            label: "Kimlik",
            action: "Kimlik ekranı açıldı"
        },
        organs: {
            label: "Organlar",
            action: "Organlar ekranı açıldı"
        },
        timeline: {
            label: "Timeline",
            action: "Timeline ekranı açıldı"
        },
        memory: {
            label: "Hafıza",
            action: "Hafıza ekranı açıldı"
        },
        bridge: {
            label: "Köprü",
            action: "Köprü ekranı açıldı"
        },
        settings: {
            label: "Ayarlar",
            action: "Ayarlar ekranı açıldı"
        }
    };

    const pageData = pageMap[page];

    if(!pageData){
        return;
    }

    const now = Date.now();
    const dayKey = this.getBrainDayKey(now);

    /*
     * Uygulama hareketleri ayrı kart oluşturmaz.
     * O günün tek Brain sohbet akışına eklenir.
     */
    let session =
        this.getTodayBrainConversationSession(brain);

    if(!session){
        session = {
            id: crypto.randomUUID(),
            title: "Brain Sohbeti · Bugün",
            kind: "conversation",
            target: null,
            status: "progress",
            startedAt: now,
            updatedAt: now,
            actions: [],
            favorite: false,
            summary: null,
            topic: "daily-brain",
            dayKey
        };

        brain.sessions.unshift(session);
    }

    if(!Array.isArray(session.actions)){
        session.actions = [];
    }

    /*
     * Her ziyaret ayrı ayrı saklanır.
     * Böylece hangi uygulamanın hangi saatlerde
     * kaç kez açıldığı sonradan hesaplanabilir.
     */
    session.actions.push({
        id: crypto.randomUUID(),
        role: "system",
        type: "navigation",
        content: pageData.action,
        createdAt: now,
        target: page,
        appLabel: pageData.label,
        context: {
            page
        }
    });

    session.updatedAt = now;

    if(
        typeof this.updateBrainConversationSummary ===
        "function"
    ){
        this.updateBrainConversationSummary(session);
    }

    if(typeof this.saveBrainState === "function"){
        this.saveBrainState();
    }

    this.renderBrainHistory();
}, 

    getBrainStorageKey(){
    /*
     * Brain bütün VAERO uygulamalarında tek bir akıştır.
     * Profil, Köprü, Hafıza veya başka bir entity açılması
     * kayıt anahtarını değiştirmez.
     */
    return "vaero:brain:global";
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
            const target = session.target || null;

            let kind = session.kind;

            if(!["conversation", "action", "noise"].includes(kind)){
                kind = target
                    ? "action"
                    : "conversation";
            }

            const rawActions = Array.isArray(session.actions)
                ? session.actions
                : [];

            const actions = rawActions
                .map(action => {
                    if(typeof action === "string"){
                        return {
                            id: crypto.randomUUID(),
                            role: kind === "action"
                                ? "system"
                                : "user",
                            type: kind === "action"
                                ? "activity"
                                : "message",
                            content: action,
                            createdAt:
                                session.updatedAt ||
                                session.startedAt ||
                                Date.now()
                        };
                    }

                    if(
                        action &&
                        typeof action === "object"
                    ){
                        const content = String(
                            action.content ||
                            action.text ||
                            action.message ||
                            ""
                        ).trim();

                        if(!content){
                            return null;
                        }

                        return {
    id:
        action.id ||
        crypto.randomUUID(),

    role:
        action.role ||
        (
            kind === "action"
                ? "system"
                : "user"
        ),

    type:
        action.type ||
        (
            kind === "action"
                ? "activity"
                : "message"
        ),

    content,

    createdAt:
        action.createdAt ||
        session.updatedAt ||
        session.startedAt ||
        Date.now(),

    context:
        action.context &&
        typeof action.context === "object"
            ? action.context
            : null,

    appLinks:
        Array.isArray(action.appLinks)
            ? action.appLinks
            : [],

    target:
        action.target || null,

    appLabel:
        action.appLabel || null
};
                    }

                    return null;
                })
                .filter(Boolean);

            const startedAt =
                Number(session.startedAt) ||
                Number(session.updatedAt) ||
                Date.now();

            const updatedAt =
                Number(session.updatedAt) ||
                startedAt;

            return {
                id:
                    session.id ||
                    crypto.randomUUID(),

                title:
                    String(
                        session.title ||
                        (
                            kind === "conversation"
                                ? "Brain Sohbeti"
                                : "Brain Oturumu"
                        )
                    ),

                kind,
                target,

                status:
                    ["progress", "done", "error"].includes(
                        session.status
                    )
                        ? session.status
                        : "progress",

                startedAt,
                updatedAt,
                actions,

                favorite:
                    Boolean(session.favorite),

                summary:
    session.summary || null,

topic:
    session.topic || null,

dayKey:
    session.dayKey ||
    this.getBrainDayKey(
        session.startedAt ||
        session.updatedAt ||
        Date.now()
    ),

migratedAt:
    session.migratedAt || Date.now()
            };
        })
        .sort((a, b) =>
            b.updatedAt - a.updatedAt
        );
},

loadBrainState(){
    const brain = VAERO.get("brain");
    if(!brain) return false;

    const storageKey = this.getBrainStorageKey();
    const savedState = localStorage.getItem(storageKey);

    /*
     * Bu entity için kayıt yoksa önceki entity'nin
     * bellekte kalan geçmişini gösterme.
     */
    if(!savedState){
        brain.sessions = [];
        brain.resumePoint = null;
        return true;
    }

    try {
    const parsedState = JSON.parse(savedState);

    brain.sessions = this.normalizeBrainSessions(
        parsedState.sessions
    );

    brain.resumePoint =
        parsedState.resumePoint || null;

    /*
     * Eski kayıt biçimini yeni sürüme kalıcı olarak geçir.
     */
    this.saveBrainState();

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
    const brain = VAERO.get("brain");
    if(!brain) return;

    const storageKey = this.getBrainStorageKey();

    const state = {
        sessions: Array.isArray(brain.sessions)
            ? brain.sessions
            : [],
        resumePoint: brain.resumePoint || null,
        savedAt: Date.now()
    };

    try {
        localStorage.setItem(
            storageKey,
            JSON.stringify(state)
        );
    } catch(error){
        console.error("Brain geçmişi kaydedilemedi:", error);
    }
},

    


    openBrain(){

    this.loadBrainState();

    document

        .querySelectorAll("#brainPanel")

        .forEach(panel => panel.remove());

    if(window.BrainApp){

        document.body.insertAdjacentHTML(

            "beforeend",

            BrainApp.render()

        );

    }

    const panel = document.getElementById("brainPanel");

    if(!panel) return;

    panel.style.display = "block";

    this.initBrainSessionDragClose();

    this.initBrainPanelAdaptiveSize();

    const contextText = document.getElementById("brainContextText");
    const brainContext = VAERO.get("brainContext");

    if(contextText && brainContext){
        const context = brainContext.build();
        const appKey = context.app || "unknown";

        const appNameMap = {
            identity: "Kimlik",
            profile: "Profil",
            organs: "Organlar",
            timeline: "Zaman Çizelgesi",
            memory: "Hafıza",
            bridge: "Köprü",
            settings: "Ayarlar",
            unknown: "bilinmeyen bir"
        };

        const appName = appNameMap[appKey] || appKey;

        contextText.innerText = `Şu an ${appName} ekranındasın.`;
        const suggestionText = document.getElementById("brainSuggestion");

const suggestionMap = {
    identity: "💡 Kimlik katmanlarını inceleyebilir veya Profil ekranına geçebilirsin.",
    profile: "💡 Profil bilgilerini tamamlayabilir veya Kimlik ekranını açabilirsin.",
    organs: "💡 Buradan Kimlik, Profil, Hafıza, Timeline, Bridge ve Ayarlar uygulamalarına geçebilirsin.",
    timeline: "💡 Geçmiş olayları inceleyebilir veya kaldığın noktayı Brain’e kaydedebilirsin.",
    memory: "💡 Hafıza kayıtlarını inceleyebilir veya yeni bir devam noktası oluşturabilirsin.",
    bridge: "💡 Varlıklar ve dünyalar arasındaki bağlantıları inceleyebilirsin.",
    settings: "💡 Sistem ve varlık tercihlerini buradan yönetebilirsin.",
    unknown: "💡 Bir uygulama açabilir veya Brain’e ne yapmak istediğini yazabilirsin."
};

if(suggestionText){
    suggestionText.innerText =
        suggestionMap[appKey] ||
        suggestionMap.unknown;
} 
    }

    this.renderBrainHistory();
},

closeBrain(){
    /*
     * Panel kapanmadan önce güncel sohbet akışını koru.
     */
    if(typeof this.saveBrainState === "function"){
        this.saveBrainState();
    }

    document
        .querySelectorAll("#brainPanel")
        .forEach(panel => panel.remove());
},

    createBrainConversationTitle(text){

    const clean = String(text || "")
        .toLowerCase()
        .replace(/[?.!,;:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const topicMap = [

        {
            words: ["profil","profile"],
            title: "Profil"
        },

        {
            words: ["kimlik","identity"],
            title: "Kimlik"
        },

        {
            words: ["hafiza","hafıza","memory"],
            title: "Hafıza"
        },

        {
            words: ["timeline","zaman"],
            title: "Timeline"
        },

        {
            words: ["bridge","kopru","köprü"],
            title: "Bridge"
        },

        {
            words: ["organ"],
            title: "Organlar"
        },

        {
            words: ["ayar","settings"],
            title: "Ayarlar"
        },

        {
            words: ["brain","beyin"],
            title: "Brain"
        }

    ];

    for(const topic of topicMap){

        if(
            topic.words.some(word =>
                clean.includes(word)
            )
        ){
            return topic.title;
        }

    }

    const firstSentence = String(text || "")
        .trim()
        .replace(/\s+/g," ");

    if(firstSentence.length <= 40){
    return firstSentence || "Brain Sohbeti";
}

    return `${firstSentence.slice(0,40).trim()}…`;
},

    updateBrainConversationSummary(session){

    if(
        !session ||
        !Array.isArray(session.actions)
    ){
        return;
    }

    const lastUserMessage = [...session.actions]
        .reverse()
        .find(item =>
            item &&
            item.role === "user" &&
            item.content
        );

    if(!lastUserMessage){
        return;
    }

    session.summary = String(
        lastUserMessage.content
    )
    .trim()
    .slice(0,120);

},

    detectBrainConversationTopic(text){
    const clean = String(text || "")
        .toLowerCase()
        .replaceAll("ı", "i")
        .replaceAll("ğ", "g")
        .replaceAll("ü", "u")
        .replaceAll("ş", "s")
        .replaceAll("ö", "o")
        .replaceAll("ç", "c")
        .replace(/[?.!,;:]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const topicMap = [
        { words: ["profil", "profile"], topic: "Profil" },
        { words: ["kimlik", "identity"], topic: "Kimlik" },
        { words: ["hafiza", "memory"], topic: "Hafıza" },
        { words: ["timeline", "zaman cizelgesi"], topic: "Timeline" },
        { words: ["bridge", "kopru"], topic: "Bridge" },
        { words: ["organ"], topic: "Organlar" },
        { words: ["ayar", "settings"], topic: "Ayarlar" },
        { words: ["brain", "beyin"], topic: "Brain" }
    ];

    const match = topicMap.find(item =>
        item.words.some(word => clean.includes(word))
    );

    return match ? match.topic : null;
},
    
updateBrainConversationMetadata(session, text){
    if(!session || session.kind !== "conversation"){
        return;
    }

    const cleanText = String(text || "").trim();

    if(!cleanText){
        return;
    }

    /*
     * Yalnızca varsayılan veya eski anlamsız başlıkları değiştir.
     * Sonradan özel olarak verilmiş başlıklara dokunma.
     */
    const currentTitle = String(session.title || "").trim();

    const genericTitles = [
        "",
        "Brain Sohbeti",
        "Brain Oturumu"
    ];

    if(genericTitles.includes(currentTitle)){
        session.title =
            this.createBrainConversationTitle(cleanText);
    }

    session.updatedAt = Date.now();
},

    updateBrainConversationSummary(session){
    if(!session || session.kind !== "conversation"){
        return;
    }

    const userMessages = (session.actions || [])
        .filter(action =>
            action &&
            typeof action === "object" &&
            action.role === "user"
        )
        .map(action =>
            this.getBrainActionText(action).trim()
        )
        .filter(Boolean);

    if(userMessages.length === 0){
        session.summary = null;
        return;
    }

    const recentMessages = userMessages.slice(-3);

    const summaryText = recentMessages.join(" · ");

    session.summary =
        summaryText.length > 160
            ? `${summaryText.slice(0, 160).trim()}…`
            : summaryText;
},

    completeActiveBrainConversation(){
    const brain = VAERO.get("brain");

    if(!brain || !Array.isArray(brain.sessions)){
        return false;
    }

    const activeSession = brain.sessions.find(session =>
        session.kind === "conversation" &&
        session.status === "progress"
    );

    if(!activeSession){
        return false;
    }

    /*
     * Buradaki status yalnızca sohbetin artık aktif olmadığını belirtir.
     * Kullanıcı arayüzünde günlük tamamlanma işareti olarak gösterilmez.
     */
    activeSession.status = "closed";
    activeSession.updatedAt = Date.now();

    this.saveBrainState();

    return true;
},
    
    getActiveBrainConversationSession(topic = null){
    const brain = VAERO.get("brain");

    if(!brain || !Array.isArray(brain.sessions)){
        return null;
    }

    const session = brain.sessions.find(item =>
        item.kind === "conversation" &&
        item.status === "progress"
    );

    if(!session){
        return null;
    }

    const lastActivity =
        Number(session.updatedAt) ||
        Number(session.startedAt) ||
        0;

    const inactivityLimit = 30 * 60 * 1000;

    /*
     * 30 dakikadan fazla ara verildiyse
     * mevcut sohbeti tamamla.
     */
    if(Date.now() - lastActivity > inactivityLimit){
        session.status = "done";
        session.updatedAt = Date.now();

        this.saveBrainState();
        return null;
    }

    /*
     * Yeni mesajın konusu belli ve mevcut oturumun
     * konusundan farklıysa eski sohbeti tamamla.
     */
    if(
        topic &&
        session.topic &&
        session.topic !== topic
    ){
        session.status = "done";
        session.updatedAt = Date.now();

        this.saveBrainState();
        return null;
    }

    return session;
},

    getBrainAppDefinitions(){
    return [
        {
            id: "profile",
            label: "Profil",
            words: [
                "profil",
                "profili",
                "profile"
            ]
        },
        {
            id: "identity",
            label: "Kimlik",
            words: [
                "kimlik",
                "kimliği",
                "kimligi",
                "identity"
            ]
        },
        {
            id: "memory",
            label: "Hafıza",
            words: [
                "hafıza",
                "hafızayı",
                "hafiza",
                "hafizayi",
                "memory"
            ]
        },
        {
            id: "bridge",
            label: "Köprü",
            words: [
                "köprü",
                "köprüyü",
                "kopru",
                "kopruyu",
                "bridge"
            ]
        },
        {
            id: "timeline",
            label: "Timeline",
            words: [
                "timeline",
                "zaman çizelgesi",
                "zaman cizelgesi"
            ]
        },
        {
            id: "organs",
            label: "Organlar",
            words: [
                "organ",
                "organlar",
                "organs"
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
            .toLocaleLowerCase("tr-TR");

    const found = [];

    this.getBrainAppDefinitions()
        .forEach(app => {
            const matched =
                app.words.some(word =>
                    normalized.includes(word)
                );

            if(matched){
                found.push({
                    app: app.id,
                    label: app.label
                });
            }
        });

    return found;
},
    
getBrainDayKey(timestamp = Date.now()){
    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
},

getTodayBrainConversationSession(brain){
    if(!brain || !Array.isArray(brain.sessions)){
        return null;
    }

    const todayKey =
        this.getBrainDayKey();

    return brain.sessions.find(session =>
        session &&
        session.kind === "conversation" &&
        session.dayKey === todayKey
    ) || null;
},

sendBrainMessage(){
    const input =
        document.getElementById("brainInput");

    if(!input) return;

    const text =
        input.value.trim();

    if(text === "") return;

    const brain =
        VAERO.get("brain");

    const brainContext =
        VAERO.get("brainContext");

    if(
        !brain ||
        typeof brain.receive !== "function"
    ){
        return;
    }

    if(!Array.isArray(brain.sessions)){
        brain.sessions = [];
    }

    const context =
        brainContext &&
        typeof brainContext.build === "function"
            ? brainContext.build()
            : null;

    const now =
        Date.now();

    const dayKey =
        this.getBrainDayKey(now);

    /*
     * Sayfa yalnızca mesaj bağlamıdır.
     * Sohbetin konusu veya oturumu değildir.
     */
    const contextPage =
        context?.page ||
        context?.currentPage ||
        context?.screen ||
        context?.route ||
        document.body?.dataset?.page ||
        null;

    /*
     * Her gün için yalnızca bir Brain sohbeti bulunur.
     */
    let session =
        this.getTodayBrainConversationSession(brain);

    if(!session){
        session = {
            id: crypto.randomUUID(),
            title: "Brain Sohbeti · Bugün",
            kind: "conversation",
            target: null,
            status: "progress",
            startedAt: now,
            updatedAt: now,
            actions: [],
            favorite: false,
            summary: null,
            topic: "daily-brain",
            dayKey
        };

        brain.sessions.unshift(session);
    }

    if(!Array.isArray(session.actions)){
        session.actions = [];
    }

    /*
     * Kullanıcı mesajı günlük sohbet akışına eklenir.
     */
    const appMentions =
    this.extractBrainAppMentions(text);

session.actions.push({
    id: crypto.randomUUID(),
    role: "user",
    type: "message",
    content: text,
    createdAt: now,
    context: {
        page: contextPage
    },
    appLinks: appMentions
});

    /*
     * Mesaj Brain'e iletilir.
     */
    const brainReply =
        brain.receive(text, context);

    if(brainReply){
        const replyText =
            typeof brainReply === "string"
                ? brainReply
                : brainReply.reply ||
                  brainReply.message ||
                  brainReply.text ||
                  null;

        if(replyText){
    const replyAppMentions =
        this.extractBrainAppMentions(replyText);

    const brainAction = {
        id: crypto.randomUUID(),
        role: "brain",
        type: "reply",
        content: "",
        fullContent: replyText,
        isStreaming: true,
        createdAt: Date.now(),
        context: {
            page: contextPage
        },
        appLinks: []
    };

    session.actions.push(brainAction);
    /*
 * Gerçek açma / geçiş komutları sohbet cevabının
 * yazılmasını beklemeden anında uygulanır.
 */
const navigationHandled =
    this.dispatchBrainIntent(text);

if(navigationHandled){
    /*
     * Streaming başlamadan yönlendirme yapıldığı için
     * Brain cevabını tamamlanmış biçimde kaydet.
     */
    brainAction.content = replyText;
    brainAction.fullContent = replyText;
    brainAction.isStreaming = false;
    brainAction.appLinks = replyAppMentions;

    session.updatedAt = Date.now();
    session.title = "Brain Sohbeti · Bugün";
    session.topic = "daily-brain";

    input.value = "";

    if(
        typeof this.updateBrainConversationSummary ===
        "function"
    ){
        this.updateBrainConversationSummary(session);
    }

    if(typeof this.saveBrainState === "function"){
        this.saveBrainState();
    }

    return;
} 

    session.updatedAt = Date.now();

    if(typeof this.saveBrainState === "function"){
        this.saveBrainState();
    }

    this.renderBrainHistory();

    this.streamBrainReply(
        session,
        brainAction,
        replyText,
        replyAppMentions
    );
}
    }

    session.updatedAt =
        Date.now();

    /*
     * Aç / geç / götür gibi gerçek komutlar
     * sohbet kaydedildikten sonra çalıştırılır.
     */
    const handledByIntent = false; 

    /*
     * Günlük sohbetin başlığı uygulama adına dönüşmez.
     */
    session.title =
        "Brain Sohbeti · Bugün";

    session.topic =
        "daily-brain";

    if(
        typeof this.updateBrainConversationSummary ===
        "function"
    ){
        this.updateBrainConversationSummary(session);
    }

    input.value = "";

    if(
        typeof this.saveBrainState ===
        "function"
    ){
        this.saveBrainState();
    }

    this.renderBrainHistory();

    /*
     * Komut ilgili uygulamayı açtıysa
     * paneli yeniden zorla açma.
     */
    if(handledByIntent){
        return;
    }

    const panel =
        document.getElementById("brainPanel");

    if(panel){
        panel.classList.remove("is-compact");
        panel.classList.add("is-expanded");
    }

    console.log(
        "Brain Daily Conversation:",
        session
    );
},

    streamBrainReply(
    session,
    brainAction,
    replyText,
    replyAppMentions = []
){
    if(
        !session ||
        !brainAction ||
        !replyText
    ){
        return;
    }

    const fullText = String(replyText);

    let characterIndex = 0;
    let renderTick = 0;

    /*
     * Uzun cevaplarda yazım süresini gereksiz
     * şekilde uzatma.
     */
    const characterStep =
        fullText.length > 500
            ? 5
            : fullText.length > 220
                ? 3
                : 2;

    const intervalDelay =
        fullText.length > 500
            ? 6
            : 10;

    /*
     * Bu fonksiyon yalnızca normal sohbet içindir.
     * Uygulama açma komutları buraya gelmeden önce
     * sendBrainMessage içinde anında çalıştırılır.
     */
    const streamTimer = window.setInterval(() => {
        characterIndex = Math.min(
            characterIndex + characterStep,
            fullText.length
        );

        /*
         * Görünen metni gerçekten ilerlet.
         */
        brainAction.content =
            fullText.slice(0, characterIndex);

        brainAction.fullContent =
            fullText;

        brainAction.isStreaming =
            characterIndex < fullText.length;

        session.updatedAt =
            Date.now();

        renderTick += 1;

        /*
         * Her karakterde bütün paneli yeniden çizme.
         * Mobil cihazlarda gereksiz yük oluşmasını önler.
         */
        if(
            renderTick % 3 === 0 ||
            characterIndex >= fullText.length
        ){
            this.renderBrainHistory();

            const history =
                document.getElementById(
                    "brainHistory"
                );

            if(history){
                history.scrollTop =
                    history.scrollHeight;
            }
        }

        if(characterIndex < fullText.length){
            return;
        }

        window.clearInterval(streamTimer);

        /*
         * Cevabı kesin olarak tamamla.
         */
        brainAction.content =
            fullText;

        brainAction.fullContent =
            fullText;

        brainAction.isStreaming =
            false;

        /*
         * Uygulama butonları cevap tamamlandıktan
         * sonra görünür.
         */
        brainAction.appLinks =
            Array.isArray(replyAppMentions)
                ? replyAppMentions
                : [];

        session.updatedAt =
            Date.now();

        if(
            typeof this.updateBrainConversationSummary ===
            "function"
        ){
            this.updateBrainConversationSummary(
                session
            );
        }

        if(
            typeof this.saveBrainState ===
            "function"
        ){
            this.saveBrainState();
        }

        this.renderBrainHistory();

        const finalHistory =
            document.getElementById(
                "brainHistory"
            );

        if(finalHistory){
            finalHistory.scrollTop =
                finalHistory.scrollHeight;
        }

    }, intervalDelay);
} ,

openBrainTarget(page){
    const opened = this.openEntityPage(page);

    if(opened){
        this.closeBrain();
        return true;
    }

    console.error(
        "Brain hedefi açılamadı:",
        page
    );

    return false;
},
    
    dispatchBrainIntent(text){
    const command = String(text || "")
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

    /*
     * Devam noktası kaydetme komutları
     */
    const saveResumeCommands = [
        "burada kaldik",
        "burda kaldik",
        "sonra devam",
        "bunu kaydet",
        "kaldigimiz yeri kaydet"
    ];

    if(
        saveResumeCommands.some(item =>
            command.includes(item)
        )
    ){
        this.saveBrainResumePoint(text);
        return true;
    }

    /*
     * Devam noktasına dönme komutları
     */
    const restoreResumeCommands = [
        "nerede kalmistik",
        "kaldigimiz yer",
        "devam et",
        "kaldigim yer"
    ];

    if(
        restoreResumeCommands.some(item =>
            command.includes(item)
        )
    ){
        this.restoreBrainResumePoint();
        return true;
    }

    const navigationTargets = [
        {
            page: "profile",
            names: [
                "profil",
                "profili",
                "profil uygulamasi",
                "profile"
            ]
        },
        {
            page: "identity",
            names: [
                "kimlik",
                "kimligi",
                "kimlik uygulamasi",
                "identity"
            ]
        },
        {
            page: "memory",
            names: [
                "hafiza",
                "hafizayi",
                "hafiza uygulamasi",
                "memory"
            ]
        },
        {
            page: "bridge",
            names: [
                "kopru",
                "kopruyu",
                "kopru uygulamasi",
                "bridge"
            ]
        },
        {
            page: "timeline",
            names: [
                "timeline",
                "zaman cizelgesi",
                "zaman akisi"
            ]
        },
        {
            page: "organs",
            names: [
                "organ",
                "organlar",
                "organlari",
                "organ uygulamasi"
            ]
        },
        {
            page: "settings",
            names: [
                "ayar",
                "ayarlar",
                "ayarlari",
                "ayarlar uygulamasi"
            ]
        }
    ];

    /*
     * Emir, rica ve doğal konuşma biçimlerini kapsar.
     */
    const navigationPatterns = [
        /\bac\b/,
        /\bacar misin\b/,
        /\acabilir misin\b/,
        /\acmani istiyorum\b/,
        /\acmak istiyorum\b/,
        /\goster\b/,
        /\gosterir misin\b/,
        /\goruntule\b/,
        /\goruntuler misin\b/,
        /\git\b/,
        /\gider misin\b/,
        /\gec\b/,
        /\gecer misin\b/,
        /\beni gotur\b/,
        /\beni .* gotur\b/,
        /\uygulamasini ac\b/,
        /\uygulamayi ac\b/
    ];

    for(const target of navigationTargets){
        const targetFound =
            target.names.some(name =>
                command === name ||
                command.startsWith(`${name} `) ||
                command.endsWith(` ${name}`) ||
                command.includes(` ${name} `)
            );

        if(!targetFound){
            continue;
        }

        const navigationRequested =
            navigationPatterns.some(pattern =>
                pattern.test(command)
            );

        if(navigationRequested){
            return this.openBrainTarget(target.page);
        }
    }

    return false;
},
    saveBrainResumePoint(note){
    const brain = VAERO.get("brain");
    const brainContext = VAERO.get("brainContext");
    if(!brain) return;

    const context = brainContext ? brainContext.build() : null;

    const activeSession =
    (brain.sessions || []).find(session =>
        session.kind === "conversation" &&
        session.status === "progress"
    ) ||
    (brain.sessions || []).find(session =>
        session.status === "progress"
    ) ||
    null;

    brain.resumePoint = {
        id: crypto.randomUUID(),
        sessionId: activeSession ? activeSession.id : null,
        sessionTitle: activeSession ? activeSession.title : null,
        app: context ? context.app : null,
        page: VAERO.engine.currentEntityPage || null,
        note: note,
        savedAt: Date.now()
    };

    if(activeSession){
    activeSession.updatedAt = Date.now();

    if(!Array.isArray(activeSession.actions)){
        activeSession.actions = [];
    }

    const resumeActionExists = activeSession.actions.some(item =>
        this.getBrainActionText(item) ===
        "Devam noktası kaydedildi"
    );

    if(!resumeActionExists){
        activeSession.actions.push({
            id: crypto.randomUUID(),
            role: "system",
            type: "resume",
            content: "Devam noktası kaydedildi",
            createdAt: Date.now()
        });
    }
}

    this.saveBrainState();
this.renderBrainHistory();

console.log("Brain Resume Point:", brain.resumePoint);
},

    restoreBrainResumePoint(){

    const brain = VAERO.get("brain");

    if(!brain || !brain.resumePoint){
        alert("Kayıtlı bir devam noktası bulunamadı.");
        return;
    }

    const point = brain.resumePoint;

    if(point.page){
        VAERO.engine.currentEntityPage = point.page;
    }

    VAERO.engine.mount(VAERO.engine.currentEntity);

    console.log("Brain Resume:", point);

},

    isBrainNoise(text){
    const clean = String(text || "").trim();

    if(!clean) return true;

    const normalized = clean
        .toLowerCase()
        .replaceAll("ı", "i")
        .replaceAll("ğ", "g")
        .replaceAll("ü", "u")
        .replaceAll("ş", "s")
        .replaceAll("ö", "o")
        .replaceAll("ç", "c");

    const words = normalized.split(/\s+/);

    // “Pro”, “asd”, “buu” gibi tek başına kalmış kısa parçalar
    if(words.length === 1 && normalized.length <= 4){
        return true;
    }

    const intentService = VAERO.get("brainIntent");
    const intent = intentService
        ? intentService.detect(clean)
        : { type: "chat" };

    // “Bu aç”, “şu ac” gibi hedefi olmayan yarım komutlar
    if(
        intent.type === "chat" &&
        words.length <= 2 &&
        normalized.length <= 10 &&
        (normalized.includes(" ac") || normalized.endsWith("ac"))
    ){
        return true;
    }

    return false;
},

removeBrainSession(sessionId){
    const brain = VAERO.get("brain");

    if(!brain || !Array.isArray(brain.sessions)){
        return;
    }

    brain.sessions = brain.sessions.filter(
        session => session.id !== sessionId
    );

    this.saveBrainState();
    this.renderBrainHistory();
},

    getBrainActionText(action){
    if(typeof action === "string"){
        return action;
    }

    if(action && typeof action === "object"){
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
        document.getElementById("brainHistory");

    const miniHistory =
        document.getElementById("brainMiniHistory");

    const brain =
        VAERO.get("brain");

    if(!history || !brain){
        return;
    }

    history.innerHTML = "";

    if(miniHistory){
        miniHistory.innerHTML = "";
    }

    const sessions =
        Array.isArray(brain.sessions)
            ? brain.sessions
            : [];

    const todayKey =
        this.getBrainDayKey();

    /*
     * Bugünün tek sohbet oturumu.
     */
    const todaySession =
        sessions.find(session =>
            session &&
            session.kind === "conversation" &&
            session.dayKey === todayKey
        );

    /*
     * Eski kart mimarisinden kalan action oturumları
     * günlük sohbet görünümüne alınmaz.
     */
    const todayActions =
        Array.isArray(todaySession?.actions)
            ? [...todaySession.actions]
                .filter(action =>
                    this
                        .getBrainActionText(action)
                        .trim() !== ""
                )
                .sort(
                    (a, b) =>
                        (a?.createdAt || 0) -
                        (b?.createdAt || 0)
                )
            : [];

    const flow =
        document.createElement("div");

    flow.className = "brain-chat-flow";

    if(todayActions.length === 0){
        flow.innerHTML = `
            <div class="brain-chat-empty">
                <strong>Bugünün sohbeti</strong>
                <span>
                    Brain’e bir şey yazarak başlayabilirsin.
                </span>
            </div>
        `;
    }else{
        todayActions.forEach(action => {
            const content =
                this.getBrainActionText(action);

            if(!content.trim()){
                return;
            }

            const role =
                action &&
                typeof action === "object"
                    ? action.role
                    : null;

            const createdAt =
                action?.createdAt || Date.now();

            const messageTime =
                new Date(createdAt)
                    .toLocaleTimeString("tr-TR", {
                        hour: "2-digit",
                        minute: "2-digit"
                    });

            /*
             * Uygulama geçişleri sohbeti bölmeyen
             * küçük sistem hareketleri olarak gösterilir.
             */
            if(
                role === "system" ||
                action?.type === "navigation"
            ){
                const systemRow =
                    document.createElement("div");

                systemRow.className =
                    "brain-chat-system";

                systemRow.innerHTML = `
                    <span class="brain-chat-system-time">
                        ${messageTime}
                    </span>

                    <span>
                        ${this.escapeBrainHTML(content)}
                    </span>
                `;

                flow.appendChild(systemRow);
                return;
            }

            const message =
                document.createElement("div");

            message.className =
                role === "user"
                    ? "brain-chat-message brain-chat-user"
                    : "brain-chat-message brain-chat-brain";

            const contextPage =
                action?.context?.page
                    ? `
                        <span class="brain-chat-context">
                            ${this.escapeBrainHTML(
                                action.context.page
                            )}
                        </span>
                    `
                    : "";

            const appLinks =
                Array.isArray(action?.appLinks)
                    ? action.appLinks
                    : [];

            const uniqueLinks = [];

            appLinks.forEach(link => {
                if(
                    !link ||
                    !link.app ||
                    uniqueLinks.some(
                        item => item.app === link.app
                    )
                ){
                    return;
                }

                uniqueLinks.push(link);
            });

            const linksHTML =
    uniqueLinks.length
        ? `
            <span class="brain-message-app-links">
                ${uniqueLinks
                    .map(link => `
                        <button
                            type="button"
                            class="brain-message-app-link"
                            data-brain-app="${this.escapeBrainHTML(link.app)}"
                            data-brain-label="${this.escapeBrainHTML(link.label)}">

                            ${this.escapeBrainHTML(link.label)}

                        </button>
                    `)
                    .join("")}
            </span>
        `
        : "";
            message.innerHTML = `
                <div class="brain-chat-meta">
                    <span>${messageTime}</span>
                    ${contextPage}
                </div>

                <div class="brain-chat-content">
                    ${this.escapeBrainHTML(content)}
                    ${linksHTML}
                </div>
            `;

            flow.appendChild(message);
        });
    }

    history.appendChild(flow);

    /*
     * Uygulama bağlantıları.
     */
    history
        .querySelectorAll(".brain-message-app-link")
        .forEach(button => {
            button.addEventListener("click", event => {
                event.stopPropagation();

                const app =
                    button.dataset.brainApp;

                if(!app){
                    return;
                }

                this.closeBrain();

                requestAnimationFrame(() => {
                    this.openEntityPage(app);
                });
            });
        });

    /*
     * Kompakt görünümde bugünün son dört gerçek mesajı.
     */
    if(miniHistory){
        const recentMessages =
            todayActions
                .filter(action =>
                    action?.role === "user" ||
                    action?.role === "brain"
                )
                .slice(-4);

        const miniFlow =
            document.createElement("div");

        miniFlow.className =
            "brain-mini-chat-flow";

        recentMessages.forEach(action => {
            const role =
                action.role === "user"
                    ? "Sen"
                    : "Brain";

            const message =
                document.createElement("div");

            message.className =
                "brain-mini-chat-message";

            message.innerHTML = `
                <strong>${role}:</strong>
                <span>
                    ${this.escapeBrainHTML(
                        this.getBrainActionText(action)
                    )}
                </span>
            `;

            miniFlow.appendChild(message);
        });

        miniFlow.addEventListener("click", () => {
            const panel =
                document.getElementById("brainPanel");

            if(panel){
                panel.classList.remove("is-compact");
                panel.classList.add("is-expanded");
            }
        });

        miniHistory.appendChild(miniFlow);
    }

    /*
     * Yeni mesaj geldiğinde sohbetin en altına git.
     */
    requestAnimationFrame(() => {
        history.scrollTop =
            history.scrollHeight;
    });
},
    
    openBrainSession(session){
    if(!session) return;

    const actionText = (session.actions || [])
    .map(action => this.getBrainActionText(action))
    .filter(Boolean)
    .join(" ");

const source = `${session.title || ""} ${actionText}`
    .toLowerCase();

    let page = null;

    if(source.includes("profil")){
        page = "profile";
    } else if(
    source.includes("kimlik") ||
    source.includes("kimliği") ||
    source.includes("kimligi")
){
    page = "identity";
    } else if(
        source.includes("hafıza") ||
        source.includes("hafiza") ||
        source.includes("memory")
    ){
        page = "memory";
    } else if(
        source.includes("köprü") ||
        source.includes("kopru") ||
        source.includes("bridge")
    ){
        page = "bridge";
    } else if(
        source.includes("timeline") ||
        source.includes("zaman")
    ){
        page = "timeline";
    } else if(source.includes("organ")){
        page = "organs";
    } else if(source.includes("ayar")){
        page = "settings";
    }

    if(!page){
        console.log("Brain Session için yönlendirme bulunamadı:", session);
        return;
    }

    this.closeBrain();

requestAnimationFrame(() => {
    this.openEntityPage(page);
});
},

    initBrainPanelAdaptiveSize(){
    const panel = document.querySelector(".brain-panel");
    const input = document.getElementById("brainInput");
    const history = document.getElementById("brainHistory");
    const miniHistory = document.getElementById("brainMiniHistory");

    if(!panel) return;

    panel.classList.remove("is-expanded");
    panel.classList.add("is-compact");

    const expandPanel = () => {
        panel.classList.remove("is-compact");
        panel.classList.add("is-expanded");
    };

    const compactPanel = event => {
        if(!document.body.contains(panel)) return;
        if(panel.contains(event.target)) return;

        const openSession = panel.querySelector(
            '.brain-session-card[data-open="true"]'
        );

        if(openSession) return;

        panel.classList.remove("is-expanded");
        panel.classList.add("is-compact");
    };

    if(input){
        input.addEventListener("focus", expandPanel);
        input.addEventListener("click", expandPanel);
    }

    if(history){
        history.addEventListener("click", expandPanel);
    }

    if(miniHistory){
        miniHistory.addEventListener("click", expandPanel);
    }

    document.addEventListener("pointerdown", compactPanel);
},
    
    initBrainSessionDragClose() {
    const panel = document.querySelector(".brain-panel");
    if (!panel) return;

    let startX = 0;
    let startY = 0;

    panel.addEventListener("pointerdown", event => {
        startX = event.clientX;
        startY = event.clientY;
    });

    panel.addEventListener("pointermove", event => {
        const movedX = Math.abs(event.clientX - startX);
        const movedY = Math.abs(event.clientY - startY);

        if (movedX < 8 && movedY < 8) return;

        panel.classList.add("is-dragging");

        panel
            .querySelectorAll('.brain-session-card[data-open="true"]')
            .forEach(card => {
                card.dataset.open = "false";
            });
    });

    panel.addEventListener("pointerup", () => {
        panel.classList.remove("is-dragging");
    });

    panel.addEventListener("pointerleave", () => {
        panel.classList.remove("is-dragging");
    });
},

};

document.addEventListener("click", event => {

    const button = event.target.closest("[data-action]");
    if(!button) return;

    const action = button.dataset.action;

    if(action === "profile:open"){
        Actions.openProfile(VAERO.engine.currentEntity);
    }

    if(action === "modal:close"){
        Actions.closeModal();
    }

    if(action === "world:create"){
        Actions.createWorld();
    }

    if(action === "world:open"){
        Actions.openWorld(button.dataset.worldId);
    }

    if(action === "world:back"){
        VAERO.engine.currentEntityPage = null;
        VAERO.engine.currentOpenedEntity = null;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    }

    if(action === "entity:dashboard"){
        Actions.openEntityPage(null);
    }

    if(action === "brain:open"){
        Actions.openBrain();
    }

    if(action === "brain:close"){
        Actions.closeBrain();
    }

    if(action === "brain:send"){
        Actions.sendBrainMessage();
    }

    if(action === "entity:identity"){
        Actions.openEntityPage("identity");
    }

    if(action === "entity:profile"){
        Actions.openEntityPage("profile");
    }

    if(action === "entity:organs"){
        Actions.openEntityPage("organs");
    }

    if(action === "entity:timeline"){
        Actions.openEntityPage("timeline");
    }

    if(action === "entity:memory"){
        Actions.openEntityPage("memory");
    }

    if(action === "entity:bridge"){
        Actions.openEntityPage("bridge");
    }

    if(action === "entity:evolution"){
    Actions.openEntityPage("evolution");
}

    if(action === "entity:settings"){
        Actions.openEntityPage("settings");
    }

    if(action === "entity:create:first"){
        VAERO.engine.entityCreateMode = true;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    }

    if(action === "entity:type:select"){
        VAERO.engine.entityType = button.dataset.entityType;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    }

    if(action === "entity:create"){
        Actions.createEntity();
    }

    if(action === "entity:open"){
        Actions.openEntity(button.dataset.entityId);
    }

});

VAERO.register("actions", Actions);

