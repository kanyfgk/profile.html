class Entity{

    constructor(data = {}){

        this.id = data.id || crypto.randomUUID();

        this.type = data.type || "entity";

        this.name = data.name || "Unnamed Entity";

        this.description = data.description || "";

        this.status = data.status || "active";

        this.organs = data.organs || []; 

        this.bridges = data.bridges || [];

        this.createdAt = data.createdAt || Date.now();

    }

    addOrgan(organ){

        if(!organ || !organ.name){
            return;
        }

        this.organs.push(organ);

    }

    addBridge(bridge){

        if(!bridge || !bridge.id){
            return;
        }

        this.bridges.push(bridge);

    }

    toJSON(){

        return {
            id:this.id,
            type:this.type,
            name:this.name,
            description:this.description,
            status:this.status,
            organs:this.organs,
            bridges:this.bridges,
            createdAt:this.createdAt
        };

    }

}
