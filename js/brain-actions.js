const BrainActions = {

    lastResult: null,

    getActions(){

        return (
            VAERO.get("actions") ||
            (
                typeof Actions !==
                    "undefined"
                    ? Actions
                    : null
            )
        );

    },

    setResult({
        success,
        intent,
        action,
        reason = null
    }){

        this.lastResult = {
            success:
                Boolean(success),

            intent:
                intent || null,

            action:
                action || null,

            reason:
                reason || null,

            executedAt:
                Date.now()
        };

        return Boolean(success);

    },

    execute(intent, context = {}){

        if(
            !intent ||
            typeof intent !== "object"
        ){
            return this.setResult({
                success: false,
                intent,
                action: null,
                reason:
                    "Geçerli intent bulunamadı."
            });
        }

        const actions =
            this.getActions();

        if(!actions){

            return this.setResult({
                success: false,
                intent,
                action: null,
                reason:
                    "Actions servisi bulunamadı."
            });

        }

        switch(intent.type){

            case "navigate":

                return this.executeNavigation(
                    intent,
                    actions
                );

            case "create":

                return this.executeCreate(
                    intent,
                    actions
                );

            case "resume:save":

                return this.setResult({
                    success:
                        actions.saveBrainResumePoint(
                            intent.raw ||
                            context.message ||
                            "Devam noktası"
                        ),

                    intent,
                    action:
                        "resume:save"
                });

            case "resume:restore":

                return this.setResult({
                    success:
                        actions.restoreBrainResumePoint(),

                    intent,
                    action:
                        "resume:restore"
                });

            case "request":

                return this.executeRequest(
                    intent,
                    actions
                );

            default:

                return this.setResult({
                    success: false,
                    intent,
                    action: null,
                    reason:
                        "Bu intent doğrudan sistem işlemi gerektirmiyor."
                });

        }

    },

    executeNavigation(intent, actions){

        const target =
            intent.target;

        let success = false;
        let action = null;

        switch(target){

            case "home":

                success =
                    actions.openHome();

                action =
                    "home:open";

                break;

            case "worlds":

                success =
                    actions.openWorlds();

                action =
                    "worlds:open";

                break;

            case "world": {

                const currentWorld =
                    VAERO.engine
                        .currentWorld;

                success =
                    currentWorld
                        ? actions.openWorld(
                            currentWorld.id
                        )
                        : actions.openWorlds();

                action =
                    currentWorld
                        ? "world:open"
                        : "worlds:open";

                break;

            }

            case "create":

                success =
                    actions.openCreate();

                action =
                    "create:open";

                break;

            case "entities":

                success =
                    actions.openEntities();

                action =
                    "entities:open";

                break;

            case "identity":

                success =
                    this.openEntityAwarePage(
                        "identity",
                        actions
                    );

                action =
                    "identity:open";

                break;

            case "profile":

                success =
                    this.openEntityAwarePage(
                        "profile",
                        actions
                    );

                action =
                    "profile:open";

                break;

            case "memory":
            case "timeline":
            case "bridge":
            case "evolution":
            case "organs":
            case "settings":
            case "discovery":

                success =
                    actions.openEntityPage(
                        target
                    );

                action =
                    `entity:${target}`;

                break;

            case "brain":

                success =
                    actions.openBrain();

                action =
                    "brain:open";

                break;

            default:

                return this.setResult({
                    success: false,
                    intent,
                    action: null,
                    reason:
                        `Bilinmeyen navigasyon hedefi: ${target}`
                });

        }

        return this.setResult({
            success,
            intent,
            action,
            reason:
                success
                    ? null
                    : "Hedef ekran açılamadı."
        });

    },

    openEntityAwarePage(page, actions){

        const openedEntity =
            VAERO.engine
                .currentOpenedEntity;

        const rootEntity =
            VAERO.engine
                .rootEntity;

        /*
         * Seçili özel bir varlık varsa onun
         * Kimlik veya Profil ekranını aç.
         */
        if(
            openedEntity &&
            openedEntity.id !==
                rootEntity?.id
        ){
            return actions.openEntityPage(
                page
            );
        }

        return page === "identity"
            ? actions.openIdentity()
            : actions.openProfile();

    },

    executeCreate(intent, actions){

        if(intent.target === "world"){

            return this.setResult({
                success:
                    actions.openCreate(),

                intent,
                action:
                    "create:open"
            });

        }

        if(intent.target === "entity"){

            const currentWorld =
                VAERO.engine
                    .currentWorld;

            if(!currentWorld){

                return this.setResult({
                    success:
                        actions.openWorlds(),

                    intent,
                    action:
                        "worlds:open",

                    reason:
                        "Önce varlığın ekleneceği dünya seçilmeli."
                });

            }

            return this.setResult({
                success:
                    actions.startEntityCreate(),

                intent,
                action:
                    "entity:create:first"
            });

        }

        return this.setResult({
            success: false,
            intent,
            action: null,
            reason:
                "Oluşturulacak yapı anlaşılamadı."
        });

    },

    executeRequest(intent, actions){

        const target =
            intent.target;

        const operation =
            intent.operation;

        /*
         * Brain şu aşamada veri üzerinde sessizce
         * değişiklik veya silme yapmaz.
         */
        if(
            operation === "delete" ||
            operation === "restore"
        ){
            return this.setResult({
                success: false,
                intent,
                action: null,
                reason:
                    "Bu işlem kullanıcı onayı gerektiriyor."
            });
        }

        if(operation === "edit"){

            if(target === "profile"){

                return this.setResult({
                    success:
                        this.openEntityAwarePage(
                            "profile",
                            actions
                        ),

                    intent,
                    action:
                        "profile:open"
                });

            }

            if(target === "identity"){

                return this.setResult({
                    success:
                        this.openEntityAwarePage(
                            "identity",
                            actions
                        ),

                    intent,
                    action:
                        "identity:open"
                });

            }

            if(target === "settings"){

                return this.setResult({
                    success:
                        actions.openEntityPage(
                            "settings"
                        ),

                    intent,
                    action:
                        "entity:settings"
                });

            }

        }

        if(operation === "search"){

            if(
                target === "world" ||
                target === "worlds"
            ){

                return this.setResult({
                    success:
                        actions.openWorlds(),

                    intent,
                    action:
                        "worlds:open"
                });

            }

            if(target === "entities"){

                return this.setResult({
                    success:
                        actions.openEntities(),

                    intent,
                    action:
                        "entities:open"
                });

            }

        }

        return this.setResult({
            success: false,
            intent,
            action: null,
            reason:
                "İstek anlaşıldı fakat bağlı bir sistem işlemi bulunmuyor."
        });

    }

};

VAERO.register(
    "brainActions",
    BrainActions
);
