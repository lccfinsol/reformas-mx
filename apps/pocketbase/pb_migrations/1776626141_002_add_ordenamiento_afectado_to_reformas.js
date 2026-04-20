/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("reformas");

  const existing = collection.fields.getByName("ordenamiento_afectado");
  if (existing) {
    if (existing.type === "text") {
      return; // field already exists with correct type, skip
    }
    collection.fields.removeByName("ordenamiento_afectado"); // exists with wrong type, remove first
  }

  collection.fields.add(new TextField({
    name: "ordenamiento_afectado",
    required: false
  }));

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("reformas");
    collection.fields.removeByName("ordenamiento_afectado");
    return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
