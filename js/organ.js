/* =========================================================
   VAERO ORGAN SYSTEM
   Engine Organ / Application Registry
========================================================= */

const OrganSystem = {

    organs: new Map(),

    allowedStatuses: new Set([
        "active",
        "inactive",
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
                typeof VAERO.get !== "function"
            ){
                return null;
            }

            return VAERO.get(name) || null;

        } catch(error){

            console.warn(
                `OrganSystem service lookup failed: ${name}`,
                error
            );

            return null;

        }

    },


    /* =====================================================
       ID
    ===================================================== */

    createId(prefix = "organ"){

        if(
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID ===
                "function"
        ){
            return crypto.randomUUID();
        }

        return `${prefix}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeName(name){

        return String(
            name ?? ""
        ).trim();

    },


    normalizeStatus(status){

        const normalized =
            String(
                status ?? "active"
            )
                .trim()
                .toLowerCase();


        return this.allowedStatuses.has(
            normalized
        )
            ? normalized
            : "inactive";

    },


    normalizePermissions(
        permissions
    ){

        if(
            !Array.isArray(
                permissions
            )
        ){
            return [];
        }


        return [
            ...new Set(
                permissions
                    .map(
                        item =>
                            String(
                                item ?? ""
                            )
                                .trim()
                                .toLowerCase()
                    )
                    .filter(Boolean)
            )
        ];

    },


    normalizeMeta(meta){

        if(
            !meta ||
            typeof meta !== "object" ||
            Array.isArray(meta)
        ){
            return {};
        }


        return {
            ...meta
        };

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


        const organ = {

            id:
                safeMeta.id ||
                this.createId(),

            name:
                organName,

            slug:
                String(
                    safeMeta.slug ||
                    organName
                )
                    .trim()
                    .toLowerCase()
                    .replace(/\s+/g, "-"),

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
                ),

            source:
                String(
                    safeMeta.source ||
                    "system"
                ),

            installed:
                safeMeta.installed !==
                false,

            permissions:
                this.normalizePermissions(
                    safeMeta.permissions
                ),

            capabilities:
                this.normalizePermissions(
                    safeMeta.capabilities
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

            meta:
                safeMeta,

            createdAt:
                Date.now(),

            updatedAt:
                Date.now()

        };


        const guardian =
            this.getService(
                "guardian"
            );


        if(
            guardian &&
            typeof guardian.check ===
                "function"
        ){

            const validation =
                guardian.check(
                    organ,
                    "organ",
                    {
                        operation:
                            "create"
                    }
                );


            if(
                validation &&
                validation.valid ===
                    false
            ){

                console.warn(
                    "Guardian organ oluşturmayı engelledi.",
                    validation.failures
                );

                return null;

            }

        }


        this.organs.set(
            organ.id,
            organ
        );


        this.emit(
            "organ:created",
            organ
        );


        return organ;

    },


    /* =====================================================
       LOOKUP
    ===================================================== */

    get(id){

        return (
            this.organs.get(
                String(
                    id ?? ""
                )
            ) ||
            null
        );

    },


    findBySlug(slug){

        const target =
            String(
                slug ?? ""
            )
                .trim()
                .toLowerCase();


        if(!target){
            return null;
        }


        return (
            this.all().find(
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
                id ?? ""
            )
        );

    },


    all(){

        return [
            ...this.organs.values()
        ];

    },


    installed(){

        return this.all().filter(
            organ =>
                organ.installed
        );

    },


    active(){

        return this.all().filter(
            organ =>
                organ.installed &&
                organ.status ===
                    "active"
        );

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


        organ.status =
            nextStatus;


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:status",
            {
                id:
                    organ.id,

                status:
                    nextStatus
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


        organ.installed =
            true;


        if(
            organ.status ===
            "inactive"
        ){

            organ.status =
                "active";

        }


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:installed",
            organ
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


        /*
         * System organları son kullanıcı tarafından
         * kaldırılamaz.
         */

        if(
            organ.source ===
                "system" &&
            organ.meta?.removable !==
                true
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
            organ
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
                permission ?? ""
            )
                .trim()
                .toLowerCase();


        return organ.permissions.includes(
            target
        );

    },


    grantPermission(
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
                permission ?? ""
            )
                .trim()
                .toLowerCase();


        if(!target){
            return false;
        }


        /*
         * Bu fonksiyon registry seviyesinde permission
         * kaydeder.
         *
         * Gerçek kullanıcı onayı / policy kontrolü
         * Applications + Brain Action Policy + backend
         * katmanında yapılmalıdır.
         */

        if(
            !organ.permissions.includes(
                target
            )
        ){

            organ.permissions.push(
                target
            );

        }


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:permission:granted",
            {
                organId:
                    organ.id,

                permission:
                    target
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


        if(!organ){
            return false;
        }


        const target =
            String(
                permission ?? ""
            )
                .trim()
                .toLowerCase();


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
                    target
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
            Array.isArray(patch)
        ){
            return false;
        }


        /*
         * Kimlik ve güvenlik alanları rastgele
         * overwrite edilmez.
         */

        if(
            patch.name !==
            undefined
        ){

            const name =
                this.normalizeName(
                    patch.name
                );


            if(name){
                organ.name = name;
            }

        }


        if(
            patch.status !==
            undefined
        ){

            organ.status =
                this.normalizeStatus(
                    patch.status
                );

        }


        if(
            patch.version !==
            undefined
        ){

            organ.version =
                String(
                    patch.version
                );

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

        }


        organ.updatedAt =
            Date.now();


        this.emit(
            "organ:updated",
            organ
        );


        return organ;

    },


    /* =====================================================
       EVENTS
    ===================================================== */

    emit(
        eventName,
        payload
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
       STATUS
    ===================================================== */

    report(){

        const organs =
            this.all();


        return {

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

            disabled:
                organs.filter(
                    organ =>
                        organ.status ===
                            "disabled"
                ).length,

            trusted:
                organs.filter(
                    organ =>
                        organ.trusted
                ).length

        };

    }

};


VAERO.register(
    "organSystem",
    OrganSystem
);


window.OrganSystem =
    OrganSystem;
