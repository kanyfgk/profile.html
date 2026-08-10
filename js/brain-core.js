const BrainCore = {

    provider: null,

    register(provider){

        if(
            !provider ||
            typeof provider.ask !== "function"
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

    analyze(prompt, context = {}){

        const intentService =
            VAERO.get("brainIntent");

        const policyService =
            VAERO.get(
                "brainActionPolicy"
            );

        const intent =
            intentService &&
            typeof intentService.detect ===
                "function"
                ? intentService.detect(
                    prompt
                )
                : {
                    type: "chat",
                    target: null,
                    operation:
                        "general",
                    confidence: 0,
                    explicit: false
                };

        const policy =
            policyService &&
            typeof policyService.evaluateIntent ===
                "function"
                ? policyService.evaluateIntent(
                    intent
                )
                : {
                    allowed: false,
                    requiresConfirmation:
                        false,
                    blocked: false,
                    executable: false,
                    actionType: null,
                    reason:
                        "Action Policy bulunamadı."
                };

        return {
            prompt:
                String(prompt || ""),

            context:
                context || {},

            intent,
            policy,

            analyzedAt:
                Date.now()
        };

    },

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
            options.execute !== false;

        const actionService =
            VAERO.get("brainActions");

        let executed = false;
        let actionResult = null;

        if(
            shouldExecute &&
            analysis.policy.allowed &&
            analysis.policy.executable &&
            actionService &&
            typeof actionService.execute ===
                "function"
        ){

            executed =
                actionService.execute(
                    analysis.intent,
                    {
                        ...context,
                        message:
                            String(
                                prompt || ""
                            )
                    }
                );

            actionResult =
                actionService.lastResult ||
                null;

        }

        return {
            ...analysis,
            executed:
                Boolean(executed),

            actionResult,

            requiresConfirmation:
                Boolean(
                    analysis.policy
                        .requiresConfirmation
                ),

            blocked:
                Boolean(
                    analysis.policy.blocked
                )
        };

    },

    async ask(prompt, context = {}){

        const routeResult =
            this.route(
                prompt,
                context
            );

        if(!this.hasProvider()){

            return {
                reply:
                    "Brain provider henüz bağlı değil.",

                ...routeResult
            };

        }

        try {

            const providerResult =
                await this.provider.ask(
                    prompt,
                    {
                        ...context,
                        intent:
                            routeResult.intent,
                        policy:
                            routeResult.policy
                    }
                );

            if(
                typeof providerResult ===
                    "string"
            ){
                return {
                    reply:
                        providerResult,

                    ...routeResult
                };
            }

            return {
                ...providerResult,
                ...routeResult,

                reply:
                    providerResult?.reply ||
                    providerResult?.message ||
                    providerResult?.text ||
                    "Brain yanıt üretemedi."
            };

        } catch(error){

            console.error(
                "Brain provider error:",
                error
            );

            return {
                reply:
                    "Brain provider şu anda yanıt veremiyor.",

                error: true,

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
