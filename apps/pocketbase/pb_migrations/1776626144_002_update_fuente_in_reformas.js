/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("reformas");
  const field = collection.fields.getByName("fuente");
  field.values = ["Diario Oficial de la Federaci\u00f3n", "C\u00e1mara de Diputados", "Peri\u00f3dicos Oficiales de Estados", "Otros", "DOF"];
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("reformas");
  const field = collection.fields.getByName("fuente");
  if (!field) { console.log("Field not found, skipping revert"); return; }
  field.values = ["Diario Oficial de la Federaci\u00f3n", "C\u00e1mara de Diputados", "Peri\u00f3dicos Oficiales de Estados", "Otros"];
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection or field not found, skipping revert");
      return;
    }
    throw e;
  }
})
