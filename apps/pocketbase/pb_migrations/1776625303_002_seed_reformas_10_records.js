/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("reformas");

  const record0 = new Record(collection);
    record0.set("titulo", "Reforma Fiscal 2024 - Impuesto sobre la Renta");
    record0.set("contenido", "Nueva estructura de tasas impositivas para personas morales con ingresos superiores a 10 millones de pesos. Se establece una tasa progresiva del 30% al 35% dependiendo del nivel de ingresos.");
    record0.set("fecha_publicacion", "2024-01-15");
    record0.set("fuente", "Diario Oficial de la Federaci\u00f3n");
    record0.set("nivel", "Federal");
    record0.set("materia_legal", "Fiscal");
    record0.set("descripcion_corta", "Reforma de tasas impositivas para personas morales");
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    record1.set("titulo", "Reforma Laboral - Derechos de Trabajadores Remotos");
    record1.set("contenido", "Establece derechos y obligaciones para trabajadores en modalidad remota, incluyendo derecho a desconexi\u00f3n, seguridad social y acceso a beneficios empresariales.");
    record1.set("fecha_publicacion", "2024-02-20");
    record1.set("fuente", "C\u00e1mara de Diputados");
    record1.set("nivel", "Federal");
    record1.set("materia_legal", "Laboral");
    record1.set("descripcion_corta", "Regulaci\u00f3n de trabajo remoto y derechos laborales");
  try {
    app.save(record1);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record2 = new Record(collection);
    record2.set("titulo", "Reforma Mercantil - Protecci\u00f3n de Datos en Transacciones");
    record2.set("contenido", "Nuevas disposiciones para la protecci\u00f3n de datos personales en transacciones comerciales electr\u00f3nicas, con sanciones de hasta 500,000 pesos por incumplimiento.");
    record2.set("fecha_publicacion", "2024-03-10");
    record2.set("fuente", "Diario Oficial de la Federaci\u00f3n");
    record2.set("nivel", "Federal");
    record2.set("materia_legal", "Mercantil");
    record2.set("descripcion_corta", "Protecci\u00f3n de datos en comercio electr\u00f3nico");
  try {
    app.save(record2);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record3 = new Record(collection);
    record3.set("titulo", "Reforma Administrativa Estatal - Simplificaci\u00f3n de Tr\u00e1mites");
    record3.set("contenido", "Reducci\u00f3n de tiempos de respuesta en tr\u00e1mites administrativos estatales de 30 a 15 d\u00edas h\u00e1biles. Implementaci\u00f3n de plataforma digital \u00fanica.");
    record3.set("fecha_publicacion", "2024-01-25");
    record3.set("fuente", "Peri\u00f3dicos Oficiales de Estados");
    record3.set("nivel", "Estatal");
    record3.set("materia_legal", "Administrativo");
    record3.set("descripcion_corta", "Agilizaci\u00f3n de tr\u00e1mites administrativos estatales");
  try {
    app.save(record3);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record4 = new Record(collection);
    record4.set("titulo", "Reforma Penal - Delitos Cibern\u00e9ticos");
    record4.set("contenido", "Tipificaci\u00f3n de nuevos delitos cibern\u00e9ticos incluyendo suplantaci\u00f3n de identidad digital, fraude electr\u00f3nico y extorsi\u00f3n en l\u00ednea. Penas de 3 a 10 a\u00f1os de prisi\u00f3n.");
    record4.set("fecha_publicacion", "2024-02-14");
    record4.set("fuente", "Diario Oficial de la Federaci\u00f3n");
    record4.set("nivel", "Federal");
    record4.set("materia_legal", "Penal");
    record4.set("descripcion_corta", "Tipificaci\u00f3n de delitos cibern\u00e9ticos");
  try {
    app.save(record4);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record5 = new Record(collection);
    record5.set("titulo", "Reforma Civil - Derechos Sucesarios Modernos");
    record5.set("contenido", "Actualizaci\u00f3n de leyes sucesorias para incluir activos digitales, criptomonedas y derechos de autor. Establece procedimientos para herencia digital.");
    record5.set("fecha_publicacion", "2024-03-05");
    record5.set("fuente", "C\u00e1mara de Diputados");
    record5.set("nivel", "Federal");
    record5.set("materia_legal", "Civil");
    record5.set("descripcion_corta", "Regulaci\u00f3n de herencia digital y activos virtuales");
  try {
    app.save(record5);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record6 = new Record(collection);
    record6.set("titulo", "Reforma Fiscal Municipal - Impuesto Predial Progresivo");
    record6.set("contenido", "Implementaci\u00f3n de sistema progresivo de impuesto predial basado en valor catastral. Exenciones para vivienda principal de hasta 500,000 pesos.");
    record6.set("fecha_publicacion", "2024-02-28");
    record6.set("fuente", "Peri\u00f3dicos Oficiales de Estados");
    record6.set("nivel", "Municipal");
    record6.set("materia_legal", "Fiscal");
    record6.set("descripcion_corta", "Sistema progresivo de impuesto predial municipal");
  try {
    app.save(record6);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record7 = new Record(collection);
    record7.set("titulo", "Reforma Laboral - Igualdad Salarial por G\u00e9nero");
    record7.set("contenido", "Obligaci\u00f3n para empresas de m\u00e1s de 50 empleados de publicar an\u00e1lisis de brecha salarial por g\u00e9nero. Sanciones de 50,000 a 500,000 pesos por incumplimiento.");
    record7.set("fecha_publicacion", "2024-03-20");
    record7.set("fuente", "Diario Oficial de la Federaci\u00f3n");
    record7.set("nivel", "Federal");
    record7.set("materia_legal", "Laboral");
    record7.set("descripcion_corta", "Transparencia salarial y equidad de g\u00e9nero");
  try {
    app.save(record7);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record8 = new Record(collection);
    record8.set("titulo", "Reforma Administrativa - Gobierno Abierto y Transparencia");
    record8.set("contenido", "Nuevas disposiciones para acceso a informaci\u00f3n p\u00fablica, incluyendo datos en formato abierto y API p\u00fablicas. Plazo de respuesta de 10 d\u00edas h\u00e1biles.");
    record8.set("fecha_publicacion", "2024-01-30");
    record8.set("fuente", "Diario Oficial de la Federaci\u00f3n");
    record8.set("nivel", "Federal");
    record8.set("materia_legal", "Administrativo");
    record8.set("descripcion_corta", "Transparencia y acceso a informaci\u00f3n p\u00fablica");
  try {
    app.save(record8);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record9 = new Record(collection);
    record9.set("titulo", "Reforma Mercantil Estatal - Apoyo a Peque\u00f1as Empresas");
    record9.set("contenido", "Cr\u00e9ditos preferenciales para PYMES con tasas de inter\u00e9s reducidas del 5% anual. Acceso a fondos de garant\u00eda para microempresas.");
    record9.set("fecha_publicacion", "2024-03-15");
    record9.set("fuente", "Peri\u00f3dicos Oficiales de Estados");
    record9.set("nivel", "Estatal");
    record9.set("materia_legal", "Mercantil");
    record9.set("descripcion_corta", "Financiamiento preferencial para peque\u00f1as empresas");
  try {
    app.save(record9);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})
