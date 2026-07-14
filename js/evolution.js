const Evolution = {

    history: [],

    storageKey: "vaero:evolution:events",

    eventTypes: [
    "achievement",
    "decision",
    "failure",
    "relationship",
    "work",
    "health",
    "finance",
    "location",
    "goal",
    "milestone",
    "engine:start",
    "general"
],

    eventStatuses: [
        "planned",
        "active",
        "completed",
        "cancelled"
    ],

    importanceLevels: [
        "low",
        "medium",
        "high",
        "critical"
    ],

    cleanupLegacyEngineStarts(){

    const beforeCount = this.history.length;

    this.history = this.history.filter(event =>
        !(
            event.type === "general" &&
            event.title ===
                "VAERO Engine started with root entity"
        )
    );

    const removedCount =
        beforeCount - this.history.length;

    if(
        removedCount > 0 &&
        typeof this.save === "function"
    ){
        this.save();
    }

    return removedCount;

},

    migrateLegacyEvents(){

    let changed = false;

    this.history = this.history.map(event => {

        const migratedEvent = {
            ...event
        };

        if(!Number.isFinite(Number(migratedEvent.xp))){
            migratedEvent.xp = 0;
            changed = true;
        }

        if(!Array.isArray(migratedEvent.organs)){
            migratedEvent.organs = [];
            changed = true;
        }

        if(!Array.isArray(migratedEvent.identities)){
            migratedEvent.identities = [];
            changed = true;
        }

        if(!migratedEvent.payload || typeof migratedEvent.payload !== "object"){
            migratedEvent.payload = {};
            changed = true;
        }

        return migratedEvent;

    });

    if(changed){
        this.save();
    }

    return changed;

},

    init(){

    this.load();

    this.cleanupLegacyEngineStarts();
    this.migrateLegacyEvents();

    VAERO.emit("evolution:ready", {
        count: this.history.length
    });

    return this;

},
    createId(){

        if(
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ){
            return crypto.randomUUID();
        }

        return `evolution_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;
    },

    normalizeText(value){

    return String(value || "")
        .toLowerCase()
        .trim()
        .replaceAll("ı", "i")
        .replaceAll("ğ", "g")
        .replaceAll("ü", "u")
        .replaceAll("ş", "s")
        .replaceAll("ö", "o")
        .replaceAll("ç", "c")
        .replace(/[?.!,;:]/g, " ")
        .replace(/\s+/g, " ");

},

    normalizeType(type){

        const normalized = String(type || "")
            .toLowerCase()
            .trim();

        if(this.eventTypes.includes(normalized)){
            return normalized;
        }

        return "general";

    },

    normalizeStatus(status){

        const normalized = String(status || "")
            .toLowerCase()
            .trim();

        if(this.eventStatuses.includes(normalized)){
            return normalized;
        }

        return "completed";

    },

    normalizeImportance(importance){

        const normalized = String(importance || "")
            .toLowerCase()
            .trim();

        if(this.importanceLevels.includes(normalized)){
            return normalized;
        }

        return "medium";

    },

    normalizeTags(tags){

        if(!Array.isArray(tags)){
            return [];
        }

        return [...new Set(
            tags
                .map(tag => String(tag || "").trim())
                .filter(Boolean)
        )];

    },

    normalizeEffects(effects){

        if(
            !effects ||
            typeof effects !== "object" ||
            Array.isArray(effects)
        ){
            return {};
        }

        const normalized = {};

        Object.entries(effects).forEach(([key, value]) => {

            const effectName = String(key || "").trim();
            const effectValue = Number(value);

            if(
                effectName &&
                Number.isFinite(effectValue)
            ){
                normalized[effectName] = effectValue;
            }

        });

        return normalized;

    },

    record(type, description, payload = {}){

    const safePayload =
        payload &&
        typeof payload === "object" &&
        !Array.isArray(payload)
            ? payload
            : {};

    const now = Date.now();

    const event = {
        id: this.createId(),

        type: this.normalizeType(type),

        title: String(
            safePayload.title ||
            description ||
            "Yaşam olayı"
        ).trim(),

        description: String(
            description || ""
        ).trim(),

        status: this.normalizeStatus(
            safePayload.status
        ),

        importance: this.normalizeImportance(
            safePayload.importance
        ),

        source: String(
            safePayload.source || "user"
        ).trim(),

        tags: this.normalizeTags(
            safePayload.tags
        ),

        relatedEntityId:
            safePayload.relatedEntityId || null,

        relatedWorldId:
            safePayload.relatedWorldId || null,

        effects: this.normalizeEffects(
            safePayload.effects
        ),

        xp: Math.max(
            0,
            Number(safePayload.xp) || 0
        ),

        organs: Array.isArray(safePayload.organs)
            ? [...new Set(
                safePayload.organs
                    .map(value =>
                        String(value || "")
                            .trim()
                            .toLowerCase()
                    )
                    .filter(Boolean)
            )]
            : [],

        identities: Array.isArray(
            safePayload.identities
        )
            ? [...new Set(
                safePayload.identities
                    .map(value =>
                        String(value || "").trim()
                    )
                    .filter(Boolean)
            )]
            : [],

        occurredAt:
            safePayload.occurredAt || now,

        createdAt: now,

        updatedAt: now,

        payload: safePayload
    };

    this.history.push(event);

    this.sort();
    this.save();

    VAERO.emit(
        "evolution:recorded",
        event
    );

    return event;

},
    

    analyzeLifeEvent(data = {}){

    const text = this.normalizeText(
        `${data.title || ""} ${data.description || ""}`
    );

    let type = "general";
    let importance = "medium";
    let tags = [];
    let effects = {};

    if(
        text.includes("ilk satis") ||
        text.includes("basari") ||
        text.includes("kazandi") ||
        text.includes("tamamlandi")
    ){
        type = "achievement";
        importance = "high";
        tags.push("başarı");

        effects = {
            experience: 10,
            confidence: 5,
            reputation: 3
        };
    }
    else if(
        text.includes("basarisiz") ||
        text.includes("kaybetti") ||
        text.includes("olmadi") ||
        text.includes("hata")
    ){
        type = "failure";
        importance = "high";
        tags.push("başarısızlık");

        effects = {
            experience: 8,
            confidence: -3
        };
    }
    else if(
        text.includes("karar verdi") ||
        text.includes("karar aldi") ||
        text.includes("vazgecti")
    ){
        type = "decision";
        tags.push("karar");

        effects = {
            awareness: 4
        };
    }
    else if(
        text.includes("hedef") ||
        text.includes("planliyor") ||
        text.includes("yapacak")
    ){
        type = "goal";
        tags.push("hedef");

        effects = {
            motivation: 3
        };
    }
    else if(
        text.includes("ise basladi") ||
        text.includes("is kurdu") ||
        text.includes("sirket")
    ){
        type = "work";
        importance = "high";
        tags.push("iş");

        effects = {
            experience: 7,
            responsibility: 5
        };
    }
    else if(
        text.includes("para") ||
        text.includes("gelir") ||
        text.includes("borc") ||
        text.includes("odeme")
    ){
        type = "finance";
        tags.push("finans");

        effects = {
            financialExperience: 5
        };
    }

    return {
        type,
        importance,
        tags,
        effects
    };

},

    inferAffectedOrgans(data = {}, analysis = {}){

    const organs = new Set(
        (Array.isArray(data.organs)
            ? data.organs
            : []
        )
            .map(value =>
                String(value || "")
                    .trim()
                    .toLowerCase()
            )
            .filter(Boolean)
    );

    const analysisType = String(
        analysis.type || ""
    )
        .trim()
        .toLowerCase();

    const importance = this.normalizeImportance(
        data.importance
    );

    const text = this.normalizeText(
        [
            data.type,
            analysisType,
            data.title,
            data.description
        ]
            .filter(Boolean)
            .join(" ")
    );

    organs.add("timeline");
    organs.add("memory");

    if(
        text.includes("kimlik") ||
        text.includes("identity") ||
        text.includes("dogrulama")
    ){
        organs.add("identity");
    }

    if(
        text.includes("profil") ||
        text.includes("profile")
    ){
        organs.add("profile");
    }

    if(
        text.includes("bridge") ||
        text.includes("kopru") ||
        text.includes("baglanti") ||
        analysisType === "relationship"
    ){
        organs.add("bridge");
    }

    if(
        analysisType === "achievement" ||
        analysisType === "decision" ||
        importance === "high" ||
        importance === "critical"
    ){
        organs.add("brain");
    }

    return [...organs];

}, 

    validateLifeEvent(data = {}){

    const title = String(
        data.title || ""
    ).trim();

    const description = String(
        data.description || ""
    ).trim();

    if(!title && !description){
        return {
            valid: false,
            reason: "Yaşam olayının başlığı veya açıklaması olmalı."
        };
    }

    return {
        valid: true,
        reason: null
    };

},

publishLifeEvent(event){

    if(!event){
        return false;
    }

    const events = VAERO.get("events");

    if(
        !events ||
        typeof events.emit !== "function"
    ){
        console.warn(
            "Life Event yayınlanamadı: EventSystem bulunamadı."
        );

        return false;
    }

    const importance = this.normalizeImportance(
    event.importance
);
    
    events.emit("life-event:created", event);

    if(importance === "high"){
    events.emit("life-event:important", event);
}

if(importance === "critical"){
    events.emit("life-event:critical", event);
}

    return true;

},

    createLifeEvent(data = {}){

    const validation =
        this.validateLifeEvent(data);

    if(!validation.valid){

        console.warn(
            "Life Event oluşturulamadı:",
            validation.reason
        );

        VAERO.emit(
            "life-event:rejected",
            {
                data,
                reason: validation.reason
            }
        );

        return null;
    }

    const analysis =
        this.analyzeLifeEvent(data);

    const event = this.record(
        data.type || analysis.type,
        data.description || "",
        {
            title:
                data.title ||
                data.description ||
                "Yaşam olayı",

            status:
                data.status ||
                "completed",

            importance:
                data.importance ||
                analysis.importance,

            source:
                data.source ||
                "user",

            tags: [
                ...analysis.tags,
                ...(Array.isArray(data.tags)
                    ? data.tags
                    : [])
            ],

            relatedEntityId:
                data.relatedEntityId ||
                null,

            relatedWorldId:
                data.relatedWorldId ||
                null,

            occurredAt:
                data.occurredAt ||
                Date.now(),

            effects: {
    ...analysis.effects,
    ...(data.effects || {})
},

xp: Number(data.xp) || 0,

organs: this.inferAffectedOrgans(
    data,
    analysis
),

identities: Array.isArray(data.identities)
    ? data.identities
    : []
});

this.publishLifeEvent(event);

return event;
},
    update(eventId, changes = {}){

        const event = this.find(eventId);

        if(!event){
            return null;
        }

        if(changes.type !== undefined){
            event.type = this.normalizeType(changes.type);
        }

        if(changes.title !== undefined){
            event.title = String(changes.title || "").trim();
        }

        if(changes.description !== undefined){
            event.description = String(
                changes.description || ""
            ).trim();
        }

        if(changes.status !== undefined){
            event.status = this.normalizeStatus(
                changes.status
            );
        }

        if(changes.importance !== undefined){
            event.importance = this.normalizeImportance(
                changes.importance
            );
        }

        if(changes.source !== undefined){
            event.source = String(
                changes.source || "user"
            ).trim();
        }

        if(changes.tags !== undefined){
            event.tags = this.normalizeTags(
                changes.tags
            );
        }

        if(changes.effects !== undefined){
            event.effects = this.normalizeEffects(
                changes.effects
            );
        }

        if(changes.xp !== undefined){
            event.xp = Math.max(
                0,
                Number(changes.xp) || 0
            );
        }

        if(changes.organs !== undefined){
            event.organs = Array.isArray(changes.organs)
                ? [...new Set(
                    changes.organs
                        .map(value =>
                            String(value || "")
                                .trim()
                                .toLowerCase()
                        )
                        .filter(Boolean)
                )]
                : [];
        }

        if(changes.identities !== undefined){
            event.identities = Array.isArray(changes.identities)
                ? [...new Set(
                    changes.identities
                        .map(value =>
                            String(value || "").trim()
                        )
                        .filter(Boolean)
                )]
                : [];
        }
        if(changes.relatedEntityId !== undefined){
            event.relatedEntityId =
                changes.relatedEntityId || null;
        }

        if(changes.relatedWorldId !== undefined){
            event.relatedWorldId =
                changes.relatedWorldId || null;
        }

        if(changes.occurredAt !== undefined){
            event.occurredAt =
                changes.occurredAt || event.occurredAt;
        }

        event.updatedAt = Date.now();

        this.sort();
        this.save();

        const events = VAERO.get("events");

        if(
            events &&
            typeof events.emit === "function"
        ){
            events.emit(
                "life-event:updated",
                event
            );
        }

        VAERO.emit("evolution:updated", event);

        return event;

    },

    remove(eventId){

        const index = this.history.findIndex(
            event => event.id === eventId
        );

        if(index === -1){
            return false;
        }

        const [removedEvent] = this.history.splice(
            index,
            1
        );

        this.save();

const events = VAERO.get("events");

if(
    events &&
    typeof events.emit === "function"
){
    events.emit(
        "life-event:removed",
        removedEvent
    );
}

VAERO.emit(
    "evolution:removed",
    removedEvent
);

        return true;

    },

    find(eventId){

        return this.history.find(
            event => event.id === eventId
        ) || null;

    },

    all(){

        return [...this.history];

    },

    byType(type){

        const normalizedType =
            this.normalizeType(type);

        return this.history.filter(
            event => event.type === normalizedType
        );

    },

    byStatus(status){

        const normalizedStatus =
            this.normalizeStatus(status);

        return this.history.filter(
            event => event.status === normalizedStatus
        );

    },

    byEntity(entityId){

        return this.history.filter(
            event =>
                event.relatedEntityId === entityId
        );

    },

    important(){

        return this.history.filter(
            event =>
                event.importance === "high" ||
                event.importance === "critical"
        );

    },

    sort(){

        this.history.sort((a, b) => {

            const aDate =
                Number(a.occurredAt) ||
                Number(a.createdAt) ||
                0;

            const bDate =
                Number(b.occurredAt) ||
                Number(b.createdAt) ||
                0;

            return bDate - aDate;

        });

        return this.history;

    },

    save(){

        try{

            localStorage.setItem(
                this.storageKey,
                JSON.stringify(this.history)
            );

            return true;

        }catch(error){

            console.error(
                "Evolution kaydedilemedi:",
                error
            );

            return false;

        }

    },

    load(){

        try{

            const saved = localStorage.getItem(
                this.storageKey
            );

            if(!saved){
                this.history = [];
                return this.history;
            }

            const parsed = JSON.parse(saved);

            this.history = Array.isArray(parsed)
                ? parsed
                : [];

            this.sort();

            return this.history;

        }catch(error){

            console.error(
                "Evolution yüklenemedi:",
                error
            );

            this.history = [];

            return this.history;

        }

    },

    clear(){

        this.history = [];

        this.save();

        VAERO.emit("evolution:cleared");

        return true;

    }

};

VAERO.register("evolution", Evolution);

Evolution.init();
