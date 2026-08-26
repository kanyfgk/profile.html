/* =========================================================
   VAERO RENDERER
   Engine Screen / Application Rendering Layer
========================================================= */

const Renderer = {

    mountId:
        "engine",


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
                    name
                ) ||
                null
            );

        } catch(error){

            console.warn(
                `Renderer service lookup failed: ${name}`,
                error
            );


            return null;

        }

    },


    /* =====================================================
       SAFE ESCAPE
    ===================================================== */

    escapeHTML(value){

        const text =
            String(
                value ??
                ""
            );


        return text
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

        if(
            components &&
            typeof components.errorState ===
                "function"
        ){

            try{

                return components.errorState(
                    message
                );

            } catch(error){

                /* fallback */

            }

        }


        const safeMessage =
            this.escapeHTML(
                message ||
                "Bu ekran şu anda açılamıyor."
            );


        return `
            <section class="section renderer-error-state">

                <div class="eyebrow">
                    EKRAN HATASI
                </div>

                <h1>
                    ${safeMessage}
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

                return components.emptyState({
                    title,
                    description
                });

            } catch(error){

                /* fallback */

            }

        }


        return `
            <section class="section renderer-empty-state">

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


        document.body.dataset.page =
            view ||
            "home";


        if(page){

            document.body.dataset.enginePage =
                page;

        } else {

            delete document
                .body
                .dataset
                .enginePage;

        }


        document.body.dataset.worldEdit =
            engine?.worldEditMode
                ? "true"
                : "false";


        document.body.dataset.entityEdit =
            engine?.entityEditMode
                ? "true"
                : "false";


        document.body.dataset.entityCreate =
            engine?.entityCreateMode
                ? "true"
                : "false";


        if(
            engine?.currentWorld?.id
        ){

            document.body.dataset.worldId =
                String(
                    engine.currentWorld.id
                );

        } else {

            delete document
                .body
                .dataset
                .worldId;

        }


        if(
            engine
                ?.currentOpenedEntity
                ?.id
        ){

            document.body.dataset.entityId =
                String(
                    engine
                        .currentOpenedEntity
                        .id
                );

        } else {

            delete document
                .body
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


        const apps = {

            vaero: () =>
                window.VaeroApp ||
                this.getService(
                    "vaeroApp"
                ),

            applications: () =>
                window.ApplicationsApp ||
                this.getService(
                    "applicationsApp"
                )

        };


        const getter =
            apps[
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
            (
                typeof VAERO !==
                    "undefined"

                    ? VAERO.engine

                    : null
            ) ||
            this.getService(
                "engine"
            ) ||
            window.Engine ||
            null;


        if(!engine){

            console.error(
                "Engine state is not available."
            );


            return false;

        }


        const rootEntity =
            engine.rootEntity ||
            entity ||
            null;


        if(!rootEntity){

            root.innerHTML =
                this.renderError(
                    components,
                    "Engine root entity bulunamadı."
                );


            return false;

        }


        const view =
            String(
                engine.currentView ||
                "home"
            );


        const currentEntityPage =
            engine.currentEntityPage
                ? String(
                    engine.currentEntityPage
                )
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
                    engine.worldEditMode
                        ? "true"
                        : "false"
                }"
                data-entity-edit="${
                    engine.entityEditMode
                        ? "true"
                        : "false"
                }"
                data-entity-create="${
                    engine.entityCreateMode
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

            case "worlds": {

                const worldService =
                    this.getService(
                        "world"
                    );


                let worlds =
                    [];


                try{

                    worlds =
                        worldService &&
                        typeof worldService.all ===
                            "function"
                            ? worldService.all()
                            : [];

                } catch(error){

                    worlds =
                        [];

                }


                return this.callComponent(
                    components,
                    "worldsView",
                    [
                        Array.isArray(
                            worlds
                        )
                            ? worlds
                            : []
                    ],
                    "Dünyalar görünümü açılamadı."
                );

            }


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


                    const worldService =
                        this.getService(
                            "world"
                        );


                    let worlds =
                        [];


                    try{

                        worlds =
                            worldService &&
                            typeof worldService.all ===
                                "function"
                                ? worldService.all()
                                : [];

                    } catch(error){

                        worlds =
                            [];

                    }


                    return this.callComponent(
                        components,
                        "worldsView",
                        [
                            Array.isArray(
                                worlds
                            )
                                ? worlds
                                : []
                        ],
                        "Dünya bulunamadı."
                    );

                }


                if(
                    engine.worldEditMode &&
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
                    engine.entityEditMode &&
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

        try{

            const applications =
                window.ApplicationsApp ||
                this.getService(
                    "applicationsApp"
                );


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


        try{

            const brainApp =
                window.BrainApp ||
                this.getService(
                    "brainApp"
                );


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


        try{

            const events =
                this.getService(
                    "events"
                );


            if(
                events &&
                typeof events.emit ===
                    "function"
            ){

                events.emit(
                    "renderer.rendered",
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

                        time:
                            Date.now()

                    }
                );

            }

        } catch(error){

            /* non-fatal */

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

        VAERO.renderer =
            Renderer;


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


window.Renderer =
    Renderer;
