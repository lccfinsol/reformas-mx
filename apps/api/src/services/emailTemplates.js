function getMateriaColor(materia) {
  const colors = {
    'Fiscal': '#3b82f6',
    'Laboral': '#10b981',
    'Penal': '#ef4444',
    'Salud': '#8b5cf6',
    'Administrativo': '#f59e0b',
    'Mercantil': '#06b6d4',
    'Otro': '#6b7280',
  };
  return colors[materia] || colors['Otro'];
}

function getImpactoColor(impacto) {
  const colors = {
    'Alto': '#ef4444',
    'Medio': '#f59e0b',
    'Bajo': '#10b981',
  };
  return colors[impacto] || '#6b7280';
}

function getReformaEmailTemplate(reforma, usuario) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const reformaUrl = `${frontendUrl}/reformas/${reforma.id}`;
  const materiaColor = getMateriaColor(reforma.materia_legal);
  const impactoColor = getImpactoColor(reforma.impacto);
  const resumen = reforma.resumen_extraido?.substring(0, 500) || reforma.titulo;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Reforma Legal</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #374151;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
      color: #ffffff;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 20px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 24px;
      color: #1f2937;
    }
    .reforma-title {
      font-size: 22px;
      font-weight: 700;
      color: #1e3a8a;
      margin: 24px 0;
      line-height: 1.4;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 24px 0;
    }
    .badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
    }
    .badge-materia {
      background-color: ${materiaColor};
    }
    .badge-impacto {
      background-color: ${impactoColor};
    }
    .info-section {
      background-color: #f3f4f6;
      border-left: 4px solid #1e3a8a;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-label {
      font-weight: 600;
      color: #1f2937;
    }
    .info-value {
      color: #6b7280;
      text-align: right;
    }
    .summary {
      background-color: #f9fafb;
      padding: 16px;
      border-radius: 4px;
      margin: 24px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #4b5563;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
      color: #ffffff;
      padding: 14px 32px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
      text-align: center;
      transition: opacity 0.2s;
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .footer {
      background-color: #f3f4f6;
      padding: 24px 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    .footer-links {
      margin-bottom: 16px;
    }
    .footer-links a {
      color: #1e3a8a;
      text-decoration: none;
      margin-right: 16px;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
    .footer-contact {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    @media (max-width: 600px) {
      .container {
        border-radius: 0;
      }
      .content {
        padding: 24px 16px;
      }
      .header {
        padding: 32px 16px;
      }
      .reforma-title {
        font-size: 18px;
      }
      .badges {
        flex-direction: column;
      }
      .badge {
        width: 100%;
        text-align: center;
      }
      .info-row {
        flex-direction: column;
      }
      .info-value {
        text-align: left;
        margin-top: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Portal de Reformas Legales</h1>
      <p>Nueva reforma publicada</p>
    </div>

    <div class="content">
      <div class="greeting">
        Hola ${usuario.nombre || 'usuario'},
      </div>

      <p>Se ha publicado una nueva reforma que coincide con tus suscripciones:</p>

      <div class="reforma-title">${reforma.titulo}</div>

      <div class="badges">
        <span class="badge badge-materia">${reforma.materia_legal}</span>
        <span class="badge badge-impacto">Impacto: ${reforma.impacto}</span>
      </div>

      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Tipo de cambio:</span>
          <span class="info-value">${reforma.tipo_cambio}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Fuente:</span>
          <span class="info-value">${reforma.fuente}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ámbito:</span>
          <span class="info-value">${reforma.estado}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Fecha de publicación:</span>
          <span class="info-value">${new Date(reforma.fecha_publicacion).toLocaleDateString('es-MX')}</span>
        </div>
      </div>

      <div class="summary">
        <strong>Resumen:</strong><br>
        ${resumen}${resumen.length >= 500 ? '...' : ''}
      </div>

      <div style="text-align: center;">
        <a href="${reformaUrl}" class="cta-button">Ver reforma completa</a>
      </div>
    </div>

    <div class="footer">
      <div class="footer-links">
        <a href="${frontendUrl}/suscripciones">Mis suscripciones</a>
        <a href="${frontendUrl}/desuscribirse">Desuscribirse</a>
      </div>
      <div class="footer-contact">
        <p style="margin: 0;">
          Portal de Reformas Legales<br>
          Plataforma de seguimiento de cambios legislativos
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export { getReformaEmailTemplate };
