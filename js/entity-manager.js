const EntityManager = {

    entities: {},

    create(data){

        const entity = new Entity(data);

        this.entities[entity.id] = entity;

        VAERO.emit("entity:created", entity);

        return entity;

    },

    get(id){

        return this.entities[id] || null;

    },

    all(){

        return Object.values(this.entities);

    }

};

VAERO.register("entityManager", EntityManager);
