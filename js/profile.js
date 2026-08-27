/* =========================================================
   VAERO PROFILE CORE
   Entity Presentation / Discovery / Social Profile Layer
========================================================= */

const Profile = {

    profiles:
        {},

    booted:
        false,


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
                `Profile event gönderilemedi: ${name}`,
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
                `Profile event fallback gönderilemedi: ${name}`,
                error
            );

        }


        return false;

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
        fallback = Date.now()
    ){

        const timestamp =
            Number(
                value
            );


        return (
            Number.isFinite(
                timestamp
            ) &&
            timestamp >
                0
        )
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


    normalizeList(value){

        let source;


        if(
            Array.isArray(
                value
            )
        ){

            source =
                value;

        }

        else if(
            value instanceof Set
        ){

            source =
                [
                    ...value
                ];

        }

        else {

            source =
                String(
                    value ??
                    ""
                )
                    .split(",");

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
                        .slice(
                            0,
                            120
                        )
            )
            .filter(
                item => {

                    if(!item){

                        return false;

                    }


                    const key =
                        item.toLocaleLowerCase(
                            "tr-TR"
                        );


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
            )
            .slice(
                0,
                100
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


    normalizeProfile(
        profile = {},
        entity = null
    ){

        const source =
            profile &&
            typeof profile ===
                "object" &&
            !Array.isArray(
                profile
            )
                ? profile
                : {};


        const now =
            Date.now();


        const entityId =
            this.normalizeId(
                source.entityId ||
                entity?.id ||
                source.id
            );


        const profileId =
            this.normalizeId(
                source.id ||
                entityId
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


        return {

            id:
                profileId ||
                entityId ||
                "",

            entityId:
                entityId ||
                profileId ||
                "",

            displayName:
                this.normalizeText(
                    source.displayName ||
                    source.name ||
                    entity?.name ||
                    "İsimsiz Varlık",
                    240
                ) ||
                "İsimsiz Varlık",

            headline:
                this.normalizeText(
                    source.headline,
                    300
                ),

            bio:
                this.normalizeText(
                    source.bio ||
                    source.about ||
                    source.description ||
                    entity?.description,
                    5000
                ),

            location:
                this.normalizeText(
                    source.location,
                    300
                ),

            website:
                this.normalizeText(
                    source.website,
                    1000
                ),

            interests:
                this.normalizeList(
                    source.interests
                ),

            skills:
                this.normalizeList(
                    source.skills
                ),

            languages:
                this.normalizeList(
                    source.languages
                ),

            visibility:
                this.normalizeVisibility(
                    source.visibility
                ),

            discoverable:
                source.discoverable !==
                    false,

            showEvolution:
                source.showEvolution !==
                    false,

            showConnections:
                source.showConnections !==
                    false,

            status:
                this.normalizeStatus(
                    source.status ||
                    entity?.status
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
                        "Profile boot Entity taraması başarısız:",
                        error
                    );

                }

            }

        }


        this.booted =
            true;


        this.emit(
            "profile:ready",
            {
                count:
                    Object.keys(
                        this.profiles
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
            this.profiles[
                entity.id
            ] ||
            null;


        const profile =
            this.normalizeProfile(
                {
                    ...(existing || {}),
                    ...(entity.profile || {})
                },
                entity
            );


        entity.profile =
            profile;


        this.profiles[
            entity.id
        ] =
            profile;


        return profile;

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
            this.profiles[
                entity.id
            ] ||
            {};


        const safeData =
            data &&
            typeof data ===
                "object" &&
            !Array.isArray(
                data
            )
                ? data
                : {};


        const profile =
            this.normalizeProfile(
                {
                    ...existing,
                    ...safeData
                },
                entity
            );


        entity.profile =
            profile;


        this.profiles[
            entity.id
        ] =
            profile;


        return profile;

    },


    /* =====================================================
       ENTITY RESOLUTION
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
                entityOrId.profile
            ){

                const existing =
                    entityOrId.id
                        ? this.profiles[
                            entityOrId.id
                        ]
                        : null;


                const profile =
                    this.normalizeProfile(
                        {
                            ...(existing || {}),
                            ...entityOrId.profile
                        },
                        entityOrId
                    );


                entityOrId.profile =
                    profile;


                if(
                    entityOrId.id
                ){

                    this.profiles[
                        entityOrId.id
                    ] =
                        profile;

                }


                return profile;

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
            this.profiles[
                id
            ]
        ){

            return this.profiles[
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


    /* =====================================================
       UPDATE
    ===================================================== */

    update(
        entityOrProfile,
        data = {}
    ){

        const profile =
            this.get(
                entityOrProfile
            );


        if(
            !profile ||
            !data ||
            typeof data !==
                "object" ||
            Array.isArray(
                data
            )
        ){

            return null;

        }


        const before = {

            ...profile,

            interests:[
                ...(profile.interests || [])
            ],

            skills:[
                ...(profile.skills || [])
            ],

            languages:[
                ...(profile.languages || [])
            ],

            metadata:{
                ...(profile.metadata || {})
            }

        };


        if(
            data.displayName !==
                undefined ||
            data.name !==
                undefined
        ){

            const displayName =
                this.normalizeText(
                    data.displayName ??
                    data.name,
                    240
                );


            if(displayName){

                profile.displayName =
                    displayName;

            }

        }


        if(
            data.headline !==
                undefined
        ){

            profile.headline =
                this.normalizeText(
                    data.headline,
                    300
                );

        }


        if(
            data.bio !==
                undefined ||
            data.description !==
                undefined
        ){

            profile.bio =
                this.normalizeText(
                    data.bio ??
                    data.description,
                    5000
                );

        }


        if(
            data.location !==
                undefined
        ){

            profile.location =
                this.normalizeText(
                    data.location,
                    300
                );

        }


        if(
            data.website !==
                undefined
        ){

            profile.website =
                this.normalizeText(
                    data.website,
                    1000
                );

        }


        if(
            data.interests !==
                undefined
        ){

            profile.interests =
                this.normalizeList(
                    data.interests
                );

        }


        if(
            data.skills !==
                undefined
        ){

            profile.skills =
                this.normalizeList(
                    data.skills
                );

        }


        if(
            data.languages !==
                undefined
        ){

            profile.languages =
                this.normalizeList(
                    data.languages
                );

        }


        if(
            data.visibility !==
                undefined
        ){

            profile.visibility =
                this.normalizeVisibility(
                    data.visibility
                );

        }


        if(
            data.discoverable !==
                undefined
        ){

            profile.discoverable =
                Boolean(
                    data.discoverable
                );

        }


        if(
            data.showEvolution !==
                undefined
        ){

            profile.showEvolution =
                Boolean(
                    data.showEvolution
                );

        }


        if(
            data.showConnections !==
                undefined
        ){

            profile.showConnections =
                Boolean(
                    data.showConnections
                );

        }


        if(
            data.status !==
                undefined
        ){

            profile.status =
                this.normalizeStatus(
                    data.status
                );

        }


        if(
            data.metadata &&
            typeof data.metadata ===
                "object" &&
            !Array.isArray(
                data.metadata
            )
        ){

            profile.metadata = {

                ...profile.metadata,

                ...data.metadata

            };

        }


        profile.updatedAt =
            Date.now();


        this.syncEntity(
            profile
        );


        this.emit(
            "profile:updated",
            {
                profile,

                before,

                entityId:
                    profile.entityId,

                time:
                    Date.now()
            }
        );


        return profile;

    },


    /* =====================================================
       VISIBILITY
    ===================================================== */

    setVisibility(
        entityOrProfile,
        visibility
    ){

        return this.update(
            entityOrProfile,
            {
                visibility
            }
        );

    },


    setDiscoverable(
        entityOrProfile,
        enabled
    ){

        return this.update(
            entityOrProfile,
            {
                discoverable:
                    Boolean(
                        enabled
                    )
            }
        );

    },


    setEvolutionVisibility(
        entityOrProfile,
        enabled
    ){

        return this.update(
            entityOrProfile,
            {
                showEvolution:
                    Boolean(
                        enabled
                    )
            }
        );

    },


    setConnectionsVisibility(
        entityOrProfile,
        enabled
    ){

        return this.update(
            entityOrProfile,
            {
                showConnections:
                    Boolean(
                        enabled
                    )
            }
        );

    },


    /* =====================================================
       LIST MANAGEMENT
    ===================================================== */

    addInterest(
        entityOrProfile,
        interest
    ){

        const profile =
            this.get(
                entityOrProfile
            );


        const value =
            this.normalizeText(
                interest,
                120
            );


        if(
            !profile ||
            !value
        ){

            return null;

        }


        return this.update(
            profile,
            {
                interests:[
                    ...profile.interests,
                    value
                ]
            }
        );

    },


    removeInterest(
        entityOrProfile,
        interest
    ){

        const profile =
            this.get(
                entityOrProfile
            );


        const value =
            this.normalizeText(
                interest,
                120
            );


        if(
            !profile ||
            !value
        ){

            return null;

        }


        const key =
            value.toLocaleLowerCase(
                "tr-TR"
            );


        return this.update(
            profile,
            {
                interests:
                    profile.interests.filter(
                        item =>
                            item.toLocaleLowerCase(
                                "tr-TR"
                            ) !==
                            key
                    )
            }
        );

    },


    addSkill(
        entityOrProfile,
        skill
    ){

        const profile =
            this.get(
                entityOrProfile
            );


        const value =
            this.normalizeText(
                skill,
                120
            );


        if(
            !profile ||
            !value
        ){

            return null;

        }


        return this.update(
            profile,
            {
                skills:[
                    ...profile.skills,
                    value
                ]
            }
        );

    },


    removeSkill(
        entityOrProfile,
        skill
    ){

        const profile =
            this.get(
                entityOrProfile
            );


        const value =
            this.normalizeText(
                skill,
                120
            );


        if(
            !profile ||
            !value
        ){

            return null;

        }


        const key =
            value.toLocaleLowerCase(
                "tr-TR"
            );


        return this.update(
            profile,
            {
                skills:
                    profile.skills.filter(
                        item =>
                            item.toLocaleLowerCase(
                                "tr-TR"
                            ) !==
                            key
                    )
            }
        );

    },


    addLanguage(
        entityOrProfile,
        language
    ){

        const profile =
            this.get(
                entityOrProfile
            );


        const value =
            this.normalizeText(
                language,
                120
            );


        if(
            !profile ||
            !value
        ){

            return null;

        }


        return this.update(
            profile,
            {
                languages:[
                    ...profile.languages,
                    value
                ]
            }
        );

    },


    removeLanguage(
        entityOrProfile,
        language
    ){

        const profile =
            this.get(
                entityOrProfile
            );


        const value =
            this.normalizeText(
                language,
                120
            );


        if(
            !profile ||
            !value
        ){

            return null;

        }


        const key =
            value.toLocaleLowerCase(
                "tr-TR"
            );


        return this.update(
            profile,
            {
                languages:
                    profile.languages.filter(
                        item =>
                            item.toLocaleLowerCase(
                                "tr-TR"
                            ) !==
                            key
                    )
            }
        );

    },


    /* =====================================================
       PROFILE STRUCTURE VALIDATION

       This validates Profile data structure.
       It is NOT Identity verification.
    ===================================================== */

    verify(profileOrEntity){

        const profile =
            this.get(
                profileOrEntity
            );


        if(!profile){

            return false;

        }


        return Boolean(
            profile.id &&
            profile.entityId &&
            profile.displayName &&
            profile.id ===
                profile.entityId
        );

    },


    /* =====================================================
       IDENTITY RESOLUTION
    ===================================================== */

    getIdentity(profileOrEntity){

        const profile =
            this.get(
                profileOrEntity
            );


        if(
            !profile ||
            !profile.entityId
        ){

            return null;

        }


        const identity =
            this.getService(
                "identity"
            );


        if(
            !identity ||
            typeof identity.get !==
                "function"
        ){

            return null;

        }


        try{

            return (
                identity.get(
                    profile.entityId
                ) ||
                null
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       CONNECTION / EVOLUTION RESOLUTION
    ===================================================== */

    getConnections(
        profileOrEntity,
        options = {}
    ){

        const profile =
            this.get(
                profileOrEntity
            );


        if(
            !profile ||
            !profile.entityId ||
            profile.showConnections !==
                true
        ){

            return [];

        }


        const bridge =
            this.getService(
                "bridge"
            );


        if(
            !bridge ||
            typeof bridge.forEntity !==
                "function"
        ){

            return [];

        }


        try{

            return (
                bridge.forEntity(
                    profile.entityId,
                    options
                ) ||
                []
            );

        } catch(error){

            return [];

        }

    },


    getEvolution(
        profileOrEntity,
        options = {}
    ){

        const profile =
            this.get(
                profileOrEntity
            );


        if(
            !profile ||
            !profile.entityId ||
            profile.showEvolution !==
                true
        ){

            return [];

        }


        const evolution =
            this.getService(
                "evolution"
            );


        if(
            !evolution ||
            typeof evolution.forEntity !==
                "function"
        ){

            return [];

        }


        try{

            return (
                evolution.forEntity(
                    profile.entityId,
                    options
                ) ||
                []
            );

        } catch(error){

            return [];

        }

    },


    /* =====================================================
       ENTITY SYNC
    ===================================================== */

    syncEntity(profile){

        if(
            !profile ||
            !profile.entityId
        ){

            return false;

        }


        const entity =
            this.resolveEntity(
                profile.entityId
            );


        if(entity){

            entity.profile =
                profile;


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


        this.profiles[
            profile.entityId
        ] =
            profile;


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
                                profile.entityId
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

                            profile:{
                                ...profile
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

            /* persistence layer may not be ready */

        }


        return true;

    },


    /* =====================================================
       REMOVE CACHE
    ===================================================== */

    remove(entityOrId){

        const profile =
            this.get(
                entityOrId
            );


        if(
            !profile ||
            !profile.entityId
        ){

            return false;

        }


        const entityId =
            profile.entityId;


        if(
            !Object.prototype.hasOwnProperty.call(
                this.profiles,
                entityId
            )
        ){

            return false;

        }


        delete this.profiles[
            entityId
        ];


        this.emit(
            "profile:removed",
            {
                profile,

                entityId,

                time:
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       DISCOVERY POLICY
    ===================================================== */

    canDiscover(profileOrEntity){

        const profile =
            this.get(
                profileOrEntity
            );


        if(!profile){

            return false;

        }


        return Boolean(
            profile.status ===
                "active" &&
            profile.discoverable ===
                true &&
            profile.visibility !==
                "private"
        );

    },


    discoverable(options = {}){

        return this
            .all({
                ...options,

                discoverable:
                    true
            })
            .filter(
                profile =>
                    this.canDiscover(
                        profile
                    )
            );

    },


    /* =====================================================
       QUERY
    ===================================================== */

    all(options = {}){

        let profiles =
            Object.values(
                this.profiles
            );


        if(options.visibility){

            const visibility =
                this.normalizeVisibility(
                    options.visibility
                );


            profiles =
                profiles.filter(
                    profile =>
                        profile.visibility ===
                            visibility
                );

        }


        if(
            options.discoverable ===
                true
        ){

            profiles =
                profiles.filter(
                    profile =>
                        profile.discoverable ===
                            true
                );

        }


        if(
            options.discoverable ===
                false
        ){

            profiles =
                profiles.filter(
                    profile =>
                        profile.discoverable !==
                            true
                );

        }


        if(options.status){

            const status =
                this.normalizeStatus(
                    options.status
                );


            profiles =
                profiles.filter(
                    profile =>
                        profile.status ===
                            status
                );

        }


        return [
            ...profiles
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


    search(
        query,
        options = {}
    ){

        const text =
            String(
                query ??
                    ""
            )
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        const profiles =
            this.all(
                options
            );


        if(!text){

            return profiles;

        }


        return profiles.filter(
            profile => {

                const haystack = [

                    profile.displayName,

                    profile.headline,

                    profile.bio,

                    profile.location,

                    profile.website,

                    ...(profile.interests || []),

                    ...(profile.skills || []),

                    ...(profile.languages || [])

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
       PROFILE SUMMARY
    ===================================================== */

    summary(entityOrProfile){

        const profile =
            this.get(
                entityOrProfile
            );


        if(!profile){

            return null;

        }


        const identity =
            this.getIdentity(
                profile
            );


        return {

            entityId:
                profile.entityId,

            displayName:
                profile.displayName,

            headline:
                profile.headline,

            location:
                profile.location,

            visibility:
                profile.visibility,

            discoverable:
                profile.discoverable,

            showEvolution:
                profile.showEvolution,

            showConnections:
                profile.showConnections,

            interests:[
                ...profile.interests
            ],

            skills:[
                ...profile.skills
            ],

            languages:[
                ...profile.languages
            ],

            identity:
                identity
                    ? {
                        vaId:
                            identity.vaId ||
                            null,

                        verificationStatus:
                            identity.verificationStatus ||
                            "unverified"
                    }
                    : null

        };

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const profiles =
            this.all();


        return {

            booted:
                this.booted,

            total:
                profiles.length,

            active:
                profiles.filter(
                    profile =>
                        profile.status ===
                            "active"
                ).length,

            discoverable:
                profiles.filter(
                    profile =>
                        this.canDiscover(
                            profile
                        )
                ).length,

            private:
                profiles.filter(
                    profile =>
                        profile.visibility ===
                            "private"
                ).length,

            connections:
                profiles.filter(
                    profile =>
                        profile.visibility ===
                            "connections"
                ).length,

            engineVisible:
                profiles.filter(
                    profile =>
                        profile.visibility ===
                            "engine"
                ).length,

            evolutionVisible:
                profiles.filter(
                    profile =>
                        profile.showEvolution ===
                            true
                ).length,

            connectionsVisible:
                profiles.filter(
                    profile =>
                        profile.showConnections ===
                            true
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
            "profile",
            Profile
        );

    }

} catch(error){

    console.error(
        "Profile register edilemedi:",
        error
    );

}


if(
    typeof window !==
        "undefined"
){

    window.Profile =
        Profile;

}
