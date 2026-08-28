/* =========================================================
   VAERO ORGAN SYSTEM
   Central Organ / Capability / Permission / Runtime Registry
========================================================= */

const OrganSystem = {

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
            payload &&
            typeof payload ===
                "object" &&
            !Array.isArray(
                payload
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

            source =
                [
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
       REQUESTED PERMISSIONS
    ===================================================== */

    getRequestedPermissions(organ){

        if(!organ){

            return [];

        }


        return this.normalizeList(
            organ.metadata
                ?.requestedPermissions ||
            organ.meta
                ?.requestedPermissions ||
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
            dependencyState?.valid
        );

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

                    hasPermission:{
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


                    grantPermission:{
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


                    setPermission:{
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


                    revokePermission:{
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


                    hasCapability:{
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


                    setStatus:{
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


                    report:{
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
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
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
                validation?.valid ===
                    false
            ){

                console.warn(
                    `Guardian organ işlemini engelledi: ${operation}`,
                    validation?.failures ||
                    null
                );


                return false;

            }


            return true;

        } catch(error){

            /*
             * Existing architecture treats Guardian
             * availability failures as non-blocking.
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
         * External organs are not promoted to trusted here.
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

            meta:{
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
         * An application cannot remain active if
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
         * This check is safe after registration because
         * dependency lookup can now resolve this registry.
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
            options &&
            typeof options ===
                "object" &&
            !Array.isArray(
                options
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

            dependencies:[
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


        if(
            !this.guardianCheck(
                organ,
                "dependency-add",
                {
                    dependency:
                        target,

                    ...(
                        context &&
                        typeof context ===
                            "object" &&
                        !Array.isArray(
                            context
                        )
                            ? context
                            : {}
                    )
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


        if(
            !this.guardianCheck(
                organ,
                "dependency-remove",
                {
                    dependency:
                        target,

                    ...(
                        context &&
                        typeof context ===
                            "object" &&
                        !Array.isArray(
                            context
                        )
                            ? context
                            : {}
                    )
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
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
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


        /*
         * Kaynak davranışı korunur:
         * kritik health değeri aktif organı error'a geçirir.
         */

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


        const dependencies =
            this.checkDependencies(
                organ.id
            );


        /*
         * Eksik dependency ile kurulum yapılmaz.
         * Var fakat inactive dependency mevcutsa organ
         * kurulabilir ancak active olmaz.
         */

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
         * External Application organs may only receive
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
                requested.length >
                    0 &&
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
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
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
         * Required permissions tamamlandığında ve
         * dependencies hazır olduğunda kurulu organ
         * tekrar active olabilir.
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
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
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


        const safeContext =
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
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
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
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
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
            )
                ? context
                : {};


        /*
         * System/Built-in organs may be trusted by origin.
         * External organs require an explicit verification
         * result supplied by the verifier layer.
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
                    organ.id
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
            context &&
            typeof context ===
                "object" &&
            !Array.isArray(
                context
            )
                ? context
                : {};


        if(
            !this.guardianCheck(
                organ,
                "update",
                safeContext
            )
        ){

            return false;

        }


        const before = {

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

            permissions:[
                ...organ.permissions
            ],

            capabilities:[
                ...organ.capabilities
            ],

            dependencies:[
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
         * mutation through update(). Permissions must pass
         * through grant/revoke validation.
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


        if(
            patch.capabilities !==
                undefined
        ){

            organ.capabilities =
                this.normalizeList(
                    patch.capabilities
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
         * Preserve immutable registry identity fields.
         */

        organ.id =
            before.id ||
            organ.id;


        organ.slug =
            organ.slug;


        organ.source =
            organ.source;


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
         * If an application's manifest permissions changed,
         * an active application cannot remain active while
         * required permissions are incomplete.
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
         * Dependency updates can also invalidate an active
         * organ. Keep registry state internally consistent.
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
            options &&
            typeof options ===
                "object" &&
            !Array.isArray(
                options
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

            permissions:[
                ...organ.permissions
            ],

            requestedPermissions,

            permissionsComplete:
                this.permissionsComplete(
                    organ
                ),

            capabilities:[
                ...organ.capabilities
            ],

            dependencies:[
                ...organ.dependencies
            ],

            dependenciesHealthy:
                dependencies.valid,

            missingDependencies:[
                ...dependencies.missing
            ],

            inactiveDependencies:[
                ...dependencies.inactive
            ],

            metadata:{
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

            booted:
                this.booted,

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
                organs.filter(
                    organ =>
                        organ.status ===
                            "paused"
                ).length,

            disabled:
                organs.filter(
                    organ =>
                        organ.status ===
                            "disabled"
                ).length,

            installing:
                organs.filter(
                    organ =>
                        organ.status ===
                            "installing"
                ).length,

            updating:
                organs.filter(
                    organ =>
                        organ.status ===
                            "updating"
                ).length,

            errors:
                errorCount,

            trusted:
                organs.filter(
                    organ =>
                        organ.trusted ===
                            true
                ).length,

            untrusted:
                organs.filter(
                    organ =>
                        organ.trusted !==
                            true
                ).length,

            protected:
                organs.filter(
                    organ =>
                        organ.protected ===
                            true
                ).length,

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

            health,

            status

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
                 * Registry boot sırasında geçersiz active
                 * durumları sessizce normalize edilir.
                 */

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
                count:
                    this.organs.size,

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

try{

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

} catch(error){

    console.warn(
        "OrganSystem VAERO register başarısız:",
        error
    );

}


/* =========================================================
   GLOBAL
========================================================= */

window.OrganSystem =
    OrganSystem;

window.OrganRegistry =
    OrganSystem;


/* =========================================================
   BOOT
========================================================= */

