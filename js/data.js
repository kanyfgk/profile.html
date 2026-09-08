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
        "1.0.0",

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

        try{

            if(
                typeof crypto !==
                    "undefined" &&
                typeof crypto.randomUUID ===
                    "function"
            ){

                return `${prefix}_${crypto.randomUUID()}`;

            }

        } catch(error){

            /* fallback */

        }


        return `${prefix}_${Date.now()}_${Math.random()
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


        const where =
            (
                options.where &&
                typeof options.where ===
                    "object" &&
                !Array.isArray(
                    options.where
                )
            )
                ? options.where
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
                options.orderBy ||
                ""
            ).trim();


        if(orderBy){

            const direction =
                String(
                    options.direction ||
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
                options.limit
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
       READ
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


        const records =
            await provider.list(
                location.appId,
                location.collection
            );


        return this.applyQuery(
            records,
            options
        );

    },


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


        const record =
            await provider.get(
                location.appId,
                location.collection,
                id
            );


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


        const created =
            await provider.create(
                location.appId,
                location.collection,
                finalValidation.value
            );


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


        const existing =
            await provider.get(
                location.appId,
                location.collection,
                id
            );


        if(!existing){

            return null;

        }


        const validation =
            this.validatePayload(
                patch,
                {
                    ...location,

                    operation:
                        "update"
                }
            );


        if(!validation.valid){

            return null;

        }


        const record = {

            ...existing,
            ...validation.value,

            id,

            createdAt:
                existing.createdAt ||
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


        const updated =
            await provider.update(
                location.appId,
                location.collection,
                id,
                finalValidation.value
            );


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
                "object"
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


        const removed =
            await provider.remove(
                location.appId,
                location.collection,
                id
            );


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
    ===================================================== */

    forApp(appId){

        const normalizedAppId =
            this.normalizeIdentifier(
                appId
            );


        if(!normalizedAppId){

            return null;

        }


        const host =
            this;


        return Object.freeze({

            appId:
                normalizedAppId,


            collection(name){

                const collection =
                    host.normalizeIdentifier(
                        name
                    );


                if(!collection){

                    return null;

                }


                return Object.freeze({

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

   This is an Engine implementation detail.
   Applications never access it directly.
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


        records.push(
            this.clone(
                record
            )
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


        records[
            index
        ] =
            this.clone(
                record
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
