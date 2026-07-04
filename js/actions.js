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

VAERO.register("actions", Actions);
