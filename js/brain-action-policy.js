const BrainActionPolicy = {

    levels: {
        SAFE: "safe",
        CONFIRM: "confirm",
        BLOCKED: "blocked"
    },

    rules: {
        /*
         * Yalnızca ekran veya görünüm değiştirir.
         */
        "app:open": "safe",
        "view:change": "safe",
        "filter:apply": "safe",
        "search:run": "safe",

        /*
         * Kullanıcının kendi cihazındaki geçici
         * veya geri alınabilir durumlar.
         */
        "draft:create": "safe",
        "draft:update": "safe",
        "session:save": "safe",
        "resume:save": "safe",
        "resume:restore": "safe",

        /*
         * Kalıcı veri oluşturur veya değiştirir.
         */
        "world:create": "confirm",
        "entity:create": "confirm",
        "field:update": "confirm",
        "profile:update": "confirm",
        "identity:verify": "confirm",
        "bridge:create": "confirm",
        "record:restore": "confirm",

        /*
         * Dışarıya etki eden veya veri kaldıran işlemler.
         */
        "content:publish": "confirm",
        "message:send": "confirm",
        "record:delete": "confirm",
        "world:delete": "confirm",
        "entity:delete": "confirm",
        "form:submit": "confirm",
        "purchase:complete": "confirm",

        /*
         * Brain tarafından doğrudan uygulanamaz.
         */
        "payment:execute": "blocked",
        "identity:transfer": "blocked",
        "ownership:change": "blocked",
        "credential:export": "blocked",
        "security:disable": "blocked"
    },

    check(actionType){

        return (
            this.rules[actionType] ||
            this.levels.CONFIRM
        );

    },

    canExecute(actionType){

        return (
            this.check(actionType) ===
            this.levels.SAFE
        );

    },

    needsConfirmation(actionType){

        return (
            this.check(actionType) ===
            this.levels.CONFIRM
        );

    },

    isBlocked(actionType){

        return (
            this.check(actionType) ===
            this.levels.BLOCKED
        );

    },

    resolveIntentAction(intent){

        if(!intent){
            return null;
        }

        if(intent.type === "navigate"){
            return "app:open";
        }

        if(intent.type === "resume:save"){
            return "resume:save";
        }

        if(intent.type === "resume:restore"){
            return "resume:restore";
        }

        if(intent.type === "create"){

            /*
             * BrainActions bu intent ile yalnızca
             * oluşturma ekranını açar. Formu kendi
             * başına göndermez.
             */
            return "app:open";

        }

        if(intent.type === "request"){

            if(intent.operation === "search"){
                return "search:run";
            }

            if(intent.operation === "edit"){

                /*
                 * Şu aşamada yalnızca düzenleme
                 * ekranına yönlendirilir.
                 */
                return "app:open";

            }

            if(intent.operation === "delete"){

                if(intent.target === "world"){
                    return "world:delete";
                }

                if(intent.target === "entities"){
                    return "entity:delete";
                }

                return "record:delete";

            }

            if(intent.operation === "restore"){
                return "record:restore";
            }

        }

        return null;

    },

    evaluate(action){

        const actionType =
            action?.type || "";

        const permission =
            this.check(actionType);

        return {
            allowed:
                permission ===
                this.levels.SAFE,

            requiresConfirmation:
                permission ===
                this.levels.CONFIRM,

            blocked:
                permission ===
                this.levels.BLOCKED,

            permission,
            action
        };

    },

    evaluateIntent(intent){

        const actionType =
            this.resolveIntentAction(
                intent
            );

        if(!actionType){

            return {
                allowed: false,
                requiresConfirmation: false,
                blocked: false,
                permission: null,
                actionType: null,
                intent,
                executable: false,
                reason:
                    "Bu intent için sistem işlemi tanımlı değil."
            };

        }

        const result =
            this.evaluate({
                type:
                    actionType,

                intent
            });

        return {
            ...result,
            actionType,
            intent,
            executable: true,
            reason:
                result.blocked
                    ? "Bu işlem Brain tarafından uygulanamaz."
                    : result.requiresConfirmation
                        ? "Bu işlem kullanıcı onayı gerektiriyor."
                        : null
        };

    }

};

VAERO.register(
    "brainActionPolicy",
    BrainActionPolicy
);
