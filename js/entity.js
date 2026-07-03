class Entity{

    constructor(data={}){

        this.id = data.id || crypto.randomUUID();

        this.type = data.type || "entity";

        this.name = data.name || "Unknown";

        this.createdAt = Date.now();

    }

}
