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
           Görünüm / gezinme / geri alınabilir lokal durum
        ------------------------------------------------- */

        "app:open":
            "safe",

        "view:change":
            "safe",

        "filter:apply":
            "safe",

        "search:run":
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


        /* -------------------------------------------------
           CONFIRM
           Kalıcı veri veya dış etki
        ------------------------------------------------- */

        "world:create":
            "confirm",

        "entity:create":
            "confirm",

        "field:update":
            "confirm",

        "profile:update":
            "confirm",

        "identity:verify":
            "confirm",

        "bridge:create":
            "confirm",

        "record:restore":
            "confirm",

        "content:publish":
            "confirm",

        "message:send":
            "confirm",

        "record:delete":
            "confirm",

        "world:delete":
            "confirm",

        "entity:delete":
            "confirm",

        "form:submit":
            "confirm",

        "purchase:complete":
            "confirm",


        /* -------------------------------------------------
           BLOCKED
           Brain doğrudan uygulayamaz
        ------------------------------------------------- */

        "payment:execute":
            "blocked",

        "identity:transfer":
            "blocked",

        "ownership:change":
            "blocked",

        "credential:export":
            "blocked",

        "security:disable":
            "blocked"

    },


    /* =====================================================
       NORMALIZATION
    ===================================================== */

    normalizeActionType(
        actionType
    ){

        return String(
            actionType ?? ""
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


    needsConfirmation(
        actionType
    ){

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
            String(
                intent.type ||
                ""
            );


        const operation =
            String(
                intent.operation ||
                ""
            );


        const target =
            String(
                intent.target ||
                ""
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
           CREATE

           Mevcut BrainActions create intentinde gerçek
           kaydı oluşturmaz. Yalnız ilgili oluşturma
           ekranını açar.

           Bu nedenle app:open güvenlidir.
        ------------------------------------------------- */

        if(
            type ===
            "create"
        ){

            if(
                target === "world" ||
                target === "entity"
            ){

                return "app:open";

            }

            return null;

        }


        /* -------------------------------------------------
           REQUEST
        ------------------------------------------------- */

        if(
            type ===
            "request"
        ){


            /* SEARCH */

            if(
                operation ===
                "search"
            ){

                return "search:run";

            }


            /* OPEN */

            if(
                operation ===
                "open"
            ){

                return target
                    ? "app:open"
                    : null;

            }


            /* EDIT

               Şu an Brain yalnız düzenleme yüzeyine
               yönlendiriyor. Gerçek field update ayrı
               confirmation işlemidir.
            */

            if(
                operation ===
                "edit"
            ){

                return target
                    ? "app:open"
                    : null;

            }


            /* DELETE */

            if(
                operation ===
                "delete"
            ){

                if(
                    target ===
                    "world" ||
                    target ===
                    "worlds"
                ){

                    return "world:delete";

                }


                if(
                    target ===
                    "entity" ||
                    target ===
                    "entities"
                ){

                    return "entity:delete";

                }


                return "record:delete";

            }


            /* RESTORE */

            if(
                operation ===
                "restore"
            ){

                return "record:restore";

            }

        }


        /*
         * chat / question / clarify / empty
         * sistem aksiyonu değildir.
         */

        return null;

    },


    /* =====================================================
       RAW ACTION EVALUATION
    ===================================================== */

    evaluate(action){

        const safeAction =
            action &&
            typeof action ===
                "object"
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


        /*
         * allowed:
         *
         * İşlem policy tarafından yasaklanmış mı?
         *
         * CONFIRM işlemler de prensipte allowed'dır.
         * Yürütülmeden önce BrainCore kullanıcı onayını
         * ayrıca kontrol eder.
         */

        const allowed =
            !blocked;


        return {

            allowed,

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

                requiresConfirmation:
                    false,

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


        let reason =
            null;


        if(result.blocked){

            reason =
                "Bu işlem Brain tarafından doğrudan uygulanamaz.";

        }
        else if(
            result.requiresConfirmation
        ){

            reason =
                "Bu işlem kullanıcı onayı gerektiriyor.";

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
       CONFIRMATION RESULT
    ===================================================== */

    canExecuteEvaluation(
        evaluation,
        confirmed = false
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
            evaluation
                .requiresConfirmation &&
            confirmed !== true
        ){
            return false;
        }


        return true;

    },


    /* =====================================================
       STATUS
    ===================================================== */

    describe(actionType){

        const permission =
            this.check(
                actionType
            );


        return {

            actionType:
                this.normalizeActionType(
                    actionType
                ) || null,

            permission,

            allowed:
                permission !==
                this.levels.BLOCKED,

            requiresConfirmation:
                permission ===
                this.levels.CONFIRM,

            blocked:
                permission ===
                this.levels.BLOCKED

        };

    }

};


VAERO.register(
    "brainActionPolicy",
    BrainActionPolicy
);


window.BrainActionPolicy =
    BrainActionPolicy;
