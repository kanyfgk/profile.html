/* =========================================================
   VAERO BRAIN ACTION POLICY
   Permission / Confirmation / Execution Boundary
========================================================= */

const BrainActionPolicy = {

    version:
        "3.0.0",


    /* =====================================================
       LEVELS
    ===================================================== */

    levels: {

        SAFE:
            "safe",

        CONFIRM:
            "confirm",

        BLOCKED:
            "blocked",

        UNKNOWN:
            "unknown"

    },


    /* =====================================================
       ACTION RULES
    ===================================================== */

    rules: {

        /* -------------------------------------------------
           SAFE
           Read / navigation / local non-destructive state
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
           Persistent or user-state mutation
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
           Brain cannot become direct authority
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
            actionType ??
                ""
        )
            .trim()
            .toLowerCase();

    },


    normalizeValue(value){

        return String(
            value ??
                ""
        )
            .trim()
            .toLowerCase();

    },


    /* =====================================================
       RULE LOOKUP
    ===================================================== */

    hasRule(actionType){

        const normalizedType =
            this.normalizeActionType(
                actionType
            );


        if(!normalizedType){

            return false;

        }


        return Object.prototype
            .hasOwnProperty.call(
                this.rules,
                normalizedType
            );

    },


    check(actionType){

        const normalizedType =
            this.normalizeActionType(
                actionType
            );


        /*
         * Unknown actions are not silently promoted into a
         * confirmable execution path.
         *
         * A mutation must first exist explicitly in Policy.
         */

        if(
            !normalizedType ||
            !this.hasRule(
                normalizedType
            )
        ){

            return this.levels
                .UNKNOWN;

        }


        return this.rules[
            normalizedType
        ];

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


    isKnown(actionType){

        return this.hasRule(
            actionType
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
            aliases[
                value
            ] ||
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


        let actionType =
            null;


        if(
            normalizedOperation ===
                "create"
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

                actionType =
                    `${normalizedTarget}:update`;

            }
            else if(
                normalizedTarget ===
                    "application"
            ){

                actionType =
                    "application:install";

            }
            else {

                actionType =
                    `${normalizedTarget}:create`;

            }

        }
        else if(
            normalizedOperation ===
                "edit" ||
            normalizedOperation ===
                "update"
        ){

            actionType =
                `${normalizedTarget}:update`;

        }
        else if(
            normalizedOperation ===
                "archive"
        ){

            actionType =
                `${normalizedTarget}:archive`;

        }
        else if(
            normalizedOperation ===
                "restore"
        ){

            actionType =
                `${normalizedTarget}:restore`;

        }
        else if(
            normalizedOperation ===
                "delete" ||
            normalizedOperation ===
                "remove"
        ){

            actionType =
                normalizedTarget ===
                    "application"
                    ? "application:remove"
                    : `${normalizedTarget}:delete`;

        }
        else if(
            normalizedOperation ===
                "install" &&
            normalizedTarget ===
                "application"
        ){

            actionType =
                "application:install";

        }


        /*
         * Important:
         * resolveCrudAction never creates an executable
         * action that Policy does not explicitly know.
         */

        if(
            !actionType ||
            !this.hasRule(
                actionType
            )
        ){

            return null;

        }


        return actionType;

    },


    /* =====================================================
       INTENT → ACTION
    ===================================================== */

    resolveIntentAction(intent){

        if(
            !intent ||
            typeof intent !==
                "object" ||
            Array.isArray(
                intent
            )
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
            type ===
                "navigate"
        ){

            return "app:open";

        }


        /* -------------------------------------------------
           RESUME
        ------------------------------------------------- */

        if(
            type ===
                "resume:save"
        ){

            return "resume:save";

        }


        if(
            type ===
                "resume:restore"
        ){

            return "resume:restore";

        }


        /* -------------------------------------------------
           CREATE SURFACE

           BrainActions currently opens the creation surface.
           It does not directly persist World/Entity here.
        ------------------------------------------------- */

        if(
            type ===
                "create"
        ){

            if(
                target ===
                    "world" ||
                target ===
                    "entity"
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
            type ===
                "application:install"
        ){

            return "application:install";

        }


        if(
            type ===
                "application:update"
        ){

            return "application:update";

        }


        if(
            type ===
                "application:remove"
        ){

            return "application:remove";

        }


        /* -------------------------------------------------
           PERMISSIONS
        ------------------------------------------------- */

        if(
            type ===
                "permission:grant"
        ){

            return "permission:grant";

        }


        if(
            type ===
                "permission:revoke"
        ){

            return "permission:revoke";

        }


        /* -------------------------------------------------
           COMMUNICATION
        ------------------------------------------------- */

        if(
            type ===
                "message:send"
        ){

            return "message:send";

        }


        if(
            type ===
                "call:start"
        ){

            return "call:start";

        }


        if(
            type ===
                "screen-share:start"
        ){

            return "screen-share:start";

        }


        /* -------------------------------------------------
           REQUEST
        ------------------------------------------------- */

        if(
            type ===
                "request"
        ){

            if(
                operation ===
                    "search"
            ){

                return "search:run";

            }


            if(
                operation ===
                    "open" ||
                operation ===
                    "view" ||
                operation ===
                    "read"
            ){

                return target
                    ? "app:open"
                    : "record:read";

            }


            /*
             * BrainActions edit path opens an editor surface.
             * Actual mutation requires its own mutation
             * intent/action.
             */

            if(
                operation ===
                    "edit"
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
                operation ===
                    "publish"
            ){

                return "content:publish";

            }


            if(
                operation ===
                    "submit"
            ){

                return "form:submit";

            }


            return null;

        }


        /* -------------------------------------------------
           EXPLICIT MUTATION INTENTS
        ------------------------------------------------- */

        const explicitActions = {

            "field:update":
                "field:update",

            "profile:update":
                "profile:update",

            "identity:update":
                "identity:update",

            "identity:verification:request":
                "identity:verification:request",

            "settings:update":
                "settings:update",

            "memory:create":
                "memory:create",

            "memory:update":
                "memory:update",

            "memory:archive":
                "memory:archive",

            "memory:restore":
                "memory:restore",

            "memory:delete":
                "memory:delete",

            "bridge:create":
                "bridge:create",

            "bridge:update":
                "bridge:update",

            "bridge:archive":
                "bridge:archive",

            "bridge:restore":
                "bridge:restore",

            "bridge:delete":
                "bridge:delete",

            "evolution:create":
                "evolution:create",

            "evolution:update":
                "evolution:update",

            "evolution:archive":
                "evolution:archive",

            "evolution:restore":
                "evolution:restore",

            "evolution:delete":
                "evolution:delete",

            "content:publish":
                "content:publish",

            "form:submit":
                "form:submit",

            "purchase:intent":
                "purchase:intent",

            "payment:execute":
                "payment:execute",

            "purchase:complete":
                "purchase:complete",

            "refund:execute":
                "refund:execute",

            "settlement:execute":
                "settlement:execute",

            "identity:verify":
                "identity:verify",

            "identity:transfer":
                "identity:transfer",

            "ownership:change":
                "ownership:change",

            "credential:export":
                "credential:export",

            "credential:read":
                "credential:read",

            "security:disable":
                "security:disable",

            "security:bypass":
                "security:bypass",

            "guardian:disable":
                "guardian:disable",

            "permission:force":
                "permission:force",

            "trust:force":
                "trust:force",

            "application:trust":
                "application:trust"

        };


        const explicitAction =
            explicitActions[
                type
            ] ||
            null;


        if(
            explicitAction &&
            this.hasRule(
                explicitAction
            )
        ){

            return explicitAction;

        }


        /*
         * chat / question / clarify / unknown types are not
         * Engine execution requests.
         */

        return null;

    },

   /* =====================================================
       CONTEXT BOUNDARIES
    ===================================================== */

    evaluateContextBoundary(
        actionType,
        intent,
        context = {}
    ){

        let engine =
            null;


        try{

            engine =
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

        } catch(error){

            engine =
                (
                    typeof window !==
                        "undefined"
                        ? window.Engine ||
                          null
                        : null
                );

        }


        const currentEntityId =
            context?.entity?.id ||
            context?.entityId ||
            engine?.currentOpenedEntity
                ?.id ||
            engine?.currentEntity
                ?.id ||
            null;


        const currentWorldId =
            context?.world?.id ||
            context?.worldId ||
            engine?.currentWorld
                ?.id ||
            null;


        const targetEntityId =
            intent?.entityId ||
            intent?.targetEntityId ||
            null;


        const targetWorldId =
            intent?.worldId ||
            intent?.targetWorldId ||
            null;


        const safeActions =
            new Set([

                "app:open",
                "view:change",
                "filter:apply",
                "search:run",
                "record:read",
                "catalog:read",
                "status:read",
                "draft:create",
                "draft:update",
                "session:save",
                "resume:save",
                "resume:restore",
                "brain:context"

            ]);


        const mutation =
            !safeActions.has(
                actionType
            );


        /*
         * Explicit cross-Entity mutation cannot silently use
         * the currently opened Entity authority.
         */

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

                valid:
                    false,

                reason:
                    "İşlem farklı bir Entity bağlamını hedefliyor.",

                code:
                    "entity-context-mismatch"

            };

        }


        /*
         * Explicit cross-World mutation cannot silently use
         * the currently active World authority.
         */

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

                valid:
                    false,

                reason:
                    "İşlem farklı bir World bağlamını hedefliyor.",

                code:
                    "world-context-mismatch"

            };

        }


        return {

            valid:
                true,

            reason:
                null,

            code:
                null

        };

    },


    /* =====================================================
       RAW ACTION EVALUATION
    ===================================================== */

    evaluate(action){

        const safeAction =
            action &&
            typeof action ===
                "object" &&
            !Array.isArray(
                action
            )
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


        const known =
            permission !==
                this.levels.UNKNOWN;


        const blocked =
            permission ===
                this.levels.BLOCKED ||
            permission ===
                this.levels.UNKNOWN;


        const requiresConfirmation =
            permission ===
                this.levels.CONFIRM;


        return {

            allowed:
                known &&
                !blocked,

            requiresConfirmation,

            blocked,

            known,

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

                allowed:
                    false,

                requiresConfirmation:
                    false,

                blocked:
                    false,

                known:
                    false,

                permission:
                    null,

                actionType:
                    null,

                intent,

                context,

                executable:
                    false,

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


        /*
         * Fail closed for unknown action types.
         */

        if(
            result.known !==
                true
        ){

            return {

                ...result,

                allowed:
                    false,

                blocked:
                    true,

                requiresConfirmation:
                    false,

                actionType,

                intent,

                context,

                executable:
                    false,

                reason:
                    "Bu action type Brain Action Policy içinde tanımlı değil."

            };

        }


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

                allowed:
                    false,

                blocked:
                    false,

                requiresConfirmation:
                    false,

                actionType,

                intent,

                context,

                executable:
                    false,

                reason:
                    boundary.reason ||
                    "İşlem mevcut Engine bağlamı dışında.",

                boundaryCode:
                    boundary.code ||
                    null

            };

        }


        let reason =
            null;


        if(
            result.blocked ===
                true
        ){

            reason =
                this.getBlockedReason(
                    actionType
                );

        }
        else if(
            result.requiresConfirmation ===
                true
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
                result.blocked !==
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

            "field:update":
                "Bir kayıt alanı değiştirilecek.",

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

            "bridge:archive":
                "Bağlantı arşivlenecek.",

            "bridge:restore":
                "Arşivlenmiş bağlantı geri getirilecek.",

            "bridge:delete":
                "Bağlantı kaydı silinecek.",

            "memory:create":
                "Yeni hafıza kaydı oluşturulacak.",

            "memory:update":
                "Hafıza kaydı değiştirilecek.",

            "memory:archive":
                "Hafıza kaydı arşivlenecek.",

            "memory:restore":
                "Arşivlenmiş hafıza kaydı geri getirilecek.",

            "memory:delete":
                "Hafıza kaydı silinecek.",

            "evolution:create":
                "Yeni Evolution kaydı oluşturulacak.",

            "evolution:update":
                "Evolution kaydı değiştirilecek.",

            "evolution:archive":
                "Evolution kaydı arşivlenecek.",

            "evolution:restore":
                "Arşivlenmiş Evolution kaydı geri getirilecek.",

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

            "notification:update":
                "Bildirim tercihleri değiştirilecek.",

            "message:send":
                "Mesaj dış kullanıcıya gönderilecek.",

            "call:start":
                "Sesli veya görüntülü iletişim başlatılacak.",

            "screen-share:start":
                "Ekran paylaşımı başlatılacak.",

            "content:publish":
                "İçerik yayınlanacak.",

            "record:restore":
                "Arşivlenmiş kayıt geri getirilecek.",

            "record:delete":
                "Kayıt silinecek.",

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
        confirmation = null
    ){

        if(
            !evaluation ||
            typeof evaluation !==
                "object"
        ){

            return false;

        }


        if(
            evaluation.executable !==
                true
        ){

            return false;

        }


        if(
            evaluation.blocked ===
                true ||
            evaluation.allowed !==
                true
        ){

            return false;

        }


        if(
            evaluation.requiresConfirmation !==
                true
        ){

            return true;

        }


        /*
         * Boolean confirmation is intentionally rejected.
         *
         * Confirmation must come from BrainCore's bound
         * confirmation flow.
         */

        if(
            !confirmation ||
            typeof confirmation !==
                "object" ||
            Array.isArray(
                confirmation
            )
        ){

            return false;

        }


        return Boolean(

            confirmation.approved ===
                true &&

            confirmation.mode ===
                "bound-confirmation" &&

            String(
                confirmation.confirmationId ||
                    ""
            ).trim()

        );

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


        const known =
            permission !==
                this.levels.UNKNOWN;


        const blocked =
            permission ===
                this.levels.BLOCKED ||
            permission ===
                this.levels.UNKNOWN;


        const requiresConfirmation =
            permission ===
                this.levels.CONFIRM;


        let reason =
            null;


        if(!known){

            reason =
                "Bu action type Brain Action Policy içinde tanımlı değil.";

        }
        else if(blocked){

            reason =
                this.getBlockedReason(
                    normalized
                );

        }
        else if(
            requiresConfirmation
        ){

            reason =
                this.getConfirmationReason(
                    normalized
                );

        }


        return {

            actionType:
                normalized ||
                null,

            known,

            permission,

            allowed:
                known &&
                !blocked,

            executable:
                known &&
                !blocked,

            requiresConfirmation,

            blocked,

            reason

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

            version:
                this.version,

            totalRules:
                entries.length,

            safe:
                entries.filter(
                    (
                        [
                            ,
                            level
                        ]
                    ) =>
                        level ===
                            this.levels.SAFE
                ).length,

            confirm:
                entries.filter(
                    (
                        [
                            ,
                            level
                        ]
                    ) =>
                        level ===
                            this.levels.CONFIRM
                ).length,

            blocked:
                entries.filter(
                    (
                        [
                            ,
                            level
                        ]
                    ) =>
                        level ===
                            this.levels.BLOCKED
                ).length,

            unknown:
                0,

            defaultPolicy:
                this.levels.UNKNOWN,

            failClosed:
                true,

            confirmationMode:
                "bound-confirmation"

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
            "brainActionPolicy",
            BrainActionPolicy
        );

    }

} catch(error){

    console.error(
        "BrainActionPolicy register edilemedi:",
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

    window.BrainActionPolicy =
        BrainActionPolicy;

}
