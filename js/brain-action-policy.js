const BrainActionPolicy = {

    levels: {
        SAFE: "safe",
        CONFIRM: "confirm",
        BLOCKED: "blocked"
    },

    /*
     * =====================================================
     * ACTION RULES
     * =====================================================
     *
     * SAFE
     * Kullanıcıdan ayrıca onay almadan uygulanabilir.
     * Kalıcı veya geri döndürülemez veri değişikliği yapmaz.
     *
     * CONFIRM
     * Kalıcı veri oluşturur, değiştirir, kaldırır
     * veya dış dünyaya etki eder.
     *
     * BLOCKED
     * Brain'in doğrudan gerçekleştirmesine izin verilmez.
     */
    rules: {

        /*
         * =================================================
         * NAVIGATION / VIEW
         * =================================================
         */

        "app:open": "safe",
        "view:change": "safe",
        "filter:apply": "safe",
        "search:run": "safe",

        /*
         * =================================================
         * CREATE FLOWS
         * =================================================
         *
         * Bunlar gerçek oluşturma işlemleri değildir.
         * Yalnızca kullanıcıyı ilgili oluşturma
         * arayüzüne götürür.
         */

        "world:create:flow": "safe",
        "entity:create:flow": "safe",

        /*
         * =================================================
         * EDIT FLOWS
         * =================================================
         *
         * Yalnızca düzenleme ekranını açar.
         * Veri henüz değiştirilmez.
         */

        "profile:edit:flow": "safe",
        "identity:edit:flow": "safe",
        "settings:edit:flow": "safe",
        "field:edit:flow": "safe",

        /*
         * =================================================
         * LOCAL / REVERSIBLE STATE
         * =================================================
         */

        "draft:create": "safe",
        "draft:update": "safe",

        "session:save": "safe",

        "resume:save": "safe",
        "resume:restore": "safe",

        /*
         * =================================================
         * PERSISTENT CREATION
         * =================================================
         *
         * Gerçek kalıcı nesne oluşturma işlemleri.
         */

        "world:create": "confirm",
        "entity:create": "confirm",
        "bridge:create": "confirm",

        /*
         * =================================================
         * PERSISTENT UPDATE
         * =================================================
         */

        "field:update": "confirm",
        "profile:update": "confirm",
        "identity:update": "confirm",
        "settings:update": "confirm",

        "identity:verify": "confirm",

        /*
         * =================================================
         * RESTORE
         * =================================================
         */

        "record:restore": "confirm",
        "world:restore": "confirm",
        "entity:restore": "confirm",

        /*
         * =================================================
         * DELETE
         * =================================================
         */

        "record:delete": "confirm",
        "world:delete": "confirm",
        "entity:delete": "confirm",

        /*
         * =================================================
         * EXTERNAL EFFECT
         * =================================================
         */

        "content:publish": "confirm",
        "message:send": "confirm",
        "form:submit": "confirm",

        /*
         * Satın alma akışının kullanıcı tarafından
         * nihai olarak tamamlanması onay gerektirir.
         */
        "purchase:complete": "confirm",

        /*
         * =================================================
         * BLOCKED
         * =================================================
         *
         * Brain tarafından doğrudan uygulanamaz.
         */

        "payment:execute": "blocked",

        "identity:transfer": "blocked",
        "ownership:change": "blocked",

        "credential:export": "blocked",
        "credential:reveal": "blocked",

        "security:disable": "blocked",
        "security:bypass": "blocked"
    },

    /*
     * =====================================================
     * BASIC POLICY HELPERS
     * =====================================================
     */

    check(actionType){

        if(!actionType){
            return this.levels.CONFIRM;
        }

        /*
         * Bilinmeyen işlem SAFE kabul edilmez.
         *
         * Fail-closed yaklaşımı:
         * Yeni bir action eklenir fakat Policy'ye
         * tanıtılması unutulursa otomatik çalışmaz.
         */
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

    /*
     * =====================================================
     * INTENT -> ACTION TYPE
     * =====================================================
     *
     * BrainIntent kullanıcının ne istediğini söyler.
     *
     * Policy burada o isteğin sistem açısından
     * hangi güvenlik sınıfına ait olduğunu belirler.
     */

    resolveIntentAction(intent){

        if(
            !intent ||
            typeof intent !== "object"
        ){
            return null;
        }

        /*
         * =================================================
         * NAVIGATION
         * =================================================
         */

        if(
            intent.type ===
                "navigate"
        ){
            return "app:open";
        }

        /*
         * =================================================
         * RESUME
         * =================================================
         */

        if(
            intent.type ===
                "resume:save"
        ){
            return "resume:save";
        }

        if(
            intent.type ===
                "resume:restore"
        ){
            return "resume:restore";
        }

        /*
         * =================================================
         * CREATE
         * =================================================
         *
         * BrainActions şu anda gerçek dünya veya
         * varlık oluşturmuyor.
         *
         * Yalnızca oluşturma arayüzünü açıyor.
         *
         * Bu nedenle gerçek:
         *
         * world:create
         * entity:create
         *
         * yerine FLOW action kullanıyoruz.
         */

        if(
            intent.type ===
                "create"
        ){

            if(
                intent.target ===
                    "world"
            ){
                return "world:create:flow";
            }

            if(
                intent.target ===
                    "entity"
            ){
                return "entity:create:flow";
            }

            /*
             * Tanımsız create hedefini app:open
             * olarak güvenli varsaymıyoruz.
             */
            return null;

        }

        /*
         * =================================================
         * REQUEST
         * =================================================
         */

        if(
            intent.type ===
                "request"
        ){

            const operation =
                intent.operation;

            const target =
                intent.target;

            /*
             * ---------------------------------------------
             * SEARCH
             * ---------------------------------------------
             */

            if(
                operation ===
                    "search"
            ){
                return "search:run";
            }

            /*
             * ---------------------------------------------
             * EDIT
             * ---------------------------------------------
             *
             * BrainActions mevcut yapıda gerçek
             * güncelleme yapmıyor.
             *
             * Sadece düzenleme ekranını açıyor.
             */

            if(
                operation ===
                    "edit"
            ){

                if(
                    target ===
                        "profile"
                ){
                    return "profile:edit:flow";
                }

                if(
                    target ===
                        "identity"
                ){
                    return "identity:edit:flow";
                }

                if(
                    target ===
                        "settings"
                ){
                    return "settings:edit:flow";
                }

                /*
                 * Desteklenmeyen edit hedefini
                 * güvenli kabul etmiyoruz.
                 */
                return null;

            }

            /*
             * ---------------------------------------------
             * DELETE
             * ---------------------------------------------
             */

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

            /*
             * ---------------------------------------------
             * RESTORE
             * ---------------------------------------------
             */

            if(
                operation ===
                    "restore"
            ){

                if(
                    target ===
                        "world" ||
                    target ===
                        "worlds"
                ){
                    return "world:restore";
                }

                if(
                    target ===
                        "entity" ||
                    target ===
                        "entities"
                ){
                    return "entity:restore";
                }

                return "record:restore";

            }

        }

        /*
         * question / chat / clarify / empty
         *
         * sistem işlemi değildir.
         */
        return null;

    },

    /*
     * =====================================================
     * ACTION EVALUATION
     * =====================================================
     */

    evaluate(action){

        const actionType =
            String(
                action?.type || ""
            ).trim();

        if(!actionType){

            return {
                allowed: false,

                requiresConfirmation:
                    false,

                blocked:
                    false,

                permission:
                    null,

                action:
                    action || null,

                reason:
                    "Geçerli action type bulunamadı."
            };

        }

        const permission =
            this.check(
                actionType
            );

        const allowed =
            permission ===
                this.levels.SAFE;

        const requiresConfirmation =
            permission ===
                this.levels.CONFIRM;

        const blocked =
            permission ===
                this.levels.BLOCKED;

        return {
            allowed,
            requiresConfirmation,
            blocked,
            permission,
            action,

            reason:
                blocked
                    ? "Bu işlem Brain tarafından uygulanamaz."
                    : requiresConfirmation
                        ? "Bu işlem kullanıcı onayı gerektiriyor."
                        : null
        };

    },

    /*
     * =====================================================
     * INTENT EVALUATION
     * =====================================================
     */

    evaluateIntent(intent){

        if(
            !intent ||
            typeof intent !== "object"
        ){

            return {
                allowed: false,

                requiresConfirmation:
                    false,

                blocked:
                    false,

                permission:
                    null,

                actionType:
                    null,

                intent:
                    intent || null,

                executable:
                    false,

                reason:
                    "Geçerli intent bulunamadı."
            };

        }

        const actionType =
            this.resolveIntentAction(
                intent
            );

        /*
         * Chat, question, clarify veya henüz
         * bağlı action bulunmayan intent.
         */
        if(!actionType){

            return {
                allowed: false,

                requiresConfirmation:
                    false,

                blocked:
                    false,

                permission:
                    null,

                actionType:
                    null,

                intent,

                executable:
                    false,

                reason:
                    "Bu intent için doğrudan sistem işlemi tanımlı değil."
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

            /*
             * executable:
             *
             * Bu action sistem tarafından TANINIYOR
             * anlamına gelir.
             *
             * Hemen çalışıp çalışamayacağına
             * allowed karar verir.
             *
             * BrainCore zaten:
             *
             * policy.allowed &&
             * policy.executable
             *
             * şartını kullanıyor.
             */
            executable:
                true,

            reason:
                result.reason
        };

    }

};

VAERO.register(
    "brainActionPolicy",
    BrainActionPolicy
);
