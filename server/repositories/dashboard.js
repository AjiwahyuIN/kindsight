import { RequestError, validateId } from '../services/fundraising-validation.js';
import { percent,growth,trendBuckets,reportingMeta } from '../services/dashboard.js';

const sqlTime = date => `${date} 00:00:00.000`;
const campaignCondition = campaignId => campaignId === 'general' ? {sql:' AND campaign_id IS NULL',params:[]} : campaignId ? {sql:' AND campaign_id = ?',params:[campaignId]} : {sql:'',params:[]};

export function createDashboardRepository(pool, organizationId) {
  validateId(organizationId);
  async function snapshot(read) {
    const connection = await pool.getConnection();
    try {
      await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
      await connection.beginTransaction();
      const data = await read(connection);
      await connection.commit();
      return data;
    } catch(error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  }
  async function ensureCampaign(connection,id) {
    if (!id || id === 'general') return;
    const [[record]] = await connection.execute('SELECT id FROM campaigns WHERE id = ? AND organization_id = ?',[id,organizationId]);
    if (!record) throw new RequestError(404,'CAMPAIGN_NOT_FOUND','Campaign not found.');
  }
  async function totals(connection,from,to,campaignId) {
    const condition = campaignCondition(campaignId);
    const [[row]] = await connection.execute(`SELECT
      COALESCE(SUM(amount),0.00) AS totalRaised,
      COUNT(*) AS donationCount,
      COUNT(DISTINCT donor_id) AS knownDonorCount,
      COUNT(CASE WHEN donor_id IS NULL THEN 1 END) AS anonymousDonationCount,
      COALESCE(ROUND(AVG(amount),2),0.00) AS averageDonation
      FROM donations WHERE organization_id = ? AND status = 'received' AND archived_at IS NULL
      AND received_at >= ? AND received_at < ?${condition.sql}`, [organizationId,sqlTime(from),sqlTime(to),...condition.params]);
    return row;
  }
  return {
    async summary(period) {
      return snapshot(async connection => {
        await ensureCampaign(connection,period.campaignId);
        const current = await totals(connection,period.from,period.to,period.campaignId);
        const previous = await totals(connection,period.previousFrom,period.previousTo,period.campaignId);
        return {
          data:{
            ...current,previousTotalRaised:previous.totalRaised,growthPercent:growth(current.totalRaised,previous.totalRaised),
            unavailableMetrics:{
              pendingAmount:{value:null,reason:'Pending reporting date basis is not defined.'},
              majorGifts:{value:null,reason:'Major gift threshold is not defined.'},
              forecast:{value:null,reason:'Forecast model and pipeline are not defined.'},
              aiInsights:{value:null,reason:'No insight source or scoring model is connected.'},
            },
          },
          meta:{...reportingMeta(period),growthZeroBaseline:'null',generatedAt:new Date().toISOString()},
        };
      });
    },
    async trend(period) {
      return snapshot(async connection => {
        await ensureCampaign(connection,period.campaignId);
        const condition = campaignCondition(period.campaignId);
        const format = period.interval === 'day' ? '%Y-%m-%d' : '%Y-%m-01';
        const [rows] = await connection.execute(`SELECT DATE_FORMAT(received_at, ?) AS bucket,
          COALESCE(SUM(amount),0.00) AS totalRaised, COUNT(*) AS donationCount
          FROM donations WHERE organization_id = ? AND status = 'received' AND archived_at IS NULL AND received_at >= ? AND received_at < ?${condition.sql}
          GROUP BY bucket ORDER BY bucket`,[format,organizationId,sqlTime(period.from),sqlTime(period.to),...condition.params]);
        const found = new Map(rows.map(row => [row.bucket,row]));
        const data = trendBuckets(period).map(bucket => found.get(bucket) || {bucket,totalRaised:'0.00',donationCount:0});
        return {data,meta:{...reportingMeta(period),interval:period.interval,partialBuckets:'clipped_to_period',generatedAt:new Date().toISOString()}};
      });
    },
    async campaigns(query) {
      return snapshot(async connection => {
        await ensureCampaign(connection,query.campaignId);
        const where = ['c.organization_id = ?'],params=[organizationId];
        if (query.archived !== 'all') where.push(`c.archived_at IS ${query.archived === 'active' ? '' : 'NOT '}NULL`);
        if (query.campaignId) {where.push('c.id = ?');params.push(query.campaignId);}
        if (query.status) {where.push('c.status = ?');params.push(query.status);}
        if (query.search) {where.push("c.name LIKE ? ESCAPE '='");params.push(`%${query.search.replace(/[=%_]/g,character=>'='+character)}%`);}
        const condition = where.length ? ' WHERE '+where.join(' AND ') : '';
        const [[{total}]] = await connection.execute(`SELECT COUNT(*) AS total FROM campaigns c${condition}`,params);
        const [rows] = await connection.execute(`SELECT c.id,c.name,c.target_amount,c.currency,c.status,c.starts_on,c.ends_on,c.archived_at,
          COALESCE(t.totalRaised,0.00) AS totalRaised,COALESCE(t.donationCount,0) AS donationCount
          FROM campaigns c LEFT JOIN (
            SELECT campaign_id,SUM(amount) AS totalRaised,COUNT(*) AS donationCount FROM donations
            WHERE organization_id = ? AND status = 'received' AND archived_at IS NULL GROUP BY campaign_id
          ) t ON t.campaign_id = c.id${condition}
          ORDER BY c.created_at DESC,c.id DESC LIMIT ${query.pageSize} OFFSET ${(query.page-1)*query.pageSize}`,[organizationId,...params]);
        return {
          data:rows.map(row=>({...row,archived_at:row.archived_at ? row.archived_at.replace(' ','T')+'Z' : null,donationCount:Number(row.donationCount),progressPercent:percent(row.totalRaised,row.target_amount)})),
          meta:{page:query.page,pageSize:query.pageSize,total,pages:Math.max(1,Math.ceil(total/query.pageSize)),currency:'USD',timeZone:'UTC',scope:'lifetime',progressUncapped:true,zeroTarget:'null',excludesArchivedDonations:true,generatedAt:new Date().toISOString()},
        };
      });
    },
  };
}
