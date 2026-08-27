/* =========================================================
   VAERO ENTITY
   Core Entity Model
========================================================= */

class Entity {

    constructor(data = {}){

        const source =
            data &&
            typeof data ===
                "object" &&
            !Array.isArray(
                data
            )
                ? data
                : {};


        this.id =
            Entity.normalizeId(
                source.id
            ) ||
            Entity.createId();


        this.type =
            Entity.normalizeText(
                source.type,
                "entity",
                120
            );


        this.name =
            Entity.normalizeText(
                source.name,
                "İsimsiz Varlık",
                240
            );


        this.description =
            Entity.normalizeText(
                source.description,
                "",
                10000
            );


        this.status =
            Entity.normalizeStatus(
                source.status
            );


        this.tags =
            Entity.normalizeStringArray(
                source.tags
            );


        this.metadata =
            Entity.normalizeObject(
                source.metadata
            );


        this.organs =
            Entity.normalizeOrganList(
                source.organs
            );


        this.bridges =
            Entity.normalizeBridgeList(
                source.bridges
            );


        this.permissions =
            Entity.normalizeStringArray(
                source.permissions
            );


        this.capabilities =
            Entity.normalizeStringArray(
                source.capabilities
            );


        this.identity =
            Entity.normalizeNullableObject(
                source.identity
            );


        this.profile =
            Entity.normalizeProfile(
                source.profile,
                this.identity
            );


        const archived =
            source.archived ===
                true ||
            String(
                source.status ||
                    ""
            )
                .trim()
                .toLowerCase() ===
                    "archived";


        this.archived =
            archived;


        const now =
            Date.now();


        this.createdAt =
            Entity.normalizeTimestamp(
                source.createdAt,
                now
            );


        this.updatedAt =
            Math.max(
                this.createdAt,
                Entity.normalizeTimestamp(
                    source.updatedAt,
                    this.createdAt
                )
            );


        this.archivedAt =
            archived
                ? Entity.normalizeTimestamp(
                    source.archivedAt,
                    this.updatedAt
                )
                : null;


        if(
            this.archived
        ){

            this.status =
                "archived";

        }

    }


    /* =====================================================
       ID
    ===================================================== */

    static createId(){

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


        return `entity_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2,10)}`;

    }


    static normalizeId(value){

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

    }


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    static normalizeText(
        value,
        fallback = "",
        maxLength = 10000
    ){

        const result =
            String(
                value ??
                    fallback
            )
                .trim()
                .slice(
                    0,
                    maxLength
                );


        if(result){

            return result;

        }


        return String(
            fallback ??
                ""
        )
            .trim()
            .slice(
                0,
                maxLength
            );

    }


    static normalizeTimestamp(
        value,
        fallback = null
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

    }


    static normalizeStatus(status){

        const value =
            String(
                status ||
                    "active"
            )
                .trim()
                .toLowerCase();


        const allowed = [

            "active",
            "inactive",
            "paused",
            "disabled",
            "archived",
            "error"

        ];


        return allowed.includes(
            value
        )
            ? value
            : "active";

    }


    static normalizeStringArray(value){

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
                item =>
                    String(
                        item ??
                            ""
                    )
                        .trim()
                        .slice(
                            0,
                            240
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
            );

    }


    /*
     * Legacy compatibility.
     */

    static normalizeArray(value){

        return Entity.normalizeStringArray(
            value
        );

    }


    static normalizeObject(value){

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

    }


    static normalizeNullableObject(value){

        if(
            !value ||
            typeof value !==
                "object" ||
            Array.isArray(
                value
            )
        ){

            return null;

        }


        return {
            ...value
        };

    }


    static normalizeProfile(
        value,
        identity = null
    ){

        if(
            !value ||
            typeof value !==
                "object" ||
            Array.isArray(
                value
            )
        ){

            return null;

        }


        return {

            ...value,

            identity:
                value.identity ||
                identity ||
                null

        };

    }


    static normalizeOrganList(value){

        if(
            !Array.isArray(
                value
            )
        ){

            return [];

        }


        const result =
            [];


        const seen =
            new Set();


        value.forEach(
            organ => {

                if(
                    !organ ||
                    typeof organ !==
                        "object" ||
                    Array.isArray(
                        organ
                    )
                ){

                    return;

                }


                const id =
                    Entity.normalizeId(
                        organ.id
                    );


                const name =
                    Entity.normalizeText(
                        organ.name ||
                        organ.slug,
                        "",
                        200
                    );


                const key =
                    String(
                        id ||
                        name
                    )
                        .trim()
                        .toLocaleLowerCase(
                            "tr-TR"
                        );


                if(
                    !key ||
                    seen.has(
                        key
                    )
                ){

                    return;

                }


                seen.add(
                    key
                );


                result.push(
                    organ
                );

            }
        );


        return result;

    }


    static normalizeBridgeList(value){

        if(
            !Array.isArray(
                value
            )
        ){

            return [];

        }


        const result =
            [];


        const seen =
            new Set();


        value.forEach(
            bridge => {

                if(
                    !bridge ||
                    typeof bridge !==
                        "object" ||
                    Array.isArray(
                        bridge
                    )
                ){

                    return;

                }


                const id =
                    Entity.normalizeId(
                        bridge.id
                    );


                if(
                    !id ||
                    seen.has(
                        id
                    )
                ){

                    return;

                }


                seen.add(
                    id
                );


                result.push(
                    bridge
                );

            }
        );


        return result;

    }


    /* =====================================================
       ORGAN MANAGEMENT
    ===================================================== */

    addOrgan(organ){

        if(
            !organ ||
            typeof organ !==
                "object" ||
            Array.isArray(
                organ
            )
        ){

            return null;

        }


        const organId =
            Entity.normalizeId(
                organ.id
            );


        const organName =
            Entity.normalizeText(
                organ.name ||
                organ.slug,
                "",
                200
            );


        if(
            !organId &&
            !organName
        ){

            return null;

        }


        const existing =
            this.organs.find(
                item => {

                    const itemId =
                        Entity.normalizeId(
                            item?.id
                        );


                    const itemName =
                        Entity.normalizeText(
                            item?.name ||
                            item?.slug,
                            "",
                            200
                        )
                            .toLocaleLowerCase(
                                "tr-TR"
                            );


                    return (
                        (
                            organId &&
                            itemId ===
                                organId
                        ) ||
                        (
                            organName &&
                            itemName ===
                                organName
                                    .toLocaleLowerCase(
                                        "tr-TR"
                                    )
                        )
                    );

                }
            );


        if(existing){

            return existing;

        }


        this.organs.push(
            organ
        );


        this.touch();


        return organ;

    }


    removeOrgan(identifier){

        const target =
            String(
                identifier ??
                    ""
            )
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        if(!target){

            return false;

        }


        const before =
            this.organs.length;


        this.organs =
            this.organs.filter(
                organ => {

                    const id =
                        String(
                            organ?.id ||
                                ""
                        )
                            .trim()
                            .toLocaleLowerCase(
                                "tr-TR"
                            );


                    const name =
                        String(
                            organ?.name ||
                            organ?.slug ||
                                ""
                        )
                            .trim()
                            .toLocaleLowerCase(
                                "tr-TR"
                            );


                    return (
                        id !==
                            target &&
                        name !==
                            target
                    );

                }
            );


        if(
            this.organs.length ===
                before
        ){

            return false;

        }


        this.touch();


        return true;

    }


    getOrgan(identifier){

        const target =
            String(
                identifier ??
                    ""
            )
                .trim()
                .toLocaleLowerCase(
                    "tr-TR"
                );


        if(!target){

            return null;

        }


        return (
            this.organs.find(
                organ => {

                    const id =
                        String(
                            organ?.id ||
                                ""
                        )
                            .trim()
                            .toLocaleLowerCase(
                                "tr-TR"
                            );


                    const name =
                        String(
                            organ?.name ||
                            organ?.slug ||
                                ""
                        )
                            .trim()
                            .toLocaleLowerCase(
                                "tr-TR"
                            );


                    return (
                        id ===
                            target ||
                        name ===
                            target
                    );

                }
            ) ||
            null
        );

    }


    hasOrgan(identifier){

        return Boolean(
            this.getOrgan(
                identifier
            )
        );

    }


    /* =====================================================
       BRIDGE MANAGEMENT
    ===================================================== */

    addBridge(bridge){

        if(
            !bridge ||
            typeof bridge !==
                "object" ||
            Array.isArray(
                bridge
            )
        ){

            return null;

        }


        const id =
            Entity.normalizeId(
                bridge.id
            );


        if(!id){

            return null;

        }


        const index =
            this.bridges.findIndex(
                item =>
                    item?.id ===
                        id
            );


        if(
            index >=
                0
        ){

            const existing =
                this.bridges[
                    index
                ];


            const existingUpdated =
                Number(
                    existing?.updatedAt ||
                    existing?.createdAt ||
                    0
                );


            const incomingUpdated =
                Number(
                    bridge?.updatedAt ||
                    bridge?.createdAt ||
                    0
                );


            if(
                incomingUpdated >
                    existingUpdated
            ){

                this.bridges[
                    index
                ] =
                    bridge;


                this.touch();


                return bridge;

            }


            return existing;

        }


        this.bridges.push(
            bridge
        );


        this.touch();


        return bridge;

    }


    removeBridge(bridgeId){

        const id =
            Entity.normalizeId(
                bridgeId
            );


        if(!id){

            return false;

        }


        const before =
            this.bridges.length;


        this.bridges =
            this.bridges.filter(
                bridge =>
                    bridge?.id !==
                        id
            );


        if(
            this.bridges.length ===
                before
        ){

            return false;

        }


        this.touch();


        return true;

    }


    getBridge(bridgeId){

        const id =
            Entity.normalizeId(
                bridgeId
            );


        if(!id){

            return null;

        }


        return (
            this.bridges.find(
                bridge =>
                    bridge?.id ===
                        id
            ) ||
            null
        );

    }


    hasBridge(bridgeId){

        return Boolean(
            this.getBridge(
                bridgeId
            )
        );

    }


    /* =====================================================
       TAGS
    ===================================================== */

    addTag(tag){

        const value =
            Entity.normalizeText(
                tag,
                "",
                240
            );


        if(!value){

            return false;

        }


        const exists =
            this.tags.some(
                item =>
                    String(
                        item
                    )
                        .toLocaleLowerCase(
                            "tr-TR"
                        ) ===
                    value.toLocaleLowerCase(
                        "tr-TR"
                    )
            );


        if(exists){

            return true;

        }


        this.tags.push(
            value
        );


        this.touch();


        return true;

    }


    removeTag(tag){

        const value =
            Entity.normalizeText(
                tag,
                "",
                240
            );


        if(!value){

            return false;

        }


        const target =
            value.toLocaleLowerCase(
                "tr-TR"
            );


        const next =
            this.tags.filter(
                item =>
                    String(
                        item
                    )
                        .toLocaleLowerCase(
                            "tr-TR"
                        ) !==
                    target
            );


        if(
            next.length ===
                this.tags.length
        ){

            return false;

        }


        this.tags =
            next;


        this.touch();


        return true;

    }


    /* =====================================================
       PERMISSIONS
    ===================================================== */

    hasPermission(permission){

        const value =
            Entity.normalizeText(
                permission,
                "",
                240
            );


        if(!value){

            return false;

        }


        const target =
            value.toLocaleLowerCase(
                "tr-TR"
            );


        return this.permissions.some(
            item =>
                String(
                    item
                )
                    .toLocaleLowerCase(
                        "tr-TR"
                    ) ===
                target
        );

    }


    grantPermission(permission){

        const value =
            Entity.normalizeText(
                permission,
                "",
                240
            );


        if(!value){

            return false;

        }


        if(
            this.hasPermission(
                value
            )
        ){

            return true;

        }


        this.permissions.push(
            value
        );


        this.touch();


        return true;

    }


    revokePermission(permission){

        const value =
            Entity.normalizeText(
                permission,
                "",
                240
            );


        if(!value){

            return false;

        }


        const target =
            value.toLocaleLowerCase(
                "tr-TR"
            );


        const next =
            this.permissions.filter(
                item =>
                    String(
                        item
                    )
                        .toLocaleLowerCase(
                            "tr-TR"
                        ) !==
                    target
            );


        if(
            next.length ===
                this.permissions.length
        ){

            return false;

        }


        this.permissions =
            next;


        this.touch();


        return true;

    }


    /* =====================================================
       CAPABILITIES
    ===================================================== */

    hasCapability(capability){

        const value =
            Entity.normalizeText(
                capability,
                "",
                240
            );


        if(!value){

            return false;

        }


        const target =
            value.toLocaleLowerCase(
                "tr-TR"
            );


        return this.capabilities.some(
            item =>
                String(
                    item
                )
                    .toLocaleLowerCase(
                        "tr-TR"
                    ) ===
                target
        );

    }


    grantCapability(capability){

        const value =
            Entity.normalizeText(
                capability,
                "",
                240
            );


        if(!value){

            return false;

        }


        if(
            this.hasCapability(
                value
            )
        ){

            return true;

        }


        this.capabilities.push(
            value
        );


        this.touch();


        return true;

    }


    revokeCapability(capability){

        const value =
            Entity.normalizeText(
                capability,
                "",
                240
            );


        if(!value){

            return false;

        }


        const target =
            value.toLocaleLowerCase(
                "tr-TR"
            );


        const next =
            this.capabilities.filter(
                item =>
                    String(
                        item
                    )
                        .toLocaleLowerCase(
                            "tr-TR"
                        ) !==
                    target
            );


        if(
            next.length ===
                this.capabilities.length
        ){

            return false;

        }


        this.capabilities =
            next;


        this.touch();


        return true;

    }


    /* =====================================================
       IDENTITY
    ===================================================== */

    setIdentity(identity){

        if(identity === null){

            this.identity =
                null;


            if(
                this.profile &&
                this.profile.identity
            ){

                this.profile = {

                    ...this.profile,

                    identity:
                        null

                };

            }


            this.touch();


            return true;

        }


        const normalized =
            Entity.normalizeNullableObject(
                identity
            );


        if(!normalized){

            return false;

        }


        this.identity =
            normalized;


        if(this.profile){

            this.profile = {

                ...this.profile,

                identity:
                    this.identity

            };

        }


        this.touch();


        return true;

    }


    setProfile(profile){

        if(profile === null){

            this.profile =
                null;


            this.touch();


            return true;

        }


        const normalized =
            Entity.normalizeProfile(
                profile,
                this.identity
            );


        if(!normalized){

            return false;

        }


        this.profile =
            normalized;


        this.touch();


        return true;

    }


    /* =====================================================
       UPDATE
    ===================================================== */

    update(data = {}){

        if(
            !data ||
            typeof data !==
                "object" ||
            Array.isArray(
                data
            )
        ){

            return this;

        }


        if(
            data.name !==
                undefined
        ){

            const name =
                Entity.normalizeText(
                    data.name,
                    "",
                    240
                );


            if(name){

                this.name =
                    name;

            }

        }


        if(
            data.description !==
                undefined
        ){

            this.description =
                Entity.normalizeText(
                    data.description,
                    "",
                    10000
                );

        }


        if(
            data.status !==
                undefined &&
            this.archived !==
                true
        ){

            const status =
                Entity.normalizeStatus(
                    data.status
                );


            if(
                status !==
                    "archived"
            ){

                this.status =
                    status;

            }

        }


        if(
            Array.isArray(
                data.tags
            )
        ){

            this.tags =
                Entity.normalizeStringArray(
                    data.tags
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

            this.metadata = {

                ...this.metadata,

                ...data.metadata

            };

        }


        if(
            Array.isArray(
                data.permissions
            )
        ){

            this.permissions =
                Entity.normalizeStringArray(
                    data.permissions
                );

        }


        if(
            Array.isArray(
                data.capabilities
            )
        ){

            this.capabilities =
                Entity.normalizeStringArray(
                    data.capabilities
                );

        }


        if(
            Array.isArray(
                data.organs
            )
        ){

            this.organs =
                Entity.normalizeOrganList(
                    data.organs
                );

        }


        if(
            Array.isArray(
                data.bridges
            )
        ){

            this.bridges =
                Entity.normalizeBridgeList(
                    data.bridges
                );

        }


        if(
            Object.prototype.hasOwnProperty.call(
                data,
                "identity"
            )
        ){

            if(
                data.identity ===
                    null
            ){

                this.identity =
                    null;

            }

            else {

                const identity =
                    Entity.normalizeNullableObject(
                        data.identity
                    );


                if(identity){

                    this.identity =
                        identity;

                }

            }

        }


        if(
            Object.prototype.hasOwnProperty.call(
                data,
                "profile"
            )
        ){

            if(
                data.profile ===
                    null
            ){

                this.profile =
                    null;

            }

            else {

                const profile =
                    Entity.normalizeProfile(
                        data.profile,
                        this.identity
                    );


                if(profile){

                    this.profile =
                        profile;

                }

            }

        }


        /*
         * Keep Profile's embedded identity reference
         * aligned with the Entity Identity snapshot.
         */

        if(
            this.profile
        ){

            this.profile = {

                ...this.profile,

                identity:
                    this.identity ||
                    this.profile.identity ||
                    null

            };

        }


        this.touch();


        return this;

    }


    /* =====================================================
       ARCHIVE
    ===================================================== */

    archive(){

        if(
            this.archived
        ){

            return true;

        }


        this.archived =
            true;


        this.archivedAt =
            Date.now();


        this.status =
            "archived";


        this.touch();


        return true;

    }


    restore(status = "active"){

        if(
            !this.archived
        ){

            return true;

        }


        this.archived =
            false;


        this.archivedAt =
            null;


        const nextStatus =
            Entity.normalizeStatus(
                status
            );


        this.status =
            nextStatus ===
                "archived"
                ? "active"
                : nextStatus;


        this.touch();


        return true;

    }


    /* =====================================================
       TIMESTAMP
    ===================================================== */

    touch(){

        const now =
            Date.now();


        this.updatedAt =
            Math.max(
                now,
                Number(
                    this.createdAt
                ) ||
                now
            );


        return this.updatedAt;

    }


    /* =====================================================
       STATE
    ===================================================== */

    isActive(){

        return (
            this.archived !==
                true &&
            this.status ===
                "active"
        );

    }


    isArchived(){

        return (
            this.archived ===
                true
        );

    }


    /* =====================================================
       VALIDATION
    ===================================================== */

    validate(){

        const issues =
            [];


        if(
            !Entity.normalizeId(
                this.id
            )
        ){

            issues.push(
                "entity-id-missing"
            );

        }


        if(
            !Entity.normalizeText(
                this.type,
                "",
                120
            )
        ){

            issues.push(
                "entity-type-missing"
            );

        }


        if(
            !Entity.normalizeText(
                this.name,
                "",
                240
            )
        ){

            issues.push(
                "entity-name-missing"
            );

        }


        if(
            !Array.isArray(
                this.organs
            )
        ){

            issues.push(
                "entity-organs-invalid"
            );

        }


        if(
            !Array.isArray(
                this.bridges
            )
        ){

            issues.push(
                "entity-bridges-invalid"
            );

        }


        if(
            !Array.isArray(
                this.permissions
            )
        ){

            issues.push(
                "entity-permissions-invalid"
            );

        }


        if(
            !Array.isArray(
                this.capabilities
            )
        ){

            issues.push(
                "entity-capabilities-invalid"
            );

        }


        if(
            this.archived ===
                true &&
            this.status !==
                "archived"
        ){

            issues.push(
                "entity-archive-state-inconsistent"
            );

        }


        return {

            valid:
                issues.length ===
                    0,

            issues,

            entityId:
                this.id,

            checkedAt:
                Date.now()

        };

    }


    /* =====================================================
       SERIALIZATION
    ===================================================== */

    toJSON(){

        return {

            id:
                this.id,

            type:
                this.type,

            name:
                this.name,

            description:
                this.description,

            status:
                this.status,

            tags:[
                ...this.tags
            ],

            metadata:{
                ...this.metadata
            },

            organs:[
                ...this.organs
            ],

            bridges:[
                ...this.bridges
            ],

            permissions:[
                ...this.permissions
            ],

            capabilities:[
                ...this.capabilities
            ],

            identity:
                this.identity
                    ? {
                        ...this.identity
                    }
                    : null,

            profile:
                this.profile
                    ? {
                        ...this.profile,

                        identity:
                            this.profile.identity
                                ? {
                                    ...this.profile.identity
                                }
                                : null
                    }
                    : null,

            archived:
                this.archived,

            archivedAt:
                this.archivedAt,

            createdAt:
                this.createdAt,

            updatedAt:
                this.updatedAt

        };

    }


    snapshot(){

        return this.toJSON();

    }

}


/* =========================================================
   GLOBAL
========================================================= */

if(
    typeof window !==
        "undefined"
){

    window.Entity =
        Entity;

}
