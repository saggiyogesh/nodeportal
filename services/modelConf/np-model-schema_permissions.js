module.exports = {
    name: "SchemaPermissions",
    base: "PersistedModel",
    properties: {
        schemaPermissionsId: { type: Number, id: true},
        permissionSchemaKey: { type: String, required: true, index: {unique: true}},  //schema key defined in permissions definition file
        actionsValue: String, //  saving action value for parsed permissions, bit value of each action
        rolePermissions: String
    },
    finders: {
        getByPermissionSchemaKey: {
            arguments: ["permissionSchemaKey"],
            query: {where: {permissionSchemaKey: "_permissionSchemaKey"} },
            method: "findOne"
        }
    }
};