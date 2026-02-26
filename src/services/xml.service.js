/**
 * =====================================================
 * SERVICIO GENERADOR DE XML CEE
 * =====================================================
 */

const { create } = require('xmlbuilder2');

/**
 * Genera XML completo de una visita
 */
exports.generateXML = (data) => {

  const {
    visit,
    building,
    envelope,
    windows,
    installations
  } = data;

  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('DatosEnergeticosDelEdificio', { version: '2.1' });

  // ==============================
  // IDENTIFICACIÓN
  // ==============================

  const identificacion = root.ele('IdentificacionEdificio');

  identificacion.ele('NombreDelEdificio')
    .txt('Vivienda unifamiliar existente');

  identificacion.ele('Direccion')
    .txt(visit.direccion || '');

  identificacion.ele('Municipio')
    .txt(visit.municipio || '');

  identificacion.ele('Provincia')
    .txt(visit.provincia || '');

  identificacion.ele('AnoConstruccion')
    .txt(visit.ano_construccion || '');

  identificacion.ele('ZonaClimatica')
    .txt(building?.zona_climatica || '');

  // ==============================
  // DATOS GENERALES
  // ==============================

  const datosGenerales = root.ele('DatosGeneralesyGeometria');

  datosGenerales.ele('SuperficieHabitable')
    .txt(building?.superficie_habitable || '');

  datosGenerales.ele('VolumenEspacioHabitable')
    .txt(building?.volumen_habitable || '');

  datosGenerales.ele('Compacidad')
    .txt(building?.compacidad || '');

  // ==============================
  // ENVOLVENTE
  // ==============================

  const envolvente = root.ele('DatosEnvolventeTermica');

  const cerramientos = envolvente.ele('CerramientosOpacos');

  envelope.forEach(e => {
    const elemento = cerramientos.ele('Elemento');

    elemento.ele('Nombre').txt(e.nombre || '');
    elemento.ele('Tipo').txt(e.tipo || '');
    elemento.ele('Superficie').txt(e.superficie || '');
    elemento.ele('Orientacion').txt(e.orientacion || '');
    elemento.ele('Transmitancia').txt(e.transmitancia || '');
  });

  const huecos = envolvente.ele('HuecosyLucernarios');

  windows.forEach(w => {
    const elemento = huecos.ele('Elemento');

    elemento.ele('Nombre').txt(w.nombre || '');
    elemento.ele('Superficie').txt(w.superficie || '');
    elemento.ele('Orientacion').txt(w.orientacion || '');
    elemento.ele('Transmitancia').txt(w.transmitancia || '');
    elemento.ele('FactorSolar').txt(w.factor_solar || '');
  });

  // ==============================
  // INSTALACIONES
  // ==============================

  const instalaciones = root.ele('InstalacionesTermicas');

  installations.forEach(i => {
    const generador = instalaciones.ele('Generador');

    generador.ele('Tipo').txt(i.tipo || '');
    generador.ele('Generador').txt(i.generador || '');
    generador.ele('Combustible').txt(i.combustible || '');
    generador.ele('PotenciaNominal').txt(i.potencia_nominal || '');
    generador.ele('RendimientoEstacional')
      .txt(i.rendimiento_estacional || '');
  });

  return root.end({ prettyPrint: true });
};
