/* =========================================================
   VAERO ENGINE SESSION
   Identity / Trust / Session Boundary

   Purpose:
   - Engine owns the authenticated identity.
   - Apps consume Engine identity context.
   - Repeated login friction is avoided.
   - Sensitive actions can request step-up verification.
========================================================= */

const EngineSession = {

    version:
        "1.0.0",

    storageKey:
        "vaero:engine:session:v1",

    session: null,

    trustLevels:
        new Set([
            "unknown",
            "basic",
            "trusted",
            "verified",
            "high"
        ]),

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


    /* =====================================================
       ID
    ===================================================== */

    createId(prefix = "session"){

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
                "session"
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
            "session";

        return `${safePrefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       ROOT IDENTITY
    ===================================================== */

    getRootIdentity(){

        const engine =
            this.getEngine();

        const entity =
            engine?.rootEntity ||
            engine?.currentEntity ||
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
                null,

            profile:
                entity.profile ||
                null

        };

    },


    /* =====================================================
       SESSION CONTEXT
    ===================================================== */

    buildContext(){

        const engine =
            this.getEngine();

        const identity =
            this.getRootIdentity();

        if(!identity?.id){
            return null;
        }

        return {

            identityId:
                identity.id,

            entityId:
                engine?.currentOpenedEntity
                    ?.id ||
                identity.id,

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
       CREATE SESSION
    ===================================================== */

    create(
        options = {}
    ){

        const identity =
            this.getRootIdentity();

        if(!identity?.id){
            return null;
        }

        const now =
            Date.now();

        const trustLevel =
            this.trustLevels.has(
                options.trustLevel
            )
                ? options.trustLevel
                : "basic";

        this.session = {

            id:
                this.createId(
                    "engine-session"
                ),

            identityId:
                identity.id,

            identityType:
                identity.type,

            trustLevel,

            authenticated:
                options.authenticated !==
                false,

            verified:
                options.verified ===
                true,

            deviceTrust:
                options.deviceTrust ||
                "unknown",

            permissions:
                Array.isArray(
                    options.permissions
                )
                    ? [
                        ...new Set(
                            options.permissions
                                .map(
                                    permission =>
                                        String(
                                            permission
                                        ).trim()
                                )
                                .filter(Boolean)
                        )
                    ]
                    : [],

            createdAt:
                now,

            authenticatedAt:
                now,

            lastActivityAt:
                now,

            expiresAt:
                Number.isFinite(
                    Number(
                        options.expiresAt
                    )
                )
                    ? Number(
                        options.expiresAt
                    )
                    : null,

            stepUp: null,

            metadata:
                (
                    options.metadata &&
                    typeof options.metadata ===
                        "object" &&
                    !Array.isArray(
                        options.metadata
                    )
                )
                    ? {
                        ...options.metadata
                    }
                    : {}

        };

        this.save();

        this.emit(
            "engine-session:created",
            this.getPublicSession()
        );

        return this.session;

    },


    /* =====================================================
       STORAGE
    ===================================================== */

    save(){

        if(!this.session){
            return false;
        }

        try{

            localStorage.setItem(
                this.storageKey,
                JSON.stringify(
                    this.session
                )
            );

            return true;

        } catch(error){

            console.warn(
                "Engine session could not be saved:",
                error
            );

            return false;
        }

    },


    load(){

        try{

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
                !parsed.identityId
            ){
                return null;
            }

            this.session =
                parsed;

            return this.session;

        } catch(error){

            console.warn(
                "Engine session could not be loaded:",
                error
            );

            return null;
        }

    },


    clear(){

        const previous =
            this.session;

        this.session =
            null;

        try{

            localStorage.removeItem(
                this.storageKey
            );

        } catch(error){
            /* non-fatal */
        }

        this.emit(
            "engine-session:cleared",
            {
                sessionId:
                    previous?.id ||
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
       SESSION VALIDITY
    ===================================================== */

    isExpired(){

        if(
            !this.session ||
            !this.session.expiresAt
        ){
            return false;
        }

        return (
            Date.now() >
            this.session.expiresAt
        );

    },


    isValid(){

        if(!this.session){
            return false;
        }

        if(
            this.session.authenticated !==
                true
        ){
            return false;
        }

        if(
            this.isExpired()
        ){
            return false;
        }

        const identity =
            this.getRootIdentity();

        if(
            identity?.id &&
            this.session.identityId !==
                identity.id
        ){
            return false;
        }

        return true;

    },


    ensure(){

        if(
            this.isValid()
        ){
            this.touch();

            return this.session;
        }

        return this.create({
            authenticated:
                true,

            trustLevel:
                "basic"
        });

    },


    touch(){

        if(!this.session){
            return false;
        }

        this.session.lastActivityAt =
            Date.now();

        this.save();

        return true;

    },


    /* =====================================================
       TRUST
    ===================================================== */

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
            this.ensure();

        if(!session){
            return false;
        }

        session.trustLevel =
            normalized;

        session.lastActivityAt =
            Date.now();

        this.save();

        this.emit(
            "engine-session:trust-changed",
            this.getPublicSession()
        );

        return true;

    },


    hasTrust(requiredLevel){

        const order = [
            "unknown",
            "basic",
            "trusted",
            "verified",
            "high"
        ];

        const current =
            order.indexOf(
                this.session?.trustLevel ||
                "unknown"
            );

        const required =
            order.indexOf(
                requiredLevel
            );

        if(
            required ===
                -1
        ){
            return false;
        }

        return (
            current >=
            required
        );

    },


    /* =====================================================
       PERMISSIONS
    ===================================================== */

    grant(permission){

        const value =
            String(
                permission ||
                ""
            ).trim();

        if(!value){
            return false;
        }

        const session =
            this.ensure();

        if(!session){
            return false;
        }

        if(
            !session.permissions
                .includes(
                    value
                )
        ){
            session.permissions
                .push(
                    value
                );
        }

        this.save();

        this.emit(
            "engine-session:permission-granted",
            {
                permission:
                    value,

                session:
                    this.getPublicSession()
            }
        );

        return true;

    },


    revoke(permission){

        const value =
            String(
                permission ||
                ""
            ).trim();

        if(
            !value ||
            !this.session
        ){
            return false;
        }

        this.session.permissions =
            this.session.permissions
                .filter(
                    item =>
                        item !==
                        value
                );

        this.save();

        this.emit(
            "engine-session:permission-revoked",
            {
                permission:
                    value,

                session:
                    this.getPublicSession()
            }
        );

        return true;

    },


    hasPermission(permission){

        const value =
            String(
                permission ||
                ""
            ).trim();

        if(!value){
            return false;
        }

        return Boolean(
            this.session
                ?.permissions
                ?.includes(
                    value
                )
        );

    },


    /* =====================================================
       STEP-UP AUTHENTICATION
    ===================================================== */

    requiresStepUp(capability){

        const value =
            String(
                capability ||
                ""
            ).trim();

        if(!value){
            return false;
        }

        if(
            !this.sensitiveCapabilities
                .has(
                    value
                )
        ){
            return false;
        }

        if(
            this.hasTrust(
                "verified"
            )
        ){
            return false;
        }

        return true;

    },


    requestStepUp(
        capability,
        metadata = {}
    ){

        const value =
            String(
                capability ||
                ""
            ).trim();

        if(!value){
            return null;
        }

        const session =
            this.ensure();

        if(!session){
            return null;
        }

        if(
            !this.requiresStepUp(
                value
            )
        ){
            return {
                required:
                    false,

                capability:
                    value
            };
        }

        session.stepUp = {

            id:
                this.createId(
                    "step-up"
                ),

            capability:
                value,

            status:
                "required",

            createdAt:
                Date.now(),

            metadata:
                (
                    metadata &&
                    typeof metadata ===
                        "object" &&
                    !Array.isArray(
                        metadata
                    )
                )
                    ? {
                        ...metadata
                    }
                    : {}

        };

        this.save();

        this.emit(
            "engine-session:step-up-required",
            session.stepUp
        );

        return session.stepUp;

    },


    completeStepUp(
        stepUpId
    ){

        const id =
            String(
                stepUpId ||
                ""
            ).trim();

        if(
            !id ||
            !this.session
                ?.stepUp ||
            this.session.stepUp.id !==
                id
        ){
            return false;
        }

        this.session.stepUp.status =
            "completed";

        this.session.stepUp.completedAt =
            Date.now();

        this.session.verified =
            true;

        this.session.trustLevel =
            "verified";

        this.session.lastActivityAt =
            Date.now();

        this.save();

        this.emit(
            "engine-session:step-up-completed",
            {
                stepUp:
                    this.session.stepUp,

                session:
                    this.getPublicSession()
            }
        );

        return true;

    },


    /* =====================================================
       APPLICATION CONTEXT

       Apps receive identity + trust + permissions
       from Engine instead of owning login.
    ===================================================== */

    getAppContext(
        appId
    ){

        const session =
            this.ensure();

        if(!session){
            return null;
        }

        const normalizedAppId =
            String(
                appId ||
                ""
            ).trim();

        return {

            appId:
                normalizedAppId ||
                null,

            sessionId:
                session.id,

            identityId:
                session.identityId,

            trustLevel:
                session.trustLevel,

            authenticated:
                session.authenticated ===
                true,

            verified:
                session.verified ===
                true,

            deviceTrust:
                session.deviceTrust,

            permissions:
                [
                    ...(
                        session.permissions ||
                        []
                    )
                ],

            context:
                this.buildContext(),

            sessionAge:
                Math.max(
                    0,
                    Date.now() -
                    session.authenticatedAt
                )

        };

    },


    /* =====================================================
       PUBLIC SESSION
    ===================================================== */

    getPublicSession(){

        if(!this.session){
            return null;
        }

        return {

            id:
                this.session.id,

            identityId:
                this.session.identityId,

            trustLevel:
                this.session.trustLevel,

            authenticated:
                this.session.authenticated ===
                true,

            verified:
                this.session.verified ===
                true,

            deviceTrust:
                this.session.deviceTrust,

            permissions:
                [
                    ...(
                        this.session.permissions ||
                        []
                    )
                ],

            createdAt:
                this.session.createdAt,

            authenticatedAt:
                this.session.authenticatedAt,

            lastActivityAt:
                this.session.lastActivityAt,

            expiresAt:
                this.session.expiresAt,

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
       REPORT
    ===================================================== */

    report(){

        return {

            version:
                this.version,

            valid:
                this.isValid(),

            session:
                this.getPublicSession(),

            context:
                this.buildContext(),

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

        this.load();

        this.ensure();

        this.emit(
            "engine-session:ready",
            {
                version:
                    this.version,

                session:
                    this.getPublicSession(),

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
