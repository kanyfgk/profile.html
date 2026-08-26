/* =========================================================
   VAERO BRAIN ACTIONS
   Policy-Aware Engine Action Execution Layer
========================================================= */

const BrainActions = {

    lastResult:
        null,


    /* =====================================================
       SERVICE ACCESS
    ===================================================== */

    getService(name){

        try{

            if(
                typeof VAERO === "undefined" ||
                typeof VAERO.get !== "function"
            ){
                return null;
            }


            return (
                VAERO.get(name) ||
                null
            );

        } catch(error){

            console.warn(
                `Brain Actions servisi okunamadı: ${name}`,
                error
            );


            return null;

        }

    },


    getActions(){

        const registeredActions =
            this.getService(
                "actions"
            );


        if(registeredActions){
            return registeredActions;
        }


        if(
            typeof Actions !==
                "undefined"
        ){
            return Actions;
        }


        return null;

    },


    getEngine(){

        try{

            if(
                typeof VAERO !== "undefined" &&
                VAERO.engine
            ){
                return VAERO.engine;
            }

        } catch(error){

            /* fallback */
        }


        return (
            window.Engine ||
            null
        );

    },


    getPolicy(){

        return (
            this.getService(
                "brainActionPolicy"
            ) ||
            window.BrainActionPolicy ||
            null
        );

    },


    /* =====================================================
       HELPERS
    ===================================================== */

    normalizeValue(value){

        return String(
            value ?? ""
        )
            .trim()
            .toLowerCase();

    },


    clone(value){

        if(
            value === null ||
            value === undefined
        ){
            return value;
        }


        try{

            if(
                typeof structuredClone ===
                    "function"
            ){

                return structuredClone(
                    value
                );

            }

        } catch(error){

            /* fallback */
        }


        try{

            return JSON.parse(
                JSON.stringify(
                    value
                )
            );

        } catch(error){

            return null;

        }

    },


    /* =====================================================
       RESULT
    ===================================================== */

    setResult({
        success,
        intent,
        action,
        reason = null,
        message = null,
        data = null
    }){

        this.lastResult = {

            success:
                Boolean(
                    success
                ),

            executed:
                Boolean(
                    success
                ),

            intent:
                intent ||
                null,

            action:
                action ||
                null,

            reason:
                reason ||
                null,

            message:
                message ||
                (
                    success
                        ? "İşlem tamamlandı."
                        : reason ||
                          "İşlem gerçekleştirilemedi."
                ),

            data:
                data !==
                    undefined
                    ? this.clone(
                        data
                    )
                    : null,

            executedAt:
                Date.now()

        };


        /*
         * BrainCore eski boolean sözleşmesini koruyor.
         * Ayrıntılı sonuç lastResult üzerinden okunur.
         */

        return Boolean(
            success
        );

    },


    /* =====================================================
       SAFE METHOD CALL
    ===================================================== */

    callAction(
        actions,
        method,
        args = []
    ){

        if(
            !actions ||
            typeof actions[method] !==
                "function"
        ){

            return {
                success:false,
                value:null,
                missing:true
            };

        }


        try{

            const value =
                actions[method](
                    ...args
                );


            /*
             * Promise yaşam döngüsü bu katmanda henüz
             * yürütülmüyor.
             */

            if(
                value &&
                typeof value.then ===
                    "function"
            ){

                return {
                    success:false,
                    value:null,
                    missing:false,
                    asyncUnsupported:true
                };

            }


            return {
                success:
                    value !== false,

                value,

                missing:false
            };

        } catch(error){

            console.error(
                `Brain Action başarısız: ${method}`,
                error
            );


            return {
                success:false,
                value:null,
                missing:false,
                error
            };

        }

    },


    /* =====================================================
       POLICY AUTHORIZATION

       BrainActions ikinci güvenlik sınırıdır.
       BrainCore policy kontrol etmiş olsa bile bu katman
       tekrar doğrular.

       Backend authority değildir.
    ===================================================== */

    authorize(
        intent,
        context = {}
    ){

        const policy =
            this.getPolicy();


        if(
            !policy ||
            typeof policy.evaluateIntent !==
                "function"
        ){

            return {
                allowed:false,
                reason:
                    "Brain Action Policy bulunamadı.",
                evaluation:null
            };

        }


        let evaluation =
            null;


        try{

            evaluation =
                policy.evaluateIntent(
                    intent,
                    context
                );

        } catch(error){

            return {
                allowed:false,
                reason:
                    "Brain Action Policy değerlendirilemedi.",
                evaluation:null
            };

        }


        if(
            !evaluation ||
            evaluation.executable !==
                true
        ){

            return {
                allowed:false,
                reason:
                    evaluation?.reason ||
                    "Intent yürütülebilir değil.",
                evaluation
            };

        }


        if(
            evaluation.blocked ===
                true ||
            evaluation.allowed !==
                true
        ){

            return {
                allowed:false,
                reason:
                    evaluation.reason ||
                    "İşlem policy tarafından engellendi.",
                evaluation
            };

        }


        if(
            evaluation.requiresConfirmation
        ){

            if(
                context.confirmed !==
                    true
            ){

                return {
                    allowed:false,
                    reason:
                        evaluation.reason ||
                        "Kullanıcı onayı gerekiyor.",
                    evaluation
                };

            }


            /*
             * BrainCore confirmationId yolunda
             * confirmationMode = bound-confirmation gönderir.
             *
             * legacy-boolean geçici uyumluluk olarak
             * BrainCore tarafından hâlâ üretilebilir.
             */

            const confirmationMode =
                context.confirmationMode ||
                null;


            if(
                confirmationMode !==
                    "bound-confirmation" &&
                confirmationMode !==
                    "legacy-boolean"
            ){

                return {
                    allowed:false,
                    reason:
                        "Onay kaynağı doğrulanamadı.",
                    evaluation
                };

            }

        }


        return {
            allowed:true,
            reason:null,
            evaluation
        };

    },


    /* =====================================================
       EXECUTE
    ===================================================== */

    execute(
        intent,
        context = {}
    ){

        if(
            !intent ||
            typeof intent !==
                "object"
        ){

            return this.setResult({

                success:false,

                intent,

                action:null,

                reason:
                    "Geçerli intent bulunamadı."

            });

        }


        const authorization =
            this.authorize(
                intent,
                context
            );


        if(
            authorization.allowed !==
                true
        ){

            return this.setResult({

                success:false,

                intent,

                action:
                    authorization
                        .evaluation
                        ?.actionType ||
                    null,

                reason:
                    authorization.reason ||
                    "Brain Actions işlemi reddetti."

            });

        }


        const actions =
            this.getActions();


        if(!actions){

            return this.setResult({

                success:false,

                intent,

                action:
                    authorization
                        .evaluation
                        ?.actionType ||
                    null,

                reason:
                    "Actions servisi bulunamadı."

            });

        }


        switch(
            this.normalizeValue(
                intent.type
            )
        ){

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

                return this.executeResumeSave(
                    intent,
                    context,
                    actions
                );


            case "resume:restore":

                return this.executeResumeRestore(
                    intent,
                    actions
                );


            case "request":

                return this.executeRequest(
                    intent,
                    context,
                    actions
                );


            case "application:install":

                return this.executeApplicationInstall(
                    intent
                );


            case "application:update":

                return this.executeApplicationUpdate(
                    intent
                );


            case "application:remove":

                return this.executeApplicationRemove(
                    intent
                );


            case "permission:grant":

                return this.executePermissionGrant(
                    intent
                );


            case "permission:revoke":

                return this.executePermissionRevoke(
                    intent
                );


            case "message:send":

            case "call:start":

            case "screen-share:start":

                return this.executeCommunicationIntent(
                    intent,
                    context
                );


            default:

                return this.setResult({

                    success:false,

                    intent,

                    action:
                        authorization
                            .evaluation
                            ?.actionType ||
                        null,

                    reason:
                        "Bu intent için Brain Actions yürütücüsü bağlı değil."

                });

        }

    },


    /* =====================================================
       NAVIGATION
    ===================================================== */

    executeNavigation(
        intent,
        actions
    ){

        const target =
            this.normalizeValue(
                intent.target
            );


        let result =
            null;


        let action =
            null;


        switch(target){

            case "home":

                result =
                    this.callAction(
                        actions,
                        "openHome"
                    );

                action =
                    "home:open";

                break;


            case "worlds":

                result =
                    this.callAction(
                        actions,
                        "openWorlds"
                    );

                action =
                    "worlds:open";

                break;


            case "world": {

                const engine =
                    this.getEngine();


                const currentWorld =
                    engine?.currentWorld ||
                    null;


                if(
                    currentWorld?.id
                ){

                    result =
                        this.callAction(
                            actions,
                            "openWorld",
                            [
                                currentWorld.id
                            ]
                        );

                    action =
                        "world:open";

                } else {

                    result =
                        this.callAction(
                            actions,
                            "openWorlds"
                        );

                    action =
                        "worlds:open";

                }


                break;

            }


            case "create":

                result =
                    this.callAction(
                        actions,
                        "openCreate"
                    );

                action =
                    "create:open";

                break;


            case "entities":

                result =
                    this.callAction(
                        actions,
                        "openEntities"
                    );

                action =
                    "entities:open";

                break;


            case "identity":

                return this.executeEntityAwareNavigation(
                    "identity",
                    intent,
                    actions
                );


            case "profile":

                return this.executeEntityAwareNavigation(
                    "profile",
                    intent,
                    actions
                );


            case "memory":

            case "timeline":

            case "bridge":

            case "evolution":

            case "organs":

            case "settings":

                result =
                    this.callAction(
                        actions,
                        "openEntityPage",
                        [
                            target
                        ]
                    );

                action =
                    `entity:${target}`;

                break;


            case "applications":

                result =
                    this.callAction(
                        actions,
                        "openApplicationsApp"
                    );

                action =
                    "app:applications";

                break;


            case "vaero":

                result =
                    this.callAction(
                        actions,
                        "openVaeroApp"
                    );

                action =
                    "app:vaero";

                break;


            case "brain":

                result =
                    this.callAction(
                        actions,
                        "openBrain"
                    );

                action =
                    "brain:open";

                break;


            case "discovery":

                return this.executeDiscoveryNavigation(
                    intent,
                    actions
                );


            default:

                return this.setResult({

                    success:false,

                    intent,

                    action:null,

                    reason:
                        `Bilinmeyen navigasyon hedefi: ${target || "boş"}`

                });

        }


        return this.setResult({

            success:
                Boolean(
                    result?.success
                ),

            intent,

            action,

            reason:
                result?.success
                    ? null
                    : result?.missing
                        ? "Bu ekran için gerekli Actions metodu bağlı değil."
                        : result?.asyncUnsupported
                            ? "Bu Actions metodu async çalışıyor ve Brain Actions henüz async yürütme kullanmıyor."
                            : "Hedef ekran açılamadı.",

            message:
                result?.success
                    ? "İlgili ekran açıldı."
                    : null

        });

    },


    /* =====================================================
       DISCOVERY NAVIGATION
    ===================================================== */

    executeDiscoveryNavigation(
        intent,
        actions
    ){

        /*
         * Önce Actions üzerinden varsa gerçek route.
         */

        const directMethods = [
            "openDiscovery",
            "openDiscoveryApp",
            "restartDiscovery"
        ];


        for(
            const method of
            directMethods
        ){

            if(
                typeof actions?.[method] ===
                    "function"
            ){

                const result =
                    this.callAction(
                        actions,
                        method
                    );


                return this.setResult({

                    success:
                        result.success,

                    intent,

                    action:
                        `discovery:${method}`,

                    reason:
                        result.success
                            ? null
                            : "Discovery açılamadı.",

                    message:
                        result.success
                            ? "Discovery açıldı."
                            : null

                });

            }

        }


        /*
         * Uydurma route yok.
         */

        return this.setResult({

            success:false,

            intent,

            action:null,

            reason:
                "Discovery için bağlı Actions route'u bulunamadı."

        });

    },


    /* =====================================================
       ENTITY-AWARE NAVIGATION
    ===================================================== */

    executeEntityAwareNavigation(
        page,
        intent,
        actions
    ){

        const success =
            this.openEntityAwarePage(
                page,
                actions
            );


        return this.setResult({

            success,

            intent,

            action:
                `${page}:open`,

            reason:
                success
                    ? null
                    : `${page} ekranı açılamadı.`,

            message:
                success
                    ? (
                        page === "identity"
                            ? "Kimlik ekranı açıldı."
                            : "Profil ekranı açıldı."
                    )
                    : null

        });

    },


    openEntityAwarePage(
        page,
        actions
    ){

        const engine =
            this.getEngine();


        const openedEntity =
            engine?.currentOpenedEntity ||
            null;


        const rootEntity =
            engine?.rootEntity ||
            null;


        if(
            openedEntity &&
            (
                !rootEntity ||
                openedEntity.id !==
                    rootEntity.id
            )
        ){

            const result =
                this.callAction(
                    actions,
                    "openEntityPage",
                    [
                        page
                    ]
                );


            return Boolean(
                result.success
            );

        }


        const method =
            page === "identity"
                ? "openIdentity"
                : "openProfile";


        const result =
            this.callAction(
                actions,
                method
            );


        return Boolean(
            result.success
        );

    },


    /* =====================================================
       CREATE SURFACE
    ===================================================== */

    executeCreate(
        intent,
        actions
    ){

        const target =
            this.normalizeValue(
                intent.target
            );


        /*
         * Policy tarafında world/entity create intenti
         * gerçek mutation değil app:open kabul ediliyor.
         *
         * Burada yalnız editor surface açılır.
         */


        if(
            target === "world"
        ){

            const result =
                this.callAction(
                    actions,
                    "openCreate"
                );


            return this.setResult({

                success:
                    result.success,

                intent,

                action:
                    "create:open",

                reason:
                    result.success
                        ? null
                        : "World oluşturma ekranı açılamadı.",

                message:
                    result.success
                        ? "World oluşturma ekranı açıldı."
                        : null

            });

        }


        if(
            target === "entity"
        ){

            const engine =
                this.getEngine();


            const currentWorld =
                engine?.currentWorld ||
                null;


            if(!currentWorld){

                const result =
                    this.callAction(
                        actions,
                        "openWorlds"
                    );


                return this.setResult({

                    success:
                        result.success,

                    intent,

                    action:
                        "worlds:open",

                    reason:
                        "Önce Entity'nin ekleneceği World seçilmeli.",

                    message:
                        result.success
                            ? "Önce Entity'nin ekleneceği World'ü seç."
                            : null

                });

            }


            const result =
                this.callAction(
                    actions,
                    "startEntityCreate"
                );


            return this.setResult({

                success:
                    result.success,

                intent,

                action:
                    "entity:create:surface",

                reason:
                    result.success
                        ? null
                        : "Entity oluşturma akışı başlatılamadı.",

                message:
                    result.success
                        ? "Entity oluşturma ekranı açıldı."
                        : null

            });

        }


        return this.setResult({

            success:false,

            intent,

            action:null,

            reason:
                "Oluşturulacak yapı anlaşılamadı."

        });

    },


    /* =====================================================
       RESUME
    ===================================================== */

    executeResumeSave(
        intent,
        context,
        actions
    ){

        const label =
            intent.raw ||
            context.message ||
            "Devam noktası";


        const result =
            this.callAction(
                actions,
                "saveBrainResumePoint",
                [
                    label
                ]
            );


        return this.setResult({

            success:
                result.success,

            intent,

            action:
                "resume:save",

            reason:
                result.success
                    ? null
                    : result.missing
                        ? "Resume kayıt sistemi bağlı değil."
                        : "Devam noktası kaydedilemedi.",

            message:
                result.success
                    ? "Devam noktası kaydedildi."
                    : null

        });

    },


    executeResumeRestore(
        intent,
        actions
    ){

        const result =
            this.callAction(
                actions,
                "restoreBrainResumePoint"
            );


        return this.setResult({

            success:
                result.success,

            intent,

            action:
                "resume:restore",

            reason:
                result.success
                    ? null
                    : result.missing
                        ? "Resume geri yükleme sistemi bağlı değil."
                        : "Devam noktası geri yüklenemedi.",

            message:
                result.success
                    ? "Kaydedilen devam noktasına dönüldü."
                    : null

        });

    },

   /* =====================================================
       REQUEST
    ===================================================== */

    executeRequest(
        intent,
        context,
        actions
    ){

        const target =
            this.normalizeValue(
                intent.target
            );


        const operation =
            this.normalizeValue(
                intent.operation
            );


        /* -------------------------------------------------
           OPEN / VIEW
        ------------------------------------------------- */

        if(
            operation === "open" ||
            operation === "view" ||
            operation === "read"
        ){

            return this.executeNavigation(
                {
                    ...intent,
                    type:"navigate",
                    target
                },
                actions
            );

        }


        /* -------------------------------------------------
           EDIT

           Şu aşamada doğrudan veri değiştirmez.
           Yalnız edit surface açar.
        ------------------------------------------------- */

        if(
            operation === "edit"
        ){

            return this.executeEditSurface(
                intent,
                actions
            );

        }


        /* -------------------------------------------------
           SEARCH
        ------------------------------------------------- */

        if(
            operation === "search"
        ){

            return this.executeSearchSurface(
                intent,
                actions
            );

        }


        /* -------------------------------------------------
           DELETE
        ------------------------------------------------- */

        if(
            operation === "delete" ||
            operation === "remove"
        ){

            return this.executeConfirmedDelete(
                intent,
                context,
                actions
            );

        }


        /* -------------------------------------------------
           ARCHIVE
        ------------------------------------------------- */

        if(
            operation === "archive"
        ){

            return this.executeConfirmedArchive(
                intent,
                context,
                actions
            );

        }


        /* -------------------------------------------------
           RESTORE
        ------------------------------------------------- */

        if(
            operation === "restore"
        ){

            return this.executeConfirmedRestore(
                intent,
                context,
                actions
            );

        }


        /* -------------------------------------------------
           APPLICATION
        ------------------------------------------------- */

        if(
            target === "application" ||
            target === "applications" ||
            target === "app"
        ){

            if(
                operation === "install"
            ){

                return this.executeApplicationInstall(
                    intent
                );

            }


            if(
                operation === "update"
            ){

                return this.executeApplicationUpdate(
                    intent
                );

            }

        }


        return this.setResult({

            success:false,

            intent,

            action:null,

            reason:
                "İstek anlaşıldı fakat bağlı bir sistem işlemi bulunmuyor."

        });

    },


    /* =====================================================
       EDIT SURFACES
    ===================================================== */

    executeEditSurface(
        intent,
        actions
    ){

        const target =
            this.normalizeValue(
                intent.target
            );


        if(
            target === "profile"
        ){

            return this.executeEntityAwareNavigation(
                "profile",
                intent,
                actions
            );

        }


        if(
            target === "identity"
        ){

            return this.executeEntityAwareNavigation(
                "identity",
                intent,
                actions
            );

        }


        if(
            target === "settings"
        ){

            const result =
                this.callAction(
                    actions,
                    "openEntityPage",
                    [
                        "settings"
                    ]
                );


            return this.setResult({

                success:
                    result.success,

                intent,

                action:
                    "entity:settings",

                reason:
                    result.success
                        ? null
                        : "Settings açılamadı.",

                message:
                    result.success
                        ? "Ayarlar ekranı açıldı."
                        : null

            });

        }


        if(
            target === "world"
        ){

            /*
             * Actions-v2 içindeki gerçek editor surface
             * varsa kullanılır.
             */

            const methods = [
                "openWorldEdit",
                "startWorldEdit"
            ];


            for(
                const method of
                methods
            ){

                if(
                    typeof actions?.[method] ===
                        "function"
                ){

                    const result =
                        this.callAction(
                            actions,
                            method
                        );


                    return this.setResult({

                        success:
                            result.success,

                        intent,

                        action:
                            "world:edit:surface",

                        reason:
                            result.success
                                ? null
                                : "World editor açılamadı.",

                        message:
                            result.success
                                ? "World düzenleme ekranı açıldı."
                                : null

                    });

                }

            }

        }


        if(
            target === "entity"
        ){

            const methods = [
                "openEntityEdit",
                "startEntityEdit"
            ];


            for(
                const method of
                methods
            ){

                if(
                    typeof actions?.[method] ===
                        "function"
                ){

                    const result =
                        this.callAction(
                            actions,
                            method
                        );


                    return this.setResult({

                        success:
                            result.success,

                        intent,

                        action:
                            "entity:edit:surface",

                        reason:
                            result.success
                                ? null
                                : "Entity editor açılamadı.",

                        message:
                            result.success
                                ? "Entity düzenleme ekranı açıldı."
                                : null

                    });

                }

            }

        }


        const entityPages =
            new Set([
                "memory",
                "timeline",
                "bridge",
                "evolution",
                "organs"
            ]);


        if(
            entityPages.has(
                target
            )
        ){

            const result =
                this.callAction(
                    actions,
                    "openEntityPage",
                    [
                        target
                    ]
                );


            return this.setResult({

                success:
                    result.success,

                intent,

                action:
                    `entity:${target}`,

                reason:
                    result.success
                        ? null
                        : "İlgili yönetim yüzeyi açılamadı.",

                message:
                    result.success
                        ? "İlgili yönetim yüzeyi açıldı."
                        : null

            });

        }


        return this.setResult({

            success:false,

            intent,

            action:null,

            reason:
                "Bu hedef için bağlı bir düzenleme yüzeyi bulunmuyor."

        });

    },


    /* =====================================================
       SEARCH SURFACES
    ===================================================== */

    executeSearchSurface(
        intent,
        actions
    ){

        const target =
            this.normalizeValue(
                intent.target
            );


        if(
            target === "world" ||
            target === "worlds"
        ){

            const result =
                this.callAction(
                    actions,
                    "openWorlds"
                );


            return this.setResult({

                success:
                    result.success,

                intent,

                action:
                    "worlds:open",

                reason:
                    result.success
                        ? null
                        : "Worlds açılamadı.",

                message:
                    result.success
                        ? "Worlds listesi açıldı."
                        : null

            });

        }


        if(
            target === "entity" ||
            target === "entities"
        ){

            const result =
                this.callAction(
                    actions,
                    "openEntities"
                );


            return this.setResult({

                success:
                    result.success,

                intent,

                action:
                    "entities:open",

                reason:
                    result.success
                        ? null
                        : "Entities açılamadı.",

                message:
                    result.success
                        ? "Entities listesi açıldı."
                        : null

            });

        }


        if(
            target === "application" ||
            target === "applications" ||
            target === "app"
        ){

            const result =
                this.callAction(
                    actions,
                    "openApplicationsApp"
                );


            return this.setResult({

                success:
                    result.success,

                intent,

                action:
                    "app:applications",

                reason:
                    result.success
                        ? null
                        : "Applications açılamadı.",

                message:
                    result.success
                        ? "Applications açıldı."
                        : null

            });

        }


        /*
         * Global Search uygulaması henüz bağlanmadı.
         * Sahte arama sonucu üretilmez.
         */

        return this.setResult({

            success:false,

            intent,

            action:null,

            reason:
                "Bu hedef için gerçek Search uygulaması henüz Brain Actions'a bağlı değil."

        });

    },


    /* =====================================================
       APPLICATION IDENTIFIER
    ===================================================== */

    resolveApplicationId(intent){

        const candidates = [

            intent?.appId,

            intent?.applicationId,

            intent?.id,

            intent?.subjectId,

            intent?.value

        ];


        const id =
            candidates.find(
                value =>
                    typeof value ===
                        "string" &&
                    value.trim()
            );


        return id
            ? id.trim()
            : null;

    },


    /* =====================================================
       APPLICATION INSTALL
    ===================================================== */

    executeApplicationInstall(
        intent
    ){

        const appId =
            this.resolveApplicationId(
                intent
            );


        if(!appId){

            return this.setResult({

                success:false,

                intent,

                action:
                    "application:install",

                reason:
                    "Kurulacak application ID belirtilmedi."

            });

        }


        const app =
            window.ApplicationsApp ||
            null;


        if(
            !app ||
            typeof app.install !==
                "function"
        ){

            return this.setResult({

                success:false,

                intent,

                action:
                    "application:install",

                reason:
                    "Applications install motoru bağlı değil."

            });

        }


        try{

            const success =
                app.install(
                    appId
                ) === true;


            return this.setResult({

                success,

                intent,

                action:
                    "application:install",

                reason:
                    success
                        ? null
                        : "Application kurulamadı veya güvenlik doğrulaması tamamlanmadı.",

                message:
                    success
                        ? "Application kuruldu."
                        : null,

                data:{
                    appId
                }

            });

        } catch(error){

            return this.setResult({

                success:false,

                intent,

                action:
                    "application:install",

                reason:
                    "Application kurulumu sırasında hata oluştu."

            });

        }

    },


    /* =====================================================
       APPLICATION UPDATE
    ===================================================== */

    executeApplicationUpdate(
        intent
    ){

        const appId =
            this.resolveApplicationId(
                intent
            );


        if(!appId){

            return this.setResult({

                success:false,

                intent,

                action:
                    "application:update",

                reason:
                    "Güncellenecek application ID belirtilmedi."

            });

        }


        const app =
            window.ApplicationsApp ||
            null;


        if(
            !app ||
            typeof app.updateApplication !==
                "function"
        ){

            return this.setResult({

                success:false,

                intent,

                action:
                    "application:update",

                reason:
                    "Applications update motoru bağlı değil."

            });

        }


        try{

            const success =
                app.updateApplication(
                    appId
                ) !== false;


            return this.setResult({

                success,

                intent,

                action:
                    "application:update",

                reason:
                    success
                        ? null
                        : "Application güncellenemedi.",

                message:
                    success
                        ? "Application güncellendi."
                        : null,

                data:{
                    appId
                }

            });

        } catch(error){

            return this.setResult({

                success:false,

                intent,

                action:
                    "application:update",

                reason:
                    "Application güncellemesi sırasında hata oluştu."

            });

        }

    },


    /* =====================================================
       APPLICATION REMOVE
    ===================================================== */

    executeApplicationRemove(
        intent
    ){

        const appId =
            this.resolveApplicationId(
                intent
            );


        if(!appId){

            return this.setResult({

                success:false,

                intent,

                action:
                    "application:remove",

                reason:
                    "Kaldırılacak application ID belirtilmedi."

            });

        }


        const app =
            window.ApplicationsApp ||
            null;


        if(
            !app ||
            typeof app.remove !==
                "function"
        ){

            return this.setResult({

                success:false,

                intent,

                action:
                    "application:remove",

                reason:
                    "Applications remove motoru bağlı değil."

            });

        }


        try{

            const success =
                app.remove(
                    appId
                ) !== false;


            return this.setResult({

                success,

                intent,

                action:
                    "application:remove",

                reason:
                    success
                        ? null
                        : "Application kaldırılamadı.",

                message:
                    success
                        ? "Application kaldırıldı."
                        : null,

                data:{
                    appId
                }

            });

        } catch(error){

            return this.setResult({

                success:false,

                intent,

                action:
                    "application:remove",

                reason:
                    "Application kaldırma sırasında hata oluştu."

            });

        }

    },


    /* =====================================================
       PERMISSION IDENTIFIERS
    ===================================================== */

    resolvePermission(
        intent
    ){

        const value =
            intent?.permission ||
            intent?.permissionId ||
            null;


        return typeof value ===
            "string"
            ? value.trim()
            : null;

    },


    /* =====================================================
       PERMISSION GRANT
    ===================================================== */

    executePermissionGrant(
        intent
    ){

        const appId =
            this.resolveApplicationId(
                intent
            );


        const permission =
            this.resolvePermission(
                intent
            );


        if(
            !appId ||
            !permission
        ){

            return this.setResult({

                success:false,

                intent,

                action:
                    "permission:grant",

                reason:
                    "Application ve permission bilgisi gerekli."

            });

        }


        const app =
            window.ApplicationsApp ||
            null;


        if(
            !app ||
            typeof app.grantRequestedPermission !==
                "function"
        ){

            return this.setResult({

                success:false,

                intent,

                action:
                    "permission:grant",

                reason:
                    "Permission yönetim motoru bağlı değil."

            });

        }


        try{

            const result =
                app.grantRequestedPermission(
                    appId,
                    permission
                );


            const success =
                result !== false;


            return this.setResult({

                success,

                intent,

                action:
                    "permission:grant",

                reason:
                    success
                        ? null
                        : "Permission verilemedi.",

                message:
                    success
                        ? "Permission verildi."
                        : null,

                data:{
                    appId,
                    permission
                }

            });

        } catch(error){

            return this.setResult({

                success:false,

                intent,

                action:
                    "permission:grant",

                reason:
                    "Permission verme işlemi başarısız."

            });

        }

    },


    /* =====================================================
       PERMISSION REVOKE
    ===================================================== */

    executePermissionRevoke(
        intent
    ){

        const appId =
            this.resolveApplicationId(
                intent
            );


        const permission =
            this.resolvePermission(
                intent
            );


        if(
            !appId ||
            !permission
        ){

            return this.setResult({

                success:false,

                intent,

                action:
                    "permission:revoke",

                reason:
                    "Application ve permission bilgisi gerekli."

            });

        }


        const app =
            window.ApplicationsApp ||
            null;


        if(
            !app ||
            typeof app.revokePermission !==
                "function"
        ){

            return this.setResult({

                success:false,

                intent,

                action:
                    "permission:revoke",

                reason:
                    "Permission yönetim motoru bağlı değil."

            });

        }


        try{

            const result =
                app.revokePermission(
                    appId,
                    permission
                );


            const success =
                result !== false;


            return this.setResult({

                success,

                intent,

                action:
                    "permission:revoke",

                reason:
                    success
                        ? null
                        : "Permission kaldırılamadı.",

                message:
                    success
                        ? "Permission kaldırıldı."
                        : null,

                data:{
                    appId,
                    permission
                }

            });

        } catch(error){

            return this.setResult({

                success:false,

                intent,

                action:
                    "permission:revoke",

                reason:
                    "Permission kaldırma işlemi başarısız."

            });

        }

    },


    /* =====================================================
       CONFIRMED ARCHIVE
    ===================================================== */

    executeConfirmedArchive(
        intent,
        context,
        actions
    ){

        if(
            context.confirmed !==
                true
        ){

            return this.setResult({

                success:false,

                intent,

                action:null,

                reason:
                    "Arşivleme işlemi kullanıcı onayı gerektiriyor."

            });

        }


        const target =
            this.normalizeValue(
                intent.target
            );


        if(
            target === "world" ||
            target === "worlds"
        ){

            const method =
                typeof actions.archiveWorld ===
                    "function"
                    ? "archiveWorld"
                    : typeof actions.archiveCurrentWorld ===
                        "function"
                        ? "archiveCurrentWorld"
                        : null;


            if(method){

                const result =
                    this.callAction(
                        actions,
                        method
                    );


                return this.setResult({

                    success:
                        result.success,

                    intent,

                    action:
                        "world:archive",

                    reason:
                        result.success
                            ? null
                            : "World arşivlenemedi.",

                    message:
                        result.success
                            ? "World arşivlendi."
                            : null

                });

            }

        }


        if(
            target === "entity" ||
            target === "entities"
        ){

            const method =
                typeof actions.archiveEntity ===
                    "function"
                    ? "archiveEntity"
                    : typeof actions.archiveCurrentEntity ===
                        "function"
                        ? "archiveCurrentEntity"
                        : null;


            if(method){

                const result =
                    this.callAction(
                        actions,
                        method
                    );


                return this.setResult({

                    success:
                        result.success,

                    intent,

                    action:
                        "entity:archive",

                    reason:
                        result.success
                            ? null
                            : "Entity arşivlenemedi.",

                    message:
                        result.success
                            ? "Entity arşivlendi."
                            : null

                });

            }

        }


        return this.setResult({

            success:false,

            intent,

            action:null,

            reason:
                "Bu hedef için doğrulanmış archive bağlantısı bulunmuyor."

        });

    },


    /* =====================================================
       CONFIRMED DELETE
    ===================================================== */

    executeConfirmedDelete(
        intent,
        context,
        actions
    ){

        if(
            context.confirmed !==
                true
        ){

            return this.setResult({

                success:false,

                intent,

                action:null,

                reason:
                    "Silme işlemi kullanıcı onayı gerektiriyor."

            });

        }


        const target =
            this.normalizeValue(
                intent.target
            );


        /*
         * Hard delete metodunu ancak gerçekten mevcutsa
         * kullanıyoruz.
         */


        if(
            target === "world" ||
            target === "worlds"
        ){

            const methods = [
                "deleteWorld",
                "removeWorld"
            ];


            for(
                const method of
                methods
            ){

                if(
                    typeof actions?.[method] ===
                        "function"
                ){

                    const result =
                        this.callAction(
                            actions,
                            method
                        );


                    return this.setResult({

                        success:
                            result.success,

                        intent,

                        action:
                            "world:delete",

                        reason:
                            result.success
                                ? null
                                : "World silinemedi.",

                        message:
                            result.success
                                ? "World silindi."
                                : null

                    });

                }

            }

        }


        if(
            target === "entity" ||
            target === "entities"
        ){

            const methods = [
                "deleteEntity",
                "removeEntity"
            ];


            for(
                const method of
                methods
            ){

                if(
                    typeof actions?.[method] ===
                        "function"
                ){

                    const result =
                        this.callAction(
                            actions,
                            method
                        );


                    return this.setResult({

                        success:
                            result.success,

                        intent,

                        action:
                            "entity:delete",

                        reason:
                            result.success
                                ? null
                                : "Entity silinemedi.",

                        message:
                            result.success
                                ? "Entity silindi."
                                : null

                    });

                }

            }

        }


        return this.setResult({

            success:false,

            intent,

            action:null,

            reason:
                "Onay alındı ancak bu hedef için doğrulanmış hard-delete motoru bağlı değil.",

            message:
                "Hiçbir veri silinmedi."

        });

    },


    /* =====================================================
       CONFIRMED RESTORE
    ===================================================== */

    executeConfirmedRestore(
        intent,
        context,
        actions
    ){

        if(
            context.confirmed !==
                true
        ){

            return this.setResult({

                success:false,

                intent,

                action:null,

                reason:
                    "Geri yükleme işlemi kullanıcı onayı gerektiriyor."

            });

        }


        const target =
            this.normalizeValue(
                intent.target
            );


        if(
            target === "world" ||
            target === "worlds"
        ){

            const method =
                typeof actions.restoreWorld ===
                    "function"
                    ? "restoreWorld"
                    : null;


            if(method){

                const result =
                    this.callAction(
                        actions,
                        method
                    );


                return this.setResult({

                    success:
                        result.success,

                    intent,

                    action:
                        "world:restore",

                    reason:
                        result.success
                            ? null
                            : "World geri yüklenemedi.",

                    message:
                        result.success
                            ? "World geri yüklendi."
                            : null

                });

            }

        }


        if(
            target === "entity" ||
            target === "entities"
        ){

            const method =
                typeof actions.restoreEntity ===
                    "function"
                    ? "restoreEntity"
                    : null;


            if(method){

                const result =
                    this.callAction(
                        actions,
                        method
                    );


                return this.setResult({

                    success:
                        result.success,

                    intent,

                    action:
                        "entity:restore",

                    reason:
                        result.success
                            ? null
                            : "Entity geri yüklenemedi.",

                    message:
                        result.success
                            ? "Entity geri yüklendi."
                            : null

                });

            }

        }


        return this.setResult({

            success:false,

            intent,

            action:null,

            reason:
                "Onay alındı ancak bu hedef için doğrulanmış restore motoru bağlı değil.",

            message:
                "Hiçbir kayıt değiştirilmedi."

        });

    },


    /* =====================================================
       COMMUNICATION

       UI ve gerçek communication service henüz kurulmadığı
       için gönderim / arama / ekran paylaşımı taklit edilmez.
    ===================================================== */

    executeCommunicationIntent(
        intent,
        context = {}
    ){

        const type =
            this.normalizeValue(
                intent.type
            );


        const service =
            this.getService(
                "communication"
            );


        if(!service){

            return this.setResult({

                success:false,

                intent,

                action:
                    type,

                reason:
                    "Communication Core henüz bağlı değil.",

                message:
                    "İletişim altyapısı kurulmadan bu işlem uygulanmayacak."

            });

        }


        const methodMap = {

            "message:send":
                "sendMessage",

            "call:start":
                "startCall",

            "screen-share:start":
                "startScreenShare"

        };


        const method =
            methodMap[
                type
            ];


        if(
            !method ||
            typeof service[method] !==
                "function"
        ){

            return this.setResult({

                success:false,

                intent,

                action:
                    type,

                reason:
                    "Communication işlemi için gerekli runtime metodu bağlı değil."

            });

        }


        try{

            const result =
                service[method](
                    intent,
                    context
                );


            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                return this.setResult({

                    success:false,

                    intent,

                    action:
                        type,

                    reason:
                        "Async Communication execution henüz BrainActions synchronous zincirine bağlanmadı."

                });

            }


            const success =
                result !== false;


            return this.setResult({

                success,

                intent,

                action:
                    type,

                reason:
                    success
                        ? null
                        : "Communication işlemi başlatılamadı.",

                message:
                    success
                        ? "Communication işlemi başlatıldı."
                        : null,

                data:
                    result &&
                    typeof result ===
                        "object"
                        ? result
                        : null

            });

        } catch(error){

            return this.setResult({

                success:false,

                intent,

                action:
                    type,

                reason:
                    "Communication işlemi sırasında hata oluştu."

            });

        }

    },


    /* =====================================================
       STATUS
    ===================================================== */

    status(){

        const actions =
            this.getActions();


        const policy =
            this.getPolicy();


        return {

            available:
                Boolean(
                    actions
                ),

            engineAvailable:
                Boolean(
                    this.getEngine()
                ),

            policyAvailable:
                Boolean(
                    policy
                ),

            applicationsAvailable:
                Boolean(
                    window.ApplicationsApp
                ),

            communicationAvailable:
                Boolean(
                    this.getService(
                        "communication"
                    )
                ),

            hasLastResult:
                Boolean(
                    this.lastResult
                ),

            lastResult:
                this.lastResult
                    ? this.clone(
                        this.lastResult
                    )
                    : null

        };

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const status =
            this.status();


        return {

            ...status,

            layers:{

                actions:
                    status.available,

                policy:
                    status.policyAvailable,

                engine:
                    status.engineAvailable,

                applications:
                    status
                        .applicationsAvailable,

                communication:
                    status
                        .communicationAvailable

            }

        };

    }

};


VAERO.register(
    "brainActions",
    BrainActions
);


window.BrainActions =
    BrainActions;
