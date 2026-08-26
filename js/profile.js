/* =========================================================
   VAERO PROFILE CORE
   Entity Presentation / Discovery / Social Profile Layer
========================================================= */

const Profile = {

    profiles:{},

    booted:
        false,


    /* =====================================================
       SAFE ACCESS
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
                `Profile event gönderilemedi: ${eventName}`,
                error
            );


            return false;

        }

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
                                    item ?? ""
                                ).trim()
                        )
                        .filter(Boolean)
                )
            ];

        }


        return [
            ...new Set(
                String(
                    value ||
                    ""
                )
                    .split(",")
                    .map(
                        item =>
                            item.trim()
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


    normalizeProfile(
        profile = {},
        entity = null
    ){

        const now =
            Date.now();


        return {

            id:
                String(
                    profile.id ||
                    entity?.id ||
                    ""
                ).trim(),

            entityId:
                String(
                    profile.entityId ||
                    entity?.id ||
                    profile.id ||
                    ""
                ).trim(),

            displayName:
                String(
                    profile.displayName ||
                    profile.name ||
                    entity?.name ||
                    "İsimsiz Varlık"
                ).trim(),

            headline:
                String(
                    profile.headline ||
                    ""
                ).trim(),

            bio:
                String(
                    profile.bio ||
                    profile.about ||
                    profile.description ||
                    entity?.description ||
                    ""
                ).trim(),

            location:
                String(
                    profile.location ||
                    ""
                ).trim(),

            website:
                String(
                    profile.website ||
                    ""
                ).trim(),

            interests:
                this.normalizeList(
                    profile.interests
                ),

            skills:
                this.normalizeList(
                    profile.skills
                ),

            languages:
                this.normalizeList(
                    profile.languages
                ),

            visibility:
                this.normalizeVisibility(
                    profile.visibility
                ),

            discoverable:
                profile.discoverable !==
                    false,

            showEvolution:
                profile.showEvolution !==
                    false,

            showConnections:
                profile.showConnections !==
                    false,

            status:
                String(
                    profile.status ||
                    entity?.status ||
                    "active"
                )
                    .trim()
                    .toLowerCase(),

            metadata:
                this.normalizeMetadata(
                    profile.metadata
                ),

            createdAt:
                Number(
                    profile.createdAt ||
                    entity?.createdAt
                ) ||
                now,

            updatedAt:
                Number(
                    profile.updatedAt
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
                    "Profile boot Entity taraması başarısız:",
                    error
                );

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
            !entity.id
        ){
            return null;
        }


        const profile =
            this.normalizeProfile(
                entity.profile ||
                {},
                entity
            );


        entity.profile =
            profile;


        this.profiles[
            entity.id
        ] = profile;


        return profile;

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


        const profile =
            this.normalizeProfile(
                data,
                entity
            );


        entity.profile =
            profile;


        this.profiles[
            entity.id
        ] = profile;


        return profile;

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
                entityOrId.profile
            ){

                const profile =
                    this.normalizeProfile(
                        entityOrId.profile,
                        entityOrId
                    );


                entityOrId.profile =
                    profile;


                if(entityOrId.id){

                    this.profiles[
                        entityOrId.id
                    ] = profile;

                }


                return profile;

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
            this.profiles[id]
        ){

            return this.profiles[
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
                String(
                    data.displayName ??
                    data.name ??
                    ""
                ).trim();


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
                String(
                    data.headline ||
                    ""
                ).trim();

        }


        if(
            data.bio !==
                undefined ||
            data.description !==
                undefined
        ){

            profile.bio =
                String(
                    data.bio ??
                    data.description ??
                    ""
                ).trim();

        }


        if(
            data.location !==
                undefined
        ){

            profile.location =
                String(
                    data.location ||
                    ""
                ).trim();

        }


        if(
            data.website !==
                undefined
        ){

            profile.website =
                String(
                    data.website ||
                    ""
                ).trim();

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
                String(
                    data.status ||
                    "active"
                )
                    .trim()
                    .toLowerCase();

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
            String(
                interest ||
                ""
            ).trim();


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
            String(
                interest ||
                ""
            ).trim();


        if(
            !profile ||
            !value
        ){
            return null;
        }


        return this.update(
            profile,
            {
                interests:
                    profile.interests.filter(
                        item =>
                            item !==
                            value
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
            String(
                skill ||
                ""
            ).trim();


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
            String(
                skill ||
                ""
            ).trim();


        if(
            !profile ||
            !value
        ){
            return null;
        }


        return this.update(
            profile,
            {
                skills:
                    profile.skills.filter(
                        item =>
                            item !==
                            value
                    )
            }
        );

    },


    /* =====================================================
       VERIFY PROFILE STRUCTURE
       This is data integrity, NOT identity verification.
    ===================================================== */

    verify(profile){

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
       ENTITY SYNC
    ===================================================== */

    syncEntity(profile){

        if(
            !profile ||
            !profile.entityId
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
                    profile.entityId
                ) ||
                null;

        } catch(error){

            entity =
                null;

        }


        if(entity){

            entity.profile =
                profile;


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


        this.profiles[
            profile.entityId
        ] = profile;


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
                        profile.entityId
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

                        profile:{
                            ...profile
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


        if(options.status){

            const status =
                String(
                    options.status
                )
                    .trim()
                    .toLowerCase();


            profiles =
                profiles.filter(
                    profile =>
                        profile.status ===
                        status
                );

        }


        return [
            ...profiles
        ];

    },


    discoverable(){

        return this.all({
            discoverable:true
        });

    },


    search(
        query,
        options = {}
    ){

        const text =
            String(
                query ||
                ""
            )
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        let profiles =
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

            interests:[
                ...profile.interests
            ],

            skills:[
                ...profile.skills
            ]

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

            discoverable:
                profiles.filter(
                    profile =>
                        profile.discoverable ===
                        true
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
                ).length

        };

    }

};


VAERO.register(
    "profile",
    Profile
);


window.Profile =
    Profile;
