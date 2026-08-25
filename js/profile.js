const Profile = {

    create(entity){

        if(!entity){
            return null;
        }

        if(
            entity.profile &&
            typeof entity.profile === "object"
        ){
            return entity.profile;
        }

        const profile = {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            description:
                entity.description || "",
            status:
                entity.status || "active",
            identity:
                entity.identity || null,
            createdAt:
                entity.createdAt ||
                Date.now(),
            updatedAt: Date.now()
        };

        entity.profile =
            profile;

        return profile;

    },

    update(profile, data = {}){

        if(!profile){
            return null;
        }

        const editableFields = [
            "name",
            "description",
            "status"
        ];

        editableFields.forEach(field => {

            if(data[field] === undefined){
                return;
            }

            if(typeof data[field] === "string"){
                profile[field] =
                    data[field].trim();
            }

        });

        profile.updatedAt =
            Date.now();

        return profile;

    },

    verify(profile){

        return Boolean(
            profile &&
            profile.id &&
            profile.name &&
            profile.identity &&
            profile.identity.id === profile.id
        );

    }

};

VAERO.register(
    "profile",
    Profile
);
