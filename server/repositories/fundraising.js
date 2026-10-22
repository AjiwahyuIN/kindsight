import { randomUUID } from 'node:crypto';
import { entities, RequestError, validateRecord, validateId } from '../services/fundraising-validation.js';

const utc = value => value == null ? null : value.replace(' ','T') + 'Z';
function serialize(entity, row) {
  if (!row) return row;
  const record = {...row, created_at:utc(row.created_at),updated_at:utc(row.updated_at),archived_at:utc(row.archived_at)};
  if (entity === 'donations') { record.received_at = utc(row.received_at); record.expected_at = utc(row.expected_at);
    if ('donor_archived_at' in row) record.donor_archived_at = utc(row.donor_archived_at);
    if ('campaign_archived_at' in row) record.campaign_archived_at = utc(row.campaign_archived_at);
  }
  return record;
}
const missing = () => new RequestError(404,'NOT_FOUND','Record not found.');

export function createFundraisingRepository(pool, organizationId) {
  validateId(organizationId); // A scope is mandatory; no global repository fallback.
  async function get(entity, id, connection = pool) {
    const [[record]] = await connection.execute(`SELECT * FROM ${entity} WHERE id = ? AND organization_id = ?`, [id,organizationId]);
    if (!record) throw missing();
    return serialize(entity, record);
  }
  async function references(connection, record, current) {
    for (const [key,table] of [['donor_id','donors'],['campaign_id','campaigns']]) {
      if (!record[key]) continue;
      const [[linked]] = await connection.execute(`SELECT id, archived_at FROM ${table} WHERE id = ? AND organization_id = ? FOR UPDATE`, [record[key],organizationId]);
      if (!linked || (linked.archived_at && current?.[key] !== record[key])) throw new RequestError(409,'REFERENCE_UNAVAILABLE','The selected donor or campaign is unavailable.',{[key]:'Select an active record or leave this empty.'});
    }
  }
  return {
    get,
    async list(entity, {page,pageSize,search,archived,status}) {
      const donation = entity === 'donations';
      const from = donation ? 'donations r LEFT JOIN donors d ON d.id = r.donor_id AND d.organization_id = r.organization_id LEFT JOIN campaigns c ON c.id = r.campaign_id AND c.organization_id = r.organization_id' : `${entity} r`;
      const where = ['r.organization_id = ?'], params = [organizationId];
      if (archived !== 'all') where.push(`r.archived_at IS ${archived === 'active' ? '' : 'NOT '}NULL`);
      if (status) { where.push('r.status = ?'); params.push(status); }
      if (search) {
        const pattern = `%${search.replace(/[=%_]/g, character => '=' + character)}%`;
        const columns = donation ? ["COALESCE(d.name, 'Anonymous')","COALESCE(c.name, 'General giving')",'r.note'] : entity === 'donors' ? ['r.name','r.email','r.organization'] : ['r.name','r.description'];
        where.push('(' + columns.map(column => `${column} LIKE ? ESCAPE '='`).join(' OR ') + ')');
        params.push(...columns.map(() => pattern));
      }
      const condition = where.length ? ' WHERE ' + where.join(' AND ') : '';
      const connection = await pool.getConnection();
      try {
        // Count and rows share a consistent snapshot during concurrent writes.
        await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await connection.beginTransaction();
        const [[{total}]] = await connection.execute(`SELECT COUNT(*) AS total FROM ${from}${condition}`, params);
        const columns = donation ? 'r.*, d.name AS donor_name, d.archived_at AS donor_archived_at, c.name AS campaign_name, c.archived_at AS campaign_archived_at' : 'r.*';
        // These integers are validated and bounded server-side; SQL identifiers never come from input.
        const [records] = await connection.execute(`SELECT ${columns} FROM ${from}${condition} ORDER BY r.created_at DESC, r.id DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`, params);
        await connection.commit();
        return {data:records.map(row => serialize(entity,row)),meta:{page,pageSize,total,pages:Math.max(1,Math.ceil(total/pageSize))}};
      } catch (error) { await connection.rollback(); throw error; }
      finally { connection.release(); }
    },
    async mutate(entity, id, input, action, expectedRevision) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        let current;
        if (id) {
          const [[row]] = await connection.execute(`SELECT * FROM ${entity} WHERE id = ? AND organization_id = ? FOR UPDATE`, [id,organizationId]);
          if (!row) throw missing();
          current = serialize(entity,row);
          if(expectedRevision !== undefined && current.revision !== expectedRevision) throw new RequestError(409,'RECORD_CHANGED','This record changed in another editor. Close and reload the record before editing again.');
        }
        if (action === 'archive' || action === 'restore') {
          await connection.execute(`UPDATE ${entity} SET revision = revision + 1, archived_at = ${action === 'archive' ? 'UTC_TIMESTAMP(3)' : 'NULL'} WHERE id = ? AND organization_id = ?`, [id,organizationId]);
        } else {
          if (current?.archived_at) throw new RequestError(409,'RECORD_ARCHIVED','Restore this record before editing it.');
          const original = current ? Object.fromEntries(entities[entity].map(key => [key,current[key]])) : {};
          const record = validateRecord(entity, {...original,...input});
          if (entity === 'donations') await references(connection, record, current);
          if (id) {
            await connection.execute(`UPDATE ${entity} SET revision = revision + 1, ${entities[entity].map(key => `${key} = ?`).join(', ')} WHERE id = ? AND organization_id = ?`, [...entities[entity].map(key => record[key]),id,organizationId]);
          } else {
            id = randomUUID();
            const columns = ['id','organization_id',...entities[entity]];
            await connection.execute(`INSERT INTO ${entity} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`, [id,organizationId,...entities[entity].map(key => record[key])]);
          }
        }
        const result = await get(entity,id,connection);
        await connection.commit();
        return result;
      } catch (error) { await connection.rollback(); throw error; }
      finally { connection.release(); }
    },
  };
}
