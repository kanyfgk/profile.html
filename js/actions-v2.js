const Actions = {

    openProfile(entity){
        const memory = VAERO.get("memorySystem"); 

        memory.remember("profile:opened", {
            entityId: entity.id,
            profileName: entity.profile.name
        });
    },

    closeModal(){
        const modal = document.getElementById("profileModal");
        if(modal) modal.classList.remove("show");
    },

    createWorld(){
        const input = document.getElementById("worldNameInput");

        if(!input || input.value.trim() === ""){
            alert("Please enter a world name.");
            return;
        }

        const worldService = VAERO.get("world");

        worldService.create({
            id: crypto.randomUUID(),
            name: input.value,
            type: "custom-world",
            owner: VAERO.engine.currentEntity.id,
            entities: []
        });

        VAERO.engine.mount(VAERO.engine.currentEntity);
        input.value = "";
    },

    openWorld(worldId){
        const worldService = VAERO.get("world");
        const world = worldService.all().find(item => item.id === worldId);

        if(!world){
            alert("World not found.");
            return;
        }

        if(!world.entities) world.entities = [];

        VAERO.engine.currentWorld = world;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    },

    createEntity(){
        const input = document.getElementById("entityNameInput");

        if(!input || input.value.trim() === ""){
            alert("Please enter a name.");
            return;
        }

        const currentWorld = VAERO.engine.currentWorld;

        if(!currentWorld){
            alert("No world selected.");
            return;
        }

        if(!currentWorld.entities) currentWorld.entities = [];

        const entityManager = VAERO.get("entityManager");

        const entity = entityManager.create({
            id: crypto.randomUUID(),
            name: input.value,
            type: VAERO.engine.entityType
        });

        currentWorld.entities.push(entity);

        VAERO.engine.entityCreateMode = false;
        VAERO.engine.entityType = null;

        VAERO.engine.mount(VAERO.engine.currentEntity);
    },

    openEntity(entityId){
        const world = VAERO.engine.currentWorld;
        if(!world) return;

        const entity = (world.entities || []).find(item => item.id === entityId);

        if(!entity){
            alert("Entity not found.");
            return;
        }

        VAERO.engine.currentOpenedEntity = entity;
        VAERO.engine.currentEntityPage = null;

        VAERO.engine.mount(VAERO.engine.currentEntity);
    },

    openEntityPage(page){
        VAERO.engine.currentEntityPage = page;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    },

    openBrain(){
    document.querySelectorAll("#brainPanel").forEach(panel => panel.remove());

    if(window.BrainApp){
        document.body.insertAdjacentHTML("beforeend", BrainApp.render());
    }

    const panel = document.getElementById("brainPanel");
    if(!panel) return;

    panel.style.display = "block";

    const contextText = document.getElementById("brainContextText");
    const brainContext = VAERO.get("brainContext");

    if(contextText && brainContext){
        const context = brainContext.build();
        const appName = context.app || "bilinmeyen";
        contextText.innerText = "Şu an " + appName + " ekranındasın.";
    }

    this.renderBrainHistory();
},

closeBrain(){
    document.querySelectorAll("#brainPanel").forEach(panel => panel.remove());
},

sendBrainMessage(){
    const input = document.getElementById("brainInput");
    if(!input) return;

    const text = input.value.trim();
    if(text === "") return;

    const brain = VAERO.get("brain");
    const brainContext = VAERO.get("brainContext");
    const context = brainContext ? brainContext.build() : null;

    if(brain && typeof brain.receive === "function"){
        brain.receive(text, context);
    }

    input.value = "";

    setTimeout(() => {

        document.querySelectorAll("#brainPanel").forEach(panel => panel.remove());

        if(window.BrainApp){
            document.body.insertAdjacentHTML("beforeend", BrainApp.render());
        }

        const panel = document.getElementById("brainPanel");
        if(panel){
            panel.style.display = "block";
        }

        const contextText = document.getElementById("brainContextText");
        const newContext = brainContext ? brainContext.build() : null;

        if(contextText && newContext){
            contextText.innerText = "Şu an " + (newContext.app || "bilinmeyen") + " ekranındasın.";
        }

        this.renderBrainHistory();

    }, 50);
},
renderBrainHistory(){
    const history = document.getElementById("brainHistory");
    const brain = VAERO.get("brain");

    if(!history || !brain || !brain.history) return;

    history.innerHTML = "";

    const cleanHistory = brain.history
        .filter(item => item && item.text)
        .filter(item => !String(item.text).includes("brainReply"))
        .slice(-8);

    cleanHistory.forEach(item => {
        const row = document.createElement("div");
        row.className = "brain-message";
        row.textContent = (item.role === "brain" ? "🧠 " : "👤 ") + item.text;
        history.appendChild(row);
    });
},
    
};

document.addEventListener("click", event => {

    const button = event.target.closest("[data-action]");
    if(!button) return;

    const action = button.dataset.action;

    if(action === "profile:open"){
        Actions.openProfile(VAERO.engine.currentEntity);
    }

    if(action === "modal:close"){
        Actions.closeModal();
    }

    if(action === "world:create"){
        Actions.createWorld();
    }

    if(action === "world:open"){
        Actions.openWorld(button.dataset.worldId);
    }

    if(action === "world:back"){
        VAERO.engine.currentEntityPage = null;
        VAERO.engine.currentOpenedEntity = null;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    }

    if(action === "entity:dashboard"){
        Actions.openEntityPage(null);
    }

    if(action === "brain:open"){
        Actions.openBrain();
    }

    if(action === "brain:close"){
        Actions.closeBrain();
    }

    if(action === "brain:send"){
        Actions.sendBrainMessage();
    }

    if(action === "entity:identity"){
        Actions.openEntityPage("identity");
    }

    if(action === "entity:profile"){
        Actions.openEntityPage("profile");
    }

    if(action === "entity:organs"){
        Actions.openEntityPage("organs");
    }

    if(action === "entity:timeline"){
        Actions.openEntityPage("timeline");
    }

    if(action === "entity:memory"){
        Actions.openEntityPage("memory");
    }

    if(action === "entity:bridge"){
        Actions.openEntityPage("bridge");
    }

    if(action === "entity:settings"){
        Actions.openEntityPage("settings");
    }

    if(action === "entity:create:first"){
        VAERO.engine.entityCreateMode = true;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    }

    if(action === "entity:type:select"){
        VAERO.engine.entityType = button.dataset.entityType;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    }

    if(action === "entity:create"){
        Actions.createEntity();
    }

    if(action === "entity:open"){
        Actions.openEntity(button.dataset.entityId);
    }

});

VAERO.register("actions", Actions);

