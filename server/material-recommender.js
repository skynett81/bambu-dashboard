import { upsertMaterialRecommendation, getMaterialRecommendations, getMaterialRecommendation, saveMaterialComparison, getMaterialComparisons, getHistoryForRecommendations } from './database.js';

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mode(arr) {
  if (!arr.length) return null;
  const freq = {};
  let maxCount = 0;
  let modeVal = arr[0];
  for (const v of arr) {
    freq[v] = (freq[v] || 0) + 1;
    if (freq[v] > maxCount) {
      maxCount = freq[v];
      modeVal = v;
    }
  }
  return modeVal;
}

export class MaterialRecommenderService {
  constructor(broadcast) {
    this._broadcast = broadcast || (() => {});
  }

  recalculate() {
    const rows = getHistoryForRecommendations();
    // Group by filament_type + filament_brand
    const groups = {};
    for (const r of rows) {
      const key = `${r.filament_type}||${r.filament_brand || ''}`;
      if (!groups[key]) groups[key] = { type: r.filament_type, brand: r.filament_brand || null, prints: [] };
      groups[key].prints.push(r);
    }

    const results = [];
    for (const g of Object.values(groups)) {
      if (g.prints.length < 3) continue;

      const total = g.prints.length;
      const completed = g.prints.filter(p => p.status === 'completed');
      const successRate = Math.round((completed.length / total) * 1000) / 10;

      const nozzleTemps = completed.filter(p => p.nozzle_target != null).map(p => p.nozzle_target);
      const bedTemps = completed.filter(p => p.bed_target != null).map(p => p.bed_target);
      const speeds = completed.filter(p => p.speed_level != null).map(p => p.speed_level);
      const durations = completed.filter(p => p.duration_seconds != null && p.duration_seconds > 0).map(p => p.duration_seconds);

      const rec = {
        filament_type: g.type,
        filament_brand: g.brand,
        recommended_nozzle_temp: nozzleTemps.length ? Math.round(median(nozzleTemps) * 10) / 10 : null,
        recommended_bed_temp: bedTemps.length ? Math.round(median(bedTemps) * 10) / 10 : null,
        recommended_speed_level: speeds.length ? mode(speeds) : null,
        success_rate: successRate,
        sample_size: total,
        avg_print_time_min: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60 * 10) / 10 : null,
        notes: null
      };

      upsertMaterialRecommendation(rec);
      results.push(rec);
    }

    // Build comparisons per material type
    const typeGroups = {};
    for (const r of results) {
      if (!r.filament_brand) continue;
      if (!typeGroups[r.filament_type]) typeGroups[r.filament_type] = [];
      typeGroups[r.filament_type].push(r);
    }
    for (const [type, recs] of Object.entries(typeGroups)) {
      const rankings = recs.sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0)).map((r, i) => ({
        rank: i + 1,
        brand: r.filament_brand,
        success_rate: r.success_rate,
        sample_size: r.sample_size,
        nozzle_temp: r.recommended_nozzle_temp,
        bed_temp: r.recommended_bed_temp,
        speed_level: r.recommended_speed_level
      }));
      saveMaterialComparison({ filament_type: type, metric: 'success_rate', rankings });
    }

    this._broadcast('material_recommendations_updated', { count: results.length });
    return results;
  }

  getRecommendation(type, brand) {
    return getMaterialRecommendation(type, brand || null);
  }

  compareBrands(type) {
    const comparisons = getMaterialComparisons(type);
    if (comparisons.length === 0) {
      // Build on-the-fly from current recommendations
      const all = getMaterialRecommendations().filter(r => r.filament_type === type && r.filament_brand);
      return all.sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0)).map((r, i) => ({
        rank: i + 1,
        brand: r.filament_brand,
        success_rate: r.success_rate,
        sample_size: r.sample_size,
        nozzle_temp: r.recommended_nozzle_temp,
        bed_temp: r.recommended_bed_temp,
        speed_level: r.recommended_speed_level
      }));
    }
    const latest = comparisons[0];
    try { return typeof latest.rankings === 'string' ? JSON.parse(latest.rankings) : latest.rankings; } catch { return []; }
  }

  suggestSettings(type, brand) {
    // Try exact match first
    let rec = getMaterialRecommendation(type, brand || null);
    if (!rec && brand) {
      // Fall back to type-only recommendation
      rec = getMaterialRecommendation(type, null);
    }
    if (!rec) {
      // Try to find any recommendation for this type
      const all = getMaterialRecommendations().filter(r => r.filament_type === type);
      if (all.length === 0) return null;
      // Use the one with highest success rate
      rec = all.sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0))[0];
    }
    return {
      filament_type: rec.filament_type,
      filament_brand: rec.filament_brand,
      nozzle_temp: rec.recommended_nozzle_temp,
      bed_temp: rec.recommended_bed_temp,
      speed_level: rec.recommended_speed_level,
      success_rate: rec.success_rate,
      sample_size: rec.sample_size,
      avg_print_time_min: rec.avg_print_time_min,
      confidence: rec.sample_size >= 10 ? 'high' : rec.sample_size >= 5 ? 'medium' : 'low'
    };
  }

  getAllRecommendations() {
    return getMaterialRecommendations();
  }

  getSuccessRates() {
    return getMaterialRecommendations()
      .filter(r => r.sample_size >= 3)
      .sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0))
      .map(r => ({
        filament_type: r.filament_type,
        filament_brand: r.filament_brand,
        success_rate: r.success_rate,
        sample_size: r.sample_size,
        recommended_nozzle_temp: r.recommended_nozzle_temp,
        recommended_bed_temp: r.recommended_bed_temp,
        recommended_speed_level: r.recommended_speed_level
      }));
  }
}
