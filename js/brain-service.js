/* =========================================================
   VAERO BRAIN SERVICE
   Public Brain Gateway
========================================================= */

const BrainService = {

    lastRequest: null,

    lastResponse: null,


    /* =====================================================
       SAFE SERVICE ACCESS
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
                `Brain Service bağı okunamadı: ${name}`,
                error
            );

            return null;

        }

    },


    /* =====================================================
       CONTEXT
    ===================================================== */

    buildContext(extraContext = {}){

        const contextService =
            this.getService(
                "brainContext"
            );


        const safeExtra =
            extraContext &&
            typeof extraContext ===
                "object" &&
            !Array.isArray(
                extraContext
            )
                ? extraContext
                : {};


        if(
            contextService &&
            typeof contextService.build ===
                "function"
        ){

            try{

                return contextService.build(
                    safeExtra
                );

            } catch(error){

                console.warn(
                    "Brain context oluşturulamadı:",
                    error
                );

            }

        }


        return {

            ...safeExtra,

            engineReady:false,

            contextSource:
                "brain-service-fallback",

            builtAt:
                Date.now()

        };

    },


    /* =====================================================
       ASK
    ===================================================== */

    async ask(
        prompt,
        options = {}
    ){

        const brain =
            this.getService(
                "brainCore"
            );


        if(
            !brain ||
            typeof brain.ask !==
                "function"
        ){

            const result = {

                reply:
                    "Brain Core şu anda kullanılamıyor.",

                error:true,

                serviceError:
                    "brain-core-unavailable",

                respondedAt:
                    Date.now()

            };


            this.lastResponse =
                result;


            return result;

        }


        const safeOptions =
            options &&
            typeof options ===
                "object" &&
            !Array.isArray(options)
                ? options
                : {};


        const {

            context:
                contextOverride = {},

            ...brainOptions

        } = safeOptions;


        const context =
            this.buildContext(
                contextOverride
            );


        const request = {

            prompt:
                String(
                    prompt ?? ""
                ),

            context,

            options:
                brainOptions,

            requestedAt:
                Date.now()

        };


        this.lastRequest =
            request;


        try{

            const response =
                await brain.ask(
                    request.prompt,
                    context,
                    brainOptions
                );


            const normalizedResponse =
                response &&
                typeof response ===
                    "object"
                    ? response
                    : {
                        reply:
                            String(
                                response ??
                                "Brain yanıt üretemedi."
                            )
                    };


            const result = {

                ...normalizedResponse,

                serviceRespondedAt:
                    Date.now()

            };


            this.lastResponse =
                result;


            return result;

        } catch(error){

            console.error(
                "Brain Service ask error:",
                error
            );


            const result = {

                reply:
                    "Brain isteği şu anda tamamlanamadı.",

                error:true,

                serviceError:
                    error?.message ||
                    String(error),

                respondedAt:
                    Date.now()

            };


            this.lastResponse =
                result;


            return result;

        }

    },


    /* =====================================================
       ANALYZE ONLY
    ===================================================== */

    analyze(
        prompt,
        extraContext = {}
    ){

        const brain =
            this.getService(
                "brainCore"
            );


        if(
            !brain ||
            typeof brain.analyze !==
                "function"
        ){

            return null;

        }


        const context =
            this.buildContext(
                extraContext
            );


        try{

            return brain.analyze(
                prompt,
                context
            );

        } catch(error){

            console.error(
                "Brain Service analyze error:",
                error
            );

            return null;

        }

    },


    /* =====================================================
       ROUTE ONLY
    ===================================================== */

    route(
        prompt,
        options = {}
    ){

        const brain =
            this.getService(
                "brainCore"
            );


        if(
            !brain ||
            typeof brain.route !==
                "function"
        ){

            return null;

        }


        const safeOptions =
            options &&
            typeof options ===
                "object" &&
            !Array.isArray(options)
                ? options
                : {};


        const {

            context:
                contextOverride = {},

            ...routeOptions

        } = safeOptions;


        const context =
            this.buildContext(
                contextOverride
            );


        try{

            return brain.route(
                prompt,
                context,
                routeOptions
            );

        } catch(error){

            console.error(
                "Brain Service route error:",
                error
            );

            return null;

        }

    },


    /* =====================================================
       STATUS
    ===================================================== */

    status(){

        const brain =
            this.getService(
                "brainCore"
            );


        return {

            available:
                Boolean(
                    brain
                ),

            brain:
                brain &&
                typeof brain.status ===
                    "function"
                    ? brain.status()
                    : null,

            hasLastRequest:
                Boolean(
                    this.lastRequest
                ),

            hasLastResponse:
                Boolean(
                    this.lastResponse
                )

        };

    },


    /* =====================================================
       RESET RUNTIME
    ===================================================== */

    resetRuntime(){

        this.lastRequest =
            null;

        this.lastResponse =
            null;


        const brain =
            this.getService(
                "brainCore"
            );


        if(
            brain &&
            typeof brain.resetRuntime ===
                "function"
        ){

            brain.resetRuntime();

        }


        return true;

    }

};


VAERO.register(
    "brainService",
    BrainService
);


window.BrainService =
    BrainService;
