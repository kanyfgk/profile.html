const Actions = {

    openProfile(entity){

        const memory = VAERO.get("memorySystem");

        memory.remember("profile:opened", {
            entityId: entity.id,
            profileName: entity.profile.name
        });

        alert(
            `${entity.profile.name}\n\nType: ${entity.profile.type}\nIdentity: ${
                entity.profile.identity.verified ? "Verified" : "Unverified"
            }`
        );

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

});

VAERO.register("actions", Actions);
