/* =========================================================
   VAERO BRAIN ACTIONS
   Policy-Aware Engine Action Execution Layer
========================================================= */

const BrainActions = {

    version:
        "3.0.0",

    lastResult:
        null,

    executionSequence:
        0,


    /* =====================================================
       SERVICE ACCESS
    ===================================================== */

    getService(name){

        const serviceName =
            String(
                name ??
                ""
            ).trim();


        if(!serviceName){

            return null;

        }


        try{

            if(
                typeof VAERO ===
                    "undefined" ||
                typeof VAERO.get !==
                    "function"
            ){

                return null;

            }


            return (
                VAERO.get(
                    serviceName
                ) ||
                null
            );

        } catch(error){

            console.warn(
                `Brain Actions servisi okunamadı: ${serviceName}`,
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


        try{

            if(
                typeof Actions !==
                    "undefined"
            ){

                return Actions;

            }

        } catch(error){

            /* global fallback unavailable */

        }


        if(
            typeof window !==
                "undefined" &&
            window.Actions
        ){

            return window.Actions;

        }


        return null;

    },


    getEngine(){

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                VAERO.engine
            ){

                return VAERO.engine;

            }

        } catch(error){

            /* fallback below */

        }


        if(
            typeof window !==
                "undefined" &&
            window.Engine
        ){

            return window.Engine;

        }


        return null;

    },


    getPolicy(){

        return (
            this.getService(
                "brainActionPolicy"
            ) ||
            (
                typeof window !==
                    "undefined"
                    ? (
                        window.BrainActionPolicy ||
                        null
                    )
                    : null
            )
        );

    },


    getApplicationsApp(){

        if(
            typeof window ===
                "undefined"
        ){

            return null;

        }


        return (
            window.ApplicationsApp ||
            null
        );

    },


    /* =====================================================
       HELPERS
    ===================================================== */

    normalizeValue(value){

        return String(
            value ??
                ""
        )
            .trim()
            .toLowerCase();

    },


    normalizeIdentifier(value){

        const id =
            String(
                value ??
                    ""
            )
                .trim()
                .slice(
                    0,
                    240
                );


        return (
            id ||
            null
        );

    },


    clone(value){

        if(
            value ===
                null ||
            value ===
                undefined
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

            /* JSON fallback */

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
        executed = null,
        blocked = false,
        intent,
        action,
        reason = null,
        message = null,
        data = null,
        error = null
    }){

        const succeeded =
            success ===
                true;


        const wasExecuted =
            executed ===
                null
                ? succeeded
                : executed ===
                    true;


        const now =
            Date.now();


        this.lastResult = {

            id:
                `brain_action_${now}_${++this.executionSequence}`,

            success:
                succeeded,

            executed:
                wasExecuted,

            blocked:
                blocked ===
                    true,

            intent:
                this.clone(
                    intent
                ) ||
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
                    succeeded
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

            error:
                error
                    ? (
                        error?.message ||
                        String(
                            error
                        )
                    )
                    : null,

            executedAt:
                now

        };


        return this.lastResult;

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
            typeof actions[
                method
            ] !==
                "function"
        ){

            return {

                success:
                    false,

                value:
                    null,

                missing:
                    true,

                asyncUnsupported:
                    false,

                error:
                    null

            };

        }


        try{

            const value =
                actions[
                    method
                ](
                    ...args
                );


            /*
             * BrainCore → BrainActions execution chain is
             * currently synchronous.
             *
             * A Promise is never interpreted as a successful
             * mutation.
             */

            if(
                value &&
                typeof value.then ===
                    "function"
            ){

                return {

                    success:
                        false,

                    value:
                        null,

                    missing:
                        false,

                    asyncUnsupported:
                        true,

                    error:
                        null

                };

            }


            return {

                success:
                    value !==
                        false,

                value,

                missing:
                    false,

                asyncUnsupported:
                    false,

                error:
                    null

            };

        } catch(error){

            console.error(
                `Brain Action başarısız: ${method}`,
                error
            );


            return {

                success:
                    false,

                value:
                    null,

                missing:
                    false,

                asyncUnsupported:
                    false,

                error

            };

        }

    },


    /* =====================================================
       ACTION RESULT
    ===================================================== */

    resultFromActionCall({
        result,
        intent,
        action,
        successMessage,
        failureMessage,
        missingMessage = null,
        asyncMessage = null,
        data = null
    }){

        const success =
            result?.success ===
                true;


        let reason =
            null;


        if(!success){

            if(
                result?.missing ===
                    true
            ){

                reason =
                    missingMessage ||
                    "Gerekli Actions metodu bağlı değil.";

            }
            else if(
                result?.asyncUnsupported ===
                    true
            ){

                reason =
                    asyncMessage ||
                    "Bu Actions metodu async çalışıyor ve synchronous Brain Actions zincirinde yürütülemiyor.";

            }
            else {

                reason =
                    result?.error
                        ?.message ||
                    failureMessage ||
                    "İşlem tamamlanamadı.";

            }

        }


        return this.setResult({

            success,

            executed:
                success,

            intent,

            action,

            reason,

            message:
                success
                    ? successMessage ||
                      "İşlem tamamlandı."
                    : null,

            data:
                data !==
                    null
                    ? data
                    : (
                        result?.value &&
                        typeof result.value ===
                            "object"
                            ? result.value
                            : null
                    ),

            error:
                result?.error ||
                null

        });

    },


    /* =====================================================
       POLICY AUTHORIZATION

       BrainActions is the second local safety boundary.

       BrainCore evaluates policy before calling this layer,
       but BrainActions never trusts that first evaluation
       blindly.

       This remains a client/runtime boundary, not backend
       authorization.
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

                allowed:
                    false,

                reason:
                    "Brain Action Policy bulunamadı.",

                evaluation:
                    null

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

                allowed:
                    false,

                reason:
                    "Brain Action Policy değerlendirilemedi.",

                evaluation:
                    null

            };

        }


        if(
            !evaluation ||
            evaluation.executable !==
                true
        ){

            return {

                allowed:
                    false,

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

                allowed:
                    false,

                reason:
                    evaluation.reason ||
                    "İşlem policy tarafından engellendi.",

                evaluation

            };

        }


        /*
         * Confirmation is accepted only from BrainCore's
         * bound-confirmation path.
         *
         * confirmed:true by itself is not authority.
         */

        if(
            evaluation.requiresConfirmation ===
                true
        ){

            if(
                context.confirmed !==
                    true
            ){

                return {

                    allowed:
                        false,

                    reason:
                        evaluation.reason ||
                        "Kullanıcı onayı gerekiyor.",

                    evaluation

                };

            }


            if(
                context.confirmationMode !==
                    "bound-confirmation"
            ){

                return {

                    allowed:
                        false,

                    reason:
                        "Onay kaynağı doğrulanamadı.",

                    evaluation

                };

            }


            if(
                !context.confirmationId
            ){

                return {

                    allowed:
                        false,

                    reason:
                        "Bağlı confirmation kimliği bulunamadı.",

                    evaluation

                };

            }

        }


        return {

            allowed:
                true,

            reason:
                null,

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
                "object" ||
            Array.isArray(
                intent
            )
        ){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    null,

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

                success:
                    false,

                executed:
                    false,

                blocked:
                    true,

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

                success:
                    false,

                executed:
                    false,

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

                    success:
                        false,

                    executed:
                        false,

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

                }
                else {

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

                    success:
                        false,

                    executed:
                        false,

                    intent,

                    action:
                        null,

                    reason:
                        `Bilinmeyen navigasyon hedefi: ${target || "boş"}`

                });

        }


        return this.resultFromActionCall({

            result,

            intent,

            action,

            successMessage:
                "İlgili ekran açıldı.",

            failureMessage:
                "Hedef ekran açılamadı.",

            missingMessage:
                "Bu ekran için gerekli Actions metodu bağlı değil.",

            asyncMessage:
                "Bu Actions metodu async çalışıyor ve Brain Actions synchronous zincirinde yürütülemiyor."

        });

    },


    /* =====================================================
       DISCOVERY NAVIGATION
    ===================================================== */

    executeDiscoveryNavigation(
        intent,
        actions
    ){

        const directMethods = [

            "openDiscovery",
            "openDiscoveryApp",
            "restartDiscovery"

        ];


        for(
            const method of directMethods
        ){

            if(
                typeof actions?.[
                    method
                ] !==
                    "function"
            ){

                continue;

            }


            const result =
                this.callAction(
                    actions,
                    method
                );


            return this.resultFromActionCall({

                result,

                intent,

                action:
                    `discovery:${method}`,

                successMessage:
                    "Discovery açıldı.",

                failureMessage:
                    "Discovery açılamadı."

            });

        }


        return this.setResult({

            success:
                false,

            executed:
                false,

            intent,

            action:
                null,

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

        const result =
            this.openEntityAwarePage(
                page,
                actions
            );


        return this.setResult({

            success:
                result.success,

            executed:
                result.success,

            intent,

            action:
                `${page}:open`,

            reason:
                result.success
                    ? null
                    : result.reason ||
                      `${page} ekranı açılamadı.`,

            message:
                result.success
                    ? (
                        page ===
                            "identity"
                            ? "Kimlik ekranı açıldı."
                            : "Profil ekranı açıldı."
                    )
                    : null,

            error:
                result.error ||
                null

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


            return {

                success:
                    result.success,

                reason:
                    result.missing
                        ? "Entity page route'u bağlı değil."
                        : result.asyncUnsupported
                            ? "Entity page route'u async çalışıyor."
                            : null,

                error:
                    result.error ||
                    null

            };

        }


        const method =
            page ===
                "identity"
                ? "openIdentity"
                : "openProfile";


        const result =
            this.callAction(
                actions,
                method
            );


        return {

            success:
                result.success,

            reason:
                result.missing
                    ? `${method} Actions metodu bağlı değil.`
                    : result.asyncUnsupported
                        ? `${method} async çalışıyor.`
                        : null,

            error:
                result.error ||
                null

        };

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
         * Creation intents currently open verified creation
         * surfaces. BrainActions does not invent a direct
         * persistence path.
         */

        if(
            target ===
                "world"
        ){

            const result =
                this.callAction(
                    actions,
                    "openCreate"
                );


            return this.resultFromActionCall({

                result,

                intent,

                action:
                    "create:open",

                successMessage:
                    "World oluşturma ekranı açıldı.",

                failureMessage:
                    "World oluşturma ekranı açılamadı."

            });

        }


        if(
            target ===
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
                        false,

                    executed:
                        result.success,

                    intent,

                    action:
                        "worlds:open",

                    reason:
                        "Önce Entity'nin ekleneceği World seçilmeli.",

                    message:
                        result.success
                            ? "Önce Entity'nin ekleneceği World'ü seç."
                            : null,

                    error:
                        result.error ||
                        null

                });

            }


            const result =
                this.callAction(
                    actions,
                    "startEntityCreate"
                );


            return this.resultFromActionCall({

                result,

                intent,

                action:
                    "entity:create:surface",

                successMessage:
                    "Entity oluşturma ekranı açıldı.",

                failureMessage:
                    "Entity oluşturma akışı başlatılamadı.",

                missingMessage:
                    "Entity oluşturma surface'i bağlı değil."

            });

        }


        return this.setResult({

            success:
                false,

            executed:
                false,

            intent,

            action:
                null,

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
            String(
                intent.raw ||
                context.message ||
                "Devam noktası"
            )
                .trim()
                .slice(
                    0,
                    1000
                );


        const result =
            this.callAction(
                actions,
                "saveBrainResumePoint",
                [
                    label
                ]
            );


        return this.resultFromActionCall({

            result,

            intent,

            action:
                "resume:save",

            successMessage:
                "Devam noktası kaydedildi.",

            failureMessage:
                "Devam noktası kaydedilemedi.",

            missingMessage:
                "Resume kayıt sistemi bağlı değil."

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


        return this.resultFromActionCall({

            result,

            intent,

            action:
                "resume:restore",

            successMessage:
                "Kaydedilen devam noktasına dönüldü.",

            failureMessage:
                "Devam noktası geri yüklenemedi.",

            missingMessage:
                "Resume geri yükleme sistemi bağlı değil."

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
           OPEN / VIEW / READ
        ------------------------------------------------- */

        if(
            operation ===
                "open" ||
            operation ===
                "view" ||
            operation ===
                "read"
        ){

            return this.executeNavigation(
                {
                    ...intent,

                    type:
                        "navigate",

                    target
                },
                actions
            );

        }


        /* -------------------------------------------------
           EDIT
        ------------------------------------------------- */

        if(
            operation ===
                "edit"
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
            operation ===
                "search"
        ){

            return this.executeSearchSurface(
                intent,
                actions
            );

        }


        /* -------------------------------------------------
           DELETE / REMOVE
        ------------------------------------------------- */

        if(
            operation ===
                "delete" ||
            operation ===
                "remove"
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
            operation ===
                "archive"
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
           APPLICATION
        ------------------------------------------------- */

        if(
            target ===
                "application" ||
            target ===
                "applications" ||
            target ===
                "app"
        ){

            if(
                operation ===
                    "install"
            ){

                return this.executeApplicationInstall(
                    intent
                );

            }


            if(
                operation ===
                    "update"
            ){

                return this.executeApplicationUpdate(
                    intent
                );

            }


            if(
                operation ===
                    "remove" ||
                operation ===
                    "uninstall"
            ){

                return this.executeApplicationRemove(
                    intent
                );

            }

        }


        return this.setResult({

            success:
                false,

            executed:
                false,

            intent,

            action:
                null,

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


            return this.resultFromActionCall({

                result,

                intent,

                action:
                    "entity:settings",

                successMessage:
                    "Ayarlar ekranı açıldı.",

                failureMessage:
                    "Settings açılamadı."

            });

        }


        if(
            target ===
                "world"
        ){

            const methods = [

                "openWorldEdit",
                "startWorldEdit"

            ];


            for(
                const method of methods
            ){

                if(
                    typeof actions?.[
                        method
                    ] !==
                        "function"
                ){

                    continue;

                }


                const result =
                    this.callAction(
                        actions,
                        method
                    );


                return this.resultFromActionCall({

                    result,

                    intent,

                    action:
                        "world:edit:surface",

                    successMessage:
                        "World düzenleme ekranı açıldı.",

                    failureMessage:
                        "World editor açılamadı."

                });

            }

        }


        if(
            target ===
                "entity"
        ){

            const methods = [

                "openEntityEdit",
                "startEntityEdit"

            ];


            for(
                const method of methods
            ){

                if(
                    typeof actions?.[
                        method
                    ] !==
                        "function"
                ){

                    continue;

                }


                const result =
                    this.callAction(
                        actions,
                        method
                    );


                return this.resultFromActionCall({

                    result,

                    intent,

                    action:
                        "entity:edit:surface",

                    successMessage:
                        "Entity düzenleme ekranı açıldı.",

                    failureMessage:
                        "Entity editor açılamadı."

                });

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


            return this.resultFromActionCall({

                result,

                intent,

                action:
                    `entity:${target}`,

                successMessage:
                    "İlgili yönetim yüzeyi açıldı.",

                failureMessage:
                    "İlgili yönetim yüzeyi açılamadı."

            });

        }


        return this.setResult({

            success:
                false,

            executed:
                false,

            intent,

            action:
                null,

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
            target ===
                "world" ||
            target ===
                "worlds"
        ){

            const result =
                this.callAction(
                    actions,
                    "openWorlds"
                );


            return this.resultFromActionCall({

                result,

                intent,

                action:
                    "worlds:open",

                successMessage:
                    "Worlds listesi açıldı.",

                failureMessage:
                    "Worlds açılamadı."

            });

        }


        if(
            target ===
                "entity" ||
            target ===
                "entities"
        ){

            const result =
                this.callAction(
                    actions,
                    "openEntities"
                );


            return this.resultFromActionCall({

                result,

                intent,

                action:
                    "entities:open",

                successMessage:
                    "Entities listesi açıldı.",

                failureMessage:
                    "Entities açılamadı."

            });

        }


        if(
            target ===
                "application" ||
            target ===
                "applications" ||
            target ===
                "app"
        ){

            const result =
                this.callAction(
                    actions,
                    "openApplicationsApp"
                );


            return this.resultFromActionCall({

                result,

                intent,

                action:
                    "app:applications",

                successMessage:
                    "Applications açıldı.",

                failureMessage:
                    "Applications açılamadı."

            });

        }


        /*
         * No fake global search.
         */

        return this.setResult({

            success:
                false,

            executed:
                false,

            intent,

            action:
                null,

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
            ? this.normalizeIdentifier(
                id
            )
            : null;

    },


    /* =====================================================
       APPLICATION INSTALL
    ===================================================== */

    executeApplicationInstall(intent){

        const appId =
            this.resolveApplicationId(
                intent
            );


        if(!appId){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    "application:install",

                reason:
                    "Kurulacak application ID belirtilmedi."

            });

        }


        const app =
            this.getApplicationsApp();


        if(
            !app ||
            typeof app.install !==
                "function"
        ){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    "application:install",

                reason:
                    "Applications install motoru bağlı değil."

            });

        }


        try{

            const result =
                app.install(
                    appId
                );


            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                return this.setResult({

                    success:
                        false,

                    executed:
                        false,

                    intent,

                    action:
                        "application:install",

                    reason:
                        "Application install motoru async çalışıyor ve Brain Actions synchronous zincirine bağlı değil."

                });

            }


            const success =
                result ===
                    true ||
                (
                    result &&
                    typeof result ===
                        "object" &&
                    result.success ===
                        true
                );


            return this.setResult({

                success,

                executed:
                    success,

                intent,

                action:
                    "application:install",

                reason:
                    success
                        ? null
                        : (
                            result?.reason ||
                            result?.message ||
                            "Application kurulamadı veya güvenlik doğrulaması tamamlanmadı."
                        ),

                message:
                    success
                        ? (
                            result?.message ||
                            "Application kuruldu."
                        )
                        : null,

                data:{
                    appId,
                    result:
                        result &&
                        typeof result ===
                            "object"
                            ? result
                            : null
                }

            });

        } catch(error){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    "application:install",

                reason:
                    "Application kurulumu sırasında hata oluştu.",

                error

            });

        }

    },


    /* =====================================================
       APPLICATION UPDATE
    ===================================================== */

    executeApplicationUpdate(intent){

        const appId =
            this.resolveApplicationId(
                intent
            );


        if(!appId){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    "application:update",

                reason:
                    "Güncellenecek application ID belirtilmedi."

            });

        }


        const app =
            this.getApplicationsApp();


        if(
            !app ||
            typeof app.updateApplication !==
                "function"
        ){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    "application:update",

                reason:
                    "Applications update motoru bağlı değil."

            });

        }


        try{

            const result =
                app.updateApplication(
                    appId
                );


            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                return this.setResult({

                    success:
                        false,

                    executed:
                        false,

                    intent,

                    action:
                        "application:update",

                    reason:
                        "Application update motoru async çalışıyor ve Brain Actions synchronous zincirine bağlı değil."

                });

            }


            const success =
                result !==
                    false &&
                (
                    typeof result !==
                        "object" ||
                    result ===
                        null ||
                    result.success !==
                        false
                );


            return this.setResult({

                success,

                executed:
                    success,

                intent,

                action:
                    "application:update",

                reason:
                    success
                        ? null
                        : (
                            result?.reason ||
                            result?.message ||
                            "Application güncellenemedi."
                        ),

                message:
                    success
                        ? (
                            result?.message ||
                            "Application güncellendi."
                        )
                        : null,

                data:{
                    appId,
                    result:
                        result &&
                        typeof result ===
                            "object"
                            ? result
                            : null
                }

            });

        } catch(error){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    "application:update",

                reason:
                    "Application güncellemesi sırasında hata oluştu.",

                error

            });

        }

    },

   /* =====================================================
       APPLICATION REMOVE
    ===================================================== */

    executeApplicationRemove(intent){

        const appId =
            this.resolveApplicationId(
                intent
            );


        if(!appId){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    "application:remove",

                reason:
                    "Kaldırılacak application ID belirtilmedi."

            });

        }


        const app =
            this.getApplicationsApp();


        if(
            !app ||
            typeof app.remove !==
                "function"
        ){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    "application:remove",

                reason:
                    "Applications remove motoru bağlı değil."

            });

        }


        try{

            const result =
                app.remove(
                    appId
                );


            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                return this.setResult({

                    success:
                        false,

                    executed:
                        false,

                    intent,

                    action:
                        "application:remove",

                    reason:
                        "Application remove motoru async çalışıyor ve Brain Actions synchronous zincirine bağlı değil."

                });

            }


            const success =
                result !==
                    false &&
                (
                    typeof result !==
                        "object" ||
                    result ===
                        null ||
                    result.success !==
                        false
                );


            return this.setResult({

                success,

                executed:
                    success,

                intent,

                action:
                    "application:remove",

                reason:
                    success
                        ? null
                        : (
                            result?.reason ||
                            result?.message ||
                            "Application kaldırılamadı."
                        ),

                message:
                    success
                        ? (
                            result?.message ||
                            "Application kaldırıldı."
                        )
                        : null,

                data:{
                    appId,
                    result:
                        result &&
                        typeof result ===
                            "object"
                            ? result
                            : null
                }

            });

        } catch(error){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    "application:remove",

                reason:
                    "Application kaldırma sırasında hata oluştu.",

                error

            });

        }

    },


    /* =====================================================
       PERMISSION IDENTIFIERS
    ===================================================== */

    resolvePermission(intent){

        const value =

            intent?.permission ||

            intent?.permissionId ||

            intent?.value ||

            null;


        return this.normalizeIdentifier(
            value
        );

    },


    /* =====================================================
       PERMISSION GRANT
    ===================================================== */

    executePermissionGrant(intent){

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

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    "permission:grant",

                reason:
                    "Application ve permission bilgisi gerekli."

            });

        }


        const app =
            this.getApplicationsApp();


        if(
            !app ||
            typeof app.grantRequestedPermission !==
                "function"
        ){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

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


            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                return this.setResult({

                    success:
                        false,

                    executed:
                        false,

                    intent,

                    action:
                        "permission:grant",

                    reason:
                        "Permission grant motoru async çalışıyor ve Brain Actions synchronous zincirine bağlı değil."

                });

            }


            const success =
                result !==
                    false &&
                (
                    typeof result !==
                        "object" ||
                    result ===
                        null ||
                    result.success !==
                        false
                );


            return this.setResult({

                success,

                executed:
                    success,

                intent,

                action:
                    "permission:grant",

                reason:
                    success
                        ? null
                        : (
                            result?.reason ||
                            result?.message ||
                            "Permission verilemedi."
                        ),

                message:
                    success
                        ? (
                            result?.message ||
                            "Permission verildi."
                        )
                        : null,

                data:{
                    appId,
                    permission,
                    result:
                        result &&
                        typeof result ===
                            "object"
                            ? result
                            : null
                }

            });

        } catch(error){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    "permission:grant",

                reason:
                    "Permission verme işlemi başarısız.",

                error

            });

        }

    },


    /* =====================================================
       PERMISSION REVOKE
    ===================================================== */

    executePermissionRevoke(intent){

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

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    "permission:revoke",

                reason:
                    "Application ve permission bilgisi gerekli."

            });

        }


        const app =
            this.getApplicationsApp();


        if(
            !app ||
            typeof app.revokePermission !==
                "function"
        ){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

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


            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                return this.setResult({

                    success:
                        false,

                    executed:
                        false,

                    intent,

                    action:
                        "permission:revoke",

                    reason:
                        "Permission revoke motoru async çalışıyor ve Brain Actions synchronous zincirine bağlı değil."

                });

            }


            const success =
                result !==
                    false &&
                (
                    typeof result !==
                        "object" ||
                    result ===
                        null ||
                    result.success !==
                        false
                );


            return this.setResult({

                success,

                executed:
                    success,

                intent,

                action:
                    "permission:revoke",

                reason:
                    success
                        ? null
                        : (
                            result?.reason ||
                            result?.message ||
                            "Permission kaldırılamadı."
                        ),

                message:
                    success
                        ? (
                            result?.message ||
                            "Permission kaldırıldı."
                        )
                        : null,

                data:{
                    appId,
                    permission,
                    result:
                        result &&
                        typeof result ===
                            "object"
                            ? result
                            : null
                }

            });

        } catch(error){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    "permission:revoke",

                reason:
                    "Permission kaldırma işlemi başarısız.",

                error

            });

        }

    },


    /* =====================================================
       BOUND CONFIRMATION CHECK
    ===================================================== */

    hasBoundConfirmation(context = {}){

        return Boolean(

            context &&

            context.confirmed ===
                true &&

            context.confirmationMode ===
                "bound-confirmation" &&

            String(
                context.confirmationId ||
                    ""
            ).trim()

        );

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
            !this.hasBoundConfirmation(
                context
            )
        ){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                blocked:
                    true,

                intent,

                action:
                    null,

                reason:
                    "Arşivleme işlemi bağlı kullanıcı onayı gerektiriyor."

            });

        }


        const target =
            this.normalizeValue(
                intent.target
            );


        if(
            target ===
                "world" ||
            target ===
                "worlds"
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


                return this.resultFromActionCall({

                    result,

                    intent,

                    action:
                        "world:archive",

                    successMessage:
                        "World arşivlendi.",

                    failureMessage:
                        "World arşivlenemedi.",

                    missingMessage:
                        "World archive motoru bağlı değil."

                });

            }

        }


        if(
            target ===
                "entity" ||
            target ===
                "entities"
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


                return this.resultFromActionCall({

                    result,

                    intent,

                    action:
                        "entity:archive",

                    successMessage:
                        "Entity arşivlendi.",

                    failureMessage:
                        "Entity arşivlenemedi.",

                    missingMessage:
                        "Entity archive motoru bağlı değil."

                });

            }

        }


        return this.setResult({

            success:
                false,

            executed:
                false,

            intent,

            action:
                null,

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
            !this.hasBoundConfirmation(
                context
            )
        ){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                blocked:
                    true,

                intent,

                action:
                    null,

                reason:
                    "Silme işlemi bağlı kullanıcı onayı gerektiriyor."

            });

        }


        const target =
            this.normalizeValue(
                intent.target
            );


        /*
         * Hard delete is never simulated.
         * Only an existing Actions method can perform it.
         */

        if(
            target ===
                "world" ||
            target ===
                "worlds"
        ){

            const methods = [

                "deleteWorld",
                "removeWorld"

            ];


            for(
                const method of methods
            ){

                if(
                    typeof actions?.[
                        method
                    ] !==
                        "function"
                ){

                    continue;

                }


                const result =
                    this.callAction(
                        actions,
                        method
                    );


                return this.resultFromActionCall({

                    result,

                    intent,

                    action:
                        "world:delete",

                    successMessage:
                        "World silindi.",

                    failureMessage:
                        "World silinemedi."

                });

            }

        }


        if(
            target ===
                "entity" ||
            target ===
                "entities"
        ){

            const methods = [

                "deleteEntity",
                "removeEntity"

            ];


            for(
                const method of methods
            ){

                if(
                    typeof actions?.[
                        method
                    ] !==
                        "function"
                ){

                    continue;

                }


                const result =
                    this.callAction(
                        actions,
                        method
                    );


                return this.resultFromActionCall({

                    result,

                    intent,

                    action:
                        "entity:delete",

                    successMessage:
                        "Entity silindi.",

                    failureMessage:
                        "Entity silinemedi."

                });

            }

        }


        return this.setResult({

            success:
                false,

            executed:
                false,

            intent,

            action:
                null,

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
            !this.hasBoundConfirmation(
                context
            )
        ){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                blocked:
                    true,

                intent,

                action:
                    null,

                reason:
                    "Geri yükleme işlemi bağlı kullanıcı onayı gerektiriyor."

            });

        }


        const target =
            this.normalizeValue(
                intent.target
            );


        if(
            target ===
                "world" ||
            target ===
                "worlds"
        ){

            if(
                typeof actions.restoreWorld ===
                    "function"
            ){

                const result =
                    this.callAction(
                        actions,
                        "restoreWorld"
                    );


                return this.resultFromActionCall({

                    result,

                    intent,

                    action:
                        "world:restore",

                    successMessage:
                        "World geri yüklendi.",

                    failureMessage:
                        "World geri yüklenemedi."

                });

            }

        }


        if(
            target ===
                "entity" ||
            target ===
                "entities"
        ){

            if(
                typeof actions.restoreEntity ===
                    "function"
            ){

                const result =
                    this.callAction(
                        actions,
                        "restoreEntity"
                    );


                return this.resultFromActionCall({

                    result,

                    intent,

                    action:
                        "entity:restore",

                    successMessage:
                        "Entity geri yüklendi.",

                    failureMessage:
                        "Entity geri yüklenemedi."

                });

            }

        }


        return this.setResult({

            success:
                false,

            executed:
                false,

            intent,

            action:
                null,

            reason:
                "Onay alındı ancak bu hedef için doğrulanmış restore motoru bağlı değil.",

            message:
                "Hiçbir kayıt değiştirilmedi."

        });

    },


    /* =====================================================
       COMMUNICATION

       BrainActions does not simulate messaging, calls or
       screen sharing.

       A real communication runtime must be registered.
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

                success:
                    false,

                executed:
                    false,

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
            typeof service[
                method
            ] !==
                "function"
        ){

            return this.setResult({

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    type,

                reason:
                    "Communication işlemi için gerekli runtime metodu bağlı değil."

            });

        }


        try{

            const result =
                service[
                    method
                ](
                    intent,
                    context
                );


            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                return this.setResult({

                    success:
                        false,

                    executed:
                        false,

                    intent,

                    action:
                        type,

                    reason:
                        "Async Communication execution henüz BrainActions synchronous zincirine bağlanmadı."

                });

            }


            const success =
                result !==
                    false &&
                (
                    typeof result !==
                        "object" ||
                    result ===
                        null ||
                    result.success !==
                        false
                );


            return this.setResult({

                success,

                executed:
                    success,

                intent,

                action:
                    type,

                reason:
                    success
                        ? null
                        : (
                            result?.reason ||
                            result?.message ||
                            "Communication işlemi başlatılamadı."
                        ),

                message:
                    success
                        ? (
                            result?.message ||
                            "Communication işlemi başlatıldı."
                        )
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

                success:
                    false,

                executed:
                    false,

                intent,

                action:
                    type,

                reason:
                    "Communication işlemi sırasında hata oluştu.",

                error

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


        const applications =
            this.getApplicationsApp();


        return {

            version:
                this.version,

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
                    applications
                ),

            communicationAvailable:
                Boolean(
                    this.getService(
                        "communication"
                    )
                ),

            executionSequence:
                this.executionSequence,

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

            version:
                this.version,

            available:
                status.available,

            engineAvailable:
                status.engineAvailable,

            policyAvailable:
                status.policyAvailable,

            applicationsAvailable:
                status.applicationsAvailable,

            communicationAvailable:
                status.communicationAvailable,

            executionSequence:
                status.executionSequence,

            hasLastResult:
                status.hasLastResult,

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

    },


    /* =====================================================
       RESET RUNTIME
    ===================================================== */

    resetRuntime(){

        this.lastResult =
            null;


        this.executionSequence =
            0;


        return true;

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
            "brainActions",
            BrainActions
        );

    }

} catch(error){

    console.error(
        "BrainActions register edilemedi:",
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

    window.BrainActions =
        BrainActions;

}
