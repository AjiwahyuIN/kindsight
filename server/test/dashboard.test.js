import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardPeriod,campaignQuery,trendBuckets,growth,percent } from '../services/dashboard.js';

test('reporting dates reject rolled calendar dates, incomplete periods, unsupported filters and unbounded ranges',()=>{
  for (const query of [
    {from:'2026-02-30',to:'2026-03-02'},{from:'2026-10-01'},{from:'2026-10-01',to:'2026-10-01'},
    {from:'2026-11-01',to:'2026-10-01'},{from:'2024-01-01',to:'2026-01-01'},
    {from:['2026-10-01'],to:'2026-11-01'},{timeZone:'Asia/Jakarta'},{campaignId:'invalid'},
  ]) assert.throws(()=>dashboardPeriod(query),error=>error.status===400);
  assert.throws(()=>dashboardPeriod({interval:'hour'},true));
  assert.throws(()=>campaignQuery({from:'2026-10-01'}));
  assert.throws(()=>campaignQuery({campaignId:'general'}));
  assert.throws(()=>campaignQuery({pageSize:'1000'}));
});

test('UTC defaults and equal-duration comparison cover month boundaries and leap days',()=>{
  const period=dashboardPeriod({},false,new Date('2026-10-19T00:30:00Z'));
  assert.equal(period.from,'2026-10-01'); assert.equal(period.to,'2026-11-01');
  assert.equal(period.previousFrom,'2026-08-31'); assert.equal(period.previousTo,'2026-10-01');
  const leap=dashboardPeriod({from:'2024-02-28',to:'2024-03-02'});
  assert.equal(leap.days,3);
  assert.deepEqual(trendBuckets(leap),['2024-02-28','2024-02-29','2024-03-01']);
  assert.deepEqual(trendBuckets({...leap,interval:'month'}),['2024-02-01','2024-03-01']);
});

test('percentages use exact decimal arithmetic, clear zero baselines and uncapped campaign progress',()=>{
  assert.equal(growth('0.30','0.20'),'50.00');
  assert.equal(growth('0.00','1.00'),'-100.00');
  assert.equal(growth('1.00','0.00'),null);
  assert.equal(growth('0.00','0.00'),null);
  assert.equal(growth('9999999999999.99','9999999999999.98'),'0.00');
  assert.equal(percent('1.00','3.00'),'33.33');
  assert.equal(percent('1.00','32.00'),'3.13');
  assert.equal(percent('150.00','100.00'),'150.00');
  assert.equal(percent('0.00','0.00'),null);
});
