/* =========================================================
   VAERO ENGINE SESSION
   Identity / Trust / Application Security Boundary

   Responsibilities:
   - Engine owns the authenticated identity.
   - Applications never receive a master Engine token.
   - Every application receives an app-scoped grant.
   - External apps receive app-scoped subject aliases.
   - Sensitive capabilities may require step-up verification.
   - Persistent storage contains metadata only, never secrets.
========================================================= */

const EngineSession = {

    version:
        "2.0.0",

    storageKey:
        "vaero:engine:session:v2",

    previousStorageKey:
        "vaero:engine:session:v1",

    session: null,

    /*
     * Secrets and runtime-only access tokens live here.
     * They are intentionally never persisted to localStorage.
     */
    runtimeTokens:
        new Map(),

    defaultSessionLifetime:
        1000 * 60 * 60 * 24,

    defaultGrantLifetime:
        1000 * 60 * 30,

    defaultStepUpLifetime:
        1000 * 60 * 10,

    trustLevels:
        new Set([
            "unknown",
            "basic",
            "trusted",
            "verified",
            "high"
        ]),

    trustOrder: [
        "unknown",
        "basic",
        "trusted",
        "verified",
        "high"
    ],

    sensitiveCapabilities:
        new Set([
            "payment.high_value",
            "identity.export",
            "identity.change",
            "security.change",
            "security.permissions",
            "private.world.invite",
            "private.world.manage",
            "reputation.override"
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


    getRegistry(){

        return (
            this.getService(
                "appRegistry"
            ) ||
            this.getService(
                "applicationRegistry"
            ) ||
            (
                typeof window !==
                    "undefined"
                    ? window.AppRegistry ||
                        null
                    : null
            )
        );

    },


    getOrganSystem(){

        return (
            this.getService(
                "organSystem"
            ) ||
            (
                typeof window !==
                    "undefined"
                    ? window.OrganSystem ||
                        null
                    : null
            )
        );

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeId(value){

        return String(
            value ??
            ""
        ).trim();

    },


    normalizeList(value){

        if(
            !Array.isArray(
                value
            )
        ){
            return [];
        }

        const seen =
            new Set();

        const result =
            [];

        value.forEach(
            item => {

                const normalized =
                    String(
                        item ??
                        ""
                    ).trim();

                if(!normalized){
                    return;
                }

                const key =
                    normalized.toLowerCase();

                if(
                    seen.has(
                        key
                    )
                ){
                    return;
                }

                seen.add(
                    key
                );

                result.push(
                    normalized
                );

            }
        );

        return result;

    },


    normalizeObject(value){

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
       ID / TOKEN
    ===================================================== */

    createId(prefix = "id"){

        const safePrefix =
            String(
                prefix ||
                "id"
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
            "id";

        try{

            if(
                typeof crypto !==
                    "undefined" &&
                typeof crypto.randomUUID ===
                    "function"
            ){
                return `${safePrefix}_${crypto.randomUUID()}`;
            }

        } catch(error){
            /* fallback */
        }

        return `${safePrefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,12)}`;

    },


    createRuntimeToken(){

        try{

            if(
                typeof crypto !==
                    "undefined" &&
                typeof crypto.getRandomValues ===
                    "function"
            ){

                const bytes =
                    new Uint8Array(
                        32
                    );

                crypto.getRandomValues(
                    bytes
                );

                return Array
                    .from(
                        bytes
                    )
                    .map(
                        byte =>
                            byte
                                .toString(16)
                                .padStart(
                                    2,
                                    "0"
                                )
                    )
                    .join(
                        ""
                    );

            }

        } catch(error){
            /* fallback */
        }

        return `${this.createId("token")}_${Math.random()
            .toString(36)
            .slice(2)}`;

    },


    /* =====================================================
       ROOT IDENTITY
    ===================================================== */

    getRootIdentity(){

        const engine =
            this.getEngine();

        /*
         * Acting identity must belong to the Engine root.
         * currentOpenedEntity is context, not actor.
         */
        const entity =
            engine?.rootEntity ||
            null;

        if(!entity){
            return null;
        }

        return {

            id:
                entity.id ||
                null,

            type:
                entity.type ||
                "person",

            name:
                entity.profile?.name ||
                entity.name ||
                null

        };

    },


    /* =====================================================
       ENGINE CONTEXT
    ===================================================== */

    buildContext(){

        const engine =
            this.getEngine();

        const identity =
            this.getRootIdentity();

        if(!identity?.id){
            return null;
        }

        const openedEntity =
            engine?.currentOpenedEntity ||
            engine?.currentEntity ||
            null;

        return {

            actorEntityId:
                identity.id,

            entityId:
                openedEntity?.id ||
                identity.id,

            entityType:
                openedEntity?.type ||
                identity.type ||
                null,

            worldId:
                engine?.currentWorld?.id ||
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


    setWorldContext(
        context = {}
    ){

        const session =
            this.ensureSession();

        if(!session){
            return false;
        }

        session.worldContext =
            this.normalizeObject(
                context
            );

        session.lastActiveAt =
            Date.now();

        this.save();

        this.emit(
            "session:context-changed",
            {
                sessionId:
                    session.sessionId,

                context:
                    {
                        ...session.worldContext
                    }
            }
        );

        return true;

    },


    /* =====================================================
       SESSION CREATION
    ===================================================== */

    createSession(
        options = {}
    ){

        const identity =
            this.getRootIdentity();

        if(!identity?.id){
            return null;
        }

        const now =
            Date.now();

        const requestedTrust =
            String(
                options.trustLevel ||
                "basic"
            )
                .trim()
                .toLowerCase();

        const trustLevel =
            this.trustLevels.has(
                requestedTrust
            )
                ? requestedTrust
                : "basic";

        const requestedExpiry =
            Number(
                options.expiresAt
            );

        this.session = {

            sessionId:
                this.createId(
                    "engine-session"
                ),

            identityId:
                identity.id,

            actorEntityId:
                identity.id,

            identityType:
                identity.type,

            createdAt:
                now,

            authenticatedAt:
                now,

            lastActiveAt:
                now,

            expiresAt:
                Number.isFinite(
                    requestedExpiry
                ) &&
                requestedExpiry >
                    now
                    ? requestedExpiry
                    : now +
                        this.defaultSessionLifetime,

            assuranceLevel:
                trustLevel,

            authenticated:
                options.authenticated !==
                false,

            verified:
                options.verified ===
                true,

            deviceTrust:
                String(
                    options.deviceTrust ||
                    "unknown"
                ),

            worldContext:
                this.normalizeObject(
                    options.worldContext
                ),

            stepUp:
                null,

            grants:
                {},

            metadata:
                this.normalizeObject(
                    options.metadata
                )

        };

        this.runtimeTokens.clear();

        this.save();

        this.emit(
            "session:created",
            {
                session:
                    this.getPublicSession()
            }
        );

        return this.session;

    },


    /* =====================================================
       STORAGE

       Only non-secret metadata is persisted.
    ===================================================== */

    getPersistableSession(){

        if(!this.session){
            return null;
        }

        const persistedGrants =
            {};

        Object.entries(
            this.session.grants ||
            {}
        ).forEach(
            ([
                appId,
                grant
            ]) => {

                if(!grant){
                    return;
                }

                persistedGrants[
                    appId
                ] = {

                    id:
                        grant.id,

                    appId:
                        grant.appId,

                    subjectId:
                        grant.subjectId,

                    subjectAlias:
                        grant.subjectAlias,

                    builtIn:
                        grant.builtIn ===
                        true,

                    capabilities:
                        [
                            ...(
                                grant.capabilities ||
                                []
                            )
                        ],

                    permissions:
                        [
                            ...(
                                grant.permissions ||
                                []
                            )
                        ],

                    contextRef:
                        grant.contextRef
                            ? {
                                ...grant.contextRef
                            }
                            : null,

                    issuedAt:
                        grant.issuedAt,

                    expiresAt:
                        grant.expiresAt,

                    trustLevel:
                        grant.trustLevel,

                    revoked:
                        grant.revoked ===
                        true,

                    revokedAt:
                        grant.revokedAt ||
                        null

                };

            }
        );

        return {

            sessionId:
                this.session.sessionId,

            identityId:
                this.session.identityId,

            actorEntityId:
                this.session.actorEntityId,

            identityType:
                this.session.identityType,

            createdAt:
                this.session.createdAt,

            authenticatedAt:
                this.session.authenticatedAt,

            lastActiveAt:
                this.session.lastActiveAt,

            expiresAt:
                this.session.expiresAt,

            assuranceLevel:
                this.session.assuranceLevel,

            authenticated:
                this.session.authenticated ===
                true,

            verified:
                this.session.verified ===
                true,

            deviceTrust:
                this.session.deviceTrust,

            worldContext:
                this.normalizeObject(
                    this.session.worldContext
                ),

            stepUp:
                this.session.stepUp
                    ? {
                        ...this.session.stepUp
                    }
                    : null,

            grants:
                persistedGrants,

            metadata:
                this.normalizeObject(
                    this.session.metadata
                )

        };

    },


    save(){

        if(!this.session){
            return false;
        }

        try{

            if(
                typeof localStorage ===
                    "undefined"
            ){
                return false;
            }

            const persisted =
                this.getPersistableSession();

            localStorage.setItem(
                this.storageKey,
                JSON.stringify(
                    persisted
                )
            );

            return true;

        } catch(error){

            console.warn(
                "Engine Session could not be saved:",
                error
            );

            return false;

        }

    },


    load(){

        try{

            if(
                typeof localStorage ===
                    "undefined"
            ){
                return null;
            }

            const raw =
                localStorage.getItem(
                    this.storageKey
                );

            if(!raw){
                return null;
            }

            const parsed =
                JSON.parse(
                    raw
                );

            if(
                !parsed ||
                typeof parsed !==
                    "object" ||
                !parsed.sessionId ||
                !parsed.identityId
            ){
                return null;
            }

            parsed.grants =
                this.normalizeObject(
                    parsed.grants
                );

            this.session =
                parsed;

            /*
             * Runtime tokens deliberately do not survive reload.
             * Existing grants will receive fresh tokens on demand.
             */
            this.runtimeTokens.clear();

            return this.session;

        } catch(error){

            console.warn(
                "Engine Session could not be loaded:",
                error
            );

            return null;

        }

    },


    migratePreviousStorage(){

        try{

            if(
                typeof localStorage ===
                    "undefined"
            ){
                return false;
            }

            const current =
                localStorage.getItem(
                    this.storageKey
                );

            if(current){
                return false;
            }

            const previous =
                localStorage.getItem(
                    this.previousStorageKey
                );

            if(!previous){
                return false;
            }

            /*
             * V1 contained session-wide permissions.
             * They are intentionally not migrated into app grants.
             */
            localStorage.removeItem(
                this.previousStorageKey
            );

            return true;

        } catch(error){

            return false;

        }

    },


    /* =====================================================
       SESSION VALIDITY
    ===================================================== */

    isExpired(){

        if(!this.session){
            return true;
        }

        const expiresAt =
            Number(
                this.session.expiresAt
            );

        if(
            !Number.isFinite(
                expiresAt
            )
        ){
            return true;
        }

        return (
            Date.now() >=
            expiresAt
        );

    },


    isValid(){

        if(!this.session){
            return false;
        }

        if(
            this.session.authenticated !==
                true ||
            this.isExpired()
        ){
            return false;
        }

        const identity =
            this.getRootIdentity();

        if(
            identity?.id &&
            String(
                this.session.identityId
            ) !==
            String(
                identity.id
            )
        ){
            return false;
        }

        return true;

    },


    ensureSession(){

        if(
            this.isValid()
        ){

            this.touch();

            return this.session;

        }

        return this.createSession({
            authenticated:
                true,

            trustLevel:
                "basic"
        });

    },


    /*
     * Compatibility alias for earlier code.
     */
    ensure(){

        return this.ensureSession();

    },


    getSession(){

        return this.isValid()
            ? this.session
            : null;

    },


    touch(){

        if(!this.session){
            return false;
        }

        this.session.lastActiveAt =
            Date.now();

        this.save();

        return true;

    },


    clear(){

        const previous =
            this.session;

        this.session =
            null;

        this.runtimeTokens.clear();

        try{

            if(
                typeof localStorage !==
                    "undefined"
            ){

                localStorage.removeItem(
                    this.storageKey
                );

                localStorage.removeItem(
                    this.previousStorageKey
                );

            }

        } catch(error){
            /* non-fatal */
        }

        this.emit(
            "session:cleared",
            {
                sessionId:
                    previous?.sessionId ||
                    null,

                identityId:
                    previous?.identityId ||
                    null,

                time:
                    Date.now()
            }
        );

        return true;

    },


    /* =====================================================
       TRUST
    ===================================================== */

    getTrustIndex(level){

        return this.trustOrder
            .indexOf(
                String(
                    level ||
                    "unknown"
                )
                    .trim()
                    .toLowerCase()
            );

    },


    hasTrust(requiredLevel){

        const current =
            this.getTrustIndex(
                this.session
                    ?.assuranceLevel ||
                    "unknown"
            );

        const required =
            this.getTrustIndex(
                requiredLevel
            );

        if(
            current < 0 ||
            required < 0
        ){
            return false;
        }

        return current >=
            required;

    },


    setTrustLevel(level){

        const normalized =
            String(
                level ||
                ""
            )
                .trim()
                .toLowerCase();

        if(
            !this.trustLevels.has(
                normalized
            )
        ){
            return false;
        }

        const session =
            this.ensureSession();

        if(!session){
            return false;
        }

        session.assuranceLevel =
            normalized;

        session.verified =
            this.getTrustIndex(
                normalized
            ) >=
            this.getTrustIndex(
                "verified"
            );

        session.lastActiveAt =
            Date.now();

        this.save();

        this.emit(
            "session:trust-changed",
            {
                session:
                    this.getPublicSession()
            }
        );

        return true;

    },


    /* =====================================================
   STEP-UP
===================================================== */

hasCompletedStepUp(
    capability,
    appId = null
){

    const value =
        this.normalizeId(
            capability
        );

    const normalizedAppId =
        this.normalizeId(
            appId
        );

    const stepUp =
        this.session?.stepUp ||
        null;


    if(
        !value ||
        !stepUp ||
        stepUp.status !==
            "completed"
    ){
        return false;
    }


    if(
        Number(
            stepUp.expiresAt
        ) <=
        Date.now()
    ){
        return false;
    }


    if(
        String(
            stepUp.capability ||
            ""
        ).toLowerCase() !==
        value.toLowerCase()
    ){
        return false;
    }


    const stepUpAppId =
        this.normalizeId(
            stepUp.appId
        );


    /*
     * App-scoped verification must match
     * the exact application.
     */
    if(
        normalizedAppId &&
        stepUpAppId !==
            normalizedAppId
    ){
        return false;
    }


    /*
     * A global check cannot consume an
     * application-scoped step-up.
     */
    if(
        !normalizedAppId &&
        stepUpAppId
    ){
        return false;
    }


    return true;

},


requiresStepUp(
    capability,
    appId = null
){

    const value =
        this.normalizeId(
            capability
        );

    if(!value){
        return false;
    }


    const normalizedValue =
        value.toLowerCase();


    const globallySensitive =
        Array.from(
            this.sensitiveCapabilities
        )
            .some(
                capabilityName =>
                    String(
                        capabilityName
                    )
                        .toLowerCase() ===
                    normalizedValue
            );


    const normalizedAppId =
        this.normalizeId(
            appId
        );


    let manifestRequiresStepUp =
        false;


    if(normalizedAppId){

        const app =
            this.findApp(
                normalizedAppId
            );


        if(app){

            const requirements =
                this.getAppTrustRequirements(
                    app
                );


            manifestRequiresStepUp =
                this.normalizeList(
                    requirements.stepUpActions
                )
                    .some(
                        action =>
                            action.toLowerCase() ===
                            normalizedValue
                    );

        }

    }


    if(
        !globallySensitive &&
        !manifestRequiresStepUp
    ){
        return false;
    }


    /*
     * A session that was genuinely verified
     * through the Engine trust layer already
     * satisfies the requirement.
     */
    if(
        this.hasTrust(
            "verified"
        )
    ){
        return false;
    }


    /*
     * Otherwise only a matching completed
     * app + capability step-up is accepted.
     */
    return !this.hasCompletedStepUp(
        value,
        normalizedAppId ||
        null
    );

},


requestStepUp(
    capability,
    metadata = {},
    appId = null
){

    const value =
        this.normalizeId(
            capability
        );

    const normalizedAppId =
        this.normalizeId(
            appId
        );


    if(!value){
        return null;
    }


    const session =
        this.ensureSession();


    if(!session){
        return null;
    }


    /*
     * Already authorised.
     */
    if(
        !this.requiresStepUp(
            value,
            normalizedAppId ||
            null
        )
    ){

        return {

            required:
                false,

            capability:
                value,

            appId:
                normalizedAppId ||
                null

        };

    }


    const now =
        Date.now();


    /*
     * Reuse an existing non-expired challenge for
     * the exact same app + capability instead of
     * creating duplicate step-up requests.
     */
    const existing =
        session.stepUp ||
        null;


    if(
        existing &&
        existing.status ===
            "required" &&
        Number(
            existing.expiresAt
        ) >
            now &&
        String(
            existing.capability ||
            ""
        ).toLowerCase() ===
            value.toLowerCase() &&
        this.normalizeId(
            existing.appId
        ) ===
            normalizedAppId
    ){

        return {
            ...existing
        };

    }


    session.stepUp = {

        id:
            this.createId(
                "step-up"
            ),

        capability:
            value,

        appId:
            normalizedAppId ||
            null,

        status:
            "required",

        createdAt:
            now,

        expiresAt:
            now +
            this.defaultStepUpLifetime,

        completedAt:
            null,

        assuranceLevel:
            null,

        metadata:
            this.normalizeObject(
                metadata
            )

    };


    session.lastActiveAt =
        now;


    this.save();


    this.emit(
        "session:step-up-required",
        {
            ...session.stepUp
        }
    );


    return {
        ...session.stepUp
    };

},


completeStepUp(
    stepUpId,
    assurance = "verified"
){

    const id =
        this.normalizeId(
            stepUpId
        );


    if(
        !id ||
        !this.session?.stepUp ||
        this.session.stepUp.id !==
            id
    ){
        return false;
    }


    if(
        this.session.stepUp.status !==
            "required"
    ){
        return false;
    }


    if(
        Number(
            this.session.stepUp.expiresAt
        ) <=
        Date.now()
    ){

        this.session.stepUp.status =
            "expired";

        this.save();

        return false;

    }


    const normalizedAssurance =
        String(
            assurance ||
            ""
        )
            .trim()
            .toLowerCase();


    if(
        !this.trustLevels.has(
            normalizedAssurance
        ) ||
        this.getTrustIndex(
            normalizedAssurance
        ) <
        this.getTrustIndex(
            "verified"
        )
    ){
        return false;
    }


    /*
     * IMPORTANT:
     * This verification belongs only to the current
     * app + capability challenge.
     *
     * It does NOT upgrade the entire Engine session.
     */
    this.session.stepUp.status =
        "completed";

    this.session.stepUp.completedAt =
        Date.now();

    this.session.stepUp.assuranceLevel =
        normalizedAssurance;

    this.session.lastActiveAt =
        Date.now();


    this.save();


    this.emit(
        "session:step-up-completed",
        {
            stepUp:
                {
                    ...this.session.stepUp
                },

            session:
                this.getPublicSession()
        }
    );


    return true;

},

    /* =====================================================
       APPLICATION LOOKUP
    ===================================================== */

    findApp(appId){

        const id =
            this.normalizeId(
                appId
            );

        if(!id){
            return null;
        }

        const registry =
            this.getRegistry();

        if(!registry){
            return null;
        }

        try{

            if(
                typeof registry.find ===
                    "function"
            ){

                const app =
                    registry.find(
                        id
                    );

                if(app){
                    return app;
                }

            }

        } catch(error){
            /* fallback */
        }

        try{

            if(
                typeof registry.all ===
                    "function"
            ){

                const apps =
                    registry.all({
                        includeDisabled:
                            true
                    });

                if(
                    Array.isArray(
                        apps
                    )
                ){

                    return (
                        apps.find(
                            app =>
                                String(
                                    app?.id ||
                                    ""
                                ) ===
                                id
                        ) ||
                        null
                    );

                }

            }

        } catch(error){
            /* no compatible lookup */
        }

        return null;

    },


    isBuiltInApp(app){

        return Boolean(
            app?.system ===
                true ||
            app?.distribution ===
                "built-in"
        );

    },


    getInstalledOrgan(app){

        if(
            !app?.id
        ){
            return null;
        }

        const organSystem =
            this.getOrganSystem();

        if(!organSystem){
            return null;
        }

        try{

            if(
                typeof organSystem.get ===
                    "function"
            ){

                const organ =
                    organSystem.get(
                        app.id
                    );

                if(organ){
                    return organ;
                }

            }

        } catch(error){
            /* fallback */
        }

        try{

            if(
                typeof organSystem.findBySlug ===
                    "function"
            ){

                return (
                    organSystem.findBySlug(
                        app.id
                    ) ||
                    null
                );

            }

        } catch(error){
            /* optional */
        }

        return null;

    },


    /* =====================================================
       APP CAPABILITY / PERMISSION RESOLUTION
    ===================================================== */

    getAllowedCapabilities(
    app,
    organ,
    requestedCapabilities = null
){

    if(!app){
        return [];
    }


    const builtIn =
        this.isBuiltInApp(
            app
        );


    /*
     * Registry v4:
     * capabilitiesRequested is the declarative manifest.
     * Legacy capabilities remains supported as fallback.
     */
    const declared =
        this.normalizeList(
            app.capabilitiesRequested ||
            app.capabilities ||
            []
        );


    /*
     * Built-ins are trusted by Engine origin.
     *
     * External applications receive ONLY capabilities
     * that are BOTH:
     *
     * 1. declared by their manifest
     * 2. authorised in OrganSystem runtime state
     */
    let available =
        [];


    if(builtIn){

        available =
            [
                ...declared
            ];

    }
    else {

        if(!organ){

            return [];

        }


        const authorised =
            this.normalizeList(
                organ.capabilities
            );


        const authorisedNormalized =
            authorised.map(
                capability =>
                    capability.toLowerCase()
            );


        available =
            declared.filter(
                capability =>
                    authorisedNormalized.includes(
                        capability.toLowerCase()
                    )
            );

    }


    /*
     * No explicit capability request means:
     * return the full authorised app-scoped set.
     */
    if(
        !Array.isArray(
            requestedCapabilities
        )
    ){

        return available;

    }


    /*
     * Explicit request can only REDUCE the grant.
     * It can never expand it.
     */
    const requested =
        this.normalizeList(
            requestedCapabilities
        );


    const availableNormalized =
        available.map(
            capability =>
                capability.toLowerCase()
        );


    return requested.filter(
        capability =>
            availableNormalized.includes(
                capability.toLowerCase()
            )
    );

},


    getAllowedPermissions(
    app,
    organ,
    requestedPermissions = null
){

    if(!app){
        return [];
    }


    const builtIn =
        this.isBuiltInApp(
            app
        );


    const declared =
        this.normalizeList(
            app.requestedPermissions ||
            []
        );


    let available =
        [];


    if(builtIn){

        /*
         * Built-in permissions are trusted by Engine origin.
         */
        available =
            [
                ...declared
            ];

    }
    else {

        if(!organ){

            return [];

        }


        /*
         * organ.permissions is the authorised runtime set.
         *
         * External apps receive only permissions that remain
         * declared by the CURRENT application manifest.
         *
         * This prevents stale permissions surviving after an
         * application manifest update.
         */
        const granted =
            this.normalizeList(
                organ.permissions
            );


        const grantedNormalized =
            granted.map(
                permission =>
                    permission.toLowerCase()
            );


        available =
            declared.filter(
                permission =>
                    grantedNormalized.includes(
                        permission.toLowerCase()
                    )
            );

    }


    if(
        !Array.isArray(
            requestedPermissions
        )
    ){

        return available;

    }


    /*
     * Explicit request may only narrow the grant.
     */
    const requested =
        this.normalizeList(
            requestedPermissions
        );


    const availableNormalized =
        available.map(
            permission =>
                permission.toLowerCase()
        );


    return requested.filter(
        permission =>
            availableNormalized.includes(
                permission.toLowerCase()
            )
    );

},

   /* =====================================================
   APPLICATION TRUST REQUIREMENTS
===================================================== */

getAppTrustRequirements(app){

    if(
        !app ||
        typeof app !==
            "object"
    ){
        return {
            level: null,
            verifiedIdentity: false,
            stepUpActions: [],
            evidence: []
        };
    }


    const requirements =
        this.normalizeObject(
            app.trustRequirements
        );


    const level =
        String(
            requirements.level ||
            ""
        )
            .trim()
            .toLowerCase();


    return {

        level:
            level ||
            null,

        verifiedIdentity:
            requirements.verifiedIdentity ===
            true,

        stepUpActions:
            this.normalizeList(
                requirements.stepUpActions
            ),

        evidence:
            this.normalizeList(
                requirements.evidence
            )

    };

},


satisfiesAppTrustRequirements(app){

    const session =
        this.getSession();

    if(!session){
        return false;
    }


    const requirements =
        this.getAppTrustRequirements(
            app
        );


    /*
     * Built-in applications are already inside the trusted
     * Engine boundary. "engine-trusted" describes application
     * origin, not the user's assurance level.
     */
    if(
        this.isBuiltInApp(
            app
        )
    ){

        if(
            requirements.verifiedIdentity ===
                true &&
            session.verified !==
                true
        ){
            return false;
        }

        return true;

    }


    /*
     * External application requirements may demand a minimum
     * Engine identity assurance level.
     */
    if(
        requirements.level &&
        this.trustLevels.has(
            requirements.level
        ) &&
        !this.hasTrust(
            requirements.level
        )
    ){

        return false;

    }


    if(
        requirements.verifiedIdentity ===
            true &&
        session.verified !==
            true
    ){

        return false;

    }


    return true;

},


    /* =====================================================
       APP-SCOPED SUBJECT
    ===================================================== */

    createSubjectAlias(appId){

        const session =
            this.ensureSession();

        if(!session){
            return null;
        }

        const id =
            this.normalizeId(
                appId
            );

        if(!id){
            return null;
        }

        /*
         * Alias is intentionally opaque.
         * It does not expose the canonical Engine identity.
         */
        return this.createId(
            `subject-${id}`
        );

    },


    /* =====================================================
       APP GRANTS
    ===================================================== */

    issueAppContext(
        appId,
        options = {}
    ){

        const id =
            this.normalizeId(
                appId
            );

        if(!id){
            return null;
        }

        const session =
            this.ensureSession();

        if(!session){
            return null;
        }

        /*
 * Registry is the canonical application authority.
 * Caller supplied application objects must never determine
 * system status, capabilities or trust requirements.
 */
const app =
    this.findApp(
        id
    );

if(!app){
    return null;
}

        const builtIn =
            this.isBuiltInApp(
                app
            );

        /*
 * OrganSystem is the canonical runtime authorization source.
 * Caller supplied organ objects are intentionally ignored.
 */
let organ =
    this.getInstalledOrgan(
        app
    );


/*
 * Before issuing a grant, synchronize the installed
 * application organ with the current Registry manifest.
 *
 * This ensures removed capabilities / permissions cannot
 * survive inside a newly issued application grant.
 */
if(organ){

    const organSystem =
        this.getOrganSystem();

    if(
        organSystem &&
        typeof organSystem.syncApplicationManifest ===
            "function"
    ){

        try{

            organSystem.syncApplicationManifest(
                organ.id
            );

            /*
             * Re-read the organ after synchronization.
             * Do not continue using a potentially stale object
             * supplied by the caller.
             */
            if(
                typeof organSystem.get ===
                    "function"
            ){

                organ =
                    organSystem.get(
                        organ.id
                    ) ||
                    organ;

            }

        } catch(error){

            console.warn(
                "Application manifest synchronization failed before grant:",
                error
            );

            /*
             * External applications fail closed.
             */
            if(
                !this.isBuiltInApp(
                    app
                )
            ){
                return null;
            }

        }

    }

}

        /*
         * External apps must be installed, trusted and active.
         */
        if(!builtIn){

            if(
                !organ ||
                organ.installed !==
                    true ||
                organ.trusted !==
                    true ||
                organ.status !==
                    "active"
            ){
                return null;
            }

        }
       /*
 * Application-level trust requirements are enforced before
 * capabilities, permissions or runtime tokens are issued.
 */
if(
    !this.satisfiesAppTrustRequirements(
        app
    )
){

    return null;

}

        const capabilities =
            this.getAllowedCapabilities(
                app,
                organ,
                options.capabilities
            );

        const permissions =
            this.getAllowedPermissions(
                app,
                organ,
                options.permissions
            );

        const existing =
            session.grants?.[
                id
            ] ||
            null;

        const now =
            Date.now();

        const requestedExpiry =
            Number(
                options.expiresAt
            );

        const expiresAt =
            Number.isFinite(
                requestedExpiry
            ) &&
            requestedExpiry >
                now
                ? Math.min(
                    requestedExpiry,
                    session.expiresAt
                )
                : Math.min(
                    now +
                    this.defaultGrantLifetime,
                    session.expiresAt
                );

        const contextRef =
            this.normalizeObject(
                options.contextRef ||
                this.buildContext()
            );

        const subjectAlias =
            builtIn
                ? null
                : (
                    existing
                        ?.subjectAlias ||
                    this.createSubjectAlias(
                        id
                    )
                );

        const subjectId =
            builtIn
                ? session.identityId
                : subjectAlias;

        const grant = {

            id:
                existing?.id ||
                this.createId(
                    `grant-${id}`
                ),

            appId:
                id,

            subjectId,

            subjectAlias,

            builtIn,

            capabilities,

            permissions,

            contextRef,

            issuedAt:
                now,

            expiresAt,

            trustLevel:
                builtIn
                    ? session.assuranceLevel
                    : (
                        organ?.trusted
                            ? "trusted"
                            : "unknown"
                    ),

            revoked:
                false,

            revokedAt:
                null

        };

        if(
            !session.grants ||
            typeof session.grants !==
                "object"
        ){
            session.grants =
                {};
        }

        session.grants[
            id
        ] = grant;

        /*
         * New runtime token invalidates any previous token.
         */
        const runtimeToken =
            this.createRuntimeToken();

        this.runtimeTokens.set(
    id,
    {
        token:
            runtimeToken,

        appId:
            id,

        grantId:
            grant.id,

        sessionId:
            session.sessionId,

        issuedAt:
            now,

        expiresAt:
            grant.expiresAt
    }
);

        session.lastActiveAt =
            now;

        this.save();

        this.emit(
            "session:grant-issued",
            {
                appId:
                    id,

                grantId:
                    grant.id,

                builtIn,

                capabilities:
                    [
                        ...capabilities
                    ],

                permissions:
                    [
                        ...permissions
                    ],

                expiresAt:
                    grant.expiresAt
            }
        );

        /*
         * Only this returned object contains the runtime token.
         * It is never stored in localStorage.
         */
        return {

            appId:
                grant.appId,

            grantId:
                grant.id,

            subjectId:
                grant.subjectId,

            builtIn:
                grant.builtIn,

            capabilities:
                [
                    ...grant.capabilities
                ],

            permissions:
                [
                    ...grant.permissions
                ],

            contextRef:
                grant.contextRef
                    ? {
                        ...grant.contextRef
                    }
                    : null,

            trustLevel:
                grant.trustLevel,

            issuedAt:
                grant.issuedAt,

            expiresAt:
                grant.expiresAt,

            accessToken:
                runtimeToken

        };

    },


    /*
     * Compatibility alias.
     */
    getAppContext(
        appId,
        options = {}
    ){

        return this.issueAppContext(
            appId,
            options
        );

    },


    getGrant(appId){

        const id =
            this.normalizeId(
                appId
            );

        if(
            !id ||
            !this.session
        ){
            return null;
        }

        const grant =
            this.session
                .grants?.[
                    id
                ] ||
            null;

        if(!grant){
            return null;
        }

        if(
            grant.revoked ===
                true ||
            Number(
                grant.expiresAt
            ) <=
            Date.now()
        ){
            return null;
        }

        return {

            ...grant,

            capabilities:
                [
                    ...(
                        grant.capabilities ||
                        []
                    )
                ],

            permissions:
                [
                    ...(
                        grant.permissions ||
                        []
                    )
                ],

            contextRef:
                grant.contextRef
                    ? {
                        ...grant.contextRef
                    }
                    : null

        };

    },


    getRuntimeToken(appId){

    const id =
        this.normalizeId(
            appId
        );


    if(!id){
        return null;
    }


    /*
     * Parent Engine session must still be valid.
     */
    if(
        !this.isValid()
    ){

        this.runtimeTokens.delete(
            id
        );

        return null;

    }


    const grant =
        this.getGrant(
            id
        );


    if(!grant){

        this.runtimeTokens.delete(
            id
        );

        return null;

    }


    let runtime =
        this.runtimeTokens.get(
            id
        ) ||
        null;


    const now =
        Date.now();


    /*
     * Existing runtime credential may be reused only if
     * it still belongs to the exact active session + grant.
     */
    if(
        runtime &&

        this.normalizeId(
            runtime.appId
        ) ===
            id &&

        this.normalizeId(
            runtime.sessionId
        ) ===
            this.normalizeId(
                this.session?.sessionId
            ) &&

        this.normalizeId(
            runtime.grantId
        ) ===
            this.normalizeId(
                grant.id
            ) &&

        Number(
            runtime.expiresAt
        ) >
            now
    ){

        return runtime.token;

    }


    /*
     * Never manufacture a fresh token directly from persisted
     * grant metadata.
     *
     * A missing / stale runtime token forces the application
     * through the complete authorization pipeline again:
     *
     * Registry manifest
     * -> OrganSystem synchronization
     * -> installation / active / trust checks
     * -> capability / permission intersection
     * -> Engine trust requirements
     * -> fresh app-scoped grant + token
     */
    this.runtimeTokens.delete(
        id
    );


    const refreshedContext =
        this.issueAppContext(
            id,
            {
                capabilities:
                    this.normalizeList(
                        grant.capabilities
                    ),

                permissions:
                    this.normalizeList(
                        grant.permissions
                    ),

                contextRef:
                    grant.contextRef
                        ? {
                            ...grant.contextRef
                        }
                        : null
            }
        );


    if(
        !refreshedContext ||
        !refreshedContext.accessToken
    ){

        return null;

    }


    return refreshedContext.accessToken;

},


    validateRuntimeToken(
    appId,
    token
){

    const id =
        this.normalizeId(
            appId
        );

    const supplied =
        this.normalizeId(
            token
        );


    if(
        !id ||
        !supplied
    ){
        return false;
    }


    /*
     * Runtime authorization is valid only while
     * the parent Engine session itself is valid.
     */
    if(
        !this.isValid()
    ){

        this.runtimeTokens.delete(
            id
        );

        return false;

    }


    const runtime =
        this.runtimeTokens.get(
            id
        ) ||
        null;


    const grant =
        this.getGrant(
            id
        );


    if(
        !runtime ||
        !grant
    ){

        this.runtimeTokens.delete(
            id
        );

        return false;

    }


    const now =
        Date.now();


    /*
     * Runtime token must belong to the exact:
     * - application
     * - Engine session
     * - grant
     */
    if(
        this.normalizeId(
            runtime.appId
        ) !==
            id ||

        this.normalizeId(
            runtime.sessionId
        ) !==
            this.normalizeId(
                this.session?.sessionId
            ) ||

        this.normalizeId(
            runtime.grantId
        ) !==
            this.normalizeId(
                grant.id
            )
    ){

        this.runtimeTokens.delete(
            id
        );

        return false;

    }


    if(
        Number(
            runtime.expiresAt
        ) <=
            now ||

        Number(
            grant.expiresAt
        ) <=
            now
    ){

        this.runtimeTokens.delete(
            id
        );

        return false;

    }


    /*
     * Validate the supplied secret before doing
     * more expensive authorization work.
     */
    if(
        runtime.token !==
        supplied
    ){
        return false;
    }


    const app =
        this.findApp(
            id
        );


    if(!app){

        this.runtimeTokens.delete(
            id
        );

        return false;

    }


    const builtIn =
        this.isBuiltInApp(
            app
        );


    let organ =
        this.getInstalledOrgan(
            app
        );


    /*
     * External application authorization must remain valid
     * for the entire lifetime of the runtime token.
     */
    if(!builtIn){

        if(!organ){

            this.revokeApp(
                id
            );

            return false;

        }


        const organSystem =
            this.getOrganSystem();


        if(
            organSystem &&
            typeof organSystem.syncApplicationManifest ===
                "function"
        ){

            try{

                organSystem.syncApplicationManifest(
                    organ.id
                );


                if(
                    typeof organSystem.get ===
                        "function"
                ){

                    organ =
                        organSystem.get(
                            organ.id
                        ) ||
                        organ;

                }

            } catch(error){

                this.revokeApp(
                    id
                );

                return false;

            }

        }


        if(
            organ.installed !==
                true ||
            organ.trusted !==
                true ||
            organ.status !==
                "active"
        ){

            this.revokeApp(
                id
            );

            return false;

        }

    }


    /*
     * Recalculate the currently authorised capability and
     * permission sets from Registry + OrganSystem.
     */
    const allowedCapabilities =
        this.getAllowedCapabilities(
            app,
            organ
        );


    const allowedPermissions =
        this.getAllowedPermissions(
            app,
            organ
        );


    const allowedCapabilitySet =
        new Set(
            allowedCapabilities.map(
                capability =>
                    capability.toLowerCase()
            )
        );


    const allowedPermissionSet =
        new Set(
            allowedPermissions.map(
                permission =>
                    permission.toLowerCase()
            )
        );


    const grantCapabilitiesStillValid =
        this.normalizeList(
            grant.capabilities
        )
            .every(
                capability =>
                    allowedCapabilitySet.has(
                        capability.toLowerCase()
                    )
            );


    const grantPermissionsStillValid =
        this.normalizeList(
            grant.permissions
        )
            .every(
                permission =>
                    allowedPermissionSet.has(
                        permission.toLowerCase()
                    )
            );


    if(
        !grantCapabilitiesStillValid ||
        !grantPermissionsStillValid
    ){

        /*
         * A previously issued grant must not survive
         * authorization withdrawal.
         */
        this.revokeApp(
            id
        );

        return false;

    }


    /*
     * Application trust requirements may also change
     * after the grant was issued.
     */
    if(
        !this.satisfiesAppTrustRequirements(
            app
        )
    ){

        this.revokeApp(
            id
        );

        return false;

    }


    return true;

},


    revokeApp(appId){

        const id =
            this.normalizeId(
                appId
            );

        if(
            !id ||
            !this.session
        ){
            return false;
        }

        const grant =
            this.session
                .grants?.[
                    id
                ];

        if(!grant){
            return false;
        }

        grant.revoked =
            true;

        grant.revokedAt =
            Date.now();

        this.runtimeTokens.delete(
            id
        );

        this.save();

        this.emit(
            "session:grant-revoked",
            {
                appId:
                    id,

                grantId:
                    grant.id,

                revokedAt:
                    grant.revokedAt
            }
        );

        return true;

    },


    revokeAllApps(){

        if(!this.session){
            return false;
        }

        Object.keys(
            this.session.grants ||
            {}
        ).forEach(
            appId => {

                const grant =
                    this.session
                        .grants[
                            appId
                        ];

                if(
                    !grant ||
                    grant.revoked ===
                        true
                ){
                    return;
                }

                grant.revoked =
                    true;

                grant.revokedAt =
                    Date.now();

            }
        );

        this.runtimeTokens.clear();

        this.save();

        this.emit(
            "session:all-grants-revoked",
            {
                sessionId:
                    this.session
                        .sessionId,

                time:
                    Date.now()
            }
        );

        return true;

    },


    /* =====================================================
       APP AUTHORIZATION
    ===================================================== */

    can(
    appId,
    capability
){

    const id =
        this.normalizeId(
            appId
        );

    const value =
        this.normalizeId(
            capability
        );

    if(
        !id ||
        !value
    ){
        return false;
    }


    const grant =
        this.getGrant(
            id
        );

    if(!grant){
        return false;
    }


    const grantedCapabilities =
        this.normalizeList(
            grant.capabilities
        )
            .map(
                item =>
                    item.toLowerCase()
            );


    /*
     * Capability must already exist inside
     * the issued app-scoped grant.
     */
    if(
        !grantedCapabilities.includes(
            value.toLowerCase()
        )
    ){
        return false;
    }


    /*
     * Central step-up policy:
     * - Engine-wide sensitive capabilities
     * - App Registry trustRequirements.stepUpActions
     */
    if(
        this.requiresStepUp(
            value,
            id
        )
    ){
        return false;
    }


    return true;

},

    hasAppPermission(
        appId,
        permission
    ){

        const id =
            this.normalizeId(
                appId
            );

        const value =
            this.normalizeId(
                permission
            );

        if(
            !id ||
            !value
        ){
            return false;
        }

        const grant =
            this.getGrant(
                id
            );

        if(!grant){
            return false;
        }

        return (
            grant.permissions ||
            []
        )
            .map(
                item =>
                    item.toLowerCase()
            )
            .includes(
                value.toLowerCase()
            );

    },


    /* =====================================================
       PUBLIC SESSION

       Does not expose runtime tokens.
    ===================================================== */

    getPublicSession(){

        if(!this.session){
            return null;
        }

        return {

            sessionId:
                this.session.sessionId,

            identityId:
                this.session.identityId,

            actorEntityId:
                this.session.actorEntityId,

            assuranceLevel:
                this.session.assuranceLevel,

            authenticated:
                this.session.authenticated ===
                true,

            verified:
                this.session.verified ===
                true,

            deviceTrust:
                this.session.deviceTrust,

            createdAt:
                this.session.createdAt,

            authenticatedAt:
                this.session.authenticatedAt,

            lastActiveAt:
                this.session.lastActiveAt,

            expiresAt:
                this.session.expiresAt,

            worldContext:
                this.normalizeObject(
                    this.session.worldContext
                ),

            activeGrantCount:
                Object.values(
                    this.session.grants ||
                    {}
                )
                    .filter(
                        grant =>
                            grant &&
                            grant.revoked !==
                                true &&
                            Number(
                                grant.expiresAt
                            ) >
                            Date.now()
                    )
                    .length,

            stepUp:
                this.session.stepUp
                    ? {
                        ...this.session.stepUp
                    }
                    : null

        };

    },


    /* =====================================================
       EVENTS
    ===================================================== */

    emit(
        eventName,
        payload = {}
    ){

        const name =
            this.normalizeId(
                eventName
            );

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
       REPORT
    ===================================================== */

    report(){

        const grants =
            Object.values(
                this.session
                    ?.grants ||
                {}
            )
                .map(
                    grant => ({

                        appId:
                            grant.appId,

                        grantId:
                            grant.id,

                        builtIn:
                            grant.builtIn ===
                            true,

                        capabilities:
                            [
                                ...(
                                    grant.capabilities ||
                                    []
                                )
                            ],

                        permissions:
                            [
                                ...(
                                    grant.permissions ||
                                    []
                                )
                            ],

                        trustLevel:
                            grant.trustLevel,

                        revoked:
                            grant.revoked ===
                            true,

                        issuedAt:
                            grant.issuedAt,

                        expiresAt:
                            grant.expiresAt,

                        runtimeTokenActive:
                            this.runtimeTokens
                                .has(
                                    grant.appId
                                )

                    })
                );

        return {

            version:
                this.version,

            valid:
                this.isValid(),

            session:
                this.getPublicSession(),

            context:
                this.buildContext(),

            grants,

            sensitiveCapabilities:
                [
                    ...this
                        .sensitiveCapabilities
                ]

        };

    },


    /* =====================================================
       INIT
    ===================================================== */

    init(){

        this.migratePreviousStorage();

        this.load();

        const session =
            this.ensureSession();

        this.emit(
            "session:ready",
            {
                version:
                    this.version,

                session:
                    this.getPublicSession(),

                time:
                    Date.now()
            }
        );

        return (
            session
                ? this
                : null
        );

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
            "engineSession",
            EngineSession
        );

    }

} catch(error){

    console.warn(
        "Engine Session VAERO registration failed:",
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
    window.EngineSession =
        EngineSession;
}


/* =========================================================
   BOOT
========================================================= */

EngineSession.init();
