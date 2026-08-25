const EntityManager = {

    entities: {},

    create(data = {}){

        const requestedId =
            data.id || null;

        if(
            requestedId &&
            this.entities[requestedId]
        ){
            return this.entities[requestedId];
        }

        const entity =
            new Entity(data);

        this.entities[entity.id] =
            entity;

        VAERO.emit(
            "entity:created",
            entity
        );

        return entity;

    },

    hydrate(data = {}){

        if(!data || typeof data !== "object"){
            return null;
        }

        if(data instanceof Entity){

            this.entities[data.id] =
                data;

            return data;

        }

        if(
            data.id &&
            this.entities[data.id]
        ){
            return this.entities[data.id];
        }

        const entity =
            new Entity(data);

        this.entities[entity.id] =
            entity;

        return entity;

    },

    get(id){

        return (
            this.entities[id] ||
            null
        );

    },

    all(){

        return Object.values(
            this.entities
        );

    },

    remove(id){

        const entity =
            this.get(id);

        if(!entity){
            return false;
        }

        delete this.entities[id];

        VAERO.emit(
            "entity:removed",
            entity
        );

        return true;

    }

};

VAERO.register(
    "entityManager",
    EntityManager
);
