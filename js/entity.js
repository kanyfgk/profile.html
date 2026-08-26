/* =========================================================
   VAERO ENTITY
   Core Entity Model
========================================================= */

class Entity {

    constructor(data = {}){

        this.id =
            data.id ||
            Entity.createId();


        this.type =
            Entity.normalizeText(
                data.type,
                "entity"
            );


        this.name =
            Entity.normalizeText(
                data.name,
                "İsimsiz Varlık"
            );


        this.description =
            Entity.normalizeText(
                data.description,
                ""
            );


        this.status =
            Entity.normalizeStatus(
                data.status
            );


        this.tags =
            Entity.normalizeArray(
                data.tags
            );


        this.metadata =
            Entity.normalizeObject(
                data.metadata
            );


        this.organs =
            Array.isArray(
                data.organs
            )
                ? [
                    ...data.organs
                ]
                : [];


        this.bridges =
            Array.isArray(
                data.bridges
            )
                ? [
                    ...data.bridges
                ]
                : [];


        this.permissions =
            Entity.normalizeArray(
                data.permissions
            );


        this.capabilities =
            Entity.normalizeArray(
                data.capabilities
            );


        this.identity =
            data.identity &&
            typeof data.identity ===
                "object" &&
            !Array.isArray(
                data.identity
            )
                ? {
                    ...data.identity
                }
                : null;


        this.profile =
            data.profile &&
            typeof data.profile ===
                "object" &&
            !Array.isArray(
                data.profile
            )
                ? {
                    ...data.profile,

                    identity:
                        data.profile.identity ||
                        this.identity
                }
                : null;


        this.archived =
            data.archived ===
            true;


        this.archivedAt =
            Number(
                data.archivedAt
            ) ||
            null;


        this.createdAt =
            Number(
                data.createdAt
            ) ||
            Date.now();


        this.updatedAt =
            Number(
                data.updatedAt
            ) ||
            this.createdAt;

    }


    /* =====================================================
       ID
    ===================================================== */

    static createId(){

        if(
            typeof crypto !==
                "undefined" &&
            typeof crypto.randomUUID ===
                "function"
        ){

            return crypto.randomUUID();

        }


        return `entity_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;

    }


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    static normalizeText(
        value,
        fallback = ""
    ){

        const result =
            String(
                value ??
                fallback
            ).trim();


        return result ||
            String(
                fallback
            ).trim();

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


    static normalizeArray(value){

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
                        item =>
                            String(
                                item ??
                                ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ];

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


    /* =====================================================
       ORGAN MANAGEMENT
    ===================================================== */

    addOrgan(organ){

        if(
            !organ ||
            typeof organ !==
                "object" ||
            !organ.name
        ){
            return null;
        }


        const organName =
            String(
                organ.name
            )
                .trim()
                .toLowerCase();


        const existing =
            this.organs.find(
                item =>
                    String(
                        item?.name ||
                        ""
                    )
                        .trim()
                        .toLowerCase() ===
                    organName
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
                .toLowerCase();


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
                            .toLowerCase();


                    const name =
                        String(
                            organ?.name ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    return (
                        id !== target &&
                        name !== target
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
                .toLowerCase();


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
                            .toLowerCase();


                    const name =
                        String(
                            organ?.name ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    return (
                        id === target ||
                        name === target
                    );

                }
            ) ||
            null
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
            !bridge.id
        ){
            return null;
        }


        const existing =
            this.bridges.find(
                item =>
                    item?.id ===
                    bridge.id
            );


        if(existing){
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
            String(
                bridgeId ??
                ""
            ).trim();


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
            String(
                bridgeId ??
                ""
            ).trim();


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


    /* =====================================================
       TAGS
    ===================================================== */

    addTag(tag){

        const value =
            String(
                tag ??
                ""
            ).trim();


        if(!value){
            return false;
        }


        if(
            this.tags.includes(
                value
            )
        ){
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
            String(
                tag ??
                ""
            ).trim();


        if(!value){
            return false;
        }


        const next =
            this.tags.filter(
                item =>
                    item !==
                    value
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
            String(
                permission ??
                ""
            ).trim();


        if(!value){
            return false;
        }


        return this.permissions.includes(
            value
        );

    }


    grantPermission(permission){

        const value =
            String(
                permission ??
                ""
            ).trim();


        if(!value){
            return false;
        }


        if(
            !this.permissions.includes(
                value
            )
        ){

            this.permissions.push(
                value
            );


            this.touch();

        }


        return true;

    }


    revokePermission(permission){

        const value =
            String(
                permission ??
                ""
            ).trim();


        if(!value){
            return false;
        }


        const next =
            this.permissions.filter(
                item =>
                    item !==
                    value
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
            String(
                capability ??
                ""
            ).trim();


        if(!value){
            return false;
        }


        return this.capabilities.includes(
            value
        );

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
            typeof data.name ===
                "string" &&
            data.name.trim()
        ){

            this.name =
                data.name.trim();

        }


        if(
            typeof data.description ===
                "string"
        ){

            this.description =
                data.description.trim();

        }


        if(
            typeof data.status ===
                "string"
        ){

            this.status =
                Entity.normalizeStatus(
                    data.status
                );

        }


        if(
            Array.isArray(
                data.tags
            )
        ){

            this.tags =
                Entity.normalizeArray(
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
                Entity.normalizeArray(
                    data.permissions
                );

        }


        if(
            Array.isArray(
                data.capabilities
            )
        ){

            this.capabilities =
                Entity.normalizeArray(
                    data.capabilities
                );

        }


        this.touch();


        return this;

    }


    /* =====================================================
       ARCHIVE
    ===================================================== */

    archive(){

        if(this.archived){
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


    restore(){

        if(!this.archived){
            return true;
        }


        this.archived =
            false;


        this.archivedAt =
            null;


        if(
            this.status ===
            "archived"
        ){

            this.status =
                "active";

        }


        this.touch();


        return true;

    }


    /* =====================================================
       TIMESTAMP
    ===================================================== */

    touch(){

        this.updatedAt =
            Date.now();


        return this.updatedAt;

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
                        ...this.profile
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

}


/* =========================================================
   GLOBAL
========================================================= */

window.Entity =
    Entity;
