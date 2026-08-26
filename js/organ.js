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

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !==
                    "function"
            ){
                return null;
            }


            return (
                VAERO.get(name) ||
                null
            );

        } catch(error){

            console.warn(
                `OrganSystem service lookup failed: ${name}`,
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

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    eventName,
                    payload
                );


                return true;

            }


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
                    eventName,
                    payload
                );


                return true;

            }

        } catch(error){

            console.warn(
                `Organ event gönderilemedi: ${eventName}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(prefix = "organ"){

        if(
            typeof crypto !==
                "undefined" &&
            typeof crypto.randomUUID ===
                "function"
        ){

            return crypto.randomUUID();

        }


        return `${prefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeName(name){

        return String(
            name ?? ""
        ).trim();

    },


    normalizeSlug(value){

        return String(
            value ??
            ""
        )
            .trim()
            .toLowerCase()
            .replace(/\s+/g,"-")
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

        if(
            Array.isArray(
                value
            )
        ){

            return [
                ...new Set(
                    value
                        .map(
                            item =>
                                String(
                                    item ??
                                    ""
                                )
                                    .trim()
                                    .toLowerCase()
                        )
                        .filter(Boolean)
                )
            ];

        }


        if(
            value instanceof
                Set
        ){

            return this.normalizeList(
                [...value]
            );

        }


        return [];

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


    /* =====================================================
       RUNTIME API
    ===================================================== */

    attachRuntimeAPI(organ){

        if(!organ){
            return null;
        }


        /*
         * Bu fonksiyonlar Organ record'unun üzerinde
         * görünür runtime API sağlar.
         *
         * OrgansApp runtimeOrgan üzerinden bunları
         * güvenli şekilde çağırabilir.
         */

        Object.defineProperties(
            organ,
            {

                hasPermission:{
                    enumerable:false,
                    configurable:true,
                    value:
                        permission =>
                            this.hasPermission(
                                organ.id,
                                permission
                            )
                },


                grantPermission:{
                    enumerable:false,
                    configurable:true,
                    value:
                        permission =>
                            this.grantPermission(
                                organ.id,
                                permission
                            )
                },


                setPermission:{
                    enumerable:false,
                    configurable:true,
                    value:
                        permission =>
                            this.grantPermission(
                                organ.id,
                                permission
                            )
                },


                revokePermission:{
                    enumerable:false,
                    configurable:true,
                    value:
                        permission =>
                            this.revokePermission(
                                organ.id,
                                permission
                            )
                },


                hasCapability:{
                    enumerable:false,
                    configurable:true,
                    value:
                        capability =>
                            this.hasCapability(
                                organ.id,
                                capability
                            )
                },


                setStatus:{
                    enumerable:false,
                    configurable:true,
                    value:
                        status =>
                            this.setStatus(
                                organ.id,
                                status
                            )
                },


                report:{
                    enumerable:false,
                    configurable:true,
                    value:
                        () =>
                            this.organReport(
                                organ.id
                            )
                }

            }
        );


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


        try{

            const validation =
                guardian.check(
                    organ,
                    "organ",
                    {
                        operation,
                        ...context
                    }
                );


            if(
                validation &&
                validation.valid ===
                    false
            ){

                console.warn(
                    `Guardian organ işlemini engelledi: ${operation}`,
                    validation.failures
                );


                return false;

            }

        } catch(error){

            console.warn(
                "Guardian organ kontrolü başarısız:",
                error
            );


            /*
             * Frontend prototipinde Guardian hatası
             * organ registry'yi tamamen çökertmesin.
             */

        }


        return true;

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
            ).trim();


        if(!id){
            return null;
        }


        /*
         * Aynı id iki kez oluşturulmaz.
         */

        if(
            this.organs.has(
                id
            )
        ){

            return this.organs.get(
                id
            );

        }


        const slug =
            this.normalizeSlug(
                safeMeta.slug ||
                organName
            );


        const duplicateSlug =
            this.findBySlug(
                slug
            );


        if(duplicateSlug){

            return duplicateSlug;

        }


        const metadata =
            this.normalizeMeta(
                safeMeta.metadata ||
                safeMeta.meta ||
                {}
            );


        const organ = {

            id,

            name:
                organName,

            title:
                String(
                    safeMeta.title ||
                    organName
                ).trim(),

            description:
                String(
                    safeMeta.description ||
                    safeMeta.subtitle ||
                    ""
                ).trim(),

            icon:
                String(
                    safeMeta.icon ||
                    "◈"
                ),

            action:
                String(
                    safeMeta.action ||
                    ""
                ).trim(),

            slug,

            status:
                this.normalizeStatus(
                    status
                ),

            version:
                String(
                    safeMeta.version ||
                    "1.0.0"
                ),

            type:
                String(
                    safeMeta.type ||
                    "organ"
                )
                    .trim()
                    .toLowerCase(),

            source:
                String(
                    safeMeta.source ||
                    "system"
                )
                    .trim()
                    .toLowerCase(),

            installed:
                safeMeta.installed !==
                    false,

            protected:
                safeMeta.protected ===
                    true ||
                (
                    (
                        safeMeta.source ||
                        "system"
                    ) === "system" &&
                    safeMeta.removable !==
                        true
                ),

            removable:
                safeMeta.removable ===
                    true,

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

            trusted:
                safeMeta.trusted ===
                    true,

            health:
                this.normalizeHealth(
                    safeMeta.health ??
                    safeMeta.healthScore ??
                    100
                ),

            healthScore:
                this.normalizeHealth(
                    safeMeta.healthScore ??
                    safeMeta.health ??
                    100
                ),

            metadata,

            /*
             * Legacy compatibility.
             */

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

        const organ =
            this.organs.get(
                String(
                    id ??
                    ""
                )
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


        return (
            this.all()
                .find(
                    organ =>
                        organ.slug ===
                        target
                ) ||
            null
        );

    },


    has(id){

        return this.organs.has(
            String(
                id ??
                ""
            )
        );

    },


    all(options = {}){

        let organs =
            [
                ...this.organs.values()
            ];


        if(
            options.installed ===
                true
        ){

            organs =
                organs.filter(
                    organ =>
                        organ.installed ===
                            true
                );

        }


        if(options.status){

            const status =
                this.normalizeStatus(
                    options.status
                );


            organs =
                organs.filter(
                    organ =>
                        organ.status ===
                        status
                );

        }


        if(
            options.trusted ===
                true
        ){

            organs =
                organs.filter(
                    organ =>
                        organ.trusted ===
                            true
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
            installed:true
        });

    },


    active(){

        return this.all()
            .filter(
                organ =>
                    organ.installed &&
                    organ.status ===
                        "active"
            );

    },


    /* =====================================================
       DEPENDENCIES
    ===================================================== */

    resolveDependency(
        dependency
    ){

        const id =
            String(
                dependency ||
                ""
            )
                .trim()
                .toLowerCase();


        if(!id){
            return null;
        }


        return (
            this.get(
                dependency
            ) ||
            this.findBySlug(
                dependency
            ) ||
            this.all()
                .find(
                    organ =>
                        String(
                            organ.name ||
                            ""
                        )
                            .trim()
                            .toLowerCase() ===
                        id
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
                valid:false,
                missing:[],
                inactive:[],
                dependencies:[]
            };

        }


        const missing = [];

        const inactive = [];


        organ.dependencies.forEach(
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
                    !resolved.installed ||
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
                missing.length === 0 &&
                inactive.length === 0,

            missing,

            inactive,

            dependencies:[
                ...organ.dependencies
            ]

        };

    },


    addDependency(
        id,
        dependency
    ){

        const organ =
            this.get(
                id
            );


        const target =
            String(
                dependency ||
                ""
            )
                .trim()
                .toLowerCase();


        if(
            !organ ||
            !target ||
            target ===
                organ.id.toLowerCase() ||
            target ===
                organ.slug
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
        dependency
    ){

        const organ =
            this.get(
                id
            );


        const target =
            String(
                dependency ||
                ""
            )
                .trim()
                .toLowerCase();


        if(
            !organ ||
            !target
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
        status
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


        const previousStatus =
            organ.status;


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


        organ.health =
            score;

        organ.healthScore =
            score;

        organ.updatedAt =
            Date.now();


        if(
            score <= 20 &&
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


        return true;

    },


    /* =====================================================
       INSTALL STATE
    ===================================================== */

    install(id){

        const organ =
            this.get(
                id
            );


        if(!organ){
            return false;
        }


        if(organ.installed){

            return true;

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
                "install"
            )
        ){
            return false;
        }


        organ.status =
            "installing";

        organ.updatedAt =
            Date.now();


        organ.installed =
            true;


        organ.status =
            dependencies.inactive.length
                ? "inactive"
                : "active";


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:installed",
            {
                organ,
                organId:
                    organ.id,
                time:
                    Date.now()
            }
        );


        return true;

    },


    uninstall(id){

        const organ =
            this.get(
                id
            );


        if(!organ){
            return false;
        }


        if(
            organ.protected ===
                true ||
            (
                organ.source ===
                    "system" &&
                organ.removable !==
                    true
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
                        candidate.installed &&
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


        if(dependents.length){

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
                "uninstall"
            )
        ){
            return false;
        }


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
            String(
                permission ??
                ""
            )
                .trim()
                .toLowerCase();


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
            String(
                permission ??
                ""
            )
                .trim()
                .toLowerCase();


        if(
            !organ ||
            !target
        ){
            return false;
        }


        /*
         * Bu Core hâlâ Engine registry/policy katmanıdır.
         * Kullanıcı onayı ve gerçek authorization backend
         * tarafında enforce edilmelidir.
         */

        if(
            !this.guardianCheck(
                organ,
                "permission-grant",
                {
                    permission:
                        target,

                    ...context
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


        return true;

    },


    revokePermission(
        id,
        permission
    ){

        const organ =
            this.get(
                id
            );


        const target =
            String(
                permission ??
                ""
            )
                .trim()
                .toLowerCase();


        if(
            !organ ||
            !target
        ){
            return false;
        }


        const before =
            organ.permissions.length;


        organ.permissions =
            organ.permissions.filter(
                item =>
                    item !==
                    target
            );


        if(
            before ===
            organ.permissions.length
        ){
            return false;
        }


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
            String(
                capability ||
                ""
            )
                .trim()
                .toLowerCase();


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
        capability
    ){

        const organ =
            this.get(
                id
            );


        const target =
            String(
                capability ||
                ""
            )
                .trim()
                .toLowerCase();


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
        capability
    ){

        const organ =
            this.get(
                id
            );


        const target =
            String(
                capability ||
                ""
            )
                .trim()
                .toLowerCase();


        if(
            !organ ||
            !target
        ){
            return false;
        }


        const before =
            organ.capabilities.length;


        organ.capabilities =
            organ.capabilities.filter(
                item =>
                    item !==
                    target
            );


        if(
            before ===
            organ.capabilities.length
        ){
            return false;
        }


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


        /*
         * Bu fonksiyon yalnız registry sonucunu saklar.
         * External app trust üretmek için tek başına
         * kullanılmamalıdır.
         */

        if(
            organ.source !==
                "system" &&
            context.verified !==
                true
        ){

            console.warn(
                "Harici organ trusted yapılamadı: verifier sonucu gerekli."
            );


            return false;

        }


        organ.trusted =
            Boolean(
                trusted
            );

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
        patch = {}
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


        const before = {

            name:
                organ.name,

            status:
                organ.status,

            version:
                organ.version,

            health:
                organ.health

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
                ).trim();

        }


        if(
            patch.description !==
                undefined
        ){

            organ.description =
                String(
                    patch.description ||
                    ""
                ).trim();

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
                ).trim();

        }


        if(
            patch.status !==
                undefined
        ){

            const statusResult =
                this.setStatus(
                    organ.id,
                    patch.status
                );


            if(
                statusResult ===
                    false
            ){
                return false;
            }

        }


        if(
            patch.version !==
                undefined
        ){

            organ.version =
                String(
                    patch.version ||
                    organ.version
                ).trim();

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


        if(
            patch.permissions !==
                undefined
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

            organ.dependencies =
                this.normalizeList(
                    patch.dependencies
                );

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


        if(
            organ.protected &&
            options.force !==
                true
        ){

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
            options.force !==
                true
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


        return {

            id:
                organ.id,

            slug:
                organ.slug,

            name:
                organ.name,

            status:
                organ.status,

            installed:
                organ.installed,

            trusted:
                organ.trusted,

            protected:
                organ.protected,

            health:
                organ.health,

            healthScore:
                organ.healthScore,

            version:
                organ.version,

            permissions:[
                ...organ.permissions
            ],

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


        const dependencyProblems =
            organs.filter(
                organ =>
                    !this
                        .checkDependencies(
                            organ.id
                        )
                        .valid
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
                            organ.health,
                        0
                    ) /
                    organs.length
                )
                : 0;


        return {

            booted:
                this.booted,

            total:
                organs.length,

            installed:
                organs.filter(
                    organ =>
                        organ.installed
                ).length,

            active:
                organs.filter(
                    organ =>
                        organ.installed &&
                        organ.status ===
                            "active"
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

            errors:
                organs.filter(
                    organ =>
                        organ.status ===
                            "error"
                ).length,

            trusted:
                organs.filter(
                    organ =>
                        organ.trusted
                ).length,

            untrusted:
                organs.filter(
                    organ =>
                        !organ.trusted
                ).length,

            protected:
                organs.filter(
                    organ =>
                        organ.protected
                ).length,

            dependencyProblems:
                dependencyProblems.map(
                    organ =>
                        organ.id
                ),

            health,

            status:
                organs.some(
                    organ =>
                        organ.status ===
                            "error" ||
                        organ.health <
                            40
                )
                    ? "critical"
                    : dependencyProblems.length
                        ? "degraded"
                        : "healthy"

        };

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(this.booted){
            return true;
        }


        /*
         * Mevcut kayıtlar varsa runtime API bağlanır.
         */

        this.organs.forEach(
            organ =>
                this.attachRuntimeAPI(
                    organ
                )
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


VAERO.register(
    "organSystem",
    OrganSystem
);


window.OrganSystem =
    OrganSystem;


/*
 * Engine boot ayrıca çağırsa da idempotent.
 */

OrganSystem.boot();
