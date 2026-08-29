const BrainActions = {

    lastResult: null,

    /*
     * =====================================================
     * SERVICES
     * =====================================================
     */

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

    getEngine(){

        return (
            VAERO.engine ||
            null
        );

    },

    /*
     * =====================================================
     * RESULT
     * =====================================================
     */

    setResult({
        success,
        intent,
        action,
        actionType = null,
        reason = null,
        meta = null
    }){

        this.lastResult = {

            success:
                Boolean(success),

            intent:
                intent || null,

            /*
             * Gerçekte çağrılan Actions
             * operasyonunun adı.
             *
             * Örnek:
             * profile:open
             */
            action:
                action || null,

            /*
             * BrainActionPolicy tarafından
             * değerlendirilen güvenlik action'ı.
             *
             * Örnek:
             * profile:edit:flow
             */
            actionType:
                actionType || null,

            reason:
                reason || null,

            meta:
                (
                    meta &&
                    typeof meta ===
                        "object"
                )
                    ? meta
                    : null,

            executedAt:
                Date.now()

        };

        return Boolean(
            success
        );

    },

    fail(
        intent,
        reason,
        action = null,
        actionType = null,
        meta = null
    ){

        return this.setResult({

            success:
                false,

            intent,

            action,

            actionType,

            reason,

            meta

        });

    },

    /*
     * =====================================================
     * EXECUTION ENTRY
     * =====================================================
     */

    execute(
        intent,
        context = {}
    ){

        if(
            !intent ||
            typeof intent !==
                "object"
        ){

            return this.fail(
                intent,
                "Geçerli intent bulunamadı."
            );

        }

        const actions =
            this.getActions();

        if(!actions){

            return this.fail(
                intent,
                "Actions servisi bulunamadı."
            );

        }

        try {

            switch(
                intent.type
            ){

                case "navigate":

                    return this
                        .executeNavigation(
                            intent,
                            actions
                        );

                case "create":

                    return this
                        .executeCreate(
                            intent,
                            actions
                        );

                case "resume:save":

                    return this
                        .executeResumeSave(
                            intent,
                            context,
                            actions
                        );

                case "resume:restore":

                    return this
                        .executeResumeRestore(
                            intent,
                            actions
                        );

                case "request":

                    return this
                        .executeRequest(
                            intent,
                            actions
                        );

                default:

                    return this.fail(
                        intent,
                        "Bu intent doğrudan sistem işlemi gerektirmiyor."
                    );

            }

        } catch(error){

            console.error(
                "Brain action execution failed:",
                error
            );

            return this.fail(
                intent,
                "İşlem uygulanırken sistem hatası oluştu.",
                null,
                null,
                {
                    error:
                        true,

                    message:
                        String(
                            error?.message ||
                            error ||
                            "Unknown error"
                        )
                }
            );

        }

    },

    /*
     * =====================================================
     * NAVIGATION
     * =====================================================
     */

    executeNavigation(
        intent,
        actions
    ){

        const target =
            intent.target;

        let success =
            false;

        let action =
            null;

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

                const engine =
                    this.getEngine();

                const currentWorld =
                    engine
                        ?.currentWorld ||
                    null;

                if(currentWorld?.id){

                    success =
                        actions.openWorld(
                            currentWorld.id
                        );

                    action =
                        "world:open";

                }else{

                    success =
                        actions.openWorlds();

                    action =
                        "worlds:open";

                }

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

                return this.fail(
                    intent,
                    `Bilinmeyen navigasyon hedefi: ${target}`,
                    null,
                    "app:open"
                );

        }

        return this.setResult({

            success,

            intent,

            action,

            actionType:
                "app:open",

            reason:
                success
                    ? null
                    : "Hedef ekran açılamadı.",

            meta: {
                target
            }

        });

    },

    /*
     * =====================================================
     * ENTITY-AWARE NAVIGATION
     * =====================================================
     */

    openEntityAwarePage(
        page,
        actions
    ){

        const engine =
            this.getEngine();

        if(!engine){
            return false;
        }

        const openedEntity =
            engine
                .currentOpenedEntity ||
            null;

        const rootEntity =
            engine
                .rootEntity ||
            null;

        /*
         * Özel bir varlık açıksa Kimlik / Profil
         * işlemi o varlığın üzerinde yürür.
         */
        if(
            openedEntity &&
            openedEntity.id &&
            openedEntity.id !==
                rootEntity?.id
        ){

            return actions
                .openEntityPage(
                    page
                );

        }

        /*
         * Root kullanıcı için mevcut özel
         * Actions metodları korunur.
         */
        if(
            page ===
                "identity"
        ){

            return actions
                .openIdentity();

        }

        if(
            page ===
                "profile"
        ){

            return actions
                .openProfile();

        }

        return false;

    },

    /*
     * =====================================================
     * CREATE FLOWS
     * =====================================================
     *
     * ÖNEMLİ:
     *
     * Bu fonksiyon gerçek world/entity
     * oluşturmaz.
     *
     * Yalnızca oluşturma akışını açar.
     *
     * Bu nedenle Policy tarafında:
     *
     * world:create:flow
     * entity:create:flow
     *
     * SAFE'dir.
     *
     * Gerçek:
     *
     * world:create
     * entity:create
     *
     * işlemleri ayrı olacak ve CONFIRM
     * gerektirecektir.
     */

    executeCreate(
        intent,
        actions
    ){

        if(
            intent.target ===
                "world"
        ){

            const success =
                actions.openCreate();

            return this.setResult({

                success,

                intent,

                action:
                    "create:open",

                actionType:
                    "world:create:flow",

                reason:
                    success
                        ? null
                        : "Dünya oluşturma ekranı açılamadı.",

                meta: {
                    target:
                        "world",

                    flow:
                        true,

                    redirected:
                        false
                }

            });

        }

        if(
            intent.target ===
                "entity"
        ){

            const engine =
                this.getEngine();

            const currentWorld =
                engine
                    ?.currentWorld ||
                null;

            /*
             * Varlığın hangi dünyaya ait olacağı
             * bilinmeden create akışı başlamaz.
             *
             * Brain bunun yerine kullanıcıyı
             * Dünyalar ekranına götürür.
             */
            if(
                !currentWorld ||
                !currentWorld.id
            ){

                const success =
                    actions.openWorlds();

                return this.setResult({

                    success,

                    intent,

                    action:
                        "worlds:open",

                    actionType:
                        "entity:create:flow",

                    reason:
                        success
                            ? "Önce varlığın ekleneceği dünya seçilmeli."
                            : "Dünya seçimi ekranı açılamadı.",

                    meta: {
                        target:
                            "entity",

                        flow:
                            true,

                        redirected:
                            true,

                        redirectTarget:
                            "worlds",

                        requiresWorld:
                            true
                    }

                });

            }

            const success =
                actions
                    .startEntityCreate();

            return this.setResult({

                success,

                intent,

                action:
                    "entity:create:flow",

                actionType:
                    "entity:create:flow",

                reason:
                    success
                        ? null
                        : "Varlık oluşturma akışı başlatılamadı.",

                meta: {
                    target:
                        "entity",

                    flow:
                        true,

                    redirected:
                        false,

                    worldId:
                        currentWorld.id
                }

            });

        }

        return this.fail(
            intent,
            "Oluşturulacak yapı anlaşılamadı."
        );

    },

    /*
     * =====================================================
     * RESUME
     * =====================================================
     */

    executeResumeSave(
        intent,
        context,
        actions
    ){

        const note =
            intent.raw ||
            context?.message ||
            "Devam noktası";

        const success =
            actions
                .saveBrainResumePoint(
                    note
                );

        return this.setResult({

            success,

            intent,

            action:
                "resume:save",

            actionType:
                "resume:save",

            reason:
                success
                    ? null
                    : "Devam noktası kaydedilemedi.",

            meta: {
                note
            }

        });

    },

    executeResumeRestore(
        intent,
        actions
    ){

        const success =
            actions
                .restoreBrainResumePoint();

        return this.setResult({

            success,

            intent,

            action:
                "resume:restore",

            actionType:
                "resume:restore",

            reason:
                success
                    ? null
                    : "Kaydedilmiş devam noktası açılamadı."

        });

    },

    /*
     * =====================================================
     * REQUEST
     * =====================================================
     */

    executeRequest(
        intent,
        actions
    ){

        const target =
            intent.target;

        const operation =
            intent.operation;

        /*
         * =================================================
         * DEFENCE IN DEPTH
         * =================================================
         *
         * Normal akışta delete / restore zaten
         * BrainActionPolicy tarafından CONFIRM
         * olarak durdurulur ve bu fonksiyona
         * ulaşmaz.
         *
         * Fakat BrainActions başka bir katmandan
         * yanlışlıkla doğrudan çağrılırsa burada
         * da kalıcı işlem çalıştırmıyoruz.
         */

        if(
            operation ===
                "delete"
        ){

            return this.fail(
                intent,
                "Silme işlemi kullanıcı onayı olmadan uygulanamaz.",
                null,
                this.resolveDeleteActionType(
                    target
                )
            );

        }

        if(
            operation ===
                "restore"
        ){

            return this.fail(
                intent,
                "Geri yükleme işlemi kullanıcı onayı olmadan uygulanamaz.",
                null,
                this.resolveRestoreActionType(
                    target
                )
            );

        }

        /*
         * =================================================
         * EDIT FLOW
         * =================================================
         */

        if(
            operation ===
                "edit"
        ){

            if(
                target ===
                    "profile"
            ){

                const success =
                    this.openEntityAwarePage(
                        "profile",
                        actions
                    );

                return this.setResult({

                    success,

                    intent,

                    action:
                        "profile:open",

                    actionType:
                        "profile:edit:flow",

                    reason:
                        success
                            ? null
                            : "Profil düzenleme ekranı açılamadı.",

                    meta: {
                        target:
                            "profile",

                        flow:
                            true
                    }

                });

            }

            if(
                target ===
                    "identity"
            ){

                const success =
                    this.openEntityAwarePage(
                        "identity",
                        actions
                    );

                return this.setResult({

                    success,

                    intent,

                    action:
                        "identity:open",

                    actionType:
                        "identity:edit:flow",

                    reason:
                        success
                            ? null
                            : "Kimlik ekranı açılamadı.",

                    meta: {
                        target:
                            "identity",

                        flow:
                            true
                    }

                });

            }

            if(
                target ===
                    "settings"
            ){

                const success =
                    actions.openEntityPage(
                        "settings"
                    );

                return this.setResult({

                    success,

                    intent,

                    action:
                        "entity:settings",

                    actionType:
                        "settings:edit:flow",

                    reason:
                        success
                            ? null
                            : "Ayarlar ekranı açılamadı.",

                    meta: {
                        target:
                            "settings",

                        flow:
                            true
                    }

                });

            }

            return this.fail(
                intent,
                "Bu alan için güvenli düzenleme akışı tanımlı değil."
            );

        }

        /*
         * =================================================
         * SEARCH
         * =================================================
         */

        if(
            operation ===
                "search"
        ){

            if(
                target === "world" ||
                target === "worlds"
            ){

                const success =
                    actions.openWorlds();

                return this.setResult({

                    success,

                    intent,

                    action:
                        "worlds:open",

                    actionType:
                        "search:run",

                    reason:
                        success
                            ? null
                            : "Dünyalar ekranı açılamadı.",

                    meta: {
                        target:
                            "worlds",

                        searchFlow:
                            true
                    }

                });

            }

            if(
                target ===
                    "entities"
            ){

                const success =
                    actions.openEntities();

                return this.setResult({

                    success,

                    intent,

                    action:
                        "entities:open",

                    actionType:
                        "search:run",

                    reason:
                        success
                            ? null
                            : "Varlıklar ekranı açılamadı.",

                    meta: {
                        target:
                            "entities",

                        searchFlow:
                            true
                    }

                });

            }

            return this.fail(
                intent,
                "Bu alan için arama akışı henüz bağlı değil.",
                null,
                "search:run"
            );

        }

        return this.fail(
            intent,
            "İstek anlaşıldı fakat bağlı bir sistem işlemi bulunmuyor."
        );

    },

    /*
     * =====================================================
     * POLICY ACTION HELPERS
     * =====================================================
     */

    resolveDeleteActionType(
        target
    ){

        if(
            target === "world" ||
            target === "worlds"
        ){
            return "world:delete";
        }

        if(
            target === "entity" ||
            target === "entities"
        ){
            return "entity:delete";
        }

        return "record:delete";

    },

    resolveRestoreActionType(
        target
    ){

        if(
            target === "world" ||
            target === "worlds"
        ){
            return "world:restore";
        }

        if(
            target === "entity" ||
            target === "entities"
        ){
            return "entity:restore";
        }

        return "record:restore";

    }

};

VAERO.register(
    "brainActions",
    BrainActions
);
