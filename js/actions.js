const Actions = {
 
    openProfile(entity){

        const memory = VAERO.get("memorySystem");

        memory.remember("profile:opened", {
            entityId: entity.id,
            profileName: entity.profile.name
        });
  
        const modal = document.getElementById("profileModal");
        const title = document.getElementById("modalTitle");
        const text = document.getElementById("modalText");

        title.innerText = entity.profile.name;

        text.innerText =
            `Type: ${entity.profile.type}
Identity: ${entity.profile.identity.verified ? "Verified" : "Unverified"}`;

        modal.classList.add("show");

    },

    closeModal(){

        const modal = document.getElementById("profileModal");

        if(modal){
            modal.classList.remove("show");
        }

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

        alert(`World "${input.value}" created.`);

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

        if(!world.entities){
            world.entities = [];
        }

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

        if(!currentWorld.entities){
            currentWorld.entities = [];
        }

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

        if(!world){
            return;
        }

        const entity = (world.entities || []).find(item => item.id === entityId);

        if(!entity){
            alert("Entity not found.");
            return;
        }

        VAERO.engine.currentOpenedEntity = entity;

        VAERO.engine.mount(VAERO.engine.currentEntity);

    }

};

document.addEventListener("click", event => {

    const button = event.target.closest("[data-action]");

    if(!button){
        return;
    }

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
        const worldId = button.dataset.worldId;
        Actions.openWorld(worldId);
    }

 if(action === "world:back"){
    VAERO.engine.currentOpenedEntity = null;
    VAERO.engine.mount(VAERO.engine.currentEntity);
}

    if(action === "entity:create:first"){
        VAERO.engine.entityCreateMode = true;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    }

    if(action === "entity:type:select"){
        const type = button.dataset.entityType;
        VAERO.engine.entityType = type;
        VAERO.engine.mount(VAERO.engine.currentEntity);
    }

    if(action === "entity:create"){
        Actions.createEntity();
    }

 if(action === "entity:open"){
    const entityId = button.dataset.entityId;
    Actions.openEntity(entityId);
}

});

VAERO.register("actions", Actions);
