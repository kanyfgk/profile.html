const Identity = {

    create(entity){

        return {

            id: entity.id,

            type: entity.type,

            name: entity.name,

            createdAt: entity.createdAt,

            verified: false,

            status: "active",

            permissions: [],

            metadata: {}

        };

    },

    verify(identity){

        identity.verified = true;

        VAERO.emit("identity:verified", identity);

        return identity;

    }

};

VAERO.register("identity", Identity);
