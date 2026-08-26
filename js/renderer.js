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
                `Renderer service lookup failed: ${name}`,
                error
            );

            return null;

        }

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

            return components.errorState(
                message
            );

        }


        return `
            <section class="section">

                <div class="eyebrow">
                    EKRAN HATASI
                </div>

                <h1>
                    ${String(
                        message ||
                        "Bu ekran şu anda açılamıyor."
                    )}
                </h1>

            </section>
        `;

    },


    /* =====================================================
       BODY STATE
    ===================================================== */

    syncDocumentState(
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

            delete document.body.dataset.enginePage;

        }


        return true;

    },


    /* =====================================================
       SYSTEM APPLICATION ROUTER
    ===================================================== */

    renderSystemApplication(
        page,
        components
    ){

        switch(page){

            /* -------------------------------------------------
               VAERO SYSTEM / PAYMENT CORE
            ------------------------------------------------- */

            case "vaero":

                if(
                    window.VaeroApp &&
                    typeof window.VaeroApp.render ===
                        "function"
                ){

                    return window.VaeroApp.render();

                }


                return this.renderError(
                    components,
                    "VAERO sistem katmanı yüklenemedi."
                );


            /* -------------------------------------------------
               APPLICATIONS
            ------------------------------------------------- */

            case "applications":

                if(
                    window.ApplicationsApp &&
                    typeof window.ApplicationsApp.render ===
                        "function"
                ){

                    return window.ApplicationsApp.render();

                }


                return this.renderError(
                    components,
                    "Applications katmanı yüklenemedi."
                );


            default:

                return null;

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
            VAERO.engine;


        if(!engine){

            console.error(
                "Engine state is not available."
            );

            return false;

        }


        const rootEntity =
            engine.rootEntity ||
            entity;


        const view =
            engine.currentView ||
            "home";


        const currentEntityPage =
            engine.currentEntityPage ||
            null;


        this.syncDocumentState(
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


        /*
         * Rendering sonucunun yanlışlıkla
         * undefined/null olması halinde shell içine
         * bozuk içerik basılmasını engeller.
         */

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

                navigationHTML =
                    components.navigation({
                        view,
                        page:
                            currentEntityPage
                    }) ||
                    "";

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
                data-engine-view="${view}"
                data-engine-page="${currentEntityPage || ""}"
            >

                <div class="engine-screen">
                    ${screenHTML}
                </div>

                ${navigationHTML}

            </main>
        `;


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

                return components.entityIdentity(
                    engine.currentOpenedEntity ||
                    rootEntity
                );


            /* -------------------------------------------------
               PROFILE
            ------------------------------------------------- */

            case "profile":

                return components.entityProfile(
                    engine.currentOpenedEntity ||
                    rootEntity
                );


            /* -------------------------------------------------
               CREATE
            ------------------------------------------------- */

            case "create":

                return components.createView(
                    rootEntity
                );


            /* -------------------------------------------------
               WORLDS
            ------------------------------------------------- */

            case "worlds": {

                const worldService =
                    this.getService(
                        "world"
                    );


                const worlds =
                    worldService &&
                    typeof worldService.all ===
                        "function"
                        ? worldService.all()
                        : [];


                return components.worldsView(
                    Array.isArray(worlds)
                        ? worlds
                        : []
                );

            }


            /* -------------------------------------------------
               WORLD
            ------------------------------------------------- */

            case "world": {

                if(
                    !engine.currentWorld ||
                    !engine.currentWorld.id
                ){

                    console.warn(
                        "World view requested without a valid world."
                    );


                    const worldService =
                        this.getService(
                            "world"
                        );


                    const worlds =
                        worldService &&
                        typeof worldService.all ===
                            "function"
                            ? worldService.all()
                            : [];


                    return components.worldsView(
                        Array.isArray(worlds)
                            ? worlds
                            : []
                    );

                }


                return components.worldView(
                    engine.currentWorld
                );

            }


            /* -------------------------------------------------
               ENTITY
            ------------------------------------------------- */

            case "entity":

                if(
                    !engine.currentOpenedEntity
                ){

                    return this.renderError(
                        components,
                        "Açılacak varlık bulunamadı."
                    );

                }


                return components.entityApp(
                    engine.currentOpenedEntity
                );


            /* -------------------------------------------------
               HOME
            ------------------------------------------------- */

            case "home":
            default:

                return components.home(
                    rootEntity
                );

        }

    }

};


/* =========================================================
   VAERO BINDING
========================================================= */

VAERO.renderer =
    Renderer;


VAERO.register(
    "renderer",
    Renderer
);


window.Renderer =
    Renderer;
