var ObjectSerializer = function() {
    this.obj_registry = new WeakMap();
    this.name2obj = new Map();
    this.class_registry = new WeakMap();
    this.name2class = new Map();

    this.registerClass(Object, "js.Object");
};

// Register class.
ObjectSerializer.prototype.registerClass = function(constructor, name) {
    if(name === undefined) name = getObjectUniqueID(constructor);
    this.class_registry.set(constructor, name);
    this.name2class.set(name, constructor);
};

// Register global object.
ObjectSerializer.prototype.registerObject = function(object, name) {
    if(name === undefined) name = getObjectUniqueID(object);
    this.obj_registry.set(object, name);
    this.name2obj.set(name, object);
};

ObjectSerializer.prototype.getClassID = function(constructor) {
    if(!this.class_registry.has(constructor)) {
        this.registerClass(constructor, getObjectUniqueID(constructor));
    }
    return this.class_registry.get(constructor);
};

// Serialize an object.
ObjectSerializer.prototype.serialize = function(input) {
    var store = { };
    var self = this;

    function store_object(oid, obj) {
        if(self.obj_registry.has(obj)) {
            return { r: self.obj_registry.get(obj) };
        }
        if(store[oid]) return;
        var store_item = { t: self.getClassID(obj.constructor), p: { } };
        store[oid] = store_item;
        for(var key in obj) {
            if(obj.hasOwnProperty(key)) {
                store_item.p[key] = do_serialize(obj[key]);
            }
        }
        return oid;
    }

    function do_serialize(obj) {
        if(typeof(obj) == "object" || typeof(obj) == "function") {
            if(obj === null) return null;
            if(obj === undefined) return undefined;
            if(obj instanceof Array) {
                return obj.map(do_serialize);
            } else {
                var oid = getObjectUniqueID(obj);
                return { id: store_object(oid, obj) };
            }
        } else {
            // Primitive type.
            return obj;
        }
    }

    return {
        root: do_serialize(input),
        store: store
    };
};
