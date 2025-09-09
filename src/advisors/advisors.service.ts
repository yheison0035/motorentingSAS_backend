import { Injectable } from '@nestjs/common';

@Injectable()
export class AdvisorsService {
  getAdvisors() {
    return [{ name: 'Manuel' }, { name: 'Patricia' }, { name: 'Alex' }];
  }

  createAdvisor() {
    return 'creando asesor.';
  }

  updateAdvisor() {
    return 'actualizando asesor.';
  }

  deleteAdvisor() {
    return 'eliminando asesor.';
  }

  updateAdvisorSegment() {
    return 'actualiza el estado del registro.';
  }
}
