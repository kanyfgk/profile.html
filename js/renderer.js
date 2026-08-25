const Renderer = {

    mountId: "engine",

    render(entity){

        const root =
            document.getElementById(
                this.mountId
            );

        if(!root){

            console.error(
                "Engine root not found."
            );

            return false;

        }

        const components =
            VAERO.get("components");

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

        document.body.dataset.page =
            view;

        let screenHTML = "";

        try {

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
                components.errorState
                    ? components.errorState(
                        "Bu ekran şu anda açılamıyor."
                    )
                    : `
                        <section class="section">
                            <div class="eyebrow">
                                EKRAN HATASI
                            </div>

                            <h1>
                                Bu ekran şu anda açılamıyor.
                            </h1>
                        </section>
                    `;

        }

        root.innerHTML = `
            <main
                class="vaero-shell"
                data-engine-view="${view}"
            >
                <div class="engine-screen">
                    ${screenHTML}
                </div>

                ${components.navigation({
                    view,
                    page:
                        engine.currentEntityPage ||
                        null
                })}
            </main>
        `;

        return true;

    },

    renderScreen({
        view,
        engine,
        components,
        rootEntity
    }){

        const currentEntityPage =
            engine.currentEntityPage;

        const isVaeroApp =
            currentEntityPage &&
            currentEntityPage.startsWith("vaero");

        if(isVaeroApp){

            if(
                window.VaeroApp &&
                typeof window.VaeroApp.render ===
                    "function"
            ){
                return window.VaeroApp.render();
            }

            return components.errorState(
                "VAERO uygulaması yüklenemedi."
            );

        }

        switch(view){

            case "identity":

                return components.entityIdentity(
                    engine.currentOpenedEntity ||
                    rootEntity
                );

            case "profile":

                return components.entityProfile(
                    engine.currentOpenedEntity ||
                    rootEntity
                );

            case "create":

                return components.createView(
                    rootEntity
                );

            case "worlds": {

                const worldService =
                    VAERO.get("world");

                const worlds =
                    worldService &&
                    typeof worldService.all ===
                        "function"
                        ? worldService.all()
                        : [];

                return components.worldsView(
                    worlds
                );

            }

            case "world":

                if(
                    !engine.currentWorld ||
                    !engine.currentWorld.id
                ){

                    console.warn(
                        "World view requested without a valid world."
                    );

                    const worldService =
                        VAERO.get("world");

                    return components.worldsView(
                        worldService &&
                        typeof worldService.all ===
                            "function"
                            ? worldService.all()
                            : []
                    );

                }

                return components.worldView(
                    engine.currentWorld
                );

            case "entity":

                if(!engine.currentOpenedEntity){

                    return components.errorState(
                        "Açılacak varlık bulunamadı."
                    );

                }

                return components.entityApp(
                    engine.currentOpenedEntity
                );

            case "home":
            default:

                return components.home(
                    rootEntity
                );

        }

    }

};

VAERO.renderer =
    Renderer;

VAERO.register(
    "renderer",
    Renderer
);
