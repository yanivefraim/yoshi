import {Engine} from 'velocity';

import velocityData from '../../velocity.data';
import velocityPrivateData from '../../velocity.private.data';

export function renderVM(template: string, data: any = {}) {
  const engine = new Engine({template});
  return engine.render(Object.assign({}, velocityData, velocityPrivateData, data));
}
