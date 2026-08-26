/* =========================================================
   VAERO BRAIN ACTION POLICY
   Permission / Confirmation / Execution Boundary
========================================================= */

const BrainActionPolicy = {

    /* =====================================================
       LEVELS
    ===================================================== */

    levels: {

        SAFE:
            "safe",

        CONFIRM:
            "confirm",

        BLOCKED:
            "blocked"

    },


    /* =====================================================
       ACTION RULES
    ===================================================== */

    rules: {

        /* -------------------------------------------------
           SAFE
           Okuma / gezinme / lokal ve geri alınabilir durum
        ------------------------------------------------- */

        "app:open":
            "safe",

        "view:change":
            "safe",

        "filter:apply":
            "safe",

        "search:run":
            "safe",

        "record:read":
            "safe",

        "catalog:read":
            "safe",

        "status:read":
            "safe",

        "draft:create":
            "safe",

        "draft:update":
            "safe",

        "session:save":
            "safe",

        "resume:save":
            "safe",

        "resume:restore":
            "safe",

        "brain:context":
            "safe",


        /* -------------------------------------------------
           CONFIRM
           Kalıcı veya kullanıcı durumunu değiştiren işlemler
        ------------------------------------------------- */

        "world:create":
            "confirm",

        "world:update":
            "confirm",

        "world:archive":
            "confirm",

        "world:restore":
            "confirm",

        "world:delete":
            "confirm",

        "entity:create":
            "confirm",

        "entity:update":
            "confirm",

        "entity:archive":
            "confirm",

        "entity:restore":
            "confirm",

        "entity:delete":
            "confirm",

        "field:update":
            "confirm",

        "profile:update":
            "confirm",

        "identity:update":
            "confirm",

        "identity:verification:request":
            "confirm",

        "bridge:create":
            "confirm",

        "bridge:update":
            "confirm",

        "bridge:archive":
            "confirm",

        "bridge:restore":
            "confirm",

        "bridge:delete":
            "confirm",

        "memory:create":
            "confirm",

        "memory:update":
            "confirm",

        "memory:archive":
            "confirm",

        "memory:restore":
            "confirm",

        "memory:delete":
            "confirm",

        "evolution:create":
            "confirm",

        "evolution:update":
            "confirm",

        "evolution:archive":
            "confirm",

        "evolution:restore":
            "confirm",

        "evolution:delete":
            "confirm",

        "settings:update":
            "confirm",

        "application:install":
            "confirm",

        "application:update":
            "confirm",

        "application:remove":
            "confirm",

        "permission:grant":
            "confirm",

        "permission:revoke":
            "confirm",

        "notification:update":
            "confirm",

        "content:publish":
            "confirm",

        "message:send":
            "confirm",

        "call:start":
            "confirm",

        "screen-share:start":
            "confirm",

        "record:restore":
            "confirm",

        "record:delete":
            "confirm",

        "form:submit":
            "confirm",

        "purchase:intent":
            "confirm",


        /* -------------------------------------------------
           BLOCKED
           Brain hiçbir şekilde doğrudan otorite olamaz
        ------------------------------------------------- */

        "payment:execute":
            "blocked",

        "purchase:complete":
            "blocked",

        "refund:execute":
            "blocked",

        "settlement:execute":
            "blocked",

        "identity:verify":
            "blocked",

        "identity:transfer":
            "blocked",

        "ownership:change":
            "blocked",

        "credential:export":
            "blocked",

        "credential:read":
            "blocked",

        "security:disable":
            "blocked",

        "security:bypass":
            "blocked",

        "guardian:disable":
            "blocked",

        "permission:force":
            "blocked",

        "trust:force":
            "blocked",

        "application:trust":
            "blocked"

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeActionType(actionType){

        return String(
            actionType ?? ""
        )
            .trim()
            .toLowerCase();

    },


    normalizeValue(value){

        return String(
            value ?? ""
        )
            .trim()
            .toLowerCase();

    },


    /* =====================================================
       RULE LOOKUP
    ===================================================== */

    check(actionType){

        const normalizedType =
            this.normalizeActionType(
                actionType
            );


        /*
         * Bilinmeyen mutation güvenli kabul edilmez.
         *
         * Default CONFIRM.
         */

        if(!normalizedType){

            return this.levels
                .CONFIRM;

        }


        return (
            this.rules[
                normalizedType
            ] ||
            this.levels.CONFIRM
        );

    },


    canExecute(actionType){

        return (
            this.check(
                actionType
            ) ===
            this.levels.SAFE
        );

    },


    needsConfirmation(actionType){

        return (
            this.check(
                actionType
            ) ===
            this.levels.CONFIRM
        );

    },


    isBlocked(actionType){

        return (
            this.check(
                actionType
            ) ===
            this.levels.BLOCKED
        );

    },


    /* =====================================================
       TARGET HELPERS
    ===================================================== */

    normalizeTarget(target){

        const value =
            this.normalizeValue(
                target
            );


        const aliases = {

            worlds:
                "world",

            dunya:
                "world",

            dunyalar:
                "world",

            entities:
                "entity",

            varlik:
                "entity",

            varliklar:
                "entity",

            profile:
                "profile",

            profil:
                "profile",

            identity:
                "identity",

            kimlik:
                "identity",

            memory:
                "memory",

            hafiza:
                "memory",

            timeline:
                "timeline",

            bridge:
                "bridge",

            kopru:
                "bridge",

            evolution:
                "evolution",

            evrim:
                "evolution",

            settings:
                "settings",

            ayarlar:
                "settings",

            applications:
                "application",

            application:
                "application",

            app:
                "application",

            uygulama:
                "application",

            uygulamalar:
                "application",

            notification:
                "notification",

            notifications:
                "notification",

            message:
                "message",

            messages:
                "message",

            call:
                "call"

        };


        return (
            aliases[value] ||
            value ||
            null
        );

    },


    /* =====================================================
       CRUD RESOLUTION
    ===================================================== */

    resolveCrudAction(
        target,
        operation
    ){

        const normalizedTarget =
            this.normalizeTarget(
                target
            );


        const normalizedOperation =
            this.normalizeValue(
                operation
            );


        if(
            !normalizedTarget ||
            !normalizedOperation
        ){
            return null;
        }


        const supportedTargets =
            new Set([
                "world",
                "entity",
                "profile",
                "identity",
                "memory",
                "bridge",
                "evolution",
                "settings",
                "application",
                "notification"
            ]);


        if(
            !supportedTargets.has(
                normalizedTarget
            )
        ){
            return null;
        }


        if(
            normalizedOperation === "create"
        ){

            if(
                normalizedTarget ===
                    "profile" ||
                normalizedTarget ===
                    "identity" ||
                normalizedTarget ===
                    "settings" ||
                normalizedTarget ===
                    "notification"
            ){

                return `${normalizedTarget}:update`;

            }


            if(
                normalizedTarget ===
                    "application"
            ){

                return "application:install";

            }


            return `${normalizedTarget}:create`;

        }


        if(
            normalizedOperation === "edit" ||
            normalizedOperation === "update"
        ){

            return `${normalizedTarget}:update`;

        }


        if(
            normalizedOperation === "archive"
        ){

            return `${normalizedTarget}:archive`;

        }


        if(
            normalizedOperation === "restore"
        ){

            return `${normalizedTarget}:restore`;

        }


        if(
            normalizedOperation === "delete" ||
            normalizedOperation === "remove"
        ){

            if(
                normalizedTarget ===
                    "application"
            ){

                return "application:remove";

            }


            return `${normalizedTarget}:delete`;

        }


        if(
            normalizedOperation === "install" &&
            normalizedTarget ===
                "application"
        ){

            return "application:install";

        }


        return null;

    },


    /* =====================================================
       INTENT → ACTION
    ===================================================== */

    resolveIntentAction(intent){

        if(
            !intent ||
            typeof intent !==
                "object"
        ){
            return null;
        }


        const type =
            this.normalizeValue(
                intent.type
            );


        const operation =
            this.normalizeValue(
                intent.operation
            );


        const target =
            this.normalizeTarget(
                intent.target
            );


        /* -------------------------------------------------
           NAVIGATION
        ------------------------------------------------- */

        if(
            type === "navigate"
        ){

            return "app:open";

        }


        /* -------------------------------------------------
           RESUME
        ------------------------------------------------- */

        if(
            type === "resume:save"
        ){

            return "resume:save";

        }


        if(
            type === "resume:restore"
        ){

            return "resume:restore";

        }


        /* -------------------------------------------------
           CREATE

           BrainActions şu an create intentinde gerçek kaydı
           doğrudan oluşturmuyor; create yüzeyini açıyor.
           Bu davranış değişirse BrainActions actionType
           bildirmelidir.
        ------------------------------------------------- */

        if(
            type === "create"
        ){

            if(
                target === "world" ||
                target === "entity"
            ){

                return "app:open";

            }


            return this.resolveCrudAction(
                target,
                "create"
            );

        }


        /* -------------------------------------------------
           EXPLICIT APPLICATION INTENTS
        ------------------------------------------------- */

        if(
            type === "application:install"
        ){

            return "application:install";

        }


        if(
            type === "application:update"
        ){

            return "application:update";

        }


        if(
            type === "application:remove"
        ){

            return "application:remove";

        }


        /* -------------------------------------------------
           PERMISSIONS
        ------------------------------------------------- */

        if(
            type === "permission:grant"
        ){

            return "permission:grant";

        }


        if(
            type === "permission:revoke"
        ){

            return "permission:revoke";

        }


        /* -------------------------------------------------
           MESSAGING / CALLS
        ------------------------------------------------- */

        if(
            type === "message:send"
        ){

            return "message:send";

        }


        if(
            type === "call:start"
        ){

            return "call:start";

        }


        if(
            type === "screen-share:start"
        ){

            return "screen-share:start";

        }


        /* -------------------------------------------------
           REQUEST
        ------------------------------------------------- */

        if(
            type === "request"
        ){

            if(
                operation === "search"
            ){

                return "search:run";

            }


            if(
                operation === "open" ||
                operation === "view" ||
                operation === "read"
            ){

                return target
                    ? "app:open"
                    : "record:read";

            }


            /*
             * EDIT şu an BrainActions tarafından sadece
             * edit yüzeyine yönlendirilirse safe olabilir.
             *
             * Intent açık şekilde "field:update" üretirse
             * aşağıdaki CONFIRM katmanına geçer.
             */

            if(
                operation === "edit"
            ){

                return target
                    ? "app:open"
                    : null;

            }


            const crudAction =
                this.resolveCrudAction(
                    target,
                    operation
                );


            if(crudAction){

                return crudAction;

            }


            if(
                operation === "publish"
            ){

                return "content:publish";

            }


            if(
                operation === "submit"
            ){

                return "form:submit";

            }

        }


        /* -------------------------------------------------
           EXPLICIT MUTATION INTENT
        ------------------------------------------------- */

        if(
            type === "field:update"
        ){

            return "field:update";

        }


        if(
            type === "profile:update"
        ){

            return "profile:update";

        }


        if(
            type === "settings:update"
        ){

            return "settings:update";

        }


        if(
            type === "memory:create"
        ){

            return "memory:create";

        }


        if(
            type === "evolution:create"
        ){

            return "evolution:create";

        }


        /*
         * chat / question / clarify gibi tipler
         * sistem aksiyonu değildir.
         */

        return null;

    },

   /* =====================================================
       CONTEXT BOUNDARIES
    ===================================================== */

    evaluateContextBoundary(
        actionType,
        intent,
        context
    ){

        const engine =
            (
                typeof VAERO !==
                    "undefined"
                    ? VAERO.engine
                    : null
            ) ||
            window.Engine ||
            null;


        const currentEntityId =
            context?.entity?.id ||
            context?.entityId ||
            engine?.currentOpenedEntity?.id ||
            engine?.currentEntity?.id ||
            null;


        const currentWorldId =
            context?.world?.id ||
            context?.worldId ||
            engine?.currentWorld?.id ||
            null;


        const targetEntityId =
            intent?.entityId ||
            intent?.targetEntityId ||
            null;


        const targetWorldId =
            intent?.worldId ||
            intent?.targetWorldId ||
            null;


        /*
         * Intent açıkça başka bir Entity/World üzerinde
         * mutation istiyorsa, Brain bunu sessizce yapmaz.
         */

        const mutation =
            ![
                "app:open",
                "view:change",
                "filter:apply",
                "search:run",
                "record:read",
                "catalog:read",
                "status:read",
                "session:save",
                "resume:save",
                "resume:restore",
                "brain:context"
            ].includes(
                actionType
            );


        if(
            mutation &&
            targetEntityId &&
            currentEntityId &&
            String(
                targetEntityId
            ) !==
            String(
                currentEntityId
            )
        ){

            return {

                valid:false,

                reason:
                    "İşlem farklı bir Entity bağlamını hedefliyor."

            };

        }


        if(
            mutation &&
            targetWorldId &&
            currentWorldId &&
            String(
                targetWorldId
            ) !==
            String(
                currentWorldId
            )
        ){

            return {

                valid:false,

                reason:
                    "İşlem farklı bir World bağlamını hedefliyor."

            };

        }


        return {

            valid:true,

            reason:null

        };

    },


    /* =====================================================
       RAW ACTION EVALUATION
    ===================================================== */

    evaluate(action){

        const safeAction =
            action &&
            typeof action === "object"
                ? action
                : {};


        const actionType =
            this.normalizeActionType(
                safeAction.type
            );


        const permission =
            this.check(
                actionType
            );


        const blocked =
            permission ===
            this.levels.BLOCKED;


        const requiresConfirmation =
            permission ===
            this.levels.CONFIRM;


        return {

            allowed:
                !blocked,

            requiresConfirmation,

            blocked,

            permission,

            actionType:
                actionType ||
                null,

            action:
                safeAction

        };

    },


    /* =====================================================
       INTENT EVALUATION
    ===================================================== */

    evaluateIntent(
        intent,
        context = {}
    ){

        const actionType =
            this.resolveIntentAction(
                intent
            );


        if(!actionType){

            return {

                allowed:false,

                requiresConfirmation:false,

                blocked:false,

                permission:null,

                actionType:null,

                intent,

                context,

                executable:false,

                reason:
                    "Bu intent için sistem işlemi tanımlı değil."

            };

        }


        const result =
            this.evaluate({

                type:
                    actionType,

                intent,

                context

            });


        const boundary =
            this.evaluateContextBoundary(
                actionType,
                intent,
                context
            );


        if(
            boundary.valid !==
                true
        ){

            return {

                ...result,

                allowed:false,

                blocked:false,

                requiresConfirmation:false,

                actionType,

                intent,

                context,

                executable:false,

                reason:
                    boundary.reason ||
                    "İşlem mevcut Engine bağlamı dışında."

            };

        }


        let reason =
            null;


        if(
            result.blocked
        ){

            reason =
                this.getBlockedReason(
                    actionType
                );

        }
        else if(
            result.requiresConfirmation
        ){

            reason =
                this.getConfirmationReason(
                    actionType
                );

        }


        return {

            ...result,

            actionType,

            intent,

            context,

            executable:
                true,

            reason

        };

    },


    /* =====================================================
       POLICY REASONS
    ===================================================== */

    getConfirmationReason(
        actionType
    ){

        const reasons = {

            "world:create":
                "Yeni World oluşturmak kalıcı sistem durumu yaratır.",

            "world:update":
                "World bilgileri değiştirilecek.",

            "world:archive":
                "World arşivlenecek.",

            "world:restore":
                "Arşivlenmiş World geri getirilecek.",

            "world:delete":
                "World silme işlemi kalıcı veri etkisi oluşturabilir.",

            "entity:create":
                "Yeni Entity oluşturulacak.",

            "entity:update":
                "Entity bilgileri değiştirilecek.",

            "entity:archive":
                "Entity arşivlenecek.",

            "entity:restore":
                "Arşivlenmiş Entity geri getirilecek.",

            "entity:delete":
                "Entity silme işlemi kalıcı veri etkisi oluşturabilir.",

            "profile:update":
                "Profil bilgilerin değiştirilecek.",

            "identity:update":
                "Kimlik verileri değiştirilecek.",

            "identity:verification:request":
                "Kimlik doğrulama talebi başlatılacak.",

            "bridge:create":
                "Yeni bir bağlantı oluşturulacak.",

            "bridge:update":
                "Bağlantı bilgileri değiştirilecek.",

            "bridge:delete":
                "Bağlantı kaydı silinecek.",

            "memory:create":
                "Yeni hafıza kaydı oluşturulacak.",

            "memory:update":
                "Hafıza kaydı değiştirilecek.",

            "memory:delete":
                "Hafıza kaydı silinecek.",

            "evolution:create":
                "Yeni Evolution kaydı oluşturulacak.",

            "evolution:update":
                "Evolution kaydı değiştirilecek.",

            "evolution:delete":
                "Evolution kaydı silinecek.",

            "settings:update":
                "Engine tercihlerin değiştirilecek.",

            "application:install":
                "Uygulama Engine içine kurulacak.",

            "application:update":
                "Kurulu uygulama güncellenecek.",

            "application:remove":
                "Kurulu uygulama kaldırılacak.",

            "permission:grant":
                "Bir uygulama veya organ yeni bir sistem izni alacak.",

            "permission:revoke":
                "Mevcut sistem izni kaldırılacak.",

            "message:send":
                "Mesaj dış kullanıcıya gönderilecek.",

            "call:start":
                "Sesli veya görüntülü iletişim başlatılacak.",

            "screen-share:start":
                "Ekran paylaşımı başlatılacak.",

            "content:publish":
                "İçerik yayınlanacak.",

            "form:submit":
                "Form verileri gönderilecek.",

            "purchase:intent":
                "Satın alma süreci başlatılacak."

        };


        return (
            reasons[
                actionType
            ] ||
            "Bu işlem kullanıcı onayı gerektiriyor."
        );

    },


    getBlockedReason(
        actionType
    ){

        const reasons = {

            "payment:execute":
                "Brain para transferini veya gerçek ödeme işlemini doğrudan gerçekleştiremez.",

            "purchase:complete":
                "Satın alma işleminin finansal tamamlanması Payment Core ve ödeme sağlayıcısının yetkisindedir.",

            "refund:execute":
                "Brain gerçek para iadesini doğrudan gerçekleştiremez.",

            "settlement:execute":
                "Settlement işlemleri finansal backend otoritesindedir.",

            "identity:verify":
                "Brain bir kimliği kendi kararıyla doğrulanmış ilan edemez.",

            "identity:transfer":
                "Kimlik transferi Brain tarafından gerçekleştirilemez.",

            "ownership:change":
                "Sahiplik değişikliği ayrı güven ve yetkilendirme katmanı gerektirir.",

            "credential:export":
                "Credential ve gizli anahtarlar Brain üzerinden dışarı aktarılamaz.",

            "credential:read":
                "Brain gizli credential değerlerini okuyamaz.",

            "security:disable":
                "Brain güvenlik katmanlarını devre dışı bırakamaz.",

            "security:bypass":
                "Brain güvenlik kontrollerini atlayamaz.",

            "guardian:disable":
                "Guardian Brain tarafından kapatılamaz.",

            "permission:force":
                "Brain kullanıcı veya sistem onayı olmadan izin zorlayamaz.",

            "trust:force":
                "Brain doğrulama sonucu olmadan trust veremez.",

            "application:trust":
                "Uygulama güveni yalnız doğrulama otoritesi üzerinden verilebilir."

        };


        return (
            reasons[
                actionType
            ] ||
            "Bu işlem Brain tarafından doğrudan uygulanamaz."
        );

    },


    /* =====================================================
       CONFIRMATION RESULT
    ===================================================== */

    canExecuteEvaluation(
        evaluation,
        confirmation = false
    ){

        if(
            !evaluation ||
            evaluation.executable ===
                false
        ){
            return false;
        }


        if(
            evaluation.blocked ||
            !evaluation.allowed
        ){
            return false;
        }


        if(
            !evaluation
                .requiresConfirmation
        ){

            return true;
        }


        /*
         * BrainCore yeni akışta confirmationId'yi intent
         * fingerprint'e bağlayarak tüketiyor.
         *
         * Policy burada confirmation'ın authority'si değil,
         * yalnız sonucunu değerlendirir.
         *
         * Boolean geriye uyumluluk için kabul edilir.
         */

        if(
            confirmation === true
        ){
            return true;
        }


        if(
            confirmation &&
            typeof confirmation ===
                "object" &&
            confirmation.approved ===
                true
        ){
            return true;
        }


        return false;

    },


    /* =====================================================
       DESCRIBE
    ===================================================== */

    describe(actionType){

        const normalized =
            this.normalizeActionType(
                actionType
            );


        const permission =
            this.check(
                normalized
            );


        const blocked =
            permission ===
            this.levels.BLOCKED;


        const requiresConfirmation =
            permission ===
            this.levels.CONFIRM;


        return {

            actionType:
                normalized ||
                null,

            permission,

            allowed:
                !blocked,

            executable:
                !blocked,

            requiresConfirmation,

            blocked,

            reason:
                blocked
                    ? this.getBlockedReason(
                        normalized
                    )
                    : requiresConfirmation
                        ? this.getConfirmationReason(
                            normalized
                        )
                        : null

        };

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const entries =
            Object.entries(
                this.rules
            );


        return {

            totalRules:
                entries.length,

            safe:
                entries.filter(
                    ([,level]) =>
                        level ===
                        this.levels.SAFE
                ).length,

            confirm:
                entries.filter(
                    ([,level]) =>
                        level ===
                        this.levels.CONFIRM
                ).length,

            blocked:
                entries.filter(
                    ([,level]) =>
                        level ===
                        this.levels.BLOCKED
                ).length,

            defaultPolicy:
                this.levels.CONFIRM

        };

    }

};


VAERO.register(
    "brainActionPolicy",
    BrainActionPolicy
);


window.BrainActionPolicy =
    BrainActionPolicy;
