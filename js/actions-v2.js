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

    if(!brain.sessions){
        brain.sessions = [];
    }

    const titleMap = {
        profile: "Profil Oturumu",
        identity: "Kimlik Oturumu",
        organs: "Organ Oturumu",
        timeline: "Timeline Oturumu",
        memory: "Hafıza Oturumu",
        bridge: "Bridge Oturumu",
        settings: "Ayarlar Oturumu"
    };

    const actionMap = {
        profile: "Profili açtı",
        identity: "Kimliğe geçti",
        organs: "Organları görüntüledi",
        timeline: "Zaman çizelgesini açtı",
        memory: "Hafızayı görüntüledi",
        bridge: "Bridge bölümüne geçti",
        settings: "Ayarları açtı"
    };

    const title = titleMap[page];
const action = actionMap[page];

if(!title || !action){
    return;
}

    let session = brain.sessions.find(s =>
        s.title === title &&
        s.status === "progress"
    );

    if(!session){
    session = {
        id: crypto.randomUUID(),
        title,

        kind: "action",
        target: page,

        status: "progress",
        startedAt: Date.now(),
        updatedAt: Date.now(),
        actions: [],
        favorite: false,
        summary: null
    };

    brain.sessions.unshift(session);
}

    session.updatedAt = Date.now();

if(!Array.isArray(session.actions)){
    session.actions = [];
}

const actionAlreadyExists = session.actions.some(item =>
    this.getBrainActionText(item) === action
);

if(!actionAlreadyExists){
    session.actions.push(action);
}

        this.saveBrainState();
    this.renderBrainHistory();
},

    getBrainStorageKey(){
    const entityId =
        VAERO.engine.currentOpenedEntity?.id ||
        VAERO.engine.currentEntity?.id ||
        "global";

    return `vaero:brain:${entityId}`;
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
                                Date.now()
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
    document.querySelectorAll("#brainPanel").forEach(panel => panel.remove());
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

    completeActiveBrainConversation(exceptSessionId = null){
    const brain = VAERO.get("brain");

    if(!brain || !Array.isArray(brain.sessions)){
        return;
    }

    brain.sessions.forEach(session => {

        if(session.kind !== "conversation"){
            return;
        }

        if(session.id === exceptSessionId){
            return;
        }

        if(session.status !== "progress"){
            return;
        }

        session.status = "done";
        session.updatedAt = Date.now();
    });
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
sendBrainMessage(){
    const input = document.getElementById("brainInput");
    if(!input) return;

    const text = input.value.trim();
    if(text === "") return;

    const brain = VAERO.get("brain");
    const brainContext = VAERO.get("brainContext");

    if(!brain || typeof brain.receive !== "function"){
        return;
    }

    if(!Array.isArray(brain.sessions)){
        brain.sessions = [];
    }

    const context = brainContext
        ? brainContext.build()
        : null;

    /*
     * Her gönderilen mesaj önce Brain'e iletilir.
     */
    const brainReply = brain.receive(text, context);

    /*
     * Normal sohbet ve komutlar artık aynı oturum kayıt
     * sisteminden geçer.
     */
    const isNoise = this.isBrainNoise(text);

const detectedTopic = isNoise
    ? null
    : this.detectBrainConversationTopic(text);

const conversationTitle = isNoise
    ? null
    : this.createBrainConversationTitle(text);

let session = isNoise
    ? null
    : this.getActiveBrainConversationSession(
    detectedTopic
);

if(!session){
    this.completeActiveBrainConversation();
    
    session = {
        id: crypto.randomUUID(),
        title: isNoise
            ? text
            : conversationTitle,
        kind: isNoise
            ? "noise"
            : "conversation",
        target: null,
        status: "progress",
        startedAt: Date.now(),
        updatedAt: Date.now(),
        actions: [],
        favorite: false,
        summary: null,
topic: detectedTopic,
detectedTitle: conversationTitle
    };

    brain.sessions.unshift(session);
}

    if(
    !isNoise &&
    detectedTopic &&
    !session.topic
){
    session.topic = detectedTopic;
    session.title = conversationTitle;
}

session.updatedAt = Date.now();
     if(!Array.isArray(session.actions)){
    session.actions = [];
}

session.actions.push({
    id: crypto.randomUUID(),
    role: "user",
    type: "message",
    content: text,
    createdAt: Date.now()
});

    if(!isNoise){
    this.updateBrainConversationMetadata(
        session,
        text
    );

        if(!isNoise){
    this.updateBrainConversationSummary(session);
}
}

    /*
     * Brain cevap döndürüyorsa aynı oturumun içine ekle.
     */
    if(brainReply){
        const replyText =
            typeof brainReply === "string"
                ? brainReply
                : brainReply.reply ||
                  brainReply.message ||
                  brainReply.text ||
                  null;

        if(replyText){
            session.actions.push({
                id: crypto.randomUUID(),
                role: "brain",
                type: "reply",
                content: replyText,
                createdAt: Date.now()
            });
            this.updateBrainConversationSummary(session);
        }
    }


    /*
     * Intent kayıttan sonra çalışır.
     * Böylece "Profili aç" gibi komutlar geçmişten kaybolmaz.
     */
    const handledByIntent = this.dispatchBrainIntent(text);

    if(handledByIntent){
    session.updatedAt = Date.now();

    session.actions.push({
        id: crypto.randomUUID(),
        role: "system",
        type: "navigation",
        content: "Komut işlendi.",
        createdAt: Date.now()
    });
}

    input.value = "";

this.updateBrainConversationSummary(session);

if(typeof this.saveBrainState === "function"){
    this.saveBrainState();
}

this.renderBrainHistory();

    /*
     * Komut paneli kapattıysa yeniden açmaya çalışma.
     */
    if(handledByIntent){
        return;
    }

    const panel = document.getElementById("brainPanel");

    if(panel){
        panel.classList.remove("is-compact");
        panel.classList.add("is-expanded");
    }

    console.log("Brain Sessions:", brain.sessions);
}, 

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

    if(saveResumeCommands.some(item => command.includes(item))){
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

    if(restoreResumeCommands.some(item => command.includes(item))){
        this.restoreBrainResumePoint();
        return true;
    }

    /*
     * Yalnızca gerçek navigasyon ifadelerini kabul et.
     * Bir kelimenin cümlede geçmesi tek başına yeterli değildir.
     */
    const navigationTargets = [
        {
            page: "profile",
            names: ["profil", "profili", "profile"]
        },
        {
            page: "identity",
            names: ["kimlik", "kimligi", "identity"]
        },
        {
            page: "memory",
            names: ["hafiza", "hafizayi", "memory"]
        },
        {
            page: "bridge",
            names: ["kopru", "kopruyu", "bridge"]
        },
        {
            page: "timeline",
            names: ["timeline", "zaman cizelgesi", "zaman akisi"]
        },
        {
            page: "organs",
            names: ["organ", "organlar", "organlari"]
        },
        {
            page: "settings",
            names: ["ayar", "ayarlar", "ayarlari"]
        }
    ];

    const openVerbs = [
        "ac",
        "goster",
        "goruntule",
        "git",
        "gec",
        "beni gotur"
    ];

    for(const target of navigationTargets){
        const targetFound = target.names.some(name =>
            command === name ||
            command.startsWith(`${name} `) ||
            command.endsWith(` ${name}`) ||
            command.includes(` ${name} `)
        );

        if(!targetFound){
            continue;
        }

        const verbFound = openVerbs.some(verb =>
            command === verb ||
            command.startsWith(`${verb} `) ||
            command.endsWith(` ${verb}`) ||
            command.includes(` ${verb} `)
        );

        if(verbFound){
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
    const history = document.getElementById("brainHistory");
    const miniHistory = document.getElementById("brainMiniHistory");
    const brain = VAERO.get("brain");

    if(!history || !brain) return;

    history.innerHTML = "";

    if(miniHistory){
        miniHistory.innerHTML = "";
    }

    const sessions = [...(brain.sessions || [])].sort((a, b) => {
    const aTime = a.updatedAt || a.startedAt || 0;
    const bTime = b.updatedAt || b.startedAt || 0;

    return bTime - aTime;
});  

    sessions.forEach((session, index) => {
        const card = document.createElement("div");

        card.className = "brain-session-card";
        const kind =
    session.kind ||
    (session.target ? "action" : "conversation");

card.classList.add(`brain-session-${kind}`);
card.dataset.open = "false";

const messageCount =
    (session.actions || []).filter(action =>
        action &&
        typeof action === "object" &&
        (
            action.role === "user" ||
            action.role === "brain"
        )
    ).length;

const sessionDate = new Date(
    session.updatedAt ||
    session.startedAt ||
    Date.now()
);

        const date = sessionDate.toLocaleDateString("tr-TR");

        const time = sessionDate.toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const statusMap = {
            done: "🟢 Tamamlandı",
            progress: "🟡 Devam Ediyor",
            error: "🔴 Sorun"
        };

        const statusText =
            statusMap[session.status] ||
            statusMap.progress;

        const validActions = Array.isArray(session.actions)
    ? session.actions.filter(item =>
        this.getBrainActionText(item).trim() !== ""
    )
    : [];

const messageCount = validActions.length;

 const rightContent = kind === "action"
    ? `<span class="brain-action-label">Aç →</span>`
    : kind === "noise"
        ? `
            <button 
                type="button"
                class="brain-noise-remove"
                aria-label="Önemsiz mesajı sil">
                ×
            </button>
        `
        : `
            <span class="brain-conversation-label">
                Sohbet · ${messageCount}
            </span>
        `;

        const lastMessage = validActions.length
    ? this.getBrainActionText(
        validActions[validActions.length - 1]
    )
    : "";

const lastMessagePreview =
    const messageCount =
    (session.actions || []).filter(action =>
        action.role === "user" ||
        action.role === "brain"
    ).length;
    lastMessage.length > 70
        ? `${lastMessage.slice(0, 70)}…`
        : lastMessage;

        const sortedActions = [...(session.actions || [])].sort(
    (a, b) =>
        (a.createdAt || 0) -
        (b.createdAt || 0)
);

card.innerHTML = `
    <div class="brain-session-head">
        <div class="brain-session-main">
            <strong>${
                this.escapeBrainHTML(
                    session.title || "Brain Oturumu"
                )
            }</strong>

            <small>${date} · ${time}</small>

            <span class="brain-session-status brain-status-${session.status || "progress"}">
                ${statusText}
            </span>

            ${
    kind === "conversation" &&
    (session.summary || lastMessagePreview)
        ? `
            <span class="brain-session-preview">
                ${
                    this.escapeBrainHTML(
                        session.summary ||
                        lastMessagePreview
                    )
                }
            </span>
        `
        : ""
}
        </div>

        ${rightContent}
    </div>

    <div class="brain-session-body">
        ${sortedActions
            .map(action => {
                const rawContent =
                    this.getBrainActionText(action);

                const content =
                    this.escapeBrainHTML(rawContent);

                if(!rawContent.trim()){
                    return "";
                }

                const role =
                    action &&
                    typeof action === "object"
                        ? action.role
                        : null;

                const roleLabel =
                    role === "user"
                        ? "Sen"
                        : role === "brain"
                            ? "Brain"
                            : role === "system"
                                ? "Sistem"
                                : "";

                return `
                    <p class="brain-session-message${
                        role
                            ? ` brain-message-${role}`
                            : ""
                    }">
                        ${
                            roleLabel
                                ? `<strong>${roleLabel}:</strong> `
                                : "- "
                        }

                        ${content}
                    </p>
                `;
            })
            .join("")}
    </div>

    <div class="brain-delete-confirm">
        <span>Silmek istediğine emin misin?</span>

        <div>
            <button
                type="button"
                class="brain-delete-approve">
                Önemsiz, sil
            </button>

            <button
                type="button"
                class="brain-delete-cancel">
                Vazgeç
            </button>
        </div>
    </div>
`;
        const removeButton = card.querySelector(".brain-noise-remove");
const approveButton = card.querySelector(".brain-delete-approve");
const cancelButton = card.querySelector(".brain-delete-cancel");

if(removeButton){
    removeButton.addEventListener("click", event => {
        event.stopPropagation();
        card.classList.add("is-confirming-delete");
    });
}

if(approveButton){
    approveButton.addEventListener("click", event => {
        event.stopPropagation();
        this.removeBrainSession(session.id);
    });
}

if(cancelButton){
    cancelButton.addEventListener("click", event => {
        event.stopPropagation();
        card.classList.remove("is-confirming-delete");
    });
}

card.addEventListener("click", event => {

    if(event.target.closest("button")) return;

    if(kind === "action"){
        this.openBrainSession(session);
        return;
    }

    if(kind === "noise"){
        return;
    }

    const isOpen = card.dataset.open === "true";

    document
        .querySelectorAll(".brain-session-card")
        .forEach(other => {
            if(other !== card){
                other.dataset.open = "false";
            }
        });

    card.dataset.open = isOpen ? "false" : "true";
});

        history.appendChild(card);

        /*
         * Mini geçmişte yalnızca son iki oturumu göster.
         * Mini kart ilk tıklamada paneli büyütür.
         */
        if(miniHistory && index < 2){
            const miniCard = card.cloneNode(true);

            miniCard.dataset.open = "false";

            miniCard.addEventListener("click", () => {
                const panel = document.getElementById("brainPanel");

                if(panel){
                    panel.classList.remove("is-compact");
                    panel.classList.add("is-expanded");
                }
            });

            miniHistory.appendChild(miniCard);
        }
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

