class Entity {

    constructor(data = {}){

        this.id =
            data.id ||
            Entity.createId();

        this.type =
            String(
                data.type ||
                "entity"
            ).trim();

        this.name =
            String(
                data.name ||
                "İsimsiz Varlık"
            ).trim();

        this.description =
            String(
                data.description ||
                ""
            ).trim();

        this.status =
            String(
                data.status ||
                "active"
            ).trim();

        this.organs =
            Array.isArray(data.organs)
                ? [...data.organs]
                : [];

        this.bridges =
            Array.isArray(data.bridges)
                ? [...data.bridges]
                : [];

        this.identity =
            data.identity &&
            typeof data.identity === "object"
                ? { ...data.identity }
                : null;

        this.profile =
            data.profile &&
            typeof data.profile === "object"
                ? {
                    ...data.profile,
                    identity:
                        data.profile.identity ||
                        this.identity
                }
                : null;

        this.createdAt =
            Number(data.createdAt) ||
            Date.now();

        this.updatedAt =
            Number(data.updatedAt) ||
            this.createdAt;

    }

    static createId(){

        if(
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
        ){
            return crypto.randomUUID();
        }

        return `entity_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 10)}`;

    }

    addOrgan(organ){

        if(!organ || !organ.name){
            return null;
        }

        const organName =
            String(organ.name)
                .trim()
                .toLowerCase();

        const existing =
            this.organs.find(item =>
                String(item?.name || "")
                    .trim()
                    .toLowerCase() === organName
            );

        if(existing){
            return existing;
        }

        this.organs.push(organ);
        this.updatedAt = Date.now();

        return organ;

    }

    addBridge(bridge){

        if(!bridge || !bridge.id){
            return null;
        }

        const existing =
            this.bridges.find(
                item =>
                    item?.id === bridge.id
            );

        if(existing){
            return existing;
        }

        this.bridges.push(bridge);
        this.updatedAt = Date.now();

        return bridge;

    }

    update(data = {}){

        if(
            typeof data.name === "string" &&
            data.name.trim()
        ){
            this.name = data.name.trim();
        }

        if(typeof data.description === "string"){
            this.description =
                data.description.trim();
        }

        if(
            typeof data.status === "string" &&
            data.status.trim()
        ){
            this.status =
                data.status.trim();
        }

        this.updatedAt = Date.now();

        return this;

    }

    toJSON(){

        return {
            id: this.id,
            type: this.type,
            name: this.name,
            description: this.description,
            status: this.status,
            organs: this.organs,
            bridges: this.bridges,
            identity: this.identity,
            profile: this.profile,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };

    }

}
