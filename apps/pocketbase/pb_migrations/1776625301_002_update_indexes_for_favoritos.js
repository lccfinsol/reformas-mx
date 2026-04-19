/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("favoritos");
  collection.indexes.push("CREATE UNIQUE INDEX idx_favoritos_usuario_reforma ON favoritos (usuario_id, reforma_id)");
  return app.save(collection);
}, (app) => {
  try {
  const collection = app.findCollectionByNameOrId("favoritos");
  collection.indexes = collection.indexes.filter(idx => !idx.includes("idx_favoritos_usuario_reforma"));
  return app.save(collection);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
