/* =========================================================
   VAERO IDENTITY CORE
   Entity Identity / Identifier / Verification Policy
========================================================= */

const Identity = {

    booted:
        false,

    identities:{},


    /* =====================================================
       SAFE ACCESS
    ===================================================== */

    getService(name){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !== "function"
            ){
                return null;
            }


            return (
                VAERO.get(name) ||
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

        try{

            if(
                typeof VAERO !== "undefined" &&
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


            events?.emit?.(
                eventName,
                payload
            );


            return true;

        } catch(error){

            console.warn(
                `Identity event gönderilemedi: ${eventName}`,
                error
            );


            return false;

        }

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
                .toUpperCase();


        let randomPart =
            "";


        if(
            typeof crypto !== "undefined" &&
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


    normalizePermissions(value){

        if(
            !Array.isArray(
                value
            )
        ){
            return [];
        }


        return [
            ...new Set(
                value
                    .map(
                        permission =>
                            String(
                                permission ||
                                ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ];

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

        const now =
            Date.now();


        /*
         * Legacy compatibility:
         * verified:true -> verificationStatus:"verified"
         */

        let verificationStatus =
            identity.verificationStatus;


        if(
            !verificationStatus &&
            identity.verified === true
        ){

            verificationStatus =
                "verified";

        }


        verificationStatus =
            this.normalizeVerification(
                verificationStatus
            );


        const vaId =
            String(
                identity.vaId ||
                identity.vaID ||
                (
                    String(
                        identity.id ||
                        ""
                    ).startsWith(
                        "VA-"
                    )
                        ? identity.id
                        : ""
                ) ||
                ""
            ).trim();


        return {

            id:
                String(
                    identity.id ||
                    entity?.id ||
                    ""
                ).trim(),

            entityId:
                String(
                    identity.entityId ||
                    entity?.id ||
                    identity.id ||
                    ""
                ).trim(),

            type:
                String(
                    identity.type ||
                    entity?.type ||
                    "entity"
                ).trim(),

            name:
                String(
                    identity.name ||
                    entity?.name ||
                    "İsimsiz Varlık"
                ).trim(),

            vaId:
                vaId ||
                this.createIdentifier(
                    "VA"
                ),

            aeId:
                String(
                    identity.aeId ||
                    identity.aeID ||
                    ""
                ).trim(),

            eaId:
                String(
                    identity.eaId ||
                    identity.eaID ||
                    ""
                ).trim(),

            alias:
                String(
                    identity.alias ||
                    ""
                ).trim(),

            visibility:
                this.normalizeVisibility(
                    identity.visibility
                ),

            verificationStatus,

            /*
             * Legacy read compatibility.
             * Authoritative field verificationStatus'tur.
             */

            verified:
                verificationStatus ===
                "verified",

            verificationRequestedAt:
                Number(
                    identity.verificationRequestedAt
                ) ||
                null,

            verifiedAt:
                verificationStatus ===
                    "verified"
                    ? (
                        Number(
                            identity.verifiedAt
                        ) ||
                        now
                    )
                    : null,

            rejectedAt:
                verificationStatus ===
                    "rejected"
                    ? (
                        Number(
                            identity.rejectedAt
                        ) ||
                        null
                    )
                    : null,

            issuer:
                String(
                    identity.issuer ||
                    ""
                ).trim(),

            verificationMethod:
                String(
                    identity.verificationMethod ||
                    ""
                ).trim(),

            verificationReference:
                String(
                    identity.verificationReference ||
                    ""
                ).trim(),

            status:
                String(
                    identity.status ||
                    "active"
                )
                    .trim()
                    .toLowerCase(),

            permissions:
                this.normalizePermissions(
                    identity.permissions
                ),

            metadata:
                this.normalizeMetadata(
                    identity.metadata
                ),

            createdAt:
                Number(
                    identity.createdAt ||
                    entity?.createdAt
                ) ||
                now,

            updatedAt:
                Number(
                    identity.updatedAt
                ) ||
                now

        };

    },


    /* =====================================================
       BOOT
    ===================================================== */

    boot(){

        if(this.booted){
            return true;
        }


        const manager =
            this.getService(
                "entityManager"
            );


        if(
            manager &&
            typeof manager.all ===
                "function"
        ){

            try{

                const entities =
                    manager.all({
                        includeArchived:true
                    }) ||
                    [];


                entities.forEach(
                    entity => {

                        if(entity){

                            this.create(
                                entity
                            );

                        }

                    }
                );

            } catch(error){

                console.warn(
                    "Identity boot Entity taraması başarısız:",
                    error
                );

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
            !entity.id
        ){
            return null;
        }


        const identity =
            this.normalizeIdentity(
                entity.identity ||
                {},
                entity
            );


        entity.identity =
            identity;


        this.identities[
            entity.id
        ] = identity;


        return identity;

    },


    hydrate(
        entity,
        data = {}
    ){

        if(
            !entity ||
            !entity.id
        ){
            return null;
        }


        const identity =
            this.normalizeIdentity(
                data,
                entity
            );


        entity.identity =
            identity;


        this.identities[
            entity.id
        ] = identity;


        return identity;

    },


    /* =====================================================
       RESOLVE
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

                const identity =
                    this.normalizeIdentity(
                        entityOrId.identity,
                        entityOrId
                    );


                entityOrId.identity =
                    identity;


                if(entityOrId.id){

                    this.identities[
                        entityOrId.id
                    ] = identity;

                }


                return identity;

            }


            if(entityOrId.id){

                return this.create(
                    entityOrId
                );

            }


            return null;

        }


        const id =
            String(
                entityOrId
            ).trim();


        if(!id){
            return null;
        }


        if(
            this.identities[id]
        ){

            return this.identities[
                id
            ];

        }


        const manager =
            this.getService(
                "entityManager"
            );


        try{

            const entity =
                manager?.get?.(
                    id
                );


            if(entity){

                return this.create(
                    entity
                );

            }

        } catch(error){

            /* fallback */
        }


        return null;

    },


    findByVAID(vaId){

        const id =
            String(
                vaId ||
                ""
            )
                .trim()
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
         * vaId / verificationStatus / verified fields
         * generic update üzerinden değiştirilemez.
         */

        if(
            changes.alias !==
                undefined
        ){

            identity.alias =
                String(
                    changes.alias ||
                    ""
                ).trim();

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
                String(
                    changes.aeId ||
                    ""
                ).trim();

        }


        if(
            changes.eaId !==
                undefined
        ){

            identity.eaId =
                String(
                    changes.eaId ||
                    ""
                ).trim();

        }


        if(
            changes.status !==
                undefined
        ){

            identity.status =
                String(
                    changes.status ||
                    "active"
                )
                    .trim()
                    .toLowerCase();

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
                "verified"
        ){
            return identity;
        }


        if(
            identity.verificationStatus ===
                "pending"
        ){
            return identity;
        }


        identity.verificationStatus =
            "pending";

        identity.verified =
            false;

        identity.verificationRequestedAt =
            Date.now();

        identity.rejectedAt =
            null;

        identity.updatedAt =
            Date.now();


        identity.metadata = {
            ...identity.metadata,

            verificationRequest:{
                source:
                    String(
                        context.source ||
                        "identity"
                    ),

                requestedAt:
                    identity.verificationRequestedAt
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
                    Date.now()
            }
        );


        return identity;

    },


    /* =====================================================
       VERIFIER
       Production authority boundary.

       Direct frontend call:
       Identity.verify(identity)
       NO LONGER self-verifies.
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


        /*
         * Verification must contain a result produced by
         * Identity Verifier / backend adapter.
         *
         * Frontend boolean alone is deliberately rejected.
         */

        if(
            !verification ||
            typeof verification !==
                "object" ||
            Array.isArray(
                verification
            ) ||
            verification.valid !==
                true ||
            !verification.issuer ||
            !verification.reference
        ){

            console.warn(
                "Identity doğrulanmadı: güvenilir verifier sonucu gerekli."
            );


            /*
             * Legacy callers do not gain verification.
             * If appropriate, create pending state instead.
             */

            if(
                identity.verificationStatus ===
                    "unverified"
            ){

                this.requestVerification(
                    identity,
                    {
                        source:
                            "legacy-verify-call"
                    }
                );

            }


            return null;

        }


        /*
         * applicationVerifier gibi gerçek cryptographic /
         * backend verification daha sonra burada enforce
         * edilecek. Şimdilik explicit verifier-result
         * contract kullanıyoruz.
         */

        identity.verificationStatus =
            "verified";

        identity.verified =
            true;

        identity.verifiedAt =
            Date.now();

        identity.rejectedAt =
            null;

        identity.issuer =
            String(
                verification.issuer
            ).trim();

        identity.verificationMethod =
            String(
                verification.method ||
                "external-verifier"
            ).trim();

        identity.verificationReference =
            String(
                verification.reference
            ).trim();

        identity.updatedAt =
            Date.now();


        this.syncEntity(
            identity
        );


        this.emit(
            "identity:verified",
            identity
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
            !result.issuer
        ){

            return null;

        }


        identity.verificationStatus =
            "rejected";

        identity.verified =
            false;

        identity.verifiedAt =
            null;

        identity.rejectedAt =
            Date.now();

        identity.issuer =
            String(
                result.issuer
            ).trim();

        identity.verificationReference =
            String(
                result.reference ||
                ""
            ).trim();

        identity.updatedAt =
            Date.now();


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
                time:
                    Date.now()
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
            String(
                permission ||
                ""
            ).trim();


        if(
            !identity ||
            !normalized
        ){
            return false;
        }


        if(
            !identity.permissions.includes(
                normalized
            )
        ){

            identity.permissions.push(
                normalized
            );

            identity.permissions =
                this.normalizePermissions(
                    identity.permissions
                );


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

        }


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
            String(
                permission ||
                ""
            ).trim();


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
            String(
                permission ||
                ""
            ).trim();


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


        const manager =
            this.getService(
                "entityManager"
            );


        let entity =
            null;


        try{

            entity =
                manager?.get?.(
                    identity.entityId
                ) ||
                null;

        } catch(error){

            entity =
                null;

        }


        if(entity){

            entity.identity =
                identity;


            if(
                typeof entity.touch ===
                    "function"
            ){

                entity.touch();

            } else {

                entity.updatedAt =
                    Date.now();

            }

        }


        this.identities[
            identity.entityId
        ] = identity;


        const engine =
            (
                typeof VAERO !==
                    "undefined"
                    ? VAERO.engine
                    : null
            ) ||
            window.Engine ||
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


            if(index >= 0){

                if(entity){

                    world.entities[
                        index
                    ] = entity;

                } else {

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


        try{

            this.getService(
                "world"
            )?.save?.();

        } catch(error){

            /* persistence layer may not be ready */
        }


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


        return [
            ...identities
        ];

    },


    search(query){

        const text =
            String(
                query ||
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

                        identity.verificationStatus,

                        ...(identity.permissions || [])

                    ]
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
                ).length

        };

    }

};


VAERO.register(
    "identity",
    Identity
);


window.Identity =
    Identity;
