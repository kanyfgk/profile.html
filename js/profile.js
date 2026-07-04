const Profile = {

    create(entity){

        return {

            id: entity.id,

            name: entity.name, 

            type: entity.type,

            description: entity.description,

            status: entity.status,

            identity: entity.identity,

            createdAt: Date.now()

        };

    },

    update(profile,data){

        Object.assign(profile,data);

        return profile;

    },

    verify(profile){

        return !!(
            profile &&
            profile.id &&
            profile.name &&
            profile.identity
        );

    }

};

VAERO.register("profile", Profile);
