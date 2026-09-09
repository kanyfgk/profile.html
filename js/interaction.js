/* =========================================================
   VAERO INTERACTION CORE
   Universal Interaction / Relationship / Outcome Protocol

   Purpose:
   - One interaction language across the entire Engine.
   - Apps do not invent separate comment/follow/outcome systems.
   - Interaction must be capable of producing measurable utility.
========================================================= */

const InteractionCore = {

    version:
        "1.0.0",

    storageKey:
        "vaero:interaction:v1",

    state: {
        interactions: [],
        relationships: [],
        outcomes: [],
        reputationEvents: []
    },


    /* =====================================================
       SUPPORTED PRIMITIVES
    ===================================================== */

    interactionTypes:
        new Set([
            "comment",
            "conversation",
            "contribution",
            "recommendation",
            "verification",
            "collaboration",
            "task",
            "decision"
        ]),

    relationshipTypes:
        new Set([
            "follow",
            "fan",
            "member",
            "collaborator"
        ]),

    outcomeTypes:
        new Set([
            "created",
            "solved",
            "decided",
            "bought",
            "verified",
            "learned",
            "organised",
            "progressed",
            "completed"
        ]),

    reputationTypes:
        new Set([
            "trust",
            "contribution",
            "reliability",
            "expertise",
            "verified-outcome",
            "community-value"
        ]),


    /* =====================================================
       SERVICE ACCESS
    ===================================================== */

    getService(name){

        const serviceName =
            String(
                name ??
                ""
            ).trim();

        if(!serviceName){
            return null;
        }

        try{

            if(
                typeof VAERO ===
                    "undefined" ||
                typeof VAERO.get !==
                    "function"
            ){
                return null;
            }

            return (
                VAERO.get(
                    serviceName
                ) ||
                null
            );

        } catch(error){

            return null;
        }

    },


    getEngine(){

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                VAERO.engine
            ){
                return VAERO.engine;
            }

        } catch(error){
            /* fallback */
        }

        if(
            typeof window !==
                "undefined"
        ){
            return (
                window.Engine ||
                null
            );
        }

        return null;

    },


    /* =====================================================
       IDENTITY
       Engine identity is the default actor.

       A currently opened Entity is context,
       not automatically the acting user.
    ===================================================== */

    getActor(){

        const engine =
            this.getEngine();

        const actor =
            engine?.rootEntity ||
            engine?.currentEntity ||
            null;

        if(!actor){
            return null;
        }

        return {
            id:
                actor.id ||
                null,

            type:
                actor.type ||
                "person",

            name:
                actor.profile?.name ||
                actor.name ||
                null
        };

    },


    getContext(){

        const engine =
            this.getEngine();

        return {

            entityId:
                engine?.currentOpenedEntity
                    ?.id ||
                engine?.currentEntity
                    ?.id ||
                null,

            worldId:
                engine?.currentWorld
                    ?.id ||
                null,

            view:
                engine?.view ||
                engine?.currentView ||
                null,

            page:
                engine?.currentEntityPage ||
                null

        };

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(prefix = "interaction"){

        try{

            if(
                typeof crypto !==
                    "undefined" &&
                typeof crypto.randomUUID ===
                    "function"
            ){
                return crypto.randomUUID();
            }

        } catch(error){
            /* fallback */
        }

        const safePrefix =
            String(
                prefix ||
                "interaction"
            )
                .trim()
                .replace(
                    /[^a-zA-Z0-9_-]/g,
                    "-"
                )
                .slice(
                    0,
                    40
                ) ||
            "interaction";

        return `${safePrefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeTarget(target){

        if(!target){
            return null;
        }

        if(
            typeof target ===
                "string"
        ){
            const id =
                target.trim();

            if(!id){
                return null;
            }

            return {
                id,
                type:
                    "unknown"
            };
        }

        if(
            typeof target !==
                "object" ||
            Array.isArray(
                target
            )
        ){
            return null;
        }

        const id =
            String(
                target.id ||
                target.targetId ||
                ""
            ).trim();

        if(!id){
            return null;
        }

        return {
            id,

            type:
                String(
                    target.type ||
                    target.targetType ||
                    "unknown"
                ).trim(),

            appId:
                target.appId ||
                null,

            worldId:
                target.worldId ||
                null,

            entityId:
                target.entityId ||
                null
        };

    },


    normalizeText(value, max = 4000){

        return String(
            value ??
            ""
        )
            .trim()
            .slice(
                0,
                max
            );

    },


    normalizeMetadata(value){

        if(
            !value ||
            typeof value !==
                "object" ||
            Array.isArray(
                value
            )
        ){
            return {};
        }

        return {
            ...value
        };

    },


    /* =====================================================
       STORAGE
    ===================================================== */

    load(){

        try{

            const raw =
                localStorage.getItem(
                    this.storageKey
                );

            if(!raw){
                return this.state;
            }

            const parsed =
                JSON.parse(
                    raw
                );

            this.state = {

                interactions:
                    Array.isArray(
                        parsed?.interactions
                    )
                        ? parsed.interactions
                        : [],

                relationships:
                    Array.isArray(
                        parsed?.relationships
                    )
                        ? parsed.relationships
                        : [],

                outcomes:
                    Array.isArray(
                        parsed?.outcomes
                    )
                        ? parsed.outcomes
                        : [],

                reputationEvents:
                    Array.isArray(
                        parsed?.reputationEvents
                    )
                        ? parsed.reputationEvents
                        : []

            };

        } catch(error){

            console.warn(
                "Interaction Core state could not be loaded:",
                error
            );

        }

        return this.state;

    },


    save(){

        try{

            localStorage.setItem(
                this.storageKey,
                JSON.stringify(
                    this.state
                )
            );

            return true;

        } catch(error){

            console.warn(
                "Interaction Core state could not be saved:",
                error
            );

            return false;
        }

    },


    /* =====================================================
       EVENTS
    ===================================================== */

    emit(
        eventName,
        payload = {}
    ){

        const name =
            String(
                eventName ||
                ""
            ).trim();

        if(!name){
            return false;
        }

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){
                VAERO.emit(
                    name,
                    payload
                );

                return true;
            }

        } catch(error){
            /* fallback */
        }

        try{

            const events =
                this.getService(
                    "events"
                );

            if(
                events &&
                typeof events.emit ===
                    "function"
            ){
                events.emit(
                    name,
                    payload
                );

                return true;
            }

        } catch(error){
            /* optional */
        }

        return false;

    },


    /* =====================================================
       UNIVERSAL INTERACTION
    ===================================================== */

    create(
        type,
        target,
        payload = {}
    ){

        const interactionType =
            String(
                type ||
                ""
            )
                .trim()
                .toLowerCase();

        if(
            !this.interactionTypes.has(
                interactionType
            )
        ){
            console.warn(
                `Unsupported interaction type: ${interactionType}`
            );

            return null;
        }

        const actor =
            payload.actor ||
            this.getActor();

        const normalizedTarget =
            this.normalizeTarget(
                target
            );

        if(
            !actor?.id ||
            !normalizedTarget
        ){
            return null;
        }

        const now =
            Date.now();

        const interaction = {

            id:
                this.createId(
                    interactionType
                ),

            type:
                interactionType,

            actor: {
                id:
                    actor.id,

                type:
                    actor.type ||
                    "person",

                name:
                    actor.name ||
                    null
            },

            target:
                normalizedTarget,

            body:
                this.normalizeText(
                    payload.body ||
                    payload.content ||
                    ""
                ),

            status:
                payload.status ||
                "active",

            metadata:
                this.normalizeMetadata(
                    payload.metadata
                ),

            context:
                {
                    ...this.getContext(),
                    ...this.normalizeMetadata(
                        payload.context
                    )
                },

            createdAt:
                now,

            updatedAt:
                now
        };

        this.state.interactions
            .push(
                interaction
            );

        this.save();

        this.emit(
            `interaction:${interactionType}`,
            interaction
        );

        this.emit(
            "interaction:created",
            interaction
        );

        return interaction;

    },


    /* =====================================================
       CONVENIENCE VERBS
    ===================================================== */

    comment(target, body, metadata = {}){

        return this.create(
            "comment",
            target,
            {
                body,
                metadata
            }
        );

    },


    converse(target, body, metadata = {}){

        return this.create(
            "conversation",
            target,
            {
                body,
                metadata
            }
        );

    },


    contribute(target, body, metadata = {}){

        return this.create(
            "contribution",
            target,
            {
                body,
                metadata
            }
        );

    },


    recommend(target, body, metadata = {}){

        return this.create(
            "recommendation",
            target,
            {
                body,
                metadata
            }
        );

    },


    verify(target, metadata = {}){

        return this.create(
            "verification",
            target,
            {
                metadata
            }
        );

    },


    collaborate(target, metadata = {}){

        return this.create(
            "collaboration",
            target,
            {
                metadata
            }
        );

    },


    decide(target, body, metadata = {}){

        return this.create(
            "decision",
            target,
            {
                body,
                metadata
            }
        );

    },


    createTask(target, body, metadata = {}){

        return this.create(
            "task",
            target,
            {
                body,
                metadata
            }
        );

    },


    /* =====================================================
       RELATIONSHIPS
       Follow / Fan / Member / Collaborator
    ===================================================== */

    setRelationship(
        type,
        target,
        active = true,
        metadata = {}
    ){

        const relationshipType =
            String(
                type ||
                ""
            )
                .trim()
                .toLowerCase();

        if(
            !this.relationshipTypes.has(
                relationshipType
            )
        ){
            return null;
        }

        const actor =
            this.getActor();

        const normalizedTarget =
            this.normalizeTarget(
                target
            );

        if(
            !actor?.id ||
            !normalizedTarget
        ){
            return null;
        }

        const existing =
            this.state.relationships
                .find(
                    relationship =>
                        relationship.type ===
                            relationshipType &&
                        relationship.actorId ===
                            actor.id &&
                        relationship.target?.id ===
                            normalizedTarget.id
                );

        const now =
            Date.now();

        if(existing){

            existing.active =
                Boolean(
                    active
                );

            existing.updatedAt =
                now;

            existing.metadata = {
                ...existing.metadata,
                ...this.normalizeMetadata(
                    metadata
                )
            };

            this.save();

            this.emit(
                "relationship:changed",
                existing
            );

            return existing;

        }

        const relationship = {

            id:
                this.createId(
                    "relation"
                ),

            type:
                relationshipType,

            actorId:
                actor.id,

            target:
                normalizedTarget,

            active:
                Boolean(
                    active
                ),

            metadata:
                this.normalizeMetadata(
                    metadata
                ),

            createdAt:
                now,

            updatedAt:
                now
        };

        this.state.relationships
            .push(
                relationship
            );

        this.save();

        this.emit(
            "relationship:created",
            relationship
        );

        return relationship;

    },


    follow(target, metadata = {}){

        return this.setRelationship(
            "follow",
            target,
            true,
            metadata
        );

    },


    unfollow(target){

        return this.setRelationship(
            "follow",
            target,
            false
        );

    },


    becomeFan(target, metadata = {}){

        return this.setRelationship(
            "fan",
            target,
            true,
            metadata
        );

    },


    leaveFan(target){

        return this.setRelationship(
            "fan",
            target,
            false
        );

    },


    /* =====================================================
       OUTCOMES
       Interaction becomes useful when it produces a result.
    ===================================================== */

    recordOutcome(
        type,
        target,
        payload = {}
    ){

        const outcomeType =
            String(
                type ||
                ""
            )
                .trim()
                .toLowerCase();

        if(
            !this.outcomeTypes.has(
                outcomeType
            )
        ){
            console.warn(
                `Unsupported outcome type: ${outcomeType}`
            );

            return null;
        }

        const actor =
            payload.actor ||
            this.getActor();

        const normalizedTarget =
            this.normalizeTarget(
                target
            );

        if(
            !actor?.id ||
            !normalizedTarget
        ){
            return null;
        }

        const outcome = {

            id:
                this.createId(
                    "outcome"
                ),

            type:
                outcomeType,

            actorId:
                actor.id,

            target:
                normalizedTarget,

            title:
                this.normalizeText(
                    payload.title ||
                    "",
                    180
                ),

            description:
                this.normalizeText(
                    payload.description ||
                    "",
                    2000
                ),

            value:
                Number.isFinite(
                    Number(
                        payload.value
                    )
                )
                    ? Number(
                        payload.value
                    )
                    : null,

            unit:
                payload.unit ||
                null,

            verified:
                payload.verified ===
                true,

            contributors:
                Array.isArray(
                    payload.contributors
                )
                    ? [
                        ...new Set(
                            payload.contributors
                                .filter(Boolean)
                        )
                    ]
                    : [],

            metadata:
                this.normalizeMetadata(
                    payload.metadata
                ),

            context:
                {
                    ...this.getContext(),
                    ...this.normalizeMetadata(
                        payload.context
                    )
                },

            createdAt:
                Date.now()
        };

        this.state.outcomes
            .push(
                outcome
            );

        this.save();

        this.emit(
            `outcome:${outcomeType}`,
            outcome
        );

        this.emit(
            "outcome:created",
            outcome
        );

        return outcome;

    },


    /* =====================================================
       REPUTATION EVENTS

       Reputation is derived from useful activity.
       It is not a follower count.
    ===================================================== */

    recordReputation(
        type,
        subjectId,
        payload = {}
    ){

        const reputationType =
            String(
                type ||
                ""
            )
                .trim()
                .toLowerCase();

        if(
            !this.reputationTypes.has(
                reputationType
            )
        ){
            return null;
        }

        const normalizedSubjectId =
            String(
                subjectId ||
                ""
            ).trim();

        if(!normalizedSubjectId){
            return null;
        }

        const event = {

            id:
                this.createId(
                    "reputation"
                ),

            type:
                reputationType,

            subjectId:
                normalizedSubjectId,

            value:
                Number.isFinite(
                    Number(
                        payload.value
                    )
                )
                    ? Number(
                        payload.value
                    )
                    : 1,

            sourceId:
                payload.sourceId ||
                null,

            verified:
                payload.verified ===
                true,

            metadata:
                this.normalizeMetadata(
                    payload.metadata
                ),

            createdAt:
                Date.now()
        };

        this.state.reputationEvents
            .push(
                event
            );

        this.save();

        this.emit(
            "reputation:recorded",
            event
        );

        return event;

    },


    /* =====================================================
       QUERY
    ===================================================== */

    getInteractionsForTarget(targetId){

        const id =
            String(
                targetId ||
                ""
            ).trim();

        if(!id){
            return [];
        }

        return this.state.interactions
            .filter(
                interaction =>
                    interaction.target?.id ===
                    id
            )
            .sort(
                (a, b) =>
                    b.createdAt -
                    a.createdAt
            );

    },


    getRelationshipsForTarget(targetId){

        const id =
            String(
                targetId ||
                ""
            ).trim();

        if(!id){
            return [];
        }

        return this.state.relationships
            .filter(
                relationship =>
                    relationship.target?.id ===
                        id &&
                    relationship.active ===
                        true
            );

    },


    getOutcomesForTarget(targetId){

        const id =
            String(
                targetId ||
                ""
            ).trim();

        if(!id){
            return [];
        }

        return this.state.outcomes
            .filter(
                outcome =>
                    outcome.target?.id ===
                    id
            )
            .sort(
                (a, b) =>
                    b.createdAt -
                    a.createdAt
            );

    },


    getOutcomeStats(targetId){

        const outcomes =
            this.getOutcomesForTarget(
                targetId
            );

        return outcomes.reduce(
            (stats, outcome) => {

                stats.total += 1;

                stats[
                    outcome.type
                ] =
                    (
                        stats[
                            outcome.type
                        ] ||
                        0
                    ) +
                    1;

                if(
                    outcome.verified ===
                    true
                ){
                    stats.verified +=
                        1;
                }

                return stats;

            },
            {
                total: 0,
                verified: 0
            }
        );

    },


    getRelationshipStats(targetId){

        const relationships =
            this.getRelationshipsForTarget(
                targetId
            );

        return relationships.reduce(
            (stats, relationship) => {

                stats.total += 1;

                stats[
                    relationship.type
                ] =
                    (
                        stats[
                            relationship.type
                        ] ||
                        0
                    ) +
                    1;

                return stats;

            },
            {
                total: 0
            }
        );

    },


    getReputation(subjectId){

        const id =
            String(
                subjectId ||
                ""
            ).trim();

        if(!id){
            return {};
        }

        return this.state.reputationEvents
            .filter(
                event =>
                    event.subjectId ===
                    id
            )
            .reduce(
                (scores, event) => {

                    scores[
                        event.type
                    ] =
                        (
                            scores[
                                event.type
                            ] ||
                            0
                        ) +
                        event.value;

                    return scores;

                },
                {}
            );

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        return {

            version:
                this.version,

            actor:
                this.getActor(),

            counts: {

                interactions:
                    this.state
                        .interactions
                        .length,

                relationships:
                    this.state
                        .relationships
                        .filter(
                            relationship =>
                                relationship.active ===
                                true
                        )
                        .length,

                outcomes:
                    this.state
                        .outcomes
                        .length,

                reputationEvents:
                    this.state
                        .reputationEvents
                        .length
            },

            primitives: {

                interactions:
                    [
                        ...this
                            .interactionTypes
                    ],

                relationships:
                    [
                        ...this
                            .relationshipTypes
                    ],

                outcomes:
                    [
                        ...this
                            .outcomeTypes
                    ]
            }

        };

    },


    /* =====================================================
       INIT
    ===================================================== */

    init(){

        this.load();

        this.emit(
            "interaction:ready",
            {
                version:
                    this.version,

                time:
                    Date.now()
            }
        );

        return this;

    }

};


/* =========================================================
   REGISTER
========================================================= */

try{

    if(
        typeof VAERO !==
            "undefined" &&
        typeof VAERO.register ===
            "function"
    ){
        VAERO.register(
            "interaction",
            InteractionCore
        );
    }

} catch(error){

    console.warn(
        "Interaction Core VAERO registration failed:",
        error
    );

}


/* =========================================================
   GLOBAL
========================================================= */

if(
    typeof window !==
        "undefined"
){
    window.InteractionCore =
        InteractionCore;
}


/* =========================================================
   BOOT
========================================================= */

InteractionCore.init();
