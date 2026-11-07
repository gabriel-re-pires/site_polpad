import { describe, expect, it } from 'vitest';
import { HARDWARE } from '../src/lib/site';

describe('HARDWARE', () => {
  it('botões de STL baixam o arquivo (raw), não abrem o visualizador', () => {
    expect(HARDWARE.caseTopo).toBe('https://github.com/gabriel-re-pires/polpad/raw/main/hardware/case/case_top.stl');
    expect(HARDWARE.caseBase).toBe('https://github.com/gabriel-re-pires/polpad/raw/main/hardware/case/case_bottom.stl');
  });
});
