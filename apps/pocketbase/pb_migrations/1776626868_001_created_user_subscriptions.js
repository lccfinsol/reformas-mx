/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Fetch related collections to get their IDs
  const usersCollection = app.findCollectionByNameOrId("users");

  const collection = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "user_id = @request.auth.id",
    "fields":     [
          {
                "autogeneratePattern": "[a-z0-9]{15}",
                "hidden": false,
                "id": "text6455425936",
                "max": 15,
                "min": 15,
                "name": "id",
                "pattern": "^[a-z0-9]+$",
                "presentable": false,
                "primaryKey": true,
                "required": true,
                "system": true,
                "type": "text"
          },
          {
                "hidden": false,
                "id": "relation6675542730",
                "name": "user_id",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "relation",
                "cascadeDelete": false,
                "collectionId": usersCollection.id,
                "displayFields": [],
                "maxSelect": 1,
                "minSelect": 0
          },
          {
                "hidden": false,
                "id": "select9861548671",
                "name": "materia_legal",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "select",
                "maxSelect": 1,
                "values": [
                      "Fiscal",
                      "Laboral",
                      "Procesal y mercantil",
                      "Penal",
                      "Salud y seguridad social",
                      "Administrativo",
                      "Otras"
                ]
          },
          {
                "hidden": false,
                "id": "select1107242098",
                "name": "estado",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "select",
                "maxSelect": 1,
                "values": [
                      "Federal",
                      "Aguascalientes",
                      "Baja California",
                      "Baja California Sur",
                      "Campeche",
                      "Chiapas",
                      "Chihuahua",
                      "Ciudad de M\u00e9xico",
                      "Coahuila",
                      "Colima",
                      "Durango",
                      "Estado de M\u00e9xico",
                      "Guanajuato",
                      "Guerrero",
                      "Hidalgo",
                      "Jalisco",
                      "Michoac\u00e1n",
                      "Morelos",
                      "Nayarit",
                      "Nuevo Le\u00f3n",
                      "Oaxaca",
                      "Puebla",
                      "Quer\u00e9taro",
                      "Quintana Roo",
                      "San Luis Potos\u00ed",
                      "Sinaloa",
                      "Sonora",
                      "Tabasco",
                      "Tamaulipas",
                      "Tlaxcala",
                      "Veracruz",
                      "Yucat\u00e1n",
                      "Zacatecas"
                ]
          },
          {
                "hidden": false,
                "id": "select9223413977",
                "name": "fuente",
                "presentable": false,
                "primaryKey": false,
                "required": true,
                "system": false,
                "type": "select",
                "maxSelect": 1,
                "values": [
                      "DOF",
                      "C\u00e1mara de Diputados",
                      "Peri\u00f3dico Estatal",
                      "Todas"
                ]
          },
          {
                "hidden": false,
                "id": "bool8072024736",
                "name": "activa",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "bool"
          },
          {
                "hidden": false,
                "id": "bool3924391599",
                "name": "notificaciones_email",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "bool"
          },
          {
                "hidden": false,
                "id": "bool5063303432",
                "name": "notificaciones_tiempo_real",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "bool"
          },
          {
                "hidden": false,
                "id": "autodate9326363742",
                "name": "fecha_creacion",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "autodate",
                "onCreate": true,
                "onUpdate": false
          },
          {
                "hidden": false,
                "id": "date6699082244",
                "name": "ultima_notificacion",
                "presentable": false,
                "primaryKey": false,
                "required": false,
                "system": false,
                "type": "date",
                "max": "",
                "min": ""
          },
          {
                "hidden": false,
                "id": "autodate2161377455",
                "name": "created",
                "onCreate": true,
                "onUpdate": false,
                "presentable": false,
                "system": false,
                "type": "autodate"
          },
          {
                "hidden": false,
                "id": "autodate8423097250",
                "name": "updated",
                "onCreate": true,
                "onUpdate": true,
                "presentable": false,
                "system": false,
                "type": "autodate"
          }
    ],
    "id": "pbc_9023758691",
    "indexes": [],
    "listRule": "user_id = @request.auth.id",
    "name": "user_subscriptions",
    "system": false,
    "type": "base",
    "updateRule": "user_id = @request.auth.id",
    "viewRule": "user_id = @request.auth.id"
  });

  try {
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("Collection name must be unique")) {
      console.log("Collection already exists, skipping");
      return;
    }
    throw e;
  }
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("pbc_9023758691");
    return app.delete(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
