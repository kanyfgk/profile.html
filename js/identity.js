const Identity = {

    create(entity){

        if(!entity){
            return null;
        }

        if(
            entity.identity &&
            typeof entity.identity === "object"
        ){
            return entity.identity;
        }

        const identity = {
            id: entity.id,
            type: entity.type,
            name: entity.name,
            createdAt:
                entity.createdAt ||
                Date.now(),
            updatedAt: Date.now(),
            verified: false,
            verifiedAt: null,
            status: "active",
            permissions: [],
            metadata: {}
        };

        entity.identity =
            identity;

        return identity;

    },

    verify(identity){

        if(!identity){
            return null;
        }

        if(identity.verified){
            return identity;
        }

        identity.verified = true;
        identity.verifiedAt = Date.now();
        identity.updatedAt = Date.now();

        VAERO.emit(
            "identity:verified",
            identity
        );

        return identity;

    },

    setPermission(identity, permission){

        if(!identity || !permission){
            return false;
        }

        if(!Array.isArray(identity.permissions)){
            identity.permissions = [];
        }

        const normalized =
            String(permission).trim();

        if(
            normalized &&
            !identity.permissions.includes(normalized)
        ){
            identity.permissions.push(normalized);
            identity.updatedAt = Date.now();
        }

        return true;

    }

};

VAERO.register(
    "identity",
    Identity
);
