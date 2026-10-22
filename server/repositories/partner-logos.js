import { partners } from '../../src/scripts/data/partners.js';
const publicLogo = row => ({id:row.id,name:row.name,width:row.width,height:row.height,builtin:false,src:`/api/v1/partner-logos/${row.id}/file`});
export function createPartnerLogoRepository(pool) {
  return {
    async list() {
      const [rows]=await pool.execute('SELECT id,name,width,height FROM partner_logos ORDER BY created_at,id');
      return [...partners.map(({file,...partner})=>({...partner,builtin:true})),...rows.map(publicLogo)];
    },
    async get(id) {const [[row]]=await pool.execute('SELECT * FROM partner_logos WHERE id=?',[id]);return row;},
    async create(logo) {
      await pool.execute('INSERT INTO partner_logos (id,name,file_name,width,height) VALUES (?,?,?,?,?)',[logo.id,logo.name,logo.file_name,logo.width,logo.height]);
      return publicLogo(logo);
    },
  };
}
