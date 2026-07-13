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

    init(){

        this.load();

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

            description: String(description || "").trim(),

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

            occurredAt:
                safePayload.occurredAt || now,

            createdAt: now,

            updatedAt: now,

            payload: safePayload
        };

        this.history.push(event);

        this.sort();
        this.save();

        VAERO.emit("evolution:recorded", event);

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
