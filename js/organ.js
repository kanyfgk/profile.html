/* =========================================================
   VAERO ORGAN SYSTEM
   Central Organ / Capability / Permission / Runtime Registry
========================================================= */

const OrganSystem = {

    version:
        "4.0.0",

    organs:
        new Map(),

    booted:
        false,


    allowedStatuses:
        new Set([

            "active",
            "inactive",
            "paused",
            "disabled",
            "installing",
            "updating",
            "error"

        ]),


    /* =====================================================
       SAFE SERVICE ACCESS
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

            console.warn(
                `OrganSystem service lookup failed: ${serviceName}`,
                error
            );


            return null;

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
                eventName ??
                    ""
            ).trim();


        if(!name){

            return false;

        }


        const safePayload =
            (
                payload &&
                typeof payload ===
                    "object" &&
                !Array.isArray(
                    payload
                )
            )
                ? payload
                : {};


        let emitted =
            false;


        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    name,
                    safePayload
                );


                emitted =
                    true;

            }

        } catch(error){

            console.warn(
                `Organ event gönderilemedi: ${name}`,
                error
            );

        }


        if(emitted){

            return true;

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
                    safePayload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `Organ event fallback gönderilemedi: ${name}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(
        prefix = "organ"
    ){

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

            /* fallback below */

        }


        const safePrefix =
            String(
                prefix ||
                    "organ"
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
            "organ";


        return `${safePrefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeName(name){

        return String(
            name ??
                ""
        )
            .trim()
            .slice(
                0,
                160
            );

    },


    normalizeSlug(value){

        return String(
            value ??
                ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            )
            .replace(
                /[^a-z0-9-_]/g,
                "-"
            )
            .replace(
                /-+/g,
                "-"
            )
            .replace(
                /^-|-$/g,
                ""
            )
            .slice(
                0,
                180
            );

    },


    normalizeSource(value){

        const source =
            String(
                value ??
                    "system"
            )
                .trim()
                .toLowerCase();


        return (
            source ||
            "system"
        );

    },


    normalizeStatus(status){

        const normalized =
            String(
                status ??
                    "active"
            )
                .trim()
                .toLowerCase();


        return this.allowedStatuses.has(
            normalized
        )
            ? normalized
            : "inactive";

    },


    normalizeList(value){

        let source =
            [];


        if(
            Array.isArray(
                value
            )
        ){

            source =
                value;

        }
        else if(
            value instanceof
                Set
        ){

            source = [
                ...value
            ];

        }
        else {

            return [];

        }


        const seen =
            new Set();


        return source
            .map(
                item =>
                    String(
                        item ??
                            ""
                    )
                        .trim()
                        .toLowerCase()
            )
            .filter(
                item => {

                    if(!item){

                        return false;

                    }


                    if(
                        seen.has(
                            item
                        )
                    ){

                        return false;

                    }


                    seen.add(
                        item
                    );


                    return true;

                }
            );

    },


    normalizeMeta(meta){

        if(
            !meta ||
            typeof meta !==
                "object" ||
            Array.isArray(
                meta
            )
        ){

            return {};

        }


        return {
            ...meta
        };

    },


    normalizeHealth(value){

        const health =
            Number(
                value
            );


        if(
            !Number.isFinite(
                health
            )
        ){

            return 100;

        }


        return Math.max(
            0,
            Math.min(
                100,
                Math.round(
                    health
                )
            )
        );

    },


    normalizePermission(permission){

        return String(
            permission ??
                ""
        )
            .trim()
            .toLowerCase();

    },


    normalizeCapability(capability){

        return String(
            capability ??
                ""
        )
            .trim()
            .toLowerCase();

    },


    normalizeDependency(dependency){

        return String(
            dependency ??
                ""
        )
            .trim()
            .toLowerCase();

    },


    normalizeTrustRequirements(value){

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

            ...value,

            level:
                value.level
                    ? String(
                        value.level
                    )
                        .trim()
                        .toLowerCase()
                    : null,

            verifiedIdentity:
                value.verifiedIdentity ===
                    true,

            stepUpActions:
                this.normalizeList(
                    value.stepUpActions
                ),

            evidence:
                this.normalizeList(
                    value.evidence
                )

        };

    },


    /* =====================================================
       APPLICATION / SYSTEM CLASSIFICATION
    ===================================================== */

    isSystemSource(source){

        const normalized =
            this.normalizeSource(
                source
            );


        return (
            normalized ===
                "system" ||
            normalized ===
                "built-in"
        );

    },


    isApplicationOrgan(organ){

        if(!organ){

            return false;

        }


        return (
            organ.type ===
                "application" ||
            Boolean(
                organ.metadata
                    ?.applicationId
            ) ||
            Boolean(
                organ.meta
                    ?.applicationId
            )
        );

    },


    isProtectedOrgan(organ){

        if(!organ){

            return false;

        }


        return (
            organ.protected ===
                true ||
            (
                this.isSystemSource(
                    organ.source
                ) &&
                organ.removable !==
                    true
            )
        );

    },


    /* =====================================================
       APPLICATION MANIFEST ACCESS
    ===================================================== */

    getApplicationRegistry(){

        return (
            this.getService(
                "appRegistry"
            ) ||
            this.getService(
                "applicationRegistry"
            ) ||
            (
                typeof AppRegistry !==
                    "undefined"
                    ? AppRegistry
                    : null
            )
        );

    },


    getApplicationId(organ){

        if(!organ){

            return null;

        }


        const applicationId =
            String(
                organ.metadata
                    ?.applicationId ||
                organ.meta
                    ?.applicationId ||
                (
                    organ.type ===
                        "application"
                        ? (
                            organ.slug ||
                            organ.id
                        )
                        : ""
                ) ||
                ""
            )
                .trim()
                .toLowerCase();


        return applicationId ||
            null;

    },


    getApplicationManifest(organ){

        const applicationId =
            this.getApplicationId(
                organ
            );


        if(!applicationId){

            return null;

        }


        const registry =
            this.getApplicationRegistry();


        if(!registry){

            return null;

        }


        try{

            if(
                typeof registry.find ===
                    "function"
            ){

                return (
                    registry.find(
                        applicationId
                    ) ||
                    null
                );

            }


            if(
                typeof registry.get ===
                    "function"
            ){

                return (
                    registry.get(
                        applicationId
                    ) ||
                    null
                );

            }

        } catch(error){

            console.warn(
                "Application manifest okunamadı:",
                applicationId,
                error
            );

        }


        return null;

    },


    /* =====================================================
       REQUESTED PERMISSIONS / CAPABILITIES
    ===================================================== */

    getRequestedPermissions(organ){

        if(!organ){

            return [];

        }


        const manifest =
            this.getApplicationManifest(
                organ
            );


        return this.normalizeList(

            manifest
                ?.requestedPermissions ||

            organ.metadata
                ?.requestedPermissions ||

            organ.meta
                ?.requestedPermissions ||

            []

        );

    },


    getRequestedCapabilities(organ){

        if(!organ){

            return [];

        }


        const manifest =
            this.getApplicationManifest(
                organ
            );


        return this.normalizeList(

            manifest
                ?.capabilitiesRequested ||

            manifest
                ?.capabilities ||

            organ.metadata
                ?.capabilitiesRequested ||

            organ.meta
                ?.capabilitiesRequested ||

            []

        );

    },


    permissionsComplete(organ){

        if(!organ){

            return false;

        }


        const requested =
            this.getRequestedPermissions(
                organ
            );


        if(
            requested.length ===
                0
        ){

            return true;

        }


        const granted =
            this.normalizeList(
                organ.permissions
            );


        return requested.every(
            permission =>
                granted.includes(
                    permission
                )
        );

    },


    canBecomeActive(organ){

        if(!organ){

            return false;

        }


        if(
            organ.installed !==
                true
        ){

            return false;

        }


        if(
            !this.permissionsComplete(
                organ
            )
        ){

            return false;

        }


        const dependencyState =
            this.checkDependencies(
                organ.id
            );


        return Boolean(
            dependencyState
                ?.valid
        );

    },


    /* =====================================================
   APPLICATION MANIFEST SYNC
===================================================== */

syncApplicationManifest(id){

    const organ =
        this.get(
            id
        );


    if(
        !organ ||
        !this.isApplicationOrgan(
            organ
        )
    ){

        return false;

    }


    const manifest =
        this.getApplicationManifest(
            organ
        );


    if(!manifest){

        return false;

    }

   const registry =
    this.getApplicationRegistry();


const manifestVersion =
    manifest.manifestVersion ??
    registry?.manifestVersion ??
    null;


    const requestedCapabilities =
        this.normalizeList(
            manifest.capabilitiesRequested ||
            manifest.capabilities
        );


    organ.capabilitiesRequested =
        requestedCapabilities;


    organ.objectTypes =
        this.normalizeList(
            manifest.objectTypes
        );


    organ.nativeVerbs =
        this.normalizeList(
            manifest.nativeVerbs
        );


    organ.outcomeTypes =
        this.normalizeList(
            manifest.outcomeTypes
        );


    organ.contextInputs =
        this.normalizeList(
            manifest.contextInputs
        );


    organ.contextOutputs =
        this.normalizeList(
            manifest.contextOutputs
        );


    organ.trustRequirements =
        this.normalizeTrustRequirements(
            manifest.trustRequirements
        );


    organ.metadata = {

        ...organ.metadata,

        applicationId:
            manifest.id,

        manifestVersion:
    manifestVersion,

        requestedPermissions:
            this.normalizeList(
                manifest.requestedPermissions
            ),

        capabilitiesRequested:
            [
                ...requestedCapabilities
            ],

        objectTypes:
            [
                ...organ.objectTypes
            ],

        nativeVerbs:
            [
                ...organ.nativeVerbs
            ],

        outcomeTypes:
            [
                ...organ.outcomeTypes
            ],

        contextInputs:
            [
                ...organ.contextInputs
            ],

        contextOutputs:
            [
                ...organ.contextOutputs
            ],

        trustRequirements: {
            ...organ.trustRequirements
        }

    };


    organ.meta = {

        ...organ.meta,

        ...organ.metadata

    };


    /*
     * Built-in/system organs are trusted by origin,
     * so declared capabilities may become runtime
     * capabilities automatically.
     */

    if(
        this.isSystemSource(
            organ.source
        )
    ){

        organ.capabilities =
            this.normalizeList([
                ...(
                    organ.capabilities ||
                    []
                ),
                ...requestedCapabilities
            ]);

    }
    else {

        else {
    /*
     * External applications never receive authority
     * simply because they requested it.
     *
     * Existing runtime capabilities and permissions
     * are pruned when the current manifest no longer
     * declares them.
     */

    organ.capabilities =
        this.normalizeList(
            organ.capabilities
        )
        .filter(
            capability =>
                requestedCapabilities.includes(
                    capability
                )
        );

    const requestedPermissions =
        this.getRequestedPermissions(
            organ
        );

    organ.permissions =
        this.normalizeList(
            organ.permissions
        )
        .filter(
            permission =>
                requestedPermissions.includes(
                    permission
                )
        );
}

    /*
     * If requested permissions changed and the app no longer
     * satisfies them, it cannot remain active.
     */

    if(
        organ.status ===
            "active" &&
        !this.permissionsComplete(
            organ
        )
    ){

        organ.status =
            "inactive";

    }


    organ.updatedAt =
        Date.now();


    this.emit(
        "organ:manifest:synced",
        {

            organId:
                organ.id,

            applicationId:
                manifest.id,

            manifestVersion:
    manifestVersion,

            capabilitiesRequested: [
                ...requestedCapabilities
            ],

            time:
                Date.now()

        }
    );


    return true;

},


    /* =====================================================
       RUNTIME API
    ===================================================== */

    attachRuntimeAPI(organ){

        if(!organ){

            return null;

        }


        try{

            Object.defineProperties(
                organ,
                {

                    hasPermission: {

                        enumerable:
                            false,

                        configurable:
                            true,

                        value:
                            permission =>
                                this.hasPermission(
                                    organ.id,
                                    permission
                                )

                    },


                    grantPermission: {

                        enumerable:
                            false,

                        configurable:
                            true,

                        value:
                            (
                                permission,
                                context = {}
                            ) =>
                                this.grantPermission(
                                    organ.id,
                                    permission,
                                    context
                                )

                    },


                    setPermission: {

                        enumerable:
                            false,

                        configurable:
                            true,

                        value:
                            (
                                permission,
                                enabled = true,
                                context = {}
                            ) => {

                                if(
                                    enabled ===
                                        false
                                ){

                                    return this.revokePermission(
                                        organ.id,
                                        permission,
                                        context
                                    );

                                }


                                return this.grantPermission(
                                    organ.id,
                                    permission,
                                    context
                                );

                            }

                    },


                    revokePermission: {

                        enumerable:
                            false,

                        configurable:
                            true,

                        value:
                            (
                                permission,
                                context = {}
                            ) =>
                                this.revokePermission(
                                    organ.id,
                                    permission,
                                    context
                                )

                    },


                    hasCapability: {

                        enumerable:
                            false,

                        configurable:
                            true,

                        value:
                            capability =>
                                this.hasCapability(
                                    organ.id,
                                    capability
                                )

                    },


                    setStatus: {

                        enumerable:
                            false,

                        configurable:
                            true,

                        value:
                            (
                                status,
                                context = {}
                            ) =>
                                this.setStatus(
                                    organ.id,
                                    status,
                                    context
                                )

                    },


                    syncManifest: {

                        enumerable:
                            false,

                        configurable:
                            true,

                        value:
                            () =>
                                this.syncApplicationManifest(
                                    organ.id
                                )

                    },


                    report: {

                        enumerable:
                            false,

                        configurable:
                            true,

                        value:
                            () =>
                                this.organReport(
                                    organ.id
                                )

                    }

                }
            );

        } catch(error){

            console.warn(
                "Organ runtime API bağlanamadı:",
                error
            );

        }


        return organ;

    },


    /* =====================================================
       GUARDIAN CHECK
    ===================================================== */

    guardianCheck(
        organ,
        operation,
        context = {}
    ){

        if(!organ){

            return false;

        }


        const guardian =
            this.getService(
                "guardian"
            );


        if(
            !guardian ||
            typeof guardian.check !==
                "function"
        ){

            return true;

        }


        const safeContext =
            (
                context &&
                typeof context ===
                    "object" &&
                !Array.isArray(
                    context
                )
            )
                ? context
                : {};


        try{

            const validation =
                guardian.check(
                    organ,
                    "organ",
                    {

                        operation,

                        ...safeContext

                    }
                );


            if(
                validation ===
                    false ||
                validation
                    ?.valid ===
                    false
            ){

                console.warn(
                    `Guardian organ işlemini engelledi: ${operation}`,
                    validation
                        ?.failures ||
                    null
                );


                return false;

            }


            return true;

        } catch(error){

            /*
             * Existing architecture keeps Guardian
             * availability failures non-blocking.
             */

            console.warn(
                "Guardian organ kontrolü başarısız:",
                error
            );


            return true;

        }

    },


    /* =====================================================
       CREATE
    ===================================================== */

    create(
        name,
        status = "active",
        meta = {}
    ){

        const organName =
            this.normalizeName(
                name
            );


        if(!organName){

            console.warn(
                "Organ oluşturulamadı: isim eksik."
            );


            return null;

        }


        const safeMeta =
            this.normalizeMeta(
                meta
            );


        const id =
            String(
                safeMeta.id ||
                this.createId()
            )
                .trim()
                .slice(
                    0,
                    180
                );


        if(!id){

            return null;

        }


        if(
            this.organs.has(
                id
            )
        ){

            return this.get(
                id
            );

        }


        const slug =
            this.normalizeSlug(
                safeMeta.slug ||
                organName
            );


        if(!slug){

            return null;

        }


        const duplicateSlug =
            this.findBySlug(
                slug
            );


        if(duplicateSlug){

            return duplicateSlug;

        }


        const source =
            this.normalizeSource(
                safeMeta.source ||
                "system"
            );


        const systemSource =
            this.isSystemSource(
                source
            );


        const metadata =
            this.normalizeMeta(
                safeMeta.metadata ||
                safeMeta.meta ||
                {}
            );


        const installed =
            safeMeta.installed !==
                undefined
                ? safeMeta.installed ===
                    true
                : systemSource;


        const removable =
            safeMeta.removable ===
                true;


        const protectedOrgan =
            safeMeta.protected ===
                true ||
            (
                systemSource &&
                removable !==
                    true
            );


        /*
         * Built-in/system organs are trusted by origin.
         * External organs are never silently promoted here.
         */

        const trusted =
            systemSource
                ? true
                : safeMeta.trusted ===
                    true;


        let initialStatus =
            this.normalizeStatus(
                status
            );


        if(
            installed !==
                true &&
            initialStatus ===
                "active"
        ){

            initialStatus =
                "inactive";

        }


        const health =
            this.normalizeHealth(
                safeMeta.health ??
                safeMeta.healthScore ??
                100
            );


        const organ = {

            id,

            name:
                organName,

            title:
                String(
                    safeMeta.title ||
                    organName
                )
                    .trim()
                    .slice(
                        0,
                        180
                    ),

            description:
                String(
                    safeMeta.description ||
                    safeMeta.subtitle ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        2000
                    ),

            icon:
                String(
                    safeMeta.icon ||
                    "◈"
                ),

            action:
                String(
                    safeMeta.action ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        180
                    ),

            slug,

            status:
                initialStatus,

            version:
                String(
                    safeMeta.version ||
                    "1.0.0"
                )
                    .trim()
                    .slice(
                        0,
                        80
                    ),

            type:
                String(
                    safeMeta.type ||
                    "organ"
                )
                    .trim()
                    .toLowerCase()
                    .slice(
                        0,
                        80
                    ),

            source,

            installed,

            protected:
                protectedOrgan,

            removable,

            permissions:
                this.normalizeList(
                    safeMeta.permissions
                ),

            capabilities:
                this.normalizeList(
                    safeMeta.capabilities
                ),

            capabilitiesRequested:
                this.normalizeList(
                    safeMeta.capabilitiesRequested ||
                    metadata.capabilitiesRequested
                ),

            objectTypes:
                this.normalizeList(
                    safeMeta.objectTypes ||
                    metadata.objectTypes
                ),

            nativeVerbs:
                this.normalizeList(
                    safeMeta.nativeVerbs ||
                    metadata.nativeVerbs
                ),

            outcomeTypes:
                this.normalizeList(
                    safeMeta.outcomeTypes ||
                    metadata.outcomeTypes
                ),

            contextInputs:
                this.normalizeList(
                    safeMeta.contextInputs ||
                    metadata.contextInputs
                ),

            contextOutputs:
                this.normalizeList(
                    safeMeta.contextOutputs ||
                    metadata.contextOutputs
                ),

            trustRequirements:
                this.normalizeTrustRequirements(
                    safeMeta.trustRequirements ||
                    metadata.trustRequirements
                ),

            dependencies:
                this.normalizeList(
                    safeMeta.dependencies ||
                    safeMeta.dependsOn
                ),

            developer:
                safeMeta.developer ||
                null,

            signature:
                safeMeta.signature ||
                null,

            trusted,

            health,

            healthScore:
                health,

            metadata,

            meta: {

                ...safeMeta,

                ...metadata

            },

            createdAt:
                Number(
                    safeMeta.createdAt
                ) ||
                Date.now(),

            updatedAt:
                Date.now()

        };


        if(
            !this.guardianCheck(
                organ,
                "create"
            )
        ){

            return null;

        }


        this.attachRuntimeAPI(
            organ
        );


        this.organs.set(
            organ.id,
            organ
        );


        /*
         * Application manifest is resolved only after
         * registration so lookup can safely access this organ.
         */

        if(
            this.isApplicationOrgan(
                organ
            )
        ){

            this.syncApplicationManifest(
                organ.id
            );

        }


        /*
         * Application cannot remain active when its
         * required permissions are incomplete.
         */

        if(
            organ.status ===
                "active" &&
            !this.permissionsComplete(
                organ
            )
        ){

            organ.status =
                "inactive";

        }


        /*
         * Dependencies also participate in activation.
         */

        if(
            organ.status ===
                "active"
        ){

            const dependencyState =
                this.checkDependencies(
                    organ.id
                );


            if(
                dependencyState &&
                dependencyState.valid ===
                    false
            ){

                organ.status =
                    "inactive";

            }

        }


        this.emit(
            "organ:created",
            {

                organ,

                organId:
                    organ.id,

                time:
                    Date.now()

            }
        );


        return organ;

    },


    /* =====================================================
       REGISTER EXISTING
    ===================================================== */

    register(data = {}){

        if(
            !data ||
            typeof data !==
                "object" ||
            Array.isArray(
                data
            )
        ){

            return null;

        }


        return this.create(

            data.name ||
            data.title ||
            data.slug ||
            "Organ",

            data.status ||
            "active",

            data

        );

    },

   /* =====================================================
       LOOKUP
    ===================================================== */

    get(id){

        const targetId =
            String(
                id ??
                    ""
            ).trim();


        if(!targetId){

            return null;

        }


        const organ =
            this.organs.get(
                targetId
            ) ||
            null;


        if(organ){

            this.attachRuntimeAPI(
                organ
            );

        }


        return organ;

    },


    find(id){

        return this.get(
            id
        );

    },


    findBySlug(slug){

        const target =
            this.normalizeSlug(
                slug
            );


        if(!target){

            return null;

        }


        const organ =
            [
                ...this.organs.values()
            ]
                .find(
                    item =>
                        item?.slug ===
                        target
                ) ||
            null;


        if(organ){

            this.attachRuntimeAPI(
                organ
            );

        }


        return organ;

    },


    has(id){

        const targetId =
            String(
                id ??
                    ""
            ).trim();


        if(!targetId){

            return false;

        }


        return this.organs.has(
            targetId
        );

    },


    all(options = {}){

        const safeOptions =
            (
                options &&
                typeof options ===
                    "object" &&
                !Array.isArray(
                    options
                )
            )
                ? options
                : {};


        let organs =
            [
                ...this.organs.values()
            ];


        if(
            safeOptions.installed ===
                true
        ){

            organs =
                organs.filter(
                    organ =>
                        organ.installed ===
                        true
                );

        }


        if(
            safeOptions.installed ===
                false
        ){

            organs =
                organs.filter(
                    organ =>
                        organ.installed !==
                        true
                );

        }


        if(
            safeOptions.status !==
                undefined &&
            safeOptions.status !==
                null &&
            String(
                safeOptions.status
            ).trim()
        ){

            const status =
                this.normalizeStatus(
                    safeOptions.status
                );


            organs =
                organs.filter(
                    organ =>
                        organ.status ===
                        status
                );

        }


        if(
            safeOptions.trusted ===
                true
        ){

            organs =
                organs.filter(
                    organ =>
                        organ.trusted ===
                        true
                );

        }


        if(
            safeOptions.trusted ===
                false
        ){

            organs =
                organs.filter(
                    organ =>
                        organ.trusted !==
                        true
                );

        }


        if(
            safeOptions.type
        ){

            const type =
                String(
                    safeOptions.type
                )
                    .trim()
                    .toLowerCase();


            organs =
                organs.filter(
                    organ =>
                        organ.type ===
                        type
                );

        }


        return organs.map(
            organ =>
                this.attachRuntimeAPI(
                    organ
                )
        );

    },


    installed(){

        return this.all({
            installed:
                true
        });

    },


    active(){

        return this.all()
            .filter(
                organ =>
                    organ.installed ===
                        true &&
                    organ.status ===
                        "active"
            );

    },


    /* =====================================================
       DEPENDENCIES
    ===================================================== */

    resolveDependency(dependency){

        const target =
            this.normalizeDependency(
                dependency
            );


        if(!target){

            return null;

        }


        const direct =
            this.get(
                dependency
            );


        if(direct){

            return direct;

        }


        const bySlug =
            this.findBySlug(
                dependency
            );


        if(bySlug){

            return bySlug;

        }


        return (
            this.all()
                .find(
                    organ =>
                        String(
                            organ.name ||
                                ""
                        )
                            .trim()
                            .toLowerCase() ===
                        target
                ) ||
            null
        );

    },


    checkDependencies(id){

        const organ =
            this.get(
                id
            );


        if(!organ){

            return {

                valid:
                    false,

                missing:
                    [],

                inactive:
                    [],

                dependencies:
                    []

            };

        }


        const dependencies =
            this.normalizeList(
                organ.dependencies
            );


        const missing =
            [];


        const inactive =
            [];


        dependencies.forEach(
            dependency => {

                const resolved =
                    this.resolveDependency(
                        dependency
                    );


                if(!resolved){

                    missing.push(
                        dependency
                    );

                    return;

                }


                if(
                    resolved.installed !==
                        true ||
                    resolved.status !==
                        "active"
                ){

                    inactive.push(
                        dependency
                    );

                }

            }
        );


        return {

            valid:
                missing.length ===
                    0 &&
                inactive.length ===
                    0,

            missing,

            inactive,

            dependencies: [
                ...dependencies
            ]

        };

    },


    dependsOn(
        sourceId,
        targetId,
        visited = new Set()
    ){

        const source =
            this.get(
                sourceId
            );


        const target =
            this.get(
                targetId
            );


        if(
            !source ||
            !target
        ){

            return false;

        }


        if(
            visited.has(
                source.id
            )
        ){

            return false;

        }


        visited.add(
            source.id
        );


        const dependencies =
            this.normalizeList(
                source.dependencies
            );


        for(
            const dependency of
            dependencies
        ){

            const resolved =
                this.resolveDependency(
                    dependency
                );


            if(!resolved){

                continue;

            }


            if(
                resolved.id ===
                target.id
            ){

                return true;

            }


            if(
                this.dependsOn(
                    resolved.id,
                    target.id,
                    visited
                )
            ){

                return true;

            }

        }


        return false;

    },


    wouldCreateDependencyCycle(
        organId,
        dependencyId
    ){

        const organ =
            this.get(
                organId
            );


        const dependency =
            this.resolveDependency(
                dependencyId
            );


        if(
            !organ ||
            !dependency
        ){

            return false;

        }


        if(
            organ.id ===
            dependency.id
        ){

            return true;

        }


        return this.dependsOn(
            dependency.id,
            organ.id
        );

    },


    addDependency(
        id,
        dependency,
        context = {}
    ){

        const organ =
            this.get(
                id
            );


        const target =
            this.normalizeDependency(
                dependency
            );


        if(
            !organ ||
            !target ||
            target ===
                String(
                    organ.id
                ).toLowerCase() ||
            target ===
                organ.slug
        ){

            return false;

        }


        const resolved =
            this.resolveDependency(
                target
            );


        if(
            resolved &&
            this.wouldCreateDependencyCycle(
                organ.id,
                resolved.id
            )
        ){

            console.warn(
                "Organ dependency cycle engellendi:",
                organ.id,
                resolved.id
            );


            return false;

        }


        const safeContext =
            (
                context &&
                typeof context ===
                    "object" &&
                !Array.isArray(
                    context
                )
            )
                ? context
                : {};


        if(
            !this.guardianCheck(
                organ,
                "dependency-add",
                {

                    dependency:
                        target,

                    ...safeContext

                }
            )
        ){

            return false;

        }


        if(
            !organ.dependencies.includes(
                target
            )
        ){

            organ.dependencies.push(
                target
            );


            organ.dependencies =
                this.normalizeList(
                    organ.dependencies
                );


            organ.updatedAt =
                Date.now();


            this.emit(
                "organ:dependency:added",
                {

                    organId:
                        organ.id,

                    dependency:
                        target,

                    time:
                        Date.now()

                }
            );

        }


        return true;

    },


    removeDependency(
        id,
        dependency,
        context = {}
    ){

        const organ =
            this.get(
                id
            );


        const target =
            this.normalizeDependency(
                dependency
            );


        if(
            !organ ||
            !target
        ){

            return false;

        }


        const safeContext =
            (
                context &&
                typeof context ===
                    "object" &&
                !Array.isArray(
                    context
                )
            )
                ? context
                : {};


        if(
            !this.guardianCheck(
                organ,
                "dependency-remove",
                {

                    dependency:
                        target,

                    ...safeContext

                }
            )
        ){

            return false;

        }


        const before =
            organ.dependencies.length;


        organ.dependencies =
            organ.dependencies.filter(
                item =>
                    item !==
                    target
            );


        if(
            before ===
            organ.dependencies.length
        ){

            return false;

        }


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:dependency:removed",
            {

                organId:
                    organ.id,

                dependency:
                    target,

                time:
                    Date.now()

            }
        );


        return true;

    },


    /* =====================================================
       STATUS
    ===================================================== */

    setStatus(
        id,
        status,
        context = {}
    ){

        const organ =
            this.get(
                id
            );


        if(!organ){

            return false;

        }


        const nextStatus =
            this.normalizeStatus(
                status
            );


        if(
            nextStatus ===
                "active"
        ){

            if(
                organ.installed !==
                    true
            ){

                console.warn(
                    "Organ aktif edilemedi: organ kurulu değil.",
                    organ.id
                );


                return false;

            }


            if(
                !this.permissionsComplete(
                    organ
                )
            ){

                console.warn(
                    "Organ aktif edilemedi: gerekli izinler tamamlanmadı.",
                    organ.id
                );


                return false;

            }


            const dependencies =
                this.checkDependencies(
                    organ.id
                );


            if(
                !dependencies.valid
            ){

                console.warn(
                    "Organ aktif edilemedi: bağımlılıklar hazır değil.",
                    dependencies
                );


                return false;

            }

        }


        const safeContext =
            (
                context &&
                typeof context ===
                    "object" &&
                !Array.isArray(
                    context
                )
            )
                ? context
                : {};


        if(
            !this.guardianCheck(
                organ,
                "status-change",
                {

                    status:
                        nextStatus,

                    ...safeContext

                }
            )
        ){

            return false;

        }


        const previousStatus =
            organ.status;


        if(
            previousStatus ===
            nextStatus
        ){

            return true;

        }


        organ.status =
            nextStatus;


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:status",
            {

                id:
                    organ.id,

                organId:
                    organ.id,

                previousStatus,

                status:
                    nextStatus,

                time:
                    Date.now()

            }
        );


        return true;

    },


    pause(id){

        return this.setStatus(
            id,
            "paused"
        );

    },


    resume(id){

        return this.setStatus(
            id,
            "active"
        );

    },


    disable(id){

        return this.setStatus(
            id,
            "disabled"
        );

    },


    /* =====================================================
       HEALTH
    ===================================================== */

    setHealth(
        id,
        health
    ){

        const organ =
            this.get(
                id
            );


        if(!organ){

            return false;

        }


        const score =
            this.normalizeHealth(
                health
            );


        const previousStatus =
            organ.status;


        organ.health =
            score;


        organ.healthScore =
            score;


        organ.updatedAt =
            Date.now();


        if(
            score <=
                20 &&
            organ.status ===
                "active"
        ){

            organ.status =
                "error";

        }


        this.emit(
            "organ:health",
            {

                organId:
                    organ.id,

                health:
                    score,

                status:
                    organ.status,

                time:
                    Date.now()

            }
        );


        if(
            previousStatus !==
            organ.status
        ){

            this.emit(
                "organ:status",
                {

                    id:
                        organ.id,

                    organId:
                        organ.id,

                    previousStatus,

                    status:
                        organ.status,

                    reason:
                        "health",

                    time:
                        Date.now()

                }
            );

        }


        return true;

    },


    /* =====================================================
       INSTALL
    ===================================================== */

    install(
        id,
        context = {}
    ){

        const organ =
            this.get(
                id
            );


        if(!organ){

            return false;

        }


        if(
            organ.installed ===
                true
        ){

            return true;

        }


        /*
         * Ensure current application manifest metadata is
         * available before evaluating installation state.
         */

        if(
            this.isApplicationOrgan(
                organ
            )
        ){

            this.syncApplicationManifest(
                organ.id
            );

        }


        const dependencies =
            this.checkDependencies(
                organ.id
            );


        if(
            dependencies.missing.length
        ){

            console.warn(
                "Organ kurulamadı: bağımlılık eksik.",
                dependencies.missing
            );


            return false;

        }


        if(
            !this.guardianCheck(
                organ,
                "install",
                context
            )
        ){

            return false;

        }


        const previousStatus =
            organ.status;


        organ.status =
            "installing";


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:status",
            {

                organId:
                    organ.id,

                previousStatus,

                status:
                    "installing",

                time:
                    Date.now()

            }
        );


        organ.installed =
            true;


        const canActivate =
            dependencies.inactive.length ===
                0 &&
            this.permissionsComplete(
                organ
            );


        organ.status =
            canActivate
                ? "active"
                : "inactive";


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:installed",
            {

                organ,

                organId:
                    organ.id,

                status:
                    organ.status,

                time:
                    Date.now()

            }
        );


        return true;

    },


    /* =====================================================
       UNINSTALL
    ===================================================== */

    uninstall(
        id,
        context = {}
    ){

        const organ =
            this.get(
                id
            );


        if(!organ){

            return false;

        }


        if(
            organ.installed !==
                true
        ){

            return true;

        }


        if(
            this.isProtectedOrgan(
                organ
            )
        ){

            console.warn(
                "System organı kaldırılamaz:",
                organ.id
            );


            return false;

        }


        const dependents =
            this.all()
                .filter(
                    candidate =>
                        candidate.id !==
                            organ.id &&
                        candidate.installed ===
                            true &&
                        candidate.dependencies.some(
                            dependency => {

                                const resolved =
                                    this.resolveDependency(
                                        dependency
                                    );


                                return (
                                    resolved?.id ===
                                    organ.id
                                );

                            }
                        )
                );


        if(
            dependents.length
        ){

            console.warn(
                "Organ kaldırılamaz: başka organlar buna bağlı.",
                dependents.map(
                    item =>
                        item.id
                )
            );


            return false;

        }


        if(
            !this.guardianCheck(
                organ,
                "uninstall",
                context
            )
        ){

            return false;

        }


        const previousStatus =
            organ.status;


        organ.installed =
            false;


        organ.status =
            "inactive";


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:uninstalled",
            {

                organ,

                organId:
                    organ.id,

                previousStatus,

                time:
                    Date.now()

            }
        );


        return true;

    },

   /* =====================================================
       PERMISSIONS
    ===================================================== */

    hasPermission(
        id,
        permission
    ){

        const organ =
            this.get(
                id
            );


        if(!organ){

            return false;

        }


        const target =
            this.normalizePermission(
                permission
            );


        if(!target){

            return false;

        }


        return organ.permissions.includes(
            target
        );

    },


    grantPermission(
        id,
        permission,
        context = {}
    ){

        const organ =
            this.get(
                id
            );


        const target =
            this.normalizePermission(
                permission
            );


        if(
            !organ ||
            !target
        ){

            return false;

        }


        /*
         * External application organs may only receive
         * permissions declared in their manifest.
         */

        if(
            this.isApplicationOrgan(
                organ
            ) &&
            !this.isSystemSource(
                organ.source
            )
        ){

            const requested =
                this.getRequestedPermissions(
                    organ
                );


            if(
    requested.length === 0 ||
    !requested.includes(
        target
    )
){

                console.warn(
                    "Application manifest dışında permission verilemez:",
                    organ.id,
                    target
                );


                return false;

            }

        }


        const safeContext =
            (
                context &&
                typeof context ===
                    "object" &&
                !Array.isArray(
                    context
                )
            )
                ? context
                : {};


        if(
            !this.guardianCheck(
                organ,
                "permission-grant",
                {

                    permission:
                        target,

                    ...safeContext

                }
            )
        ){

            return false;

        }


        if(
            organ.permissions.includes(
                target
            )
        ){

            return true;

        }


        organ.permissions.push(
            target
        );


        organ.permissions =
            this.normalizeList(
                organ.permissions
            );


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:permission:granted",
            {

                organId:
                    organ.id,

                permission:
                    target,

                time:
                    Date.now()

            }
        );


        /*
         * When required permissions become complete,
         * an installed inactive organ may become active.
         */

        if(
            organ.installed ===
                true &&
            organ.status ===
                "inactive" &&
            this.permissionsComplete(
                organ
            ) &&
            this.checkDependencies(
                organ.id
            ).valid
        ){

            this.setStatus(
                organ.id,
                "active",
                {

                    source:
                        "permission-complete"

                }
            );

        }


        return true;

    },


    revokePermission(
        id,
        permission,
        context = {}
    ){

        const organ =
            this.get(
                id
            );


        const target =
            this.normalizePermission(
                permission
            );


        if(
            !organ ||
            !target
        ){

            return false;

        }


        if(
            !organ.permissions.includes(
                target
            )
        ){

            return false;

        }


        const safeContext =
            (
                context &&
                typeof context ===
                    "object" &&
                !Array.isArray(
                    context
                )
            )
                ? context
                : {};


        if(
            !this.guardianCheck(
                organ,
                "permission-revoke",
                {

                    permission:
                        target,

                    ...safeContext

                }
            )
        ){

            return false;

        }


        organ.permissions =
            organ.permissions.filter(
                item =>
                    item !==
                    target
            );


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:permission:revoked",
            {

                organId:
                    organ.id,

                permission:
                    target,

                time:
                    Date.now()

            }
        );


        const required =
            this.getRequestedPermissions(
                organ
            );


        if(
            required.includes(
                target
            ) &&
            organ.status ===
                "active"
        ){

            this.setStatus(
                organ.id,
                "inactive",
                {

                    source:
                        "permission-revoked"

                }
            );

        }


        return true;

    },


    /* =====================================================
       CAPABILITIES
    ===================================================== */

    hasCapability(
        id,
        capability
    ){

        const organ =
            this.get(
                id
            );


        const target =
            this.normalizeCapability(
                capability
            );


        if(
            !organ ||
            !target
        ){

            return false;

        }


        return organ.capabilities.includes(
            target
        );

    },


    addCapability(
        id,
        capability,
        context = {}
    ){

        const organ =
            this.get(
                id
            );


        const target =
            this.normalizeCapability(
                capability
            );


        if(
            !organ ||
            !target
        ){

            return false;

        }


        /*
         * External applications may only be granted a
         * capability they declared in capabilitiesRequested.
         */

        if(
            this.isApplicationOrgan(
                organ
            ) &&
            !this.isSystemSource(
                organ.source
            )
        ){

            const requested =
                this.getRequestedCapabilities(
                    organ
                );


            if(
    requested.length === 0 ||
    !requested.includes(
        target
    )
){

                console.warn(
                    "Application manifest dışında capability verilemez:",
                    organ.id,
                    target
                );


                return false;

            }

        }


        const safeContext =
            (
                context &&
                typeof context ===
                    "object" &&
                !Array.isArray(
                    context
                )
            )
                ? context
                : {};


        if(
            !this.guardianCheck(
                organ,
                "capability-add",
                {

                    capability:
                        target,

                    ...safeContext

                }
            )
        ){

            return false;

        }


        if(
            !organ.capabilities.includes(
                target
            )
        ){

            organ.capabilities.push(
                target
            );


            organ.capabilities =
                this.normalizeList(
                    organ.capabilities
                );


            organ.updatedAt =
                Date.now();


            this.emit(
                "organ:capability:added",
                {

                    organId:
                        organ.id,

                    capability:
                        target,

                    time:
                        Date.now()

                }
            );

        }


        return true;

    },


    removeCapability(
        id,
        capability,
        context = {}
    ){

        const organ =
            this.get(
                id
            );


        const target =
            this.normalizeCapability(
                capability
            );


        if(
            !organ ||
            !target
        ){

            return false;

        }


        if(
            !organ.capabilities.includes(
                target
            )
        ){

            return false;

        }


        const safeContext =
            (
                context &&
                typeof context ===
                    "object" &&
                !Array.isArray(
                    context
                )
            )
                ? context
                : {};


        if(
            !this.guardianCheck(
                organ,
                "capability-remove",
                {

                    capability:
                        target,

                    ...safeContext

                }
            )
        ){

            return false;

        }


        organ.capabilities =
            organ.capabilities.filter(
                item =>
                    item !==
                    target
            );


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:capability:removed",
            {

                organId:
                    organ.id,

                capability:
                    target,

                time:
                    Date.now()

            }
        );


        return true;

    },


    /* =====================================================
       TRUST
    ===================================================== */

    setTrusted(
        id,
        trusted,
        context = {}
    ){

        const organ =
            this.get(
                id
            );


        if(!organ){

            return false;

        }


        const nextTrusted =
            Boolean(
                trusted
            );


        const safeContext =
            (
                context &&
                typeof context ===
                    "object" &&
                !Array.isArray(
                    context
                )
            )
                ? context
                : {};


        /*
         * System/built-in organs may be trusted by origin.
         * External organs require explicit verifier evidence.
         */

        if(
            nextTrusted &&
            !this.isSystemSource(
                organ.source
            )
        ){

            if(
                safeContext.verified !==
                    true
            ){

                console.warn(
                    "Harici organ trusted yapılamadı: verifier sonucu gerekli."
                );


                return false;

            }


            const verification =
                safeContext.verification;


            if(
                verification &&
                verification.appId &&
                verification.appId !==
                    organ.id &&
                verification.appId !==
                    this.getApplicationId(
                        organ
                    )
            ){

                console.warn(
                    "Harici organ trusted yapılamadı: verifier appId eşleşmiyor."
                );


                return false;

            }

        }


        if(
            !this.guardianCheck(
                organ,
                "trust-change",
                {

                    trusted:
                        nextTrusted,

                    verified:
                        safeContext.verified ===
                        true

                }
            )
        ){

            return false;

        }


        if(
            organ.trusted ===
            nextTrusted
        ){

            return true;

        }


        organ.trusted =
            nextTrusted;


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:trust",
            {

                organId:
                    organ.id,

                trusted:
                    organ.trusted,

                time:
                    Date.now()

            }
        );


        return true;

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    update(
        id,
        patch = {},
        context = {}
    ){

        const organ =
            this.get(
                id
            );


        if(
            !organ ||
            !patch ||
            typeof patch !==
                "object" ||
            Array.isArray(
                patch
            )
        ){

            return false;

        }


        const safeContext =
            (
                context &&
                typeof context ===
                    "object" &&
                !Array.isArray(
                    context
                )
            )
                ? context
                : {};


        /*
 * Application manifest-owned fields are authoritative
 * in AppRegistry.
 *
 * External application organs cannot rewrite these fields
 * directly or through metadata / meta.
 */
if(
    this.isApplicationOrgan(
        organ
    ) &&
    !this.isSystemSource(
        organ.source
    )
){

    const manifestOwnedFields = [
        "applicationId",
        "manifestVersion",
        "requestedPermissions",
        "capabilitiesRequested",
        "objectTypes",
        "nativeVerbs",
        "outcomeTypes",
        "contextInputs",
        "contextOutputs",
        "trustRequirements"
    ];


    const containsProtectedField =
        object => {

            if(
                !object ||
                typeof object !==
                    "object" ||
                Array.isArray(
                    object
                )
            ){
                return false;
            }


            return manifestOwnedFields.some(
                field =>
                    Object.prototype.hasOwnProperty.call(
                        object,
                        field
                    )
            );

        };


    const attemptsManifestMutation =
        containsProtectedField(
            patch
        ) ||
        containsProtectedField(
            patch.metadata
        ) ||
        containsProtectedField(
            patch.meta
        );


    if(attemptsManifestMutation){

        console.warn(
            "External application manifest fields cannot be changed through OrganSystem.update():",
            organ.id
        );

        return false;

    }

}


        const before = {

            id:
                organ.id,

            name:
                organ.name,

            title:
                organ.title,

            status:
                organ.status,

            version:
                organ.version,

            health:
                organ.health,

            permissions: [
                ...organ.permissions
            ],

            capabilities: [
                ...organ.capabilities
            ],

            capabilitiesRequested: [
                ...(
                    organ.capabilitiesRequested ||
                    []
                )
            ],

            objectTypes: [
                ...(
                    organ.objectTypes ||
                    []
                )
            ],

            nativeVerbs: [
                ...(
                    organ.nativeVerbs ||
                    []
                )
            ],

            outcomeTypes: [
                ...(
                    organ.outcomeTypes ||
                    []
                )
            ],

            contextInputs: [
                ...(
                    organ.contextInputs ||
                    []
                )
            ],

            contextOutputs: [
                ...(
                    organ.contextOutputs ||
                    []
                )
            ],

            dependencies: [
                ...organ.dependencies
            ]

        };


        if(
            patch.name !==
                undefined
        ){

            const name =
                this.normalizeName(
                    patch.name
                );


            if(name){

                organ.name =
                    name;

            }

        }


        if(
            patch.title !==
                undefined
        ){

            organ.title =
                String(
                    patch.title ||
                    organ.name
                )
                    .trim()
                    .slice(
                        0,
                        180
                    );

        }


        if(
            patch.description !==
                undefined
        ){

            organ.description =
                String(
                    patch.description ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        2000
                    );

        }


        if(
            patch.icon !==
                undefined
        ){

            organ.icon =
                String(
                    patch.icon ||
                    "◈"
                );

        }


        if(
            patch.action !==
                undefined
        ){

            organ.action =
                String(
                    patch.action ||
                    ""
                )
                    .trim()
                    .slice(
                        0,
                        180
                    );

        }


        if(
            patch.version !==
                undefined
        ){

            organ.version =
                String(
                    patch.version ||
                    organ.version
                )
                    .trim()
                    .slice(
                        0,
                        80
                    );

        }


        if(
            patch.health !==
                undefined ||
            patch.healthScore !==
                undefined
        ){

            const health =
                this.normalizeHealth(
                    patch.health ??
                    patch.healthScore
                );


            organ.health =
                health;


            organ.healthScore =
                health;

        }


        /*
         * Application organs do not accept bulk permission
         * mutation through update().
         */

        if(
            patch.permissions !==
                undefined &&
            !this.isApplicationOrgan(
                organ
            )
        ){

            organ.permissions =
                this.normalizeList(
                    patch.permissions
                );

        }


        /*
         * Runtime granted capabilities remain separate from
         * manifest requested capabilities.
         */

        if(
            patch.capabilities !==
                undefined
        ){

            if(
                this.isApplicationOrgan(
                    organ
                ) &&
                !this.isSystemSource(
                    organ.source
                )
            ){

                const requested =
                    this.getRequestedCapabilities(
                        organ
                    );


                const proposed =
                    this.normalizeList(
                        patch.capabilities
                    );


                organ.capabilities =
                    proposed.filter(
                        capability =>
                            requested.includes(
                                capability
                            )
                    );

            }
            else {

                organ.capabilities =
                    this.normalizeList(
                        patch.capabilities
                    );

            }

        }


        if(
            patch.capabilitiesRequested !==
                undefined
        ){

            organ.capabilitiesRequested =
                this.normalizeList(
                    patch.capabilitiesRequested
                );

        }


        if(
            patch.objectTypes !==
                undefined
        ){

            organ.objectTypes =
                this.normalizeList(
                    patch.objectTypes
                );

        }


        if(
            patch.nativeVerbs !==
                undefined
        ){

            organ.nativeVerbs =
                this.normalizeList(
                    patch.nativeVerbs
                );

        }


        if(
            patch.outcomeTypes !==
                undefined
        ){

            organ.outcomeTypes =
                this.normalizeList(
                    patch.outcomeTypes
                );

        }


        if(
            patch.contextInputs !==
                undefined
        ){

            organ.contextInputs =
                this.normalizeList(
                    patch.contextInputs
                );

        }


        if(
            patch.contextOutputs !==
                undefined
        ){

            organ.contextOutputs =
                this.normalizeList(
                    patch.contextOutputs
                );

        }


        if(
            patch.trustRequirements !==
                undefined
        ){

            organ.trustRequirements =
                this.normalizeTrustRequirements(
                    patch.trustRequirements
                );

        }


        if(
            patch.dependencies !==
                undefined
        ){

            const nextDependencies =
                this.normalizeList(
                    patch.dependencies
                );


            for(
                const dependency of
                nextDependencies
            ){

                const resolved =
                    this.resolveDependency(
                        dependency
                    );


                if(
                    resolved &&
                    this.wouldCreateDependencyCycle(
                        organ.id,
                        resolved.id
                    )
                ){

                    console.warn(
                        "Organ update dependency cycle nedeniyle engellendi:",
                        dependency
                    );


                    return false;

                }

            }


            organ.dependencies =
                nextDependencies;

        }


        if(
            patch.metadata &&
            typeof patch.metadata ===
                "object" &&
            !Array.isArray(
                patch.metadata
            )
        ){

            organ.metadata = {

                ...organ.metadata,

                ...patch.metadata

            };

        }


        if(
            patch.meta &&
            typeof patch.meta ===
                "object" &&
            !Array.isArray(
                patch.meta
            )
        ){

            organ.meta = {

                ...organ.meta,

                ...patch.meta

            };


            organ.metadata = {

                ...organ.metadata,

                ...patch.meta

            };

        }


        /*
         * Keep interaction-network metadata mirrored.
         */

        organ.metadata = {

            ...organ.metadata,

            capabilitiesRequested: [
                ...(
                    organ.capabilitiesRequested ||
                    []
                )
            ],

            objectTypes: [
                ...(
                    organ.objectTypes ||
                    []
                )
            ],

            nativeVerbs: [
                ...(
                    organ.nativeVerbs ||
                    []
                )
            ],

            outcomeTypes: [
                ...(
                    organ.outcomeTypes ||
                    []
                )
            ],

            contextInputs: [
                ...(
                    organ.contextInputs ||
                    []
                )
            ],

            contextOutputs: [
                ...(
                    organ.contextOutputs ||
                    []
                )
            ],

            trustRequirements: {
                ...(
                    organ.trustRequirements ||
                    {}
                )
            }

        };


        organ.meta = {

            ...organ.meta,

            ...organ.metadata

        };


        /*
         * Immutable registry identity fields remain unchanged.
         */

        organ.id =
            before.id;


        if(
            patch.status !==
                undefined
        ){

            const statusResult =
                this.setStatus(
                    organ.id,
                    patch.status,
                    safeContext
                );


            if(
                statusResult ===
                    false
            ){

                return false;

            }

        }


        /*
         * Manifest changes may invalidate an active app.
         */

        if(
            this.isApplicationOrgan(
                organ
            ) &&
            organ.status ===
                "active" &&
            !this.permissionsComplete(
                organ
            )
        ){

            this.setStatus(
                organ.id,
                "inactive",
                {

                    source:
                        "manifest-permission-change"

                }
            );

        }


        /*
         * Dependency updates may also invalidate it.
         */

        if(
            organ.status ===
                "active"
        ){

            const dependencyState =
                this.checkDependencies(
                    organ.id
                );


            if(
                dependencyState.valid ===
                    false
            ){

                this.setStatus(
                    organ.id,
                    "inactive",
                    {

                        source:
                            "dependency-change"

                    }
                );

            }

        }


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:updated",
            {

                organ,

                before,

                organId:
                    organ.id,

                time:
                    Date.now()

            }
        );


        return organ;

    },

   /* =====================================================
       REMOVE
    ===================================================== */

    remove(
        id,
        options = {}
    ){

        const organ =
            this.get(
                id
            );


        if(!organ){

            return false;

        }


        const safeOptions =
            (
                options &&
                typeof options ===
                    "object" &&
                !Array.isArray(
                    options
                )
            )
                ? options
                : {};


        if(
            this.isProtectedOrgan(
                organ
            ) &&
            safeOptions.force !==
                true
        ){

            console.warn(
                "Protected organ silinemez:",
                organ.id
            );


            return false;

        }


        const dependents =
            this.all()
                .filter(
                    candidate =>
                        candidate.id !==
                            organ.id &&
                        candidate.dependencies.some(
                            dependency =>
                                this.resolveDependency(
                                    dependency
                                )?.id ===
                                organ.id
                        )
                );


        if(
            dependents.length &&
            safeOptions.force !==
                true
        ){

            console.warn(
                "Organ silinemez: bağımlı organlar mevcut.",
                dependents.map(
                    candidate =>
                        candidate.id
                )
            );


            return false;

        }


        if(
            safeOptions.force !==
                true &&
            !this.guardianCheck(
                organ,
                "remove",
                safeOptions
            )
        ){

            return false;

        }


        this.organs.delete(
            organ.id
        );


        this.emit(
            "organ:removed",
            {

                organ,

                organId:
                    organ.id,

                forced:
                    safeOptions.force ===
                    true,

                time:
                    Date.now()

            }
        );


        return true;

    },


    /* =====================================================
       SINGLE ORGAN REPORT
    ===================================================== */

    organReport(id){

        const organ =
            this.get(
                id
            );


        if(!organ){

            return null;

        }


        const dependencies =
            this.checkDependencies(
                organ.id
            );


        const requestedPermissions =
            this.getRequestedPermissions(
                organ
            );


        const requestedCapabilities =
            this.getRequestedCapabilities(
                organ
            );


        return {

            id:
                organ.id,

            slug:
                organ.slug,

            name:
                organ.name,

            title:
                organ.title,

            type:
                organ.type,

            source:
                organ.source,

            status:
                organ.status,

            installed:
                organ.installed,

            trusted:
                organ.trusted,

            protected:
                organ.protected,

            removable:
                organ.removable,

            health:
                organ.health,

            healthScore:
                organ.healthScore,

            version:
                organ.version,

            developer:
                organ.developer,

            permissions: [
                ...organ.permissions
            ],

            requestedPermissions,

            permissionsComplete:
                this.permissionsComplete(
                    organ
                ),

            capabilities: [
                ...organ.capabilities
            ],

            capabilitiesRequested: [
                ...requestedCapabilities
            ],

            objectTypes: [
                ...(
                    organ.objectTypes ||
                    []
                )
            ],

            nativeVerbs: [
                ...(
                    organ.nativeVerbs ||
                    []
                )
            ],

            outcomeTypes: [
                ...(
                    organ.outcomeTypes ||
                    []
                )
            ],

            contextInputs: [
                ...(
                    organ.contextInputs ||
                    []
                )
            ],

            contextOutputs: [
                ...(
                    organ.contextOutputs ||
                    []
                )
            ],

            trustRequirements: {
                ...(
                    organ.trustRequirements ||
                    {}
                )
            },

            dependencies: [
                ...organ.dependencies
            ],

            dependenciesHealthy:
                dependencies.valid,

            missingDependencies: [
                ...dependencies.missing
            ],

            inactiveDependencies: [
                ...dependencies.inactive
            ],

            metadata: {
                ...organ.metadata
            },

            createdAt:
                organ.createdAt,

            updatedAt:
                organ.updatedAt

        };

    },


    /* =====================================================
       SYSTEM REPORT
    ===================================================== */

    report(){

        const organs =
            this.all();


        const installed =
            organs.filter(
                organ =>
                    organ.installed ===
                    true
            );


        const dependencyProblems =
            installed.filter(
                organ =>
                    !this
                        .checkDependencies(
                            organ.id
                        )
                        .valid
            );


        const permissionProblems =
            installed.filter(
                organ =>
                    !this.permissionsComplete(
                        organ
                    )
            );


        const applicationOrgans =
            organs.filter(
                organ =>
                    this.isApplicationOrgan(
                        organ
                    )
            );


        const interactionReady =
            applicationOrgans.filter(
                organ =>
                    (
                        organ.objectTypes?.length ||
                        0
                    ) >
                        0 &&
                    (
                        organ.nativeVerbs?.length ||
                        0
                    ) >
                        0 &&
                    (
                        organ.outcomeTypes?.length ||
                        0
                    ) >
                        0
            );


        const manifestSynced =
            applicationOrgans.filter(
                organ =>
                    Boolean(
                        organ.metadata
                            ?.applicationId
                    ) &&
                    (
                        (
                            organ.capabilitiesRequested
                                ?.length ||
                            0
                        ) >
                            0 ||
                        (
                            organ.objectTypes
                                ?.length ||
                            0
                        ) >
                            0 ||
                        (
                            organ.nativeVerbs
                                ?.length ||
                            0
                        ) >
                            0 ||
                        (
                            organ.outcomeTypes
                                ?.length ||
                            0
                        ) >
                            0
                    )
            );


        const health =
            organs.length
                ? Math.round(
                    organs.reduce(
                        (
                            total,
                            organ
                        ) =>
                            total +
                            this.normalizeHealth(
                                organ.health
                            ),
                        0
                    ) /
                    organs.length
                )
                : 0;


        const errorCount =
            organs.filter(
                organ =>
                    organ.status ===
                    "error"
            ).length;


        const criticalHealthCount =
            organs.filter(
                organ =>
                    this.normalizeHealth(
                        organ.health
                    ) <
                    40
            ).length;


        let status =
            "healthy";


        if(
            errorCount >
                0 ||
            criticalHealthCount >
                0
        ){

            status =
                "critical";

        }
        else if(
            dependencyProblems.length >
                0 ||
            permissionProblems.length >
                0
        ){

            status =
                "degraded";

        }


        return {

            version:
                this.version,

            booted:
                this.booted,

            status,

            total:
                organs.length,

            installed:
                installed.length,

            active:
                installed.filter(
                    organ =>
                        organ.status ===
                        "active"
                ).length,

            inactive:
                installed.filter(
                    organ =>
                        organ.status ===
                        "inactive"
                ).length,

            paused:
                installed.filter(
                    organ =>
                        organ.status ===
                        "paused"
                ).length,

            disabled:
                installed.filter(
                    organ =>
                        organ.status ===
                        "disabled"
                ).length,

            errors:
                errorCount,

            health,

            criticalHealthCount,

            dependencyProblems:
                dependencyProblems.map(
                    organ =>
                        organ.id
                ),

            permissionProblems:
                permissionProblems.map(
                    organ =>
                        organ.id
                ),

            applications:
                applicationOrgans.length,

            manifestSynced:
                manifestSynced.length,

            interactionReady:
                interactionReady.length,

            time:
                Date.now()

        };

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(
            this.booted
        ){

            return true;

        }


        this.organs.forEach(
            organ => {

                this.attachRuntimeAPI(
                    organ
                );


                /*
                 * Lazy registry sync:
                 * OrganSystem does not require AppRegistry
                 * to exist before this file is evaluated.
                 */

                if(
                    this.isApplicationOrgan(
                        organ
                    )
                ){

                    this.syncApplicationManifest(
                        organ.id
                    );

                }


                /*
                 * Existing runtime authority is normalized.
                 *
                 * For external applications, a capability
                 * that is no longer declared by the current
                 * manifest cannot remain authorised.
                 */

                if(
                    this.isApplicationOrgan(
                        organ
                    ) &&
                    !this.isSystemSource(
                        organ.source
                    )
                ){

                    const requestedCapabilities =
    this.getRequestedCapabilities(
        organ
    );

const requestedPermissions =
    this.getRequestedPermissions(
        organ
    );

organ.capabilities =
    this.normalizeList(
        organ.capabilities
    )
    .filter(
        capability =>
            requestedCapabilities.includes(
                capability
            )
    );

organ.permissions =
    this.normalizeList(
        organ.permissions
    )
    .filter(
        permission =>
            requestedPermissions.includes(
                permission
            )
    ); 

                }


                if(
                    organ.status ===
                        "active" &&
                    (
                        organ.installed !==
                            true ||
                        !this.permissionsComplete(
                            organ
                        ) ||
                        !this.checkDependencies(
                            organ.id
                        ).valid
                    )
                ){

                    organ.status =
                        "inactive";

                    organ.updatedAt =
                        Date.now();

                }

            }
        );


        this.booted =
            true;


        this.emit(
            "organ:ready",
            {

                version:
                    this.version,

                report:
                    this.report(),

                time:
                    Date.now()

            }
        );


        return true;

    }

};


/* =========================================================
   REGISTER
========================================================= */

if(
    typeof VAERO !==
        "undefined" &&
    typeof VAERO.register ===
        "function"
){

    VAERO.register(
        "organSystem",
        OrganSystem
    );


    VAERO.register(
        "organRegistry",
        OrganSystem
    );

}


/* =========================================================
   GLOBAL
========================================================= */

if(
    typeof window !==
        "undefined"
){

    window.OrganSystem =
        OrganSystem;


    window.OrganRegistry =
        OrganSystem;

}


/* =========================================================
   BOOT
========================================================= */

try{

    OrganSystem.boot();

} catch(error){

    console.error(
        "OrganSystem boot failed:",
        error
    );

}
