/**
 * Emparejamiento entre un aporte y la familia que lo realizó.
 *
 * Un aporte guarda solo el nombre que escribió la persona ("María Soto"), pero
 * el panel admin necesita saber a qué familia pertenece ("Familia Soto"). No
 * existe vínculo en la base de datos, así que el aporte se cruza con las
 * familias registradas (invitaciones y confirmaciones de asistencia):
 *
 * 1. Por email: si el aporte trae email y coincide con una confirmación.
 * 2. Por nombre exacto normalizado (minúsculas, sin acentos, sin el prefijo
 *    "familia"): nombre de la familia, nombre de cada persona que asiste y el
 *    mismo criterio sobre las invitaciones (familia y personas invitadas).
 * 3. Por coincidencia parcial: si los términos significativos de un nombre
 *    contienen a los del otro ("María Soto" ↔ "María Soto Pérez", o solo
 *    "Soto" ↔ "Familia Soto") y hay una única familia posible.
 *
 * Si el emparejamiento es ambiguo se devuelve `null`: es preferible no mostrar
 * familia que atribuir un aporte a la familia equivocada.
 */

/** Largo mínimo de un término para usarlo en comparaciones parciales */
const LARGO_MINIMO_TERMINO = 3;

/** Palabras que no aportan información al comparar nombres */
const PALABRAS_IGNORADAS = new Set([
  'de',
  'del',
  'la',
  'las',
  'los',
  'y',
  'e',
  'familia',
  'don',
  'dona',
  'sr',
  'sra',
  'srta',
]);

/** Datos mínimos de las familias registradas para poder emparejar aportes */
export interface DatosFamilias {
  invitaciones: Array<{ familia: string; asistentes?: string | null }>;
  asistencias: Array<{
    nombreFamilia: string;
    email?: string | null;
    asistentes: Array<{ nombre: string }>;
  }>;
}

/**
 * Clave de comparación "fuerte" de nombres: minúsculas, sin acentos, sin
 * espacios extra y sin el prefijo "familia". Así "Familia Guevara Reyes" y
 * "Guevara Reyes" se consideran la misma familia.
 */
export function normalizarClave(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^familia\s+/, '');
}

/** Normaliza un email para comparar (minúsculas y sin espacios). */
function normalizarEmail(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase();
}

/** Términos significativos de un nombre, para comparaciones parciales */
function terminosSignificativos(nombre: string): string[] {
  return normalizarClave(nombre)
    .split(' ')
    .filter((t) => t.length >= LARGO_MINIMO_TERMINO && !PALABRAS_IGNORADAS.has(t));
}

/** Indica si todos los términos de `a` están dentro de `b` */
function contieneTerminos(a: string[], b: string[]): boolean {
  return a.every((t) => b.includes(t));
}

/**
 * Construye un buscador que, dado el nombre y el email de un aporte, devuelve
 * el nombre de la familia registrada que le corresponde (o `null`).
 */
export function crearBuscadorDeFamilias(datos: DatosFamilias) {
  const porEmail = new Map<string, string>();
  const porNombre = new Map<string, string>();
  const candidatos: Array<{ terminos: string[]; familia: string }> = [];

  const registrar = (nombre: string, familia: string) => {
    const clave = normalizarClave(nombre);
    if (!clave) return;

    // El primer registro gana (se registran primero las confirmaciones, que
    // reflejan cómo se llama la familia en el RSVP).
    if (!porNombre.has(clave)) porNombre.set(clave, familia);

    const terminos = terminosSignificativos(clave);
    if (terminos.length > 0) candidatos.push({ terminos, familia });
  };

  // Primero las confirmaciones de asistencia (la familia tal como respondió)
  for (const asistencia of datos.asistencias) {
    const email = normalizarEmail(asistencia.email);
    if (email && !porEmail.has(email)) porEmail.set(email, asistencia.nombreFamilia);

    registrar(asistencia.nombreFamilia, asistencia.nombreFamilia);
    for (const asistente of asistencia.asistentes) {
      registrar(asistente.nombre, asistencia.nombreFamilia);
    }
  }

  // Luego las invitaciones (nombre de la familia y personas invitadas)
  for (const invitacion of datos.invitaciones) {
    registrar(invitacion.familia, invitacion.familia);
    const personas = (invitacion.asistentes || '').split(/[\n,;]+/);
    for (const persona of personas) {
      registrar(persona, invitacion.familia);
    }
  }

  return function familiaDeAporte(
    nombreInvitado: string,
    emailInvitado?: string | null
  ): string | null {
    const email = normalizarEmail(emailInvitado);
    if (email) {
      const familia = porEmail.get(email);
      if (familia) return familia;
    }

    const clave = normalizarClave(nombreInvitado || '');
    if (!clave) return null;

    const terminos = terminosSignificativos(clave);

    // Con nombre y apellido basta que calce exacto con una familia o persona.
    // Con una sola palabra ("Soto", "María") el dato es débil: se exige que
    // exista una única familia posible para no atribuir mal el aporte.
    if (terminos.length >= 2) {
      const exacta = porNombre.get(clave);
      if (exacta) return exacta;
    }

    if (terminos.length === 0) {
      return porNombre.get(clave) ?? null;
    }

    // Coincidencia parcial: los términos de uno deben contener los del otro
    const familiasCoincidentes = new Set<string>();
    for (const candidato of candidatos) {
      if (
        contieneTerminos(terminos, candidato.terminos) ||
        contieneTerminos(candidato.terminos, terminos)
      ) {
        familiasCoincidentes.add(candidato.familia);
      }
    }

    return familiasCoincidentes.size === 1 ? [...familiasCoincidentes][0] : null;
  };
}
