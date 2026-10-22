import { createHash } from 'node:crypto';
import { landingKeys,normalizeLanding } from '../../shared/landing-content.js';
import { RequestError } from '../services/fundraising-validation.js';
const revision=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const decode=value=>typeof value==='string'?JSON.parse(value):value;
const output=(section,row)=>{const raw=decode(row.content_json);const timestamp=typeof row.updated_at==='string'?row.updated_at.replace(' ','T')+'Z':row.updated_at;return {data:normalizeLanding(section,raw),meta:{revision:revision(raw),updatedAt:new Date(timestamp).toISOString()}};};
export function createLandingRepository(pool,keys=landingKeys) {
  async function row(connection,section,lock=false) {
    const [[record]]=await connection.execute(`SELECT content_json,updated_at FROM landing_sections WHERE section_key = ?${lock?' FOR UPDATE':''}`,[keys[section]]);
    if(!record)throw new RequestError(404,'CONTENT_NOT_FOUND','Landing content is not initialized.');
    return record;
  }
  return {
    async get(section){return output(section,await row(pool,section));},
    async update(section,content,expectedRevision){
      const connection=await pool.getConnection();
      try {
        await connection.beginTransaction();const current=await row(connection,section,true);
        if(revision(decode(current.content_json))!==expectedRevision)throw new RequestError(409,'CONTENT_CHANGED','This content was changed in another editor. Reload the saved content before editing again.');
        // The original Hero illustration is not CMS copy or a live financial report.
        const raw=decode(current.content_json);
        let stored=section==='hero'&&Object.hasOwn(raw,'preview')?{...content,preview:raw.preview}:content;
        if(section==='difference'){
          stored={...content,...(Object.hasOwn(raw,'insight')?{insight:raw.insight}:{}),items:content.items.map(item=>{
            const original=raw.items.find(entry=>entry.id===item.id);
            return {...item,...(original?.icon?{icon:original.icon}:{})};
          })};
        }
        await connection.execute('UPDATE landing_sections SET content_json = ?,updated_at = CURRENT_TIMESTAMP(3) WHERE section_key = ?',[JSON.stringify(stored),keys[section]]);
        const result=output(section,await row(connection,section));await connection.commit();return result;
      } catch(error){await connection.rollback();throw error;}finally{connection.release();}
    },
  };
}
