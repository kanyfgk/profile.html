/* =========================================================
   VAERO DATA SYSTEM
   Engine Application Data Authority
   Provider Abstraction / Local Runtime Provider

   IMPORTANT
   ---------------------------------------------------------
   Applications do not own persistence infrastructure.

   Applications ask VAERO Engine for data access.

   Current provider:
   - local runtime storage

   Future providers may include:
   - VAERO Server
   - VAERO Sync
   - distributed VAERO nodes

   Applications must not care which provider is active.
========================================================= */

const DataSystem = {

    version:
        "1.1.0",

    booted:
        false,

    bootedAt:
        null,

    providers:
        new Map(),

    activeProviderId:
        null,


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

            return null;

        }

    },


    /* =====================================================
       EVENT
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


        const events =
            this.getService(
                "events"
            );


        if(
            events &&
            typeof events.emit ===
                "function"
        ){

            try{

                events.emit(
                    name,
                    payload
                );


                return true;

            } catch(error){

                return false;

            }

        }


        return false;

    },


    /* =====================================================
       CLONE
    ===================================================== */

    clone(value){

        if(
            value ===
                undefined ||
            value ===
                null
        ){

            return value;

        }


        try{

            if(
                typeof structuredClone ===
                    "function"
            ){

                return structuredClone(
                    value
                );

            }

        } catch(error){

            /* fallback */

        }


        try{

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(
        prefix = "data"
    ){

        const safePrefix =
            this.normalizeIdentifier(
                prefix,
                "data"
            ) ||
            "data";


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
            .slice(2,10)}`;

    },


    normalizeIdentifier(
        value,
        fallback = ""
    ){

        const normalized =
            String(
                value ??
                fallback
            )
                .trim()
                .toLowerCase()
                .replace(
                    /\s+/g,
                    "-"
                );


        if(
            !normalized ||
            normalized.length >
                120
        ){

            return "";

        }


        if(
            !/^[a-z0-9:_\-.]+$/.test(
                normalized
            )
        ){

            return "";

        }


        return normalized;

    },


    normalizeRecordId(value){

        const id =
            String(
                value ??
                ""
            ).trim();


        if(
            !id ||
            id.length >
                200
        ){

            return "";

        }


        if(
            !/^[a-zA-Z0-9:_\-.]+$/.test(
                id
            )
        ){

            return "";

        }


        return id;

    },


    /* =====================================================
       PAYLOAD VALIDATION
    ===================================================== */

    validatePayload(
        payload,
        context = {}
    ){

        if(
            !payload ||
            typeof payload !==
                "object" ||
            Array.isArray(
                payload
            )
        ){

            return {
                valid:
                    false,

                reason:
                    "Data payload object değil."
            };

        }


        const cloned =
            this.clone(
                payload
            );


        if(
            !cloned ||
            typeof cloned !==
                "object" ||
            Array.isArray(
                cloned
            )
        ){

            return {
                valid:
                    false,

                reason:
                    "Data payload güvenli şekilde kopyalanamadı."
            };

        }


        const guardian =
            this.getService(
                "guardian"
            );


        if(
            guardian &&
            typeof guardian.validateDetailed ===
                "function"
        ){

            try{

                const result =
                    guardian.validateDetailed(
                        cloned,
                        {
                            scope:
                                "data",

                            operation:
                                context.operation ||
                                null,

                            appId:
                                context.appId ||
                                null,

                            collection:
                                context.collection ||
                                null
                        }
                    );


                if(
                    result &&
                    result.valid ===
                        false
                ){

                    return {
                        valid:
                            false,

                        reason:
                            result.failures?.[0]
                                ?.reason ||
                            "Guardian data işlemini engelledi.",

                        guardian:
                            result
                    };

                }

            } catch(error){

                return {
                    valid:
                        false,

                    reason:
                        error?.message ||
                        "Guardian validation başarısız."
                };

            }

        }


        return {
            valid:
                true,

            value:
                cloned
        };

    },


    /* =====================================================
       PROVIDER REGISTRY
    ===================================================== */

    registerProvider(
        id,
        provider
    ){

        const providerId =
            this.normalizeIdentifier(
                id
            );


        if(
            !providerId ||
            !provider ||
            typeof provider !==
                "object"
        ){

            return false;

        }


        const required = [

            "list",
            "get",
            "create",
            "update",
            "remove"

        ];


        const valid =
            required.every(
                method =>
                    typeof provider[
                        method
                    ] ===
                        "function"
            );


        if(!valid){

            console.warn(
                `Data provider contract eksik: ${providerId}`
            );


            return false;

        }


        this.providers.set(
            providerId,
            provider
        );


        this.emit(
            "data:provider:registered",
            {
                providerId,

                time:
                    Date.now()
            }
        );


        return true;

    },


    useProvider(id){

        const providerId =
            this.normalizeIdentifier(
                id
            );


        if(
            !providerId ||
            !this.providers.has(
                providerId
            )
        ){

            return false;

        }


        this.activeProviderId =
            providerId;


        this.emit(
            "data:provider:changed",
            {
                providerId,

                time:
                    Date.now()
            }
        );


        return true;

    },


    provider(){

        if(
            !this.activeProviderId
        ){

            return null;

        }


        return (
            this.providers.get(
                this.activeProviderId
            ) ||
            null
        );

    },


    /* =====================================================
       APPLICATION ACCESS POLICY

       requestedPermissions is a declaration, not an
       authority grant.

       Until VAERO has a dedicated installed-app permission
       authority, Data System only accepts applications that
       AppRegistry itself marked as built-in system + trusted.

       External apps therefore cannot grant themselves data
       access simply by requesting data.read / data.write.
    ===================================================== */

    getAppManifest(appId){

        const normalizedAppId =
            this.normalizeIdentifier(
                appId
            );


        if(!normalizedAppId){

            return null;

        }


        const registry =
            this.getService(
                "appRegistry"
            );


        if(
            !registry ||
            typeof registry.get !==
                "function"
        ){

            return null;

        }


        try{

            return (
                registry.get(
                    normalizedAppId
                ) ||
                null
            );

        } catch(error){

            return null;

        }

    },


    isTrustedAppManifest(manifest){

        if(
            !manifest ||
            typeof manifest !==
                "object"
        ){

            return false;

        }


        if(
            manifest.enabled ===
                false
        ){

            return false;

        }


        return (
            manifest.system ===
                true &&
            manifest.trusted ===
                true &&
            manifest.distribution ===
                "built-in"
        );

    },


    hasAppPermission(
        appId,
        permission
    ){

        const normalizedAppId =
            this.normalizeIdentifier(
                appId
            );


        const normalizedPermission =
            String(
                permission ??
                ""
            )
                .trim()
                .toLowerCase();


        if(
            !normalizedAppId ||
            !normalizedPermission
        ){

            return false;

        }


        const manifest =
            this.getAppManifest(
                normalizedAppId
            );


        if(
            !this.isTrustedAppManifest(
                manifest
            )
        ){

            return false;

        }


        const requested =
            Array.isArray(
                manifest.requestedPermissions
            )
                ? manifest.requestedPermissions
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
                : [];


        return requested.includes(
            normalizedPermission
        );

    },


    authorizeApp(
        appId,
        permission,
        context = {}
    ){

        const normalizedAppId =
            this.normalizeIdentifier(
                appId
            );


        const normalizedPermission =
            String(
                permission ??
                ""
            )
                .trim()
                .toLowerCase();


        const allowed =
            this.hasAppPermission(
                normalizedAppId,
                normalizedPermission
            );


        if(allowed){

            return true;

        }


        this.emit(
            "data:access:blocked",
            {
                appId:
                    normalizedAppId ||
                    null,

                permission:
                    normalizedPermission ||
                    null,

                collection:
                    context.collection ||
                    null,

                operation:
                    context.operation ||
                    null,

                reason:
                    "application-permission-denied",

                time:
                    Date.now()
            }
        );


        return false;

    },


    /* =====================================================
       NORMALIZE LOCATION
    ===================================================== */

    resolveLocation(
        appId,
        collection
    ){

        const normalizedAppId =
            this.normalizeIdentifier(
                appId
            );


        const normalizedCollection =
            this.normalizeIdentifier(
                collection
            );


        if(
            !normalizedAppId ||
            !normalizedCollection
        ){

            return null;

        }


        return {

            appId:
                normalizedAppId,

            collection:
                normalizedCollection

        };

    },


    /* =====================================================
       QUERY
    ===================================================== */

    applyQuery(
        records,
        options = {}
    ){

        let result =
            Array.isArray(
                records
            )
                ? records
                    .map(
                        record =>
                            this.clone(
                                record
                            )
                    )
                    .filter(Boolean)
                : [];


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


        const where =
            (
                safeOptions.where &&
                typeof safeOptions.where ===
                    "object" &&
                !Array.isArray(
                    safeOptions.where
                )
            )
                ? safeOptions.where
                : null;


        if(where){

            result =
                result.filter(
                    record =>
                        Object.entries(
                            where
                        )
                            .every(
                                (
                                    [
                                        key,
                                        expected
                                    ]
                                ) =>
                                    record?.[
                                        key
                                    ] ===
                                        expected
                            )
                );

        }


        const orderBy =
            String(
                safeOptions.orderBy ||
                ""
            ).trim();


        if(orderBy){

            const direction =
                String(
                    safeOptions.direction ||
                    "asc"
                )
                    .trim()
                    .toLowerCase() ===
                        "desc"
                    ? -1
                    : 1;


            result.sort(
                (
                    a,
                    b
                ) => {

                    const first =
                        a?.[
                            orderBy
                        ];

                    const second =
                        b?.[
                            orderBy
                        ];


                    if(
                        first ===
                            second
                    ){

                        return 0;

                    }


                    return (
                        first >
                        second
                            ? 1
                            : -1
                    ) *
                    direction;

                }
            );

        }


        const numericLimit =
            Number(
                safeOptions.limit
            );


        if(
            Number.isFinite(
                numericLimit
            ) &&
            numericLimit >
                0
        ){

            result =
                result.slice(
                    0,
                    Math.floor(
                        numericLimit
                    )
                );

        }


        return result;

    },


    /* =====================================================
       READ LIST
    ===================================================== */

    async list(
        appId,
        collection,
        options = {}
    ){

        const location =
            this.resolveLocation(
                appId,
                collection
            );


        const provider =
            this.provider();


        if(
            !location ||
            !provider
        ){

            return [];

        }


        if(
            !this.authorizeApp(
                location.appId,
                "data.read",
                {
                    collection:
                        location.collection,

                    operation:
                        "list"
                }
            )
        ){

            return [];

        }


        let records =
            [];


        try{

            records =
                await provider.list(
                    location.appId,
                    location.collection
                );

        } catch(error){

            console.warn(
                "Data provider list işlemi başarısız:",
                error
            );


            return [];

        }


        const safeRecords =
            Array.isArray(
                records
            )
                ? records
                    .map(
                        record =>
                            this.validatePayload(
                                record,
                                {
                                    ...location,

                                    operation:
                                        "read-list"
                                }
                            )
                    )
                    .filter(
                        validation =>
                            validation?.valid ===
                                true
                    )
                    .map(
                        validation =>
                            validation.value
                    )
                : [];


        return this.applyQuery(
            safeRecords,
            options
        );

    },


    /* =====================================================
       READ ONE
    ===================================================== */

    async get(
        appId,
        collection,
        recordId
    ){

        const location =
            this.resolveLocation(
                appId,
                collection
            );


        const id =
            this.normalizeRecordId(
                recordId
            );


        const provider =
            this.provider();


        if(
            !location ||
            !id ||
            !provider
        ){

            return null;

        }


        if(
            !this.authorizeApp(
                location.appId,
                "data.read",
                {
                    collection:
                        location.collection,

                    operation:
                        "get"
                }
            )
        ){

            return null;

        }


        let record =
            null;


        try{

            record =
                await provider.get(
                    location.appId,
                    location.collection,
                    id
                );

        } catch(error){

            console.warn(
                "Data provider get işlemi başarısız:",
                error
            );


            return null;

        }


        if(!record){

            return null;

        }


        const validation =
            this.validatePayload(
                record,
                {
                    ...location,

                    operation:
                        "read"
                }
            );


        return validation.valid
            ? validation.value
            : null;

    },


    /* =====================================================
       CREATE
    ===================================================== */

    async create(
        appId,
        collection,
        payload
    ){

        const location =
            this.resolveLocation(
                appId,
                collection
            );


        const provider =
            this.provider();


        if(
            !location ||
            !provider
        ){

            return null;

        }


        if(
            !this.authorizeApp(
                location.appId,
                "data.write",
                {
                    collection:
                        location.collection,

                    operation:
                        "create"
                }
            )
        ){

            return null;

        }


        const validation =
            this.validatePayload(
                payload,
                {
                    ...location,

                    operation:
                        "create"
                }
            );


        if(!validation.valid){

            console.warn(
                validation.reason
            );


            return null;

        }


        const now =
            Date.now();


        const requestedId =
            this.normalizeRecordId(
                validation.value.id
            );


        const record = {

            ...validation.value,

            id:
                requestedId ||
                this.createId(
                    location.collection
                ),

            createdAt:
                Number(
                    validation.value
                        .createdAt
                ) ||
                now,

            updatedAt:
                now

        };


        const finalValidation =
            this.validatePayload(
                record,
                {
                    ...location,

                    operation:
                        "create"
                }
            );


        if(!finalValidation.valid){

            return null;

        }


        let created =
            null;


        try{

            created =
                await provider.create(
                    location.appId,
                    location.collection,
                    finalValidation.value
                );

        } catch(error){

            console.warn(
                "Data provider create işlemi başarısız:",
                error
            );


            return null;

        }


        if(created){

            this.emit(
                "data:created",
                {
                    appId:
                        location.appId,

                    collection:
                        location.collection,

                    recordId:
                        created.id ||
                        record.id,

                    time:
                        now
                }
            );

        }


        return this.clone(
            created
        );

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    async update(
        appId,
        collection,
        recordId,
        patch
    ){

        const location =
            this.resolveLocation(
                appId,
                collection
            );


        const id =
            this.normalizeRecordId(
                recordId
            );


        const provider =
            this.provider();


        if(
            !location ||
            !id ||
            !provider
        ){

            return null;

        }


        if(
            !this.authorizeApp(
                location.appId,
                "data.write",
                {
                    collection:
                        location.collection,

                    operation:
                        "update"
                }
            )
        ){

            return null;

        }


        let existing =
            null;


        try{

            existing =
                await provider.get(
                    location.appId,
                    location.collection,
                    id
                );

        } catch(error){

            console.warn(
                "Data provider update read işlemi başarısız:",
                error
            );


            return null;

        }


        if(!existing){

            return null;

        }


        /*
         * Existing provider state is also validated before
         * being merged with the incoming patch.
         */

        const existingValidation =
            this.validatePayload(
                existing,
                {
                    ...location,

                    operation:
                        "update-existing"
                }
            );


        if(!existingValidation.valid){

            return null;

        }


        const patchValidation =
            this.validatePayload(
                patch,
                {
                    ...location,

                    operation:
                        "update-patch"
                }
            );


        if(!patchValidation.valid){

            return null;

        }


        const record = {

            ...existingValidation.value,
            ...patchValidation.value,

            id,

            createdAt:
                existingValidation.value
                    .createdAt ||
                Date.now(),

            updatedAt:
                Date.now()

        };


        const finalValidation =
            this.validatePayload(
                record,
                {
                    ...location,

                    operation:
                        "update"
                }
            );


        if(!finalValidation.valid){

            return null;

        }


        let updated =
            null;


        try{

            updated =
                await provider.update(
                    location.appId,
                    location.collection,
                    id,
                    finalValidation.value
                );

        } catch(error){

            console.warn(
                "Data provider update işlemi başarısız:",
                error
            );


            return null;

        }


        if(updated){

            this.emit(
                "data:updated",
                {
                    appId:
                        location.appId,

                    collection:
                        location.collection,

                    recordId:
                        id,

                    time:
                        Date.now()
                }
            );

        }


        return this.clone(
            updated
        );

    },


    /* =====================================================
       UPSERT
    ===================================================== */

    async upsert(
        appId,
        collection,
        payload
    ){

        if(
            !payload ||
            typeof payload !==
                "object" ||
            Array.isArray(
                payload
            )
        ){

            return null;

        }


        const id =
            this.normalizeRecordId(
                payload.id
            );


        if(id){

            const existing =
                await this.get(
                    appId,
                    collection,
                    id
                );


            if(existing){

                return this.update(
                    appId,
                    collection,
                    id,
                    payload
                );

            }

        }


        return this.create(
            appId,
            collection,
            payload
        );

    },


    /* =====================================================
       REMOVE
    ===================================================== */

    async remove(
        appId,
        collection,
        recordId
    ){

        const location =
            this.resolveLocation(
                appId,
                collection
            );


        const id =
            this.normalizeRecordId(
                recordId
            );


        const provider =
            this.provider();


        if(
            !location ||
            !id ||
            !provider
        ){

            return false;

        }


        if(
            !this.authorizeApp(
                location.appId,
                "data.write",
                {
                    collection:
                        location.collection,

                    operation:
                        "remove"
                }
            )
        ){

            return false;

        }


        let removed =
            false;


        try{

            removed =
                await provider.remove(
                    location.appId,
                    location.collection,
                    id
                );

        } catch(error){

            console.warn(
                "Data provider remove işlemi başarısız:",
                error
            );


            return false;

        }


        if(removed){

            this.emit(
                "data:removed",
                {
                    appId:
                        location.appId,

                    collection:
                        location.collection,

                    recordId:
                        id,

                    time:
                        Date.now()
                }
            );

        }


        return Boolean(
            removed
        );

    },


    /* =====================================================
       COUNT
    ===================================================== */

    async count(
        appId,
        collection,
        options = {}
    ){

        const records =
            await this.list(
                appId,
                collection,
                options
            );


        return records.length;

    },


    /* =====================================================
       APPLICATION-SCOPED CLIENT

       Application receives only its own namespace.

       It cannot choose another application's namespace after
       the client is created.
    ===================================================== */

    forApp(appId){

        const normalizedAppId =
            this.normalizeIdentifier(
                appId
            );


        if(!normalizedAppId){

            return null;

        }


        const manifest =
            this.getAppManifest(
                normalizedAppId
            );


        if(
            !this.isTrustedAppManifest(
                manifest
            )
        ){

            this.emit(
                "data:client:blocked",
                {
                    appId:
                        normalizedAppId,

                    reason:
                        "application-not-trusted",

                    time:
                        Date.now()
                }
            );


            return null;

        }


        const canRead =
            this.hasAppPermission(
                normalizedAppId,
                "data.read"
            );


        const canWrite =
            this.hasAppPermission(
                normalizedAppId,
                "data.write"
            );


        if(
            !canRead &&
            !canWrite
        ){

            this.emit(
                "data:client:blocked",
                {
                    appId:
                        normalizedAppId,

                    reason:
                        "no-data-permission",

                    time:
                        Date.now()
                }
            );


            return null;

        }


        const host =
            this;


        return Object.freeze({

            appId:
                normalizedAppId,

            permissions:
                Object.freeze({

                    read:
                        canRead,

                    write:
                        canWrite

                }),


            collection(name){

                const collection =
                    host.normalizeIdentifier(
                        name
                    );


                if(!collection){

                    return null;

                }


                return Object.freeze({

                    name:
                        collection,


                    list(
                        options = {}
                    ){

                        return host.list(
                            normalizedAppId,
                            collection,
                            options
                        );

                    },


                    get(recordId){

                        return host.get(
                            normalizedAppId,
                            collection,
                            recordId
                        );

                    },


                    create(payload){

                        return host.create(
                            normalizedAppId,
                            collection,
                            payload
                        );

                    },


                    update(
                        recordId,
                        patch
                    ){

                        return host.update(
                            normalizedAppId,
                            collection,
                            recordId,
                            patch
                        );

                    },


                    upsert(payload){

                        return host.upsert(
                            normalizedAppId,
                            collection,
                            payload
                        );

                    },


                    remove(recordId){

                        return host.remove(
                            normalizedAppId,
                            collection,
                            recordId
                        );

                    },


                    count(
                        options = {}
                    ){

                        return host.count(
                            normalizedAppId,
                            collection,
                            options
                        );

                    }

                });

            }

        });

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(this.booted){

            return this.report();

        }


        if(
            !this.providers.has(
                "local"
            )
        ){

            this.registerProvider(
                "local",
                LocalDataProvider
            );

        }


        if(
            !this.useProvider(
                "local"
            )
        ){

            return false;

        }


        this.booted =
            true;


        this.bootedAt =
            Date.now();


        this.emit(
            "data:booted",
            {
                provider:
                    this.activeProviderId,

                time:
                    this.bootedAt
            }
        );


        return this.report();

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        return {

            version:
                this.version,

            booted:
                this.booted,

            bootedAt:
                this.bootedAt,

            activeProvider:
                this.activeProviderId,

            providers:
                [
                    ...this.providers.keys()
                ]

        };

    }

};


/* =========================================================
   LOCAL DATA PROVIDER

   Browser-native persistence implementation.

   IMPORTANT
   ---------------------------------------------------------
   This is an Engine implementation detail.

   Applications never access localStorage or this provider
   directly.

   The provider can later be replaced by VAERO-owned remote
   infrastructure without changing application code.
========================================================= */

const LocalDataProvider = {

    id:
        "local",

    storagePrefix:
        "vaero:data:v1:",

    memoryFallback:
        new Map(),


    key(
        appId,
        collection
    ){

        return (
            this.storagePrefix +
            appId +
            ":" +
            collection
        );

    },


    clone(value){

        if(
            value ===
                undefined ||
            value ===
                null
        ){

            return value;

        }


        try{

            if(
                typeof structuredClone ===
                    "function"
            ){

                return structuredClone(
                    value
                );

            }

        } catch(error){

            /* fallback */

        }


        try{

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch(error){

            return null;

        }

    },


    readCollection(
        appId,
        collection
    ){

        const key =
            this.key(
                appId,
                collection
            );


        if(
            typeof localStorage ===
                "undefined"
        ){

            return this.clone(
                this.memoryFallback.get(
                    key
                ) ||
                []
            ) || [];

        }


        try{

            const raw =
                localStorage.getItem(
                    key
                );


            if(!raw){

                return [];

            }


            const parsed =
                JSON.parse(
                    raw
                );


            return Array.isArray(
                parsed
            )
                ? parsed
                : [];

        } catch(error){

            return [];

        }

    },


    writeCollection(
        appId,
        collection,
        records
    ){

        const key =
            this.key(
                appId,
                collection
            );


        const safeRecords =
            Array.isArray(
                records
            )
                ? this.clone(
                    records
                ) || []
                : [];


        if(
            typeof localStorage ===
                "undefined"
        ){

            this.memoryFallback.set(
                key,
                safeRecords
            );


            return true;

        }


        try{

            localStorage.setItem(
                key,
                JSON.stringify(
                    safeRecords
                )
            );


            return true;

        } catch(error){

            return false;

        }

    },


    async list(
        appId,
        collection
    ){

        return this.readCollection(
            appId,
            collection
        );

    },


    async get(
        appId,
        collection,
        recordId
    ){

        const records =
            this.readCollection(
                appId,
                collection
            );


        const record =
            records.find(
                item =>
                    item?.id ===
                        recordId
            );


        return this.clone(
            record ||
            null
        );

    },


    async create(
        appId,
        collection,
        record
    ){

        const records =
            this.readCollection(
                appId,
                collection
            );


        if(
            records.some(
                item =>
                    item?.id ===
                        record.id
            )
        ){

            return null;

        }


        const clonedRecord =
            this.clone(
                record
            );


        if(!clonedRecord){

            return null;

        }


        records.push(
            clonedRecord
        );


        if(
            !this.writeCollection(
                appId,
                collection,
                records
            )
        ){

            return null;

        }


        return this.clone(
            record
        );

    },


    async update(
        appId,
        collection,
        recordId,
        record
    ){

        const records =
            this.readCollection(
                appId,
                collection
            );


        const index =
            records.findIndex(
                item =>
                    item?.id ===
                        recordId
            );


        if(
            index <
                0
        ){

            return null;

        }


        const clonedRecord =
            this.clone(
                record
            );


        if(!clonedRecord){

            return null;

        }


        records[
            index
        ] =
            clonedRecord;


        if(
            !this.writeCollection(
                appId,
                collection,
                records
            )
        ){

            return null;

        }


        return this.clone(
            record
        );

    },


    async remove(
        appId,
        collection,
        recordId
    ){

        const records =
            this.readCollection(
                appId,
                collection
            );


        const next =
            records.filter(
                item =>
                    item?.id !==
                        recordId
            );


        if(
            next.length ===
                records.length
        ){

            return false;

        }


        return this.writeCollection(
            appId,
            collection,
            next
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
            "data",
            DataSystem
        );

    }

} catch(error){

    console.error(
        "VAERO Data System register edilemedi:",
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

    window.DataSystem =
        DataSystem;

}
