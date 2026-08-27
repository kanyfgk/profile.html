/* =========================================================
   VAERO RENDERER
   Engine Screen / Application Rendering Layer
========================================================= */

const Renderer = {

    version:
        "3.0.0",

    mountId:
        "engine",

    renderCount:
        0,

    lastRenderAt:
        null,

    lastRenderState:
        null,


    /* =====================================================
       ROOT
    ===================================================== */

    getRoot(){

        if(
            typeof document ===
                "undefined"
        ){

            return null;

        }


        return document.getElementById(
            this.mountId
        );

    },


    /* =====================================================
       SAFE SERVICE ACCESS
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
                `Renderer service lookup failed: ${serviceName}`,
                error
            );


            return null;

        }

    },


    /* =====================================================
       ENGINE ACCESS
    ===================================================== */

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

            /* service fallback */

        }


        const service =
            this.getService(
                "engine"
            );


        if(service){

            return service;

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


    /* =====================================================
       SAFE ESCAPE
    ===================================================== */

    escapeHTML(value){

        return String(
            value ??
                ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    },


    /* =====================================================
       ERROR STATE
    ===================================================== */

    renderError(
        components,
        message
    ){

        const safeMessage =
            String(
                message ||
                    "Bu ekran şu anda açılamıyor."
            );


        if(
            components &&
            typeof components.errorState ===
                "function"
        ){

            try{

                const result =
                    components.errorState(
                        safeMessage
                    );


                if(
                    typeof result ===
                        "string"
                ){

                    return result;

                }

            } catch(error){

                /* local fallback */

            }

        }


        return `
            <section
                class="section renderer-error-state"
                role="alert"
            >

                <div class="eyebrow">
                    EKRAN HATASI
                </div>

                <h1>
                    ${this.escapeHTML(
                        safeMessage
                    )}
                </h1>

            </section>
        `;

    },


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    renderUnavailable(
        components,
        title,
        description = ""
    ){

        if(
            components &&
            typeof components.emptyState ===
                "function"
        ){

            try{

                const result =
                    components.emptyState({
                        title,
                        description
                    });


                if(
                    typeof result ===
                        "string"
                ){

                    return result;

                }

            } catch(error){

                /* local fallback */

            }

        }


        return `
            <section
                class="section renderer-empty-state"
                aria-live="polite"
            >

                <div class="eyebrow">
                    VAERO
                </div>

                <h1>
                    ${this.escapeHTML(
                        title
                    )}
                </h1>

                ${
                    description
                        ? `
                            <p>
                                ${this.escapeHTML(
                                    description
                                )}
                            </p>
                        `
                        : ""
                }

            </section>
        `;

    },


    /* =====================================================
       BODY STATE
    ===================================================== */

    syncDocumentState(
        engine,
        view,
        page
    ){

        if(
            typeof document ===
                "undefined" ||
            !document.body
        ){

            return false;

        }


        const body =
            document.body;


        body.dataset.page =
            String(
                view ||
                    "home"
            );


        if(page){

            body.dataset.enginePage =
                String(
                    page
                );

        } else {

            delete body
                .dataset
                .enginePage;

        }


        body.dataset.worldEdit =
            engine?.worldEditMode ===
                true
                ? "true"
                : "false";


        body.dataset.entityEdit =
            engine?.entityEditMode ===
                true
                ? "true"
                : "false";


        body.dataset.entityCreate =
            engine?.entityCreateMode ===
                true
                ? "true"
                : "false";


        if(
            engine?.currentWorld?.id
        ){

            body.dataset.worldId =
                String(
                    engine.currentWorld.id
                );

        } else {

            delete body
                .dataset
                .worldId;

        }


        const entityId =
            engine
                ?.currentOpenedEntity
                ?.id ||
            engine
                ?.currentEntity
                ?.id ||
            null;


        if(entityId){

            body.dataset.entityId =
                String(
                    entityId
                );

        } else {

            delete body
                .dataset
                .entityId;

        }


        return true;

    },


    /* =====================================================
       SYSTEM APPLICATION LOOKUP
    ===================================================== */

    getSystemApplication(page){

        const normalized =
            String(
                page ||
                    ""
            )
                .trim()
                .toLowerCase();


        if(!normalized){

            return null;

        }


        const getters = {

            vaero:
                () => {

                    if(
                        typeof window !==
                            "undefined" &&
                        window.VaeroApp
                    ){

                        return window.VaeroApp;

                    }


                    return this.getService(
                        "vaeroApp"
                    );

                },

            applications:
                () => {

                    if(
                        typeof window !==
                            "undefined" &&
                        window.ApplicationsApp
                    ){

                        return window.ApplicationsApp;

                    }


                    return this.getService(
                        "applicationsApp"
                    );

                }

        };


        const getter =
            getters[
                normalized
            ];


        if(!getter){

            return null;

        }


        try{

            return (
                getter() ||
                null
            );

        } catch(error){

            console.warn(
                `System application lookup failed: ${normalized}`,
                error
            );


            return null;

        }

    },


    /* =====================================================
       SYSTEM APPLICATION ROUTER
    ===================================================== */

    renderSystemApplication(
        page,
        components
    ){

        const normalized =
            String(
                page ||
                    ""
            )
                .trim()
                .toLowerCase();


        const application =
            this.getSystemApplication(
                normalized
            );


        if(!application){

            return null;

        }


        if(
            typeof application.render !==
                "function"
        ){

            return this.renderError(
                components,
                `${normalized} uygulaması render API sunmuyor.`
            );

        }


        try{

            const result =
                application.render();


            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                return this.renderError(
                    components,
                    `${normalized} uygulaması async render döndürdü.`
                );

            }


            if(
                typeof result ===
                    "string"
            ){

                return result;

            }


            return this.renderError(
                components,
                `${normalized} uygulaması geçerli bir ekran üretmedi.`
            );

        } catch(error){

            console.error(
                `System application render failed: ${normalized}`,
                error
            );


            return this.renderError(
                components,
                `${normalized} uygulaması açılamadı.`
            );

        }

    },


    /* =====================================================
       COMPONENT CALL
    ===================================================== */

    callComponent(
        components,
        method,
        args = [],
        fallbackMessage =
            "Bu görünüm şu anda kullanılamıyor."
    ){

        if(
            !components ||
            typeof components[
                method
            ] !==
                "function"
        ){

            return this.renderError(
                components,
                fallbackMessage
            );

        }


        try{

            const result =
                components[
                    method
                ](
                    ...args
                );


            if(
                result &&
                typeof result.then ===
                    "function"
            ){

                return this.renderError(
                    components,
                    `${fallbackMessage} Async render desteklenmiyor.`
                );

            }


            if(
                typeof result !==
                    "string"
            ){

                return this.renderError(
                    components,
                    fallbackMessage
                );

            }


            return result;

        } catch(error){

            console.error(
                `Renderer component failed: ${method}`,
                error
            );


            return this.renderError(
                components,
                fallbackMessage
            );

        }

    },


    /* =====================================================
       SAFE WORLD LIST
    ===================================================== */

    getWorlds(){

        const worldService =
            this.getService(
                "world"
            );


        if(
            !worldService ||
            typeof worldService.all !==
                "function"
        ){

            return [];

        }


        try{

            const worlds =
                worldService.all();


            return Array.isArray(
                worlds
            )
                ? worlds
                : [];

        } catch(error){

            console.warn(
                "Renderer world list could not be read:",
                error
            );


            return [];

        }

    },


    /* =====================================================
       MAIN RENDER
    ===================================================== */

    render(entity){

        const root =
            this.getRoot();


        if(!root){

            console.error(
                "Engine root not found."
            );


            return false;

        }


        const components =
            this.getService(
                "components"
            );


        if(!components){

            console.error(
                "Components service not found."
            );


            return false;

        }


        const engine =
            this.getEngine();


        if(!engine){

            console.error(
                "Engine state is not available."
            );


            return false;

        }


        const rootEntity =
            engine.rootEntity ||
            entity ||
            engine.currentEntity ||
            null;


        if(!rootEntity){

            root.innerHTML =
                this.renderError(
                    components,
                    "Engine root entity bulunamadı."
                );


            return false;

        }


        const requestedView =
            String(
                engine.currentView ||
                    "home"
            )
                .trim()
                .toLowerCase();


        const view =
            typeof engine.isValidView ===
                "function" &&
            engine.isValidView(
                requestedView
            )
                ? requestedView
                : (
                    requestedView ||
                    "home"
                );


        const currentEntityPage =
            engine.currentEntityPage
                ? String(
                    engine.currentEntityPage
                )
                    .trim()
                    .toLowerCase()
                : null;


        this.syncDocumentState(
            engine,
            view,
            currentEntityPage
        );


        let screenHTML =
            "";


        try{

            screenHTML =
                this.renderScreen({

                    view,

                    engine,

                    components,

                    rootEntity

                });

        } catch(error){

            console.error(
                "Screen render failed:",
                error
            );


            screenHTML =
                this.renderError(
                    components,
                    "Bu ekran şu anda açılamıyor."
                );

        }


        if(
            typeof screenHTML !==
                "string"
        ){

            screenHTML =
                this.renderError(
                    components,
                    "Ekran geçerli bir görünüm üretmedi."
                );

        }


        let navigationHTML =
            "";


        try{

            if(
                typeof components.navigation ===
                    "function"
            ){

                const navigation =
                    components.navigation({

                        view,

                        page:
                            currentEntityPage,

                        world:
                            engine.currentWorld ||
                            null,

                        entity:
                            engine.currentOpenedEntity ||
                            null

                    });


                navigationHTML =
                    typeof navigation ===
                        "string"
                        ? navigation
                        : "";

            }

        } catch(error){

            console.error(
                "Navigation render failed:",
                error
            );

        }


        root.innerHTML = `
            <main
                class="vaero-shell"
                data-engine-view="${this.escapeHTML(
                    view
                )}"
                data-engine-page="${this.escapeHTML(
                    currentEntityPage ||
                        ""
                )}"
                data-world-edit="${
                    engine.worldEditMode ===
                        true
                        ? "true"
                        : "false"
                }"
                data-entity-edit="${
                    engine.entityEditMode ===
                        true
                        ? "true"
                        : "false"
                }"
                data-entity-create="${
                    engine.entityCreateMode ===
                        true
                        ? "true"
                        : "false"
                }"
            >

                <div
                    class="engine-screen"
                    data-engine-screen="${this.escapeHTML(
                        currentEntityPage ||
                            view
                    )}"
                >
                    ${screenHTML}
                </div>

                ${navigationHTML}

            </main>
        `;


        this.renderCount +=
            1;


        this.lastRenderAt =
            Date.now();


        this.lastRenderState = {

            view,

            page:
                currentEntityPage,

            worldId:
                engine.currentWorld?.id ||
                null,

            entityId:
                engine
                    .currentOpenedEntity
                    ?.id ||
                engine
                    .currentEntity
                    ?.id ||
                null,

            time:
                this.lastRenderAt

        };


        this.afterRender({

            root,

            engine,

            view,

            page:
                currentEntityPage

        });


        return true;

    },

   /* =====================================================
       SCREEN ROUTER
    ===================================================== */

    renderScreen({
        view,
        engine,
        components,
        rootEntity
    }){

        const currentEntityPage =
            engine.currentEntityPage ||
            null;


        /* =================================================
           SYSTEM APPLICATIONS
        ================================================= */

        if(currentEntityPage){

            const systemApplication =
                this.renderSystemApplication(
                    currentEntityPage,
                    components
                );


            if(
                systemApplication !==
                    null
            ){

                return systemApplication;

            }

        }


        /* =================================================
           ENGINE VIEWS
        ================================================= */

        switch(view){

            /* -------------------------------------------------
               IDENTITY
            ------------------------------------------------- */

            case "identity":

                return this.callComponent(
                    components,
                    "entityIdentity",
                    [
                        engine.currentOpenedEntity ||
                        rootEntity
                    ],
                    "Kimlik görünümü açılamadı."
                );


            /* -------------------------------------------------
               PROFILE
            ------------------------------------------------- */

            case "profile":

                return this.callComponent(
                    components,
                    "entityProfile",
                    [
                        engine.currentOpenedEntity ||
                        rootEntity
                    ],
                    "Profil görünümü açılamadı."
                );


            /* -------------------------------------------------
               CREATE
            ------------------------------------------------- */

            case "create":

                return this.callComponent(
                    components,
                    "createView",
                    [
                        rootEntity
                    ],
                    "Varlık oluşturma ekranı açılamadı."
                );


            /* -------------------------------------------------
               WORLDS
            ------------------------------------------------- */

            case "worlds":

                return this.callComponent(
                    components,
                    "worldsView",
                    [
                        this.getWorlds()
                    ],
                    "Dünyalar görünümü açılamadı."
                );


            /* -------------------------------------------------
               WORLD
            ------------------------------------------------- */

            case "world": {

                const currentWorld =
                    engine.currentWorld;


                if(
                    !currentWorld ||
                    !currentWorld.id
                ){

                    console.warn(
                        "World view requested without a valid world."
                    );


                    return this.callComponent(
                        components,
                        "worldsView",
                        [
                            this.getWorlds()
                        ],
                        "Dünya bulunamadı."
                    );

                }


                if(
                    engine.worldEditMode ===
                        true &&
                    typeof components.worldEditor ===
                        "function"
                ){

                    return this.callComponent(
                        components,
                        "worldEditor",
                        [
                            currentWorld
                        ],
                        "Dünya düzenleyicisi açılamadı."
                    );

                }


                return this.callComponent(
                    components,
                    "worldView",
                    [
                        currentWorld
                    ],
                    "Dünya görünümü açılamadı."
                );

            }


            /* -------------------------------------------------
               ENTITY
            ------------------------------------------------- */

            case "entity": {

                const openedEntity =
                    engine.currentOpenedEntity;


                if(!openedEntity){

                    return this.renderError(
                        components,
                        "Açılacak varlık bulunamadı."
                    );

                }


                if(
                    engine.entityEditMode ===
                        true &&
                    typeof components.entityEditor ===
                        "function"
                ){

                    return this.callComponent(
                        components,
                        "entityEditor",
                        [
                            openedEntity
                        ],
                        "Varlık düzenleyicisi açılamadı."
                    );

                }


                return this.callComponent(
                    components,
                    "entityApp",
                    [
                        openedEntity
                    ],
                    "Varlık görünümü açılamadı."
                );

            }


            /* -------------------------------------------------
               HOME
            ------------------------------------------------- */

            case "home":

                return this.callComponent(
                    components,
                    "home",
                    [
                        rootEntity
                    ],
                    "VAERO ana ekranı açılamadı."
                );


            /* -------------------------------------------------
               FALLBACK
            ------------------------------------------------- */

            default:

                console.warn(
                    "Unknown Engine view:",
                    view
                );


                return this.callComponent(
                    components,
                    "home",
                    [
                        rootEntity
                    ],
                    "VAERO ana ekranı açılamadı."
                );

        }

    },


    /* =====================================================
       AFTER RENDER
    ===================================================== */

    afterRender({
        root,
        engine,
        view,
        page
    }){

        /* -------------------------------------------------
           APPLICATIONS HOOK
        ------------------------------------------------- */

        try{

            let applications =
                null;


            if(
                typeof window !==
                    "undefined" &&
                window.ApplicationsApp
            ){

                applications =
                    window.ApplicationsApp;

            } else {

                applications =
                    this.getService(
                        "applicationsApp"
                    );

            }


            if(
                page ===
                    "applications" &&
                applications &&
                typeof applications.afterRender ===
                    "function"
            ){

                applications.afterRender(
                    root
                );

            }

        } catch(error){

            console.warn(
                "Applications post-render failed:",
                error
            );

        }


        /* -------------------------------------------------
           VAERO APP HOOK
        ------------------------------------------------- */

        try{

            let vaeroApp =
                null;


            if(
                typeof window !==
                    "undefined" &&
                window.VaeroApp
            ){

                vaeroApp =
                    window.VaeroApp;

            } else {

                vaeroApp =
                    this.getService(
                        "vaeroApp"
                    );

            }


            if(
                page ===
                    "vaero" &&
                vaeroApp &&
                typeof vaeroApp.afterRender ===
                    "function"
            ){

                vaeroApp.afterRender(
                    root
                );

            }

        } catch(error){

            console.warn(
                "VAERO App post-render failed:",
                error
            );

        }


        /* -------------------------------------------------
           BRAIN APP REFRESH
        ------------------------------------------------- */

        try{

            let brainApp =
                null;


            if(
                typeof window !==
                    "undefined" &&
                window.BrainApp
            ){

                brainApp =
                    window.BrainApp;

            } else {

                brainApp =
                    this.getService(
                        "brainApp"
                    );

            }


            if(
                brainApp &&
                typeof brainApp.refresh ===
                    "function"
            ){

                brainApp.refresh();

            }

        } catch(error){

            /* optional */

        }


        /* -------------------------------------------------
           FOCUS MANAGEMENT
        ------------------------------------------------- */

        try{

            if(
                root &&
                typeof root.querySelector ===
                    "function"
            ){

                const autofocusTarget =
                    root.querySelector(
                        "[data-engine-autofocus]"
                    );


                if(
                    autofocusTarget &&
                    typeof autofocusTarget.focus ===
                        "function"
                ){

                    autofocusTarget.focus({
                        preventScroll:
                            true
                    });

                }

            }

        } catch(error){

            /* optional accessibility enhancement */

        }


        /* -------------------------------------------------
           RENDER EVENT
        ------------------------------------------------- */

        this.emitRendered(
            {
                view,

                page:
                    page ||
                    null,

                worldId:
                    engine.currentWorld?.id ||
                    null,

                entityId:
                    engine
                        .currentOpenedEntity
                        ?.id ||
                    engine
                        .currentEntity
                        ?.id ||
                    null,

                renderCount:
                    this.renderCount,

                time:
                    this.lastRenderAt ||
                    Date.now()
            }
        );


        return true;

    },


    /* =====================================================
       RENDER EVENT
    ===================================================== */

    emitRendered(payload){

        try{

            if(
                typeof VAERO !==
                    "undefined" &&
                typeof VAERO.emit ===
                    "function"
            ){

                VAERO.emit(
                    "renderer.rendered",
                    payload
                );


                return true;

            }

        } catch(error){

            /* events fallback */

        }


        const events =
            this.getService(
                "events"
            );


        if(
            !events ||
            typeof events.emit !==
                "function"
        ){

            return false;

        }


        try{

            events.emit(
                "renderer.rendered",
                payload
            );


            return true;

        } catch(error){

            console.warn(
                "Renderer event emit failed:",
                error
            );


            return false;

        }

    },


    /* =====================================================
       REPORT
    ===================================================== */

    report(){

        const root =
            this.getRoot();


        const engine =
            this.getEngine();


        return {

            version:
                this.version,

            mountId:
                this.mountId,

            mounted:
                Boolean(
                    root
                ),

            renderCount:
                this.renderCount,

            lastRenderAt:
                this.lastRenderAt,

            lastRenderState:
                this.lastRenderState
                    ? {
                        ...this.lastRenderState
                    }
                    : null,

            engineAvailable:
                Boolean(
                    engine
                ),

            componentsAvailable:
                Boolean(
                    this.getService(
                        "components"
                    )
                )

        };

    },


    /* =====================================================
       RESET RUNTIME
    ===================================================== */

    resetRuntime(
        options = {}
    ){

        this.renderCount =
            0;


        this.lastRenderAt =
            null;


        this.lastRenderState =
            null;


        if(
            options.clearRoot ===
                true
        ){

            const root =
                this.getRoot();


            if(root){

                root.innerHTML =
                    "";

            }

        }


        return true;

    }

};


/* =========================================================
   VAERO BINDING
========================================================= */

try{

    if(
        typeof VAERO !==
            "undefined"
    ){

        if(
            typeof VAERO.setRenderer ===
                "function"
        ){

            VAERO.setRenderer(
                Renderer
            );

        } else {

            VAERO.renderer =
                Renderer;

        }


        if(
            typeof VAERO.register ===
                "function"
        ){

            VAERO.register(
                "renderer",
                Renderer
            );

        }

    }

} catch(error){

    console.warn(
        "Renderer VAERO binding failed:",
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

    window.Renderer =
        Renderer;

}
