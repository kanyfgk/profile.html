const Guardian = {

    rules: [],

    addRule(name, validator){

        this.rules.push({
            name,
            validator
        });

    },

    validate(entity){

        for(const rule of this.rules){

            const result = rule.validator(entity);

            if(result !== true){

                console.warn(
                    "Guardian blocked:",
                    rule.name
                );

                return false;

            }

        }

        return true;

    }

};

Guardian.addRule(
    "Entity Must Have ID",
    entity => !!entity.id
);

Guardian.addRule(
    "Entity Must Have Name",
    entity => !!entity.name
);

VAERO.register("guardian", Guardian);
