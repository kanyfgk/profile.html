const BrainCore = {

    provider: null,

    /*
     * =====================================================
     * PROVIDER
     * =====================================================
     */

    register(provider){

        if(
            !provider ||
            typeof provider.ask !==
                "function"
        ){

            console.error(
                "Brain provider kaydedilemedi: ask() fonksiyonu eksik."
            );

            return false;

        }

        this.provider =
            provider;

        return true;

    },

    hasProvider(){

        return Boolean(
            this.provider &&
            typeof this.provider.ask ===
                "function"
        );

    },

    /*
     * =====================================================
     * FALLBACKS
     * =====================================================
     */

    createFallbackIntent(
        raw = ""
    ){

        return {

            type:
                "chat",

            target:
                null,

            operation:
                "general",

            confidence:
                0,

            explicit:
                false,

            raw:
                String(
                    raw || ""
                )

        };

    },

    createFallbackPolicy(
        reason =
            "Action Policy bulunamadı."
    ){

        return {

            allowed:
                false,

            requiresConfirmation:
                false,

            blocked:
                false,

            executable:
                false,

            permission:
                null,

            actionType:
                null,

            reason

        };

    },

    normalizeContext(
        context
    ){

        if(
            !context ||
            typeof context !==
                "object" ||
            Array.isArray(
                context
            )
        ){

            return {};

        }

        return context;

    },

    /*
     * =====================================================
     * ANALYSIS
     * =====================================================
     */

    analyze(
        prompt,
        context = {}
    ){

        const cleanPrompt =
            String(
                prompt || ""
            );

        const cleanContext =
            this.normalizeContext(
                context
            );

        const intentService =
            VAERO.get(
                "brainIntent"
            );

        const policyService =
            VAERO.get(
                "brainActionPolicy"
            );

        let intent =
            null;

        /*
         * =================================================
         * INTENT
         * =================================================
         */

        try {

            if(
                intentService &&
                typeof intentService.detect ===
                    "function"
            ){

                intent =
                    intentService.detect(
                        cleanPrompt
                    );

            }

        } catch(error){

            console.error(
                "Brain Intent analysis failed:",
                error
            );

        }

        if(
            !intent ||
            typeof intent !==
                "object"
        ){

            intent =
                this.createFallbackIntent(
                    cleanPrompt
                );

        }

        /*
         * =================================================
         * POLICY
         * =================================================
         */

        let policy =
            null;

        try {

            if(
                policyService &&
                typeof policyService
                    .evaluateIntent ===
                    "function"
            ){

                policy =
                    policyService
                        .evaluateIntent(
                            intent
                        );

            }

        } catch(error){

            console.error(
                "Brain Policy evaluation failed:",
                error
            );

            policy =
                this.createFallbackPolicy(
                    "Action Policy değerlendirilirken sistem hatası oluştu."
                );

        }

        if(
            !policy ||
            typeof policy !==
                "object"
        ){

            policy =
                this.createFallbackPolicy();

        }

        return {

            prompt:
                cleanPrompt,

            context:
                cleanContext,

            intent,

            policy,

            analyzedAt:
                Date.now()

        };

    },

    /*
     * =====================================================
     * ROUTE STATUS
     * =====================================================
     */

    resolveRouteStatus({
        shouldExecute,
        policy,
        executionAttempted,
        executed,
        actionResult
    }){

        if(
            policy?.blocked
        ){
            return "blocked";
        }

        if(
            policy?.requiresConfirmation
        ){
            return "confirmation_required";
        }

        if(
            !policy?.executable
        ){
            return "no_action";
        }

        if(
            !policy?.allowed
        ){
            return "not_allowed";
        }

        if(
            !shouldExecute
        ){
            return "analysis_only";
        }

        if(
            !executionAttempted
        ){
            return "execution_unavailable";
        }

        if(executed){
            return "executed";
        }

        if(
            actionResult &&
            actionResult.success ===
                false
        ){
            return "execution_failed";
        }

        return "execution_failed";

    },

    /*
     * =====================================================
     * ROUTE
     * =====================================================
     */

    route(
        prompt,
        context = {},
        options = {}
    ){

        const analysis =
            this.analyze(
                prompt,
                context
            );

        const shouldExecute =
            options?.execute !==
                false;

        const actionService =
            VAERO.get(
                "brainActions"
            );

        let executionAttempted =
            false;

        let executed =
            false;

        let actionResult =
            null;

        let executionError =
            null;

        /*
         * =================================================
         * EXECUTION
         * =================================================
         *
         * Yalnızca:
         *
         * - route execute açıksa
         * - Policy SAFE diyorsa
         * - action tanımlıysa
         *
         * BrainActions çağrılır.
         */

        if(
            shouldExecute &&
            analysis.policy
                ?.allowed &&
            analysis.policy
                ?.executable
        ){

            if(
                actionService &&
                typeof actionService.execute ===
                    "function"
            ){

                executionAttempted =
                    true;

                /*
                 * Önceki işlemden kalan lastResult
                 * yeni route'a sızamaz.
                 */
                if(
                    Object.prototype
                        .hasOwnProperty
                        .call(
                            actionService,
                            "lastResult"
                        )
                ){

                    actionService.lastResult =
                        null;

                }

                try {

                    const executionReturn =
                        actionService.execute(
                            analysis.intent,
                            {
                                ...analysis.context,

                                message:
                                    analysis.prompt
                            }
                        );

                    const latestResult =
                        actionService
                            .lastResult ||
                        null;

                    /*
                     * BrainActions yeni sözleşmede
                     * lastResult üretir.
                     *
                     * Yine de eski implementation ile
                     * uyumluluk için executionReturn
                     * fallback olarak korunur.
                     */
                    if(latestResult){

                        actionResult =
                            latestResult;

                        executed =
                            latestResult
                                .success ===
                                true;

                    }else{

                        executed =
                            Boolean(
                                executionReturn
                            );

                        actionResult = {

                            success:
                                executed,

                            intent:
                                analysis.intent,

                            action:
                                null,

                            actionType:
                                analysis.policy
                                    ?.actionType ||
                                null,

                            reason:
                                executed
                                    ? null
                                    : "BrainActions işlem sonucu üretmedi.",

                            executedAt:
                                Date.now()

                        };

                    }

                } catch(error){

                    executionError =
                        error;

                    executed =
                        false;

                    console.error(
                        "Brain Actions execution failed:",
                        error
                    );

                    actionResult = {

                        success:
                            false,

                        intent:
                            analysis.intent,

                        action:
                            null,

                        actionType:
                            analysis.policy
                                ?.actionType ||
                            null,

                        reason:
                            "İşlem uygulanırken sistem hatası oluştu.",

                        meta: {

                            error:
                                true,

                            message:
                                String(
                                    error?.message ||
                                    error ||
                                    "Unknown error"
                                )

                        },

                        executedAt:
                            Date.now()

                    };

                }

            }else{

                actionResult = {

                    success:
                        false,

                    intent:
                        analysis.intent,

                    action:
                        null,

                    actionType:
                        analysis.policy
                            ?.actionType ||
                        null,

                    reason:
                        "BrainActions servisi bulunamadı.",

                    executedAt:
                        Date.now()

                };

            }

        }

        const requiresConfirmation =
            Boolean(
                analysis.policy
                    ?.requiresConfirmation
            );

        const blocked =
            Boolean(
                analysis.policy
                    ?.blocked
            );

        const routeStatus =
            this.resolveRouteStatus({

                shouldExecute,

                policy:
                    analysis.policy,

                executionAttempted,

                executed,

                actionResult

            });

        return {

            ...analysis,

            shouldExecute,

            executionAttempted,

            executed:
                Boolean(
                    executed
                ),

            actionResult,

            requiresConfirmation,

            blocked,

            routeStatus,

            executionError:
                executionError
                    ? true
                    : false,

            routedAt:
                Date.now()

        };

    },

    /*
     * =====================================================
     * ROUTE REPLY
     * =====================================================
     *
     * Provider çağrılmadan önce Core'un kesin
     * olarak söylemesi gereken durumlar burada
     * çözülür.
     *
     * Böylece provider:
     *
     * - BLOCKED işlemi yapılmış gibi
     * - onay isteyen işlemi uygulanmış gibi
     * - başarısız işlemi başarılı gibi
     *
     * gösteremez.
     */

    getProtectedRouteReply(
        routeResult
    ){

        if(
            routeResult?.blocked
        ){

            return (
                routeResult
                    ?.policy
                    ?.reason ||
                "Bu işlem Brain tarafından uygulanamaz."
            );

        }

        if(
            routeResult
                ?.requiresConfirmation
        ){

            return (
                routeResult
                    ?.policy
                    ?.reason ||
                "Bu işlem kullanıcı onayı gerektiriyor."
            );

        }

        if(
            routeResult
                ?.policy
                ?.allowed &&
            routeResult
                ?.policy
                ?.executable &&
            routeResult
                ?.shouldExecute &&
            !routeResult
                ?.executed
        ){

            return (
                routeResult
                    ?.actionResult
                    ?.reason ||
                "İşlem tanındı ancak uygulanamadı."
            );

        }

        return null;

    },

    /*
     * =====================================================
     * PROVIDER ASK
     * =====================================================
     */

    async ask(
        prompt,
        context = {},
        options = {}
    ){

        const routeResult =
            this.route(
                prompt,
                context,
                options
            );

        /*
         * =================================================
         * POLICY / EXECUTION OVERRIDE
         * =================================================
         *
         * Bu cevaplar provider'a bırakılmaz.
         */

        const protectedReply =
            this.getProtectedRouteReply(
                routeResult
            );

        if(protectedReply){

            return {

                reply:
                    protectedReply,

                providerUsed:
                    false,

                ...routeResult

            };

        }

        /*
         * =================================================
         * PROVIDER NOT AVAILABLE
         * =================================================
         */

        if(
            !this.hasProvider()
        ){

            /*
             * Sistem işlemi başarıyla uygulandıysa
             * "provider bağlı değil" demek yanlış
             * olur.
             */
            if(
                routeResult.executed
            ){

                return {

                    reply:
                        routeResult
                            ?.actionResult
                            ?.reason ||
                        "İşlem uygulandı.",

                    providerUsed:
                        false,

                    ...routeResult

                };

            }

            return {

                reply:
                    "Brain provider henüz bağlı değil.",

                providerUsed:
                    false,

                ...routeResult

            };

        }

        /*
         * =================================================
         * PROVIDER
         * =================================================
         */

        try {

            const providerResult =
                await this.provider.ask(
                    String(
                        prompt || ""
                    ),
                    {
                        ...routeResult.context,

                        intent:
                            routeResult.intent,

                        policy:
                            routeResult.policy,

                        actionResult:
                            routeResult
                                .actionResult,

                        executed:
                            routeResult
                                .executed,

                        routeStatus:
                            routeResult
                                .routeStatus
                    }
                );

            /*
             * Provider yalnızca string
             * döndürüyorsa.
             */
            if(
                typeof providerResult ===
                    "string"
            ){

                return {

                    reply:
                        providerResult,

                    providerUsed:
                        true,

                    ...routeResult

                };

            }

            /*
             * Provider beklenen object formatında
             * değilse güvenli fallback.
             */
            if(
                !providerResult ||
                typeof providerResult !==
                    "object"
            ){

                return {

                    reply:
                        routeResult.executed
                            ? "İşlem uygulandı."
                            : "Brain yanıt üretemedi.",

                    providerUsed:
                        true,

                    ...routeResult

                };

            }

            const providerReply =
                providerResult.reply ||
                providerResult.message ||
                providerResult.text ||
                (
                    routeResult.executed
                        ? "İşlem uygulandı."
                        : "Brain yanıt üretemedi."
                );

            /*
             * routeResult providerResult'tan
             * sonra spread edilir.
             *
             * Böylece provider:
             *
             * - policy
             * - executed
             * - actionResult
             * - blocked
             *
             * gibi sistem gerçeklerini
             * değiştiremez.
             */
            return {

                ...providerResult,

                ...routeResult,

                reply:
                    String(
                        providerReply
                    ),

                providerUsed:
                    true

            };

        } catch(error){

            console.error(
                "Brain provider error:",
                error
            );

            return {

                reply:
                    routeResult.executed
                        ? (
                            routeResult
                                ?.actionResult
                                ?.reason ||
                            "İşlem uygulandı ancak Brain yanıtı oluşturulamadı."
                        )
                        : "Brain provider şu anda yanıt veremiyor.",

                error:
                    true,

                providerUsed:
                    true,

                providerError:
                    String(
                        error?.message ||
                        error ||
                        "Unknown error"
                    ),

                ...routeResult

            };

        }

    }

};

VAERO.register(
    "brainCore",
    BrainCore
);

window.BrainCore =
    BrainCore;
