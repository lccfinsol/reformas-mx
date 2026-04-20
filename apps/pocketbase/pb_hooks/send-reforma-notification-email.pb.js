/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const reforma = e.record;
  const reformaId = reforma.id;
  const reformaTitulo = reforma.get("titulo");
  const reformaContenido = reforma.get("contenido");
  const reformaFecha = reforma.get("fecha_publicacion");
  const reformaFuente = reforma.get("fuente");
  const reformaMateria = reforma.get("materia_legal");
  const reformaNivel = reforma.get("nivel");
  const reformaDescripcion = reforma.get("descripcion_corta");
  
  try {
    // Get all active subscriptions
    const subscriptions = $app.findAllRecords("user_subscriptions", {
      filter: "activa = true && notificaciones_email = true"
    });
    
    subscriptions.forEach((subscription) => {
      const userId = subscription.get("user_id");
      const suscripcionMateria = subscription.get("materia_legal");
      const suscripcionEstado = subscription.get("estado");
      const suscripcionFuente = subscription.get("fuente");
      
      // Check if reforma matches subscription criteria
      let matches = true;
      
      // Check materia_legal
      if (suscripcionMateria && reformaMateria !== suscripcionMateria) {
        matches = false;
      }
      
      // Check estado (nivel)
      if (suscripcionEstado && suscripcionEstado !== "Federal" && reformaNivel !== suscripcionEstado) {
        matches = false;
      }
      
      // Check fuente
      if (suscripcionFuente !== "Todas" && reformaFuente !== suscripcionFuente) {
        matches = false;
      }
      
      if (matches) {
        // Get user email
        const user = $app.findRecordById("users", userId);
        if (user && user.get("email")) {
          const userEmail = user.get("email");
          
          // Send email notification
          const message = new MailerMessage({
            from: {
              address: $app.settings().meta.senderAddress,
              name: $app.settings().meta.senderName
            },
            to: [{ address: userEmail }],
            subject: "Nueva Reforma: " + reformaTitulo,
            html: "<html><head><style>body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; } .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; } .header { background-color: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; } .header h1 { margin: 0; font-size: 24px; } .content { background-color: white; padding: 20px; border-radius: 0 0 8px 8px; } .field { margin-bottom: 15px; } .field-label { font-weight: bold; color: #1e40af; } .field-value { margin-top: 5px; color: #555; } .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; } .button { display: inline-block; background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; } </style></head><body><div class=\"container\"><div class=\"header\"><h1>Nueva Reforma Publicada</h1></div><div class=\"content\"><p>Hola,</p><p>Se ha publicado una nueva reforma que coincide con tus preferencias de suscripción.</p><div class=\"field\"><div class=\"field-label\">Título:</div><div class=\"field-value\">" + reformaTitulo + "</div></div><div class=\"field\"><div class=\"field-label\">Materia Legal:</div><div class=\"field-value\">" + (reformaMateria || "No especificada") + "</div></div><div class=\"field\"><div class=\"field-label\">Nivel:</div><div class=\"field-value\">" + (reformaNivel || "No especificado") + "</div></div><div class=\"field\"><div class=\"field-label\">Fuente:</div><div class=\"field-value\">" + (reformaFuente || "No especificada") + "</div></div><div class=\"field\"><div class=\"field-label\">Fecha de Publicación:</div><div class=\"field-value\">" + reformaFecha + "</div></div>" + (reformaDescripcion ? "<div class=\"field\"><div class=\"field-label\">Descripción:</div><div class=\"field-value\">" + reformaDescripcion + "</div></div>" : "") + "<div class=\"field\"><div class=\"field-label\">Contenido:</div><div class=\"field-value\">" + reformaContenido.substring(0, 500) + (reformaContenido.length > 500 ? "..." : "") + "</div></div></div><div class=\"footer\"><p>Esta es una notificación automática de tu suscripción a reformas legales.</p></div></div></body></html>"
          });
          
          $app.newMailClient().send(message);
          
          // Create notification history record
          const notificationRecord = new Record("notification_history", {
            user_id: userId,
            reforma_id: reformaId,
            tipo_notificacion: "email",
            leida: false
          });
          $app.save(notificationRecord);
        }
      }
    });
  } catch (error) {
    console.log("Error sending reforma notifications: " + error.message);
  }
  
  e.next();
}, "reformas");