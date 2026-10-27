// La tournée quotidienne de la relance douce, vers 18 h au Québec (22 h UTC) : voir push.mjs.
import { getStore } from '@netlify/blobs';
import { tournee } from './push.mjs';

export const config = { schedule: '0 22 * * *' };

export default async () => {
  const faits = await tournee(getStore({ name: 'diapason-push', consistency: 'strong' }), getStore({ name: 'diapason-espaces', consistency: 'strong' }));
  console.log('relances envoyées :', faits.length);
};
