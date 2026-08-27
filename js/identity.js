/* =========================================================
   VAERO IDENTITY CORE
   Entity Identity / Identifier / Verification Policy
========================================================= */

const Identity = {

    booted:
        false,

    identities:
        {},


    /* =====================================================
       SAFE ACCESS
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

            console.warn(
                `Identity event gönderilemedi: ${name}`,
                error
            );

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

            console.warn(
                `Identity event fallback gönderilemedi: ${name}`,
                error
            );

        }


        return false;

    },


    /* =====================================================
       ID
    ===================================================== */

    createIdentifier(prefix = "VA"){

        const normalizedPrefix =
            String(
                prefix ||
                    "VA"
            )
                .trim()
                .toUpperCase()
                .replace(
                    /[^A-Z0-9]/g,
                    ""
                )
                .slice(
                    0,
                    12
                ) ||
            "VA";


        let randomPart =
            "";


        try{

            if(
                typeof crypto !==
                    "undefined" &&
                typeof crypto.randomUUID ===
                    "function"
            ){

                randomPart =
                    crypto
                        .randomUUID()
                        .replaceAll(
                            "-",
                            ""
                        )
                        .slice(
                            0,
                            12
                        )
                        .toUpperCase();

            }

        } catch(error){

            /* fallback below */

        }


        if(!randomPart){

            randomPart =
                `${Date.now().toString(36)}${Math.random()
                    .toString(36)
                    .slice(2,8)}`
                    .toUpperCase();

        }


        return `${normalizedPrefix}-${randomPart}`;

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeId(value){

        const id =
            String(
                value ??
                    ""
            )
                .trim()
                .slice(
                    0,
                    200
                );


        return (
            id ||
            null
        );

    },


    normalizeText(
        value,
        maxLength = 1000
    ){

        return String(
            value ??
                ""
        )
            .trim()
            .slice(
                0,
                maxLength
            );

    },


    normalizeTimestamp(
        value,
        fallback = null
    ){

        const timestamp =
            Number(
                value
            );


        return Number.isFinite(
            timestamp
        ) &&
        timestamp >
            0
            ? timestamp
            : fallback;

    },


    normalizeVisibility(value){

        const visibility =
            String(
                value ||
                    "private"
            )
                .trim()
                .toLowerCase();


        return [
            "private",
            "connections",
            "engine"
        ].includes(
            visibility
        )
            ? visibility
            : "private";

    },


    normalizeVerification(value){

        const status =
            String(
                value ||
                    "unverified"
            )
                .trim()
                .toLowerCase();


        return [
            "unverified",
            "pending",
            "verified",
            "rejected"
        ].includes(
            status
        )
            ? status
            : "unverified";

    },


    normalizeStatus(value){

        const status =
            String(
                value ||
                    "active"
            )
                .trim()
                .toLowerCase();


        return [
            "active",
            "inactive",
            "suspended",
            "archived"
        ].includes(
            status
        )
            ? status
            : "active";

    },


    normalizePermissions(value){

        if(
            !Array.isArray(
                value
            ) &&
            !(value instanceof Set)
        ){

            return [];

        }


        const source =
            Array.isArray(
                value
            )
                ? value
                : [
                    ...value
                ];


        const seen =
            new Set();


        return source
            .map(
                permission =>
                    String(
                        permission ??
                            ""
                    )
                        .trim()
                        .slice(
                            0,
                            160
                        )
            )
            .filter(
                permission => {

                    if(!permission){

                        return false;

                    }


                    const key =
                        permission.toLowerCase();


                    if(
                        seen.has(
                            key
                        )
                    ){

                        return false;

                    }


                    seen.add(
                        key
                    );


                    return true;

                }
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


    normalizeIdentity(
        identity = {},
        entity = null
    ){

        const source =
            identity &&
            typeof identity ===
                "object" &&
            !Array.isArray(
                identity
            )
                ? identity
                : {};


        const now =
            Date.now();


        let verificationStatus =
            source.verificationStatus;


        /*
         * Legacy compatibility only.
         */

        if(
            !verificationStatus &&
            source.verified ===
                true
        ){

            verificationStatus =
                "verified";

        }


        verificationStatus =
            this.normalizeVerification(
                verificationStatus
            );


        const entityId =
            this.normalizeId(
                source.entityId ||
                entity?.id ||
                source.id
            );


        const identityId =
            this.normalizeId(
                source.id ||
                entityId
            );


        const existingVAID =
            this.normalizeText(
                source.vaId ||
                source.vaID ||
                (
                    String(
                        source.id ||
                            ""
                    ).startsWith(
                        "VA-"
                    )
                        ? source.id
                        : ""
                ),
                200
            );


        const createdAt =
            this.normalizeTimestamp(
                source.createdAt ||
                entity?.createdAt,
                now
            );


        const updatedAt =
            this.normalizeTimestamp(
                source.updatedAt,
                createdAt
            );


        const verifiedAt =
            verificationStatus ===
                "verified"
                ? this.normalizeTimestamp(
                    source.verifiedAt,
                    updatedAt
                )
                : null;


        const rejectedAt =
            verificationStatus ===
                "rejected"
                ? this.normalizeTimestamp(
                    source.rejectedAt,
                    updatedAt
                )
                : null;


        return {

            id:
                identityId ||
                entityId ||
                "",

            entityId:
                entityId ||
                identityId ||
                "",

            type:
                this.normalizeText(
                    source.type ||
                    entity?.type ||
                    "entity",
                    120
                ) ||
                "entity",

            name:
                this.normalizeText(
                    source.name ||
                    entity?.name ||
                    "İsimsiz Varlık",
                    240
                ) ||
                "İsimsiz Varlık",

            vaId:
                existingVAID ||
                this.createIdentifier(
                    "VA"
                ),

            aeId:
                this.normalizeText(
                    source.aeId ||
                    source.aeID,
                    200
                ),

            eaId:
                this.normalizeText(
                    source.eaId ||
                    source.eaID,
                    200
                ),

            alias:
                this.normalizeText(
                    source.alias,
                    240
                ),

            visibility:
                this.normalizeVisibility(
                    source.visibility
                ),

            verificationStatus,

            /*
             * Compatibility mirror only.
             * verificationStatus is authoritative.
             */

            verified:
                verificationStatus ===
                    "verified",

            verificationRequestedAt:
                this.normalizeTimestamp(
                    source.verificationRequestedAt,
                    null
                ),

            verifiedAt,

            rejectedAt,

            issuer:
                this.normalizeText(
                    source.issuer,
                    240
                ),

            verificationMethod:
                this.normalizeText(
                    source.verificationMethod,
                    240
                ),

            verificationReference:
                this.normalizeText(
                    source.verificationReference,
                    500
                ),

            status:
                this.normalizeStatus(
                    source.status
                ),

            permissions:
                this.normalizePermissions(
                    source.permissions
                ),

            metadata:
                this.normalizeMetadata(
                    source.metadata
                ),

            createdAt,

            updatedAt:
                Math.max(
                    createdAt,
                    updatedAt
                )

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


        const manager =
            this.getService(
                "entityManager"
            );


        if(manager){

            const methods = [
                "all",
                "getAll"
            ];


            for(
                const method of methods
            ){

                if(
                    typeof manager[
                        method
                    ] !==
                        "function"
                ){

                    continue;

                }


                try{

                    const entities =
                        manager[
                            method
                        ]({
                            includeArchived:
                                true
                        }) ||
                        [];


                    if(
                        Array.isArray(
                            entities
                        )
                    ){

                        entities.forEach(
                            entity => {

                                if(
                                    entity?.id
                                ){

                                    this.create(
                                        entity
                                    );

                                }

                            }
                        );

                    }


                    break;

                } catch(error){

                    console.warn(
                        "Identity boot Entity taraması başarısız:",
                        error
                    );

                }

            }

        }


        this.booted =
            true;


        this.emit(
            "identity:ready",
            {
                count:
                    Object.keys(
                        this.identities
                    ).length,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       CREATE / HYDRATE
    ===================================================== */

    create(entity){

        if(
            !entity ||
            typeof entity !==
                "object" ||
            !entity.id
        ){

            return null;

        }


        const existing =
            this.identities[
                entity.id
            ] ||
            null;


        const identity =
            this.normalizeIdentity(
                {
                    ...(existing || {}),
                    ...(entity.identity || {})
                },
                entity
            );


        entity.identity =
            identity;


        this.identities[
            entity.id
        ] =
            identity;


        return identity;

    },


    hydrate(
        entity,
        data = {}
    ){

        if(
            !entity ||
            typeof entity !==
                "object" ||
            !entity.id
        ){

            return null;

        }


        const existing =
            this.identities[
                entity.id
            ] ||
            {};


        const identity =
            this.normalizeIdentity(
                {
                    ...existing,
                    ...(
                        data &&
                        typeof data ===
                            "object" &&
                        !Array.isArray(
                            data
                        )
                            ? data
                            : {}
                    )
                },
                entity
            );


        /*
         * VA ID remains stable once assigned.
         */

        if(
            existing.vaId
        ){

            identity.vaId =
                existing.vaId;

        }


        entity.identity =
            identity;


        this.identities[
            entity.id
        ] =
            identity;


        return identity;

    },


    /* =====================================================
       RESOLVE ENTITY
    ===================================================== */

    resolveEntity(entityId){

        const id =
            this.normalizeId(
                entityId
            );


        if(!id){

            return null;

        }


        const manager =
            this.getService(
                "entityManager"
            );


        if(manager){

            const methods = [
                "get",
                "find",
                "getById"
            ];


            for(
                const method of methods
            ){

                if(
                    typeof manager[
                        method
                    ] !==
                        "function"
                ){

                    continue;

                }


                try{

                    const entity =
                        manager[
                            method
                        ](
                            id
                        );


                    if(entity){

                        return entity;

                    }

                } catch(error){

                    /* next resolver */

                }

            }

        }


        return null;

    },


    /* =====================================================
       GET
    ===================================================== */

    get(entityOrId){

        if(!entityOrId){

            return null;

        }


        if(
            typeof entityOrId ===
                "object"
        ){

            if(
                entityOrId.identity
            ){

                const existing =
                    entityOrId.id
                        ? this.identities[
                            entityOrId.id
                        ]
                        : null;


                const identity =
                    this.normalizeIdentity(
                        {
                            ...(existing || {}),
                            ...entityOrId.identity
                        },
                        entityOrId
                    );


                if(
                    existing?.vaId
                ){

                    identity.vaId =
                        existing.vaId;

                }


                entityOrId.identity =
                    identity;


                if(
                    entityOrId.id
                ){

                    this.identities[
                        entityOrId.id
                    ] =
                        identity;

                }


                return identity;

            }


            if(
                entityOrId.id
            ){

                return this.create(
                    entityOrId
                );

            }


            return null;

        }


        const id =
            this.normalizeId(
                entityOrId
            );


        if(!id){

            return null;

        }


        if(
            this.identities[
                id
            ]
        ){

            return this.identities[
                id
            ];

        }


        const entity =
            this.resolveEntity(
                id
            );


        if(entity){

            return this.create(
                entity
            );

        }


        return null;

    },


    findByVAID(vaId){

        const id =
            this.normalizeText(
                vaId,
                200
            )
                .toUpperCase();


        if(!id){

            return null;

        }


        return (
            Object.values(
                this.identities
            ).find(
                identity =>
                    String(
                        identity?.vaId ||
                            ""
                    )
                        .toUpperCase() ===
                    id
            ) ||
            null
        );

    },


    /* =====================================================
       UPDATE
    ===================================================== */

    update(
        entityOrIdentity,
        changes = {}
    ){

        const identity =
            this.get(
                entityOrIdentity
            );


        if(
            !identity ||
            !changes ||
            typeof changes !==
                "object" ||
            Array.isArray(
                changes
            )
        ){

            return null;

        }


        /*
         * Protected fields cannot be changed through
         * generic update:
         *
         * vaId
         * verificationStatus
         * verified
         * verifiedAt
         * issuer
         * verificationReference
         */

        if(
            changes.alias !==
                undefined
        ){

            identity.alias =
                this.normalizeText(
                    changes.alias,
                    240
                );

        }


        if(
            changes.visibility !==
                undefined
        ){

            identity.visibility =
                this.normalizeVisibility(
                    changes.visibility
                );

        }


        if(
            changes.aeId !==
                undefined
        ){

            identity.aeId =
                this.normalizeText(
                    changes.aeId,
                    200
                );

        }


        if(
            changes.eaId !==
                undefined
        ){

            identity.eaId =
                this.normalizeText(
                    changes.eaId,
                    200
                );

        }


        if(
            changes.status !==
                undefined
        ){

            identity.status =
                this.normalizeStatus(
                    changes.status
                );

        }


        if(
            changes.metadata &&
            typeof changes.metadata ===
                "object" &&
            !Array.isArray(
                changes.metadata
            )
        ){

            identity.metadata = {

                ...identity.metadata,

                ...changes.metadata

            };

        }


        identity.updatedAt =
            Date.now();


        this.syncEntity(
            identity
        );


        this.emit(
            "identity:updated",
            {
                identity,

                entityId:
                    identity.entityId,

                time:
                    Date.now()
            }
        );


        return identity;

    },


    /* =====================================================
       VERIFICATION REQUEST
    ===================================================== */

    requestVerification(
        entityOrIdentity,
        context = {}
    ){

        const identity =
            this.get(
                entityOrIdentity
            );


        if(!identity){

            return null;

        }


        if(
            identity.verificationStatus ===
                "verified" ||
            identity.verificationStatus ===
                "pending"
        ){

            return identity;

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


        const requestedAt =
            Date.now();


        identity.verificationStatus =
            "pending";


        identity.verified =
            false;


        identity.verificationRequestedAt =
            requestedAt;


        identity.verifiedAt =
            null;


        identity.rejectedAt =
            null;


        identity.updatedAt =
            requestedAt;


        identity.metadata = {

            ...identity.metadata,

            verificationRequest:{

                source:
                    this.normalizeText(
                        safeContext.source ||
                        "identity",
                        240
                    ),

                requestedAt

            }

        };


        this.syncEntity(
            identity
        );


        this.emit(
            "identity:verification-requested",
            {
                identity,

                entityId:
                    identity.entityId,

                time:
                    requestedAt
            }
        );


        return identity;

    },


    /* =====================================================
       VERIFICATION AUTHORITY BOUNDARY

       This method accepts a verifier RESULT.
       It does not itself prove identity authenticity.
    ===================================================== */

    verify(
        entityOrIdentity,
        verification = {}
    ){

        const identity =
            this.get(
                entityOrIdentity
            );


        if(!identity){

            return null;

        }


        if(
            !verification ||
            typeof verification !==
                "object" ||
            Array.isArray(
                verification
            )
        ){

            return null;

        }


        const issuer =
            this.normalizeText(
                verification.issuer,
                240
            );


        const reference =
            this.normalizeText(
                verification.reference,
                500
            );


        /*
         * A plain frontend call cannot self-verify.
         * A trusted verifier/backend adapter must eventually
         * produce this result contract.
         */

        if(
            verification.valid !==
                true ||
            !issuer ||
            !reference
        ){

            console.warn(
                "Identity doğrulanmadı: geçerli verifier sonucu gerekli."
            );


            if(
                identity.verificationStatus ===
                    "unverified"
            ){

                this.requestVerification(
                    identity,
                    {
                        source:
                            "verification-attempt"
                    }
                );

            }


            return null;

        }


        const now =
            Date.now();


        identity.verificationStatus =
            "verified";


        identity.verified =
            true;


        identity.verifiedAt =
            now;


        identity.rejectedAt =
            null;


        identity.issuer =
            issuer;


        identity.verificationMethod =
            this.normalizeText(
                verification.method ||
                "external-verifier",
                240
            ) ||
            "external-verifier";


        identity.verificationReference =
            reference;


        identity.updatedAt =
            now;


        identity.metadata = {

            ...identity.metadata,

            verificationResult:{
                issuer,

                reference,

                method:
                    identity.verificationMethod,

                verifiedAt:
                    now
            }

        };


        this.syncEntity(
            identity
        );


        this.emit(
            "identity:verified",
            {
                identity,

                entityId:
                    identity.entityId,

                issuer,

                reference,

                time:
                    now
            }
        );


        return identity;

    },


    rejectVerification(
        entityOrIdentity,
        result = {}
    ){

        const identity =
            this.get(
                entityOrIdentity
            );


        if(!identity){

            return null;

        }


        if(
            !result ||
            typeof result !==
                "object" ||
            Array.isArray(
                result
            )
        ){

            return null;

        }


        const issuer =
            this.normalizeText(
                result.issuer,
                240
            );


        if(!issuer){

            return null;

        }


        const now =
            Date.now();


        identity.verificationStatus =
            "rejected";


        identity.verified =
            false;


        identity.verifiedAt =
            null;


        identity.rejectedAt =
            now;


        identity.issuer =
            issuer;


        identity.verificationMethod =
            this.normalizeText(
                result.method ||
                identity.verificationMethod,
                240
            );


        identity.verificationReference =
            this.normalizeText(
                result.reference,
                500
            );


        identity.updatedAt =
            now;


        identity.metadata = {

            ...identity.metadata,

            verificationRejection:{

                issuer,

                reference:
                    identity.verificationReference,

                reason:
                    this.normalizeText(
                        result.reason,
                        1000
                    ) ||
                    null,

                rejectedAt:
                    now
            }

        };


        this.syncEntity(
            identity
        );


        this.emit(
            "identity:verification-rejected",
            {
                identity,

                entityId:
                    identity.entityId,

                reason:
                    result.reason ||
                    null,

                issuer,

                time:
                    now
            }
        );


        return identity;

    },


    resetVerification(
        entityOrIdentity,
        context = {}
    ){

        const identity =
            this.get(
                entityOrIdentity
            );


        if(!identity){

            return null;

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


        /*
         * Reset is deliberately gated.
         */

        if(
            safeContext.authorized !==
                true
        ){

            return null;

        }


        const now =
            Date.now();


        identity.verificationStatus =
            "unverified";


        identity.verified =
            false;


        identity.verificationRequestedAt =
            null;


        identity.verifiedAt =
            null;


        identity.rejectedAt =
            null;


        identity.issuer =
            "";


        identity.verificationMethod =
            "";


        identity.verificationReference =
            "";


        identity.updatedAt =
            now;


        this.syncEntity(
            identity
        );


        this.emit(
            "identity:verification-reset",
            {
                identity,

                entityId:
                    identity.entityId,

                time:
                    now
            }
        );


        return identity;

    },


    /* =====================================================
       VERIFICATION STATUS
    ===================================================== */

    isVerified(entityOrIdentity){

        return (
            this.get(
                entityOrIdentity
            )?.verificationStatus ===
                "verified"
        );

    },


    isPending(entityOrIdentity){

        return (
            this.get(
                entityOrIdentity
            )?.verificationStatus ===
                "pending"
        );

    },


    /* =====================================================
       PERMISSIONS
    ===================================================== */

    setPermission(
        entityOrIdentity,
        permission
    ){

        const identity =
            this.get(
                entityOrIdentity
            );


        const normalized =
            this.normalizeText(
                permission,
                160
            );


        if(
            !identity ||
            !normalized
        ){

            return false;

        }


        if(
            identity.permissions.includes(
                normalized
            )
        ){

            return true;

        }


        identity.permissions =
            this.normalizePermissions([
                ...identity.permissions,
                normalized
            ]);


        identity.updatedAt =
            Date.now();


        this.syncEntity(
            identity
        );


        this.emit(
            "identity:permission-granted",
            {
                identity,

                permission:
                    normalized,

                entityId:
                    identity.entityId,

                time:
                    Date.now()
            }
        );


        return true;

    },


    revokePermission(
        entityOrIdentity,
        permission
    ){

        const identity =
            this.get(
                entityOrIdentity
            );


        const normalized =
            this.normalizeText(
                permission,
                160
            );


        if(
            !identity ||
            !normalized
        ){

            return false;

        }


        const before =
            identity.permissions.length;


        identity.permissions =
            identity.permissions.filter(
                item =>
                    item !==
                        normalized
            );


        if(
            identity.permissions.length ===
                before
        ){

            return false;

        }


        identity.updatedAt =
            Date.now();


        this.syncEntity(
            identity
        );


        this.emit(
            "identity:permission-revoked",
            {
                identity,

                permission:
                    normalized,

                entityId:
                    identity.entityId,

                time:
                    Date.now()
            }
        );


        return true;

    },


    hasPermission(
        entityOrIdentity,
        permission
    ){

        const identity =
            this.get(
                entityOrIdentity
            );


        const normalized =
            this.normalizeText(
                permission,
                160
            );


        if(
            !identity ||
            !normalized
        ){

            return false;

        }


        return identity.permissions.includes(
            normalized
        );

    },


    /* =====================================================
       ENTITY SYNC
    ===================================================== */

    syncEntity(identity){

        if(
            !identity ||
            !identity.entityId
        ){

            return false;

        }


        const entity =
            this.resolveEntity(
                identity.entityId
            );


        if(entity){

            entity.identity =
                identity;


            if(
                typeof entity.touch ===
                    "function"
            ){

                try{

                    entity.touch();

                } catch(error){

                    entity.updatedAt =
                        Date.now();

                }

            }

            else {

                entity.updatedAt =
                    Date.now();

            }

        }


        this.identities[
            identity.entityId
        ] =
            identity;


        /*
         * Current world compatibility sync.
         */

        try{

            const engine =
                (
                    typeof VAERO !==
                        "undefined"
                        ? VAERO.engine
                        : null
                ) ||
                (
                    typeof window !==
                        "undefined"
                        ? window.Engine
                        : null
                ) ||
                null;


            const world =
                engine?.currentWorld;


            if(
                world &&
                Array.isArray(
                    world.entities
                )
            ){

                const index =
                    world.entities.findIndex(
                        item =>
                            item?.id ===
                                identity.entityId
                    );


                if(
                    index >=
                        0
                ){

                    if(entity){

                        world.entities[
                            index
                        ] =
                            entity;

                    }

                    else {

                        world.entities[
                            index
                        ] = {

                            ...world.entities[
                                index
                            ],

                            identity:{
                                ...identity
                            },

                            updatedAt:
                                Date.now()

                        };

                    }

                }

            }

        } catch(error){

            /* compatibility only */

        }


        try{

            const worldService =
                this.getService(
                    "world"
                );


            if(
                typeof worldService?.save ===
                    "function"
            ){

                worldService.save();

            }

        } catch(error){

            /* persistence may not be ready */

        }


        return true;

    },


    /* =====================================================
       REMOVE CACHE
    ===================================================== */

    remove(entityOrId){

        const identity =
            this.get(
                entityOrId
            );


        if(
            !identity ||
            !identity.entityId
        ){

            return false;

        }


        const entityId =
            identity.entityId;


        if(
            !Object.prototype.hasOwnProperty.call(
                this.identities,
                entityId
            )
        ){

            return false;

        }


        delete this.identities[
            entityId
        ];


        this.emit(
            "identity:removed",
            {
                identity,

                entityId,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       QUERY
    ===================================================== */

    all(options = {}){

        let identities =
            Object.values(
                this.identities
            );


        if(options.visibility){

            const visibility =
                this.normalizeVisibility(
                    options.visibility
                );


            identities =
                identities.filter(
                    identity =>
                        identity.visibility ===
                            visibility
                );

        }


        if(options.status){

            const status =
                this.normalizeStatus(
                    options.status
                );


            identities =
                identities.filter(
                    identity =>
                        identity.status ===
                            status
                );

        }


        if(
            options.verified ===
                true
        ){

            identities =
                identities.filter(
                    identity =>
                        identity.verificationStatus ===
                            "verified"
                );

        }


        if(
            options.pending ===
                true
        ){

            identities =
                identities.filter(
                    identity =>
                        identity.verificationStatus ===
                            "pending"
                );

        }


        if(
            options.rejected ===
                true
        ){

            identities =
                identities.filter(
                    identity =>
                        identity.verificationStatus ===
                            "rejected"
                );

        }


        return [
            ...identities
        ].sort(
            (
                a,
                b
            ) =>
                Number(
                    b.updatedAt
                ) -
                Number(
                    a.updatedAt
                )
        );

    },


    search(query){

        const text =
            String(
                query ??
                    ""
            )
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        if(!text){

            return this.all();

        }


        return this
            .all()
            .filter(
                identity => {

                    const haystack = [

                        identity.name,

                        identity.alias,

                        identity.type,

                        identity.vaId,

                        identity.aeId,

                        identity.eaId,

                        identity.status,

                        identity.verificationStatus,

                        ...(identity.permissions || [])

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLocaleLowerCase(
                            "tr-TR"
                        );


                    return haystack.includes(
                        text
                    );

                }
            );

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const identities =
            this.all();


        return {

            booted:
                this.booted,

            total:
                identities.length,

            active:
                identities.filter(
                    identity =>
                        identity.status ===
                            "active"
                ).length,

            verified:
                identities.filter(
                    identity =>
                        identity.verificationStatus ===
                            "verified"
                ).length,

            pending:
                identities.filter(
                    identity =>
                        identity.verificationStatus ===
                            "pending"
                ).length,

            unverified:
                identities.filter(
                    identity =>
                        identity.verificationStatus ===
                            "unverified"
                ).length,

            rejected:
                identities.filter(
                    identity =>
                        identity.verificationStatus ===
                            "rejected"
                ).length,

            private:
                identities.filter(
                    identity =>
                        identity.visibility ===
                            "private"
                ).length,

            connections:
                identities.filter(
                    identity =>
                        identity.visibility ===
                            "connections"
                ).length,

            engineVisible:
                identities.filter(
                    identity =>
                        identity.visibility ===
                            "engine"
                ).length

        };

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
            "identity",
            Identity
        );

    }

} catch(error){

    console.error(
        "Identity register edilemedi:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.Identity =
        Identity;

}
