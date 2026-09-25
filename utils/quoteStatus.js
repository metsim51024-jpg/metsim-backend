// backend/utils/quoteStatus.js
// Fuente unica de verdad de los estados de una cotizacion.
// La usan el modelo, el panel de admin, los emails y la pagina publica de
// seguimiento, para que no se desincronicen las etiquetas ni el orden.

/**
 * Etapas del recorrido, en orden. `key` es lo que se guarda en la base.
 * `label` y `description` son lo que ve el cliente en /seguimiento.
 */
const STAGES = [
  {
    key: 'received',
    label: 'Solicitud recibida',
    description: 'Tu pedido entro al sistema y quedo registrado con su numero de seguimiento.'
  },
  {
    key: 'analyzing',
    label: 'En analisis tecnico',
    description: 'Estamos revisando el alcance del proyecto y calculando materiales y plazos.'
  },
  {
    key: 'quoted',
    label: 'Presupuesto enviado',
    description: 'Te enviamos la cotizacion por correo con el detalle de materiales y plazos.'
  },
  {
    key: 'approved',
    label: 'Aprobado por el cliente',
    description: 'Confirmaste el presupuesto y el proyecto entro en agenda de produccion.'
  },
  {
    key: 'drawings',
    label: 'Planos en aprobacion',
    description: 'Preparamos los planos de fabricacion y esperamos tu visto bueno para cortar material.'
  },
  {
    key: 'manufacturing',
    label: 'En fabricacion',
    description: 'Tu pedido esta en planta. Te avisamos cuando pase a despacho.'
  },
  {
    key: 'delivered',
    label: 'Entregado',
    description: 'Trabajo entregado e instalado. Gracias por confiar en METSIM.'
  }
];

/** Estado terminal que no forma parte del recorrido feliz. */
const REJECTED = {
  key: 'rejected',
  label: 'No continuo',
  description: 'Este pedido quedo cerrado sin avanzar. Si fue un error, escribinos y lo reabrimos.'
};

/**
 * Estados viejos que quedaron en las cotizaciones creadas antes del seguimiento.
 * Se siguen aceptando para no invalidar los documentos existentes, pero se
 * muestran siempre traducidos al estado nuevo equivalente.
 */
const LEGACY_MAP = {
  pending: 'received',
  responded: 'quoted',
  accepted: 'approved'
};

const STAGE_KEYS = STAGES.map((s) => s.key);
const ALL_KEYS = [...STAGE_KEYS, REJECTED.key];

/** Lo que acepta el enum del modelo: los estados nuevos mas los viejos. */
const SCHEMA_VALUES = [...ALL_KEYS, ...Object.keys(LEGACY_MAP)];

/** Traduce un estado viejo a su equivalente nuevo; deja pasar los ya validos. */
const normalizeStatus = (status) => {
  if (!status) return 'received';
  return LEGACY_MAP[status] || status;
};

/** Etiqueta legible de un estado, sirva o no para el recorrido. */
const labelOf = (status) => {
  const key = normalizeStatus(status);
  if (key === REJECTED.key) return REJECTED.label;
  const stage = STAGES.find((s) => s.key === key);
  return stage ? stage.label : key;
};

/**
 * Arma la linea de tiempo que ve el cliente.
 * Las etapas anteriores a la actual se marcan cumplidas; la fecha sale del
 * historial cuando existe, y si no del createdAt (cotizaciones viejas, que no
 * tienen historial porque son anteriores a esta funcionalidad).
 */
const buildTimeline = (quote) => {
  const current = normalizeStatus(quote.status);
  const history = quote.status_history || [];

  const dateFor = (key) => {
    const entry = history.find((h) => normalizeStatus(h.status) === key);
    if (entry) return entry.at;
    // La primera etapa siempre ocurrio: es cuando se creo la solicitud.
    if (key === 'received') return quote.createdAt;
    return null;
  };

  const isRejected = current === REJECTED.key;
  // Si fue rechazada, el recorrido se congela en la ultima etapa alcanzada.
  const lastReached = isRejected
    ? history.map((h) => STAGE_KEYS.indexOf(normalizeStatus(h.status))).filter((i) => i >= 0).pop()
    : STAGE_KEYS.indexOf(current);
  const currentIndex = typeof lastReached === 'number' && lastReached >= 0 ? lastReached : 0;

  const timeline = STAGES.map((stage, i) => ({
    key: stage.key,
    label: stage.label,
    description: stage.description,
    state: i < currentIndex ? 'done' : i === currentIndex ? (isRejected ? 'done' : 'current') : 'pending',
    at: i <= currentIndex ? dateFor(stage.key) : null
  }));

  if (isRejected) {
    timeline.push({
      key: REJECTED.key,
      label: REJECTED.label,
      description: REJECTED.description,
      state: 'rejected',
      at: dateFor(REJECTED.key) || quote.updatedAt
    });
  }

  return timeline;
};

module.exports = {
  STAGES,
  REJECTED,
  LEGACY_MAP,
  STAGE_KEYS,
  ALL_KEYS,
  SCHEMA_VALUES,
  normalizeStatus,
  labelOf,
  buildTimeline
};
