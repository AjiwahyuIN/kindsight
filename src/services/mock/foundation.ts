import { foundationColors, type ColorSwatch } from '../../data/foundation';
import { ServiceError, type SampleScenario, type ServiceOptions } from '../types';

export async function getFoundationPalette(scenario: SampleScenario, { signal }: ServiceOptions = {}): Promise<ColorSwatch[]> {
  signal?.throwIfAborted();
  if (scenario === 'error') throw new ServiceError('Contoh kegagalan service. Pilih Data tersedia untuk memulihkan.', 'SAMPLE_ERROR', 400);
  return scenario === 'empty' ? [] : structuredClone([...foundationColors]);
}
