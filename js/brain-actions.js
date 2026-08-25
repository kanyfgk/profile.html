/* =========================================================
   VAERO BRAIN ACTIONS
   Safe Engine Action Execution Layer
========================================================= */

const BrainActions = {

    lastResult: null,


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

            /* window fallback below */
        }


        if(
            typeof window !== "undefined" &&
            window.Engine
        ){
            return window.Engine;
        }


        return null;

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
                Boolean(success),

            executed:
                Boolean(success),

            intent:
                intent || null,

            action:
                action || null,

            reason:
                reason || null,

            message:
                message ||
                (
                    success
                        ? "İşlem tamamlandı."
                        : reason ||
                          "İşlem gerçekleştirilemedi."
                ),

            data:
                data || null,

            executedAt:
                Date.now()

        };


        /*
         * Mevcut sistemin boolean dönüş beklentisini
         * koruyoruz. BrainCore ayrıntılı sonucu
         * lastResult üzerinden alabiliyor.
         */

        return Boolean(success);

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


        const actions =
            this.getActions();


        if(!actions){

            return this.setResult({

                success:false,

                intent,

                action:null,

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


            default:

                return this.setResult({

                    success:false,

                    intent,

                    action:null,

                    reason:
                        "Bu intent doğrudan sistem işlemi gerektirmiyor."

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
            String(
                intent.target ||
                ""
            );


        let result = null;

        let action = null;


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


                if(currentWorld?.id){

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


            case "brain":

                result =
                    this.callAction(
                        actions,
                        "openBrain"
                    );

                action =
                    "brain:open";

                break;


            /*
             * Discovery onboarding ekranıdır.
             * Normal entity page gibi açmıyoruz.
             */

            case "discovery":

                return this.setResult({

                    success:false,

                    intent,

                    action:null,

                    reason:
                        "Discovery normal bir varlık uygulaması değildir.",

                    message:
                        "Discovery onboarding akışından yönetiliyor."

                });


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
                        : "Hedef ekran açılamadı.",

            message:
                result?.success
                    ? "İlgili ekran açıldı."
                    : null

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
                    ? `${page === "identity"
                        ? "Kimlik"
                        : "Profil"} ekranı açıldı.`
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


        /*
         * Özel bir varlık açıksa uygulamayı
         * doğrudan o varlığın bağlamında aç.
         */

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
       CREATE
    ===================================================== */

    executeCreate(
        intent,
        actions
    ){

        if(
            intent.target ===
            "world"
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
                        : "Dünya oluşturma ekranı açılamadı.",

                message:
                    result.success
                        ? "Dünya oluşturma ekranı açıldı."
                        : null

            });

        }


        if(
            intent.target ===
            "entity"
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
                        "Önce varlığın ekleneceği dünya seçilmeli.",

                    message:
                        result.success
                            ? "Önce varlığın ekleneceği dünyayı seç."
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
                    "entity:create:first",

                reason:
                    result.success
                        ? null
                        : "Varlık oluşturma akışı başlatılamadı.",

                message:
                    result.success
                        ? "Varlık oluşturma ekranı açıldı."
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
            String(
                intent.target ||
                ""
            );


        const operation =
            String(
                intent.operation ||
                ""
            );


        /* -------------------------------------------------
           DELETE

           BrainCore buraya yalnız confirmation sonrası
           ulaşabilir. Fakat gerçek destructive API
           bağlı değilse işlem uydurulmaz.
        ------------------------------------------------- */

        if(
            operation ===
            "delete"
        ){

            return this.executeConfirmedDelete(
                intent,
                context,
                actions
            );

        }


        /* -------------------------------------------------
           RESTORE
        ------------------------------------------------- */

        if(
            operation ===
            "restore"
        ){

            return this.executeConfirmedRestore(
                intent,
                context,
                actions
            );

        }


        /* -------------------------------------------------
           EDIT
           Şimdilik ilgili yönetim yüzeyini açar.
        ------------------------------------------------- */

        if(
            operation ===
            "edit"
        ){

            if(
                target ===
                "profile"
            ){

                return this.executeEntityAwareNavigation(
                    "profile",
                    intent,
                    actions
                );

            }


            if(
                target ===
                "identity"
            ){

                return this.executeEntityAwareNavigation(
                    "identity",
                    intent,
                    actions
                );

            }


            if(
                target ===
                "settings"
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


            return this.setResult({

                success:false,

                intent,

                action:null,

                reason:
                    "Bu hedef için düzenleme yüzeyi bağlı değil."

            });

        }


        /* -------------------------------------------------
           SEARCH

           Gerçek arama motoru henüz BrainActions
           tarafından sağlanmıyor. Desteklenen hedeflerde
           ilgili liste ekranı açılır.
        ------------------------------------------------- */

        if(
            operation ===
            "search"
        ){

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
                            : "Dünyalar açılamadı.",

                    message:
                        result.success
                            ? "Dünyalar listesi açıldı."
                            : null

                });

            }


            if(
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
                            : "Varlıklar açılamadı.",

                    message:
                        result.success
                            ? "Varlıklar listesi açıldı."
                            : null

                });

            }


            return this.setResult({

                success:false,

                intent,

                action:null,

                reason:
                    "Bu hedef için gerçek arama işlemi henüz bağlı değil."

            });

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
       CONFIRMED DESTRUCTIVE OPERATIONS
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


        /*
         * Henüz Actions katmanında doğrulanmış
         * destructive API görmedik.
         *
         * deleteWorld / deleteEntity / deleteRecord gibi
         * fonksiyonlar uydurulmuyor.
         */

        return this.setResult({

            success:false,

            intent,

            action:null,

            reason:
                "Silme işlemi için doğrulanmış sistem bağlantısı henüz mevcut değil.",

            message:
                "Onay alındı ancak bağlı bir silme motoru olmadığı için hiçbir veri değiştirilmedi."

        });

    },


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


        /*
         * Resume restore ayrı ve güvenli akıştır.
         * Generic record restore için gerçek API
         * görülmeden işlem yapılmaz.
         */

        return this.setResult({

            success:false,

            intent,

            action:null,

            reason:
                "Kayıt geri yükleme motoru henüz Brain Actions katmanına bağlı değil.",

            message:
                "Onay alındı ancak doğrulanmış geri yükleme bağlantısı olmadığı için veri değiştirilmedi."

        });

    },


    /* =====================================================
       STATUS
    ===================================================== */

    status(){

        const actions =
            this.getActions();


        return {

            available:
                Boolean(actions),

            engineAvailable:
                Boolean(
                    this.getEngine()
                ),

            hasLastResult:
                Boolean(
                    this.lastResult
                ),

            lastResult:
                this.lastResult
                    ? {
                        ...this.lastResult
                    }
                    : null

        };

    }

};


VAERO.register(
    "brainActions",
    BrainActions
);


window.BrainActions =
    BrainActions;
