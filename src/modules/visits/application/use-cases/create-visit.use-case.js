class CreateVisitUseCase {
  constructor(visitRepository, airtableService) {
    this.visitRepository = visitRepository;
    this.airtableService = airtableService;
  }

  async execute({ body, user }) {
    const { cliente, municipio, provincia, direccion, airtable_id } = body;

    const newVisit = await this.visitRepository.create({
      tecnicoId: user.id,
      direccion: direccion || cliente || 'Sin Nombre',
      municipio: municipio || 'N/A',
      provincia: provincia || 'N/A'
    });

    if (airtable_id && this.airtableService?.updateEstado) {
      try {
        await this.airtableService.updateEstado(airtable_id, '5. En curso');
        console.log(`Airtable ${airtable_id} actualizado a En curso ✅`);
      } catch (error) {
        console.error('Error Airtable (No bloqueante):', error.message);
      }
    }

    return newVisit;
  }
}

module.exports = CreateVisitUseCase;