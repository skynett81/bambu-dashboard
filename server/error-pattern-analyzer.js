import { saveErrorPattern, getErrorPatterns, clearErrorPatterns, saveErrorCorrelation, getErrorCorrelations, clearErrorCorrelations, upsertPrinterHealthScore, getPrinterHealthScores, getPrinterHealthScore, getErrorsForAnalysis, getHistoryForErrorAnalysis, getErrorPattern } from './database.js';

export class ErrorPatternAnalyzer {
  constructor(broadcast) {
    this._broadcast = broadcast || (() => {});
  }

  analyze() {
    try {
      this.analyzePatterns();
      this.analyzeCorrelations();
      this.calculateHealthScores();
      this._broadcast('error_analysis_updated', { timestamp: new Date().toISOString() });
    } catch (e) {
      console.error('[error-analysis] Analysefeil:', e.message);
    }
  }

  analyzePatterns() {
    const errors = getErrorsForAnalysis();
    if (!errors.length) return [];

    clearErrorPatterns();

    // Group errors by code
    const byCode = {};
    for (const e of errors) {
      if (!e.code) continue;
      if (!byCode[e.code]) byCode[e.code] = [];
      byCode[e.code].push(e);
    }

    const history = getHistoryForErrorAnalysis();
    const results = [];

    for (const [code, codeErrors] of Object.entries(byCode)) {
      if (codeErrors.length < 2) continue;

      // Find common conditions
      const conditions = this._findCommonConditions(codeErrors, history);
      const timestamps = codeErrors.map(e => e.timestamp).filter(Boolean).sort();
      const severity = this._dominantSeverity(codeErrors);

      // Generate suggestion
      const suggestion = this._generateSuggestion(code, conditions, codeErrors);

      // Confidence: based on sample size and condition consistency
      const confidence = Math.min(1, Math.round((codeErrors.length / Math.max(errors.length, 1)) * 10 * 100) / 100);

      const pattern = {
        pattern_name: `${code} Pattern`,
        description: `Error ${code}: ${codeErrors[0]?.message || 'Unknown'}`,
        error_codes: [code],
        conditions,
        frequency: codeErrors.length,
        severity,
        suggestion,
        confidence: Math.min(confidence, 1),
        first_seen: timestamps[0] || null,
        last_seen: timestamps[timestamps.length - 1] || null
      };

      saveErrorPattern(pattern);
      results.push(pattern);
    }

    return results;
  }

  analyzeCorrelations() {
    const errors = getErrorsForAnalysis();
    const history = getHistoryForErrorAnalysis();
    if (!errors.length || !history.length) return [];

    clearErrorCorrelations();

    // Get unique error codes
    const errorCodes = [...new Set(errors.filter(e => e.code).map(e => e.code))];
    const totalPrints = history.length;
    const results = [];

    for (const code of errorCodes) {
      const codeErrors = errors.filter(e => e.code === code);
      const totalErrors = codeErrors.length;

      // Correlate with material types
      const materialCorrs = this._correlateFactor(codeErrors, history, 'filament_type', totalErrors, totalPrints);
      for (const c of materialCorrs) {
        c.error_code = code;
        c.factor = 'material';
        saveErrorCorrelation(c);
        results.push(c);
      }

      // Correlate with speed levels
      const speedCorrs = this._correlateFactor(codeErrors, history, 'speed_level', totalErrors, totalPrints);
      for (const c of speedCorrs) {
        c.error_code = code;
        c.factor = 'speed';
        saveErrorCorrelation(c);
        results.push(c);
      }

      // Correlate with printers
      const printerCorrs = this._correlateByPrinter(codeErrors, history, totalErrors, totalPrints);
      for (const c of printerCorrs) {
        c.error_code = code;
        c.factor = 'printer';
        saveErrorCorrelation(c);
        results.push(c);
      }

      // Correlate with temperature ranges from context
      const tempCorrs = this._correlateTemperature(codeErrors, totalErrors);
      for (const c of tempCorrs) {
        c.error_code = code;
        c.factor = 'temperature';
        saveErrorCorrelation(c);
        results.push(c);
      }
    }

    return results;
  }

  calculateHealthScores() {
    const errors = getErrorsForAnalysis();
    const history = getHistoryForErrorAnalysis();

    // Get unique printer IDs from both errors and history
    const printerIds = [...new Set([
      ...errors.map(e => e.printer_id).filter(Boolean),
      ...history.map(h => h.printer_id).filter(Boolean)
    ])];

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString();

    for (const pid of printerIds) {
      const printerErrors = errors.filter(e => e.printer_id === pid);
      const printerHistory = history.filter(h => h.printer_id === pid);

      // Errors in last 30 days
      const recentErrors = printerErrors.filter(e => e.timestamp >= thirtyDaysAgo);
      // Print hours in last 30 days
      const recentPrints = printerHistory.filter(h => h.started_at >= thirtyDaysAgo);
      const printHours30d = recentPrints.reduce((sum, h) => sum + ((h.duration_seconds || 0) / 3600), 0);

      // Error frequency: errors per print hour
      const errorFrequency = printHours30d > 0 ? Math.round((recentErrors.length / printHours30d) * 100) / 100 : 0;

      // MTBF: total print hours / total errors
      const totalPrintHours = printerHistory.reduce((sum, h) => sum + ((h.duration_seconds || 0) / 3600), 0);
      const mtbf = printerErrors.length > 0 ? Math.round((totalPrintHours / printerErrors.length) * 10) / 10 : null;

      // Health score: 100 - (error_frequency * 20), clamped 0-100
      const healthScore = Math.max(0, Math.min(100, Math.round((100 - errorFrequency * 20) * 10) / 10));

      // Trend: compare last 7 days vs previous 7 days
      const last7Errors = printerErrors.filter(e => e.timestamp >= sevenDaysAgo).length;
      const prev7Errors = printerErrors.filter(e => e.timestamp >= fourteenDaysAgo && e.timestamp < sevenDaysAgo).length;
      let trend = 'stable';
      if (last7Errors > prev7Errors * 1.3) trend = 'worsening';
      else if (last7Errors < prev7Errors * 0.7 && prev7Errors > 0) trend = 'improving';

      // Risk factors: top 3 most frequent error codes
      const codeCounts = {};
      for (const e of recentErrors) {
        if (e.code) codeCounts[e.code] = (codeCounts[e.code] || 0) + 1;
      }
      const riskFactors = Object.entries(codeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([code, count]) => ({ code, count }));

      upsertPrinterHealthScore({
        printer_id: pid,
        health_score: healthScore,
        error_frequency: errorFrequency,
        mtbf_hours: mtbf,
        risk_factors: riskFactors,
        trend
      });
    }
  }

  getSuggestions(printerId) {
    const patterns = getErrorPatterns();
    const health = printerId ? getPrinterHealthScore(printerId) : null;
    const correlations = getErrorCorrelations(null);

    const suggestions = [];

    // From patterns: filter by printer if applicable
    for (const p of patterns) {
      if (!p.suggestion) continue;
      let conditions;
      try { conditions = typeof p.conditions === 'string' ? JSON.parse(p.conditions) : p.conditions; } catch { conditions = {}; }

      // If printerId filter, check if pattern involves this printer
      if (printerId && conditions.printers && !conditions.printers.includes(printerId)) continue;

      suggestions.push({
        type: 'pattern',
        severity: p.severity,
        error_code: typeof p.error_codes === 'string' ? JSON.parse(p.error_codes)[0] : (p.error_codes?.[0] || null),
        suggestion: p.suggestion,
        confidence: p.confidence,
        frequency: p.frequency
      });
    }

    // From health score
    if (health) {
      if (health.health_score < 50) {
        suggestions.push({
          type: 'health',
          severity: 'warning',
          suggestion: `Printer health score is ${health.health_score}. Consider performing maintenance checks.`,
          confidence: 0.8
        });
      }
      if (health.trend === 'worsening') {
        suggestions.push({
          type: 'trend',
          severity: 'warning',
          suggestion: 'Error rate is increasing compared to last week. Investigate recent changes.',
          confidence: 0.7
        });
      }
    }

    // From strong correlations
    const strongCorrs = correlations.filter(c => c.correlation_strength > 2);
    for (const c of strongCorrs) {
      suggestions.push({
        type: 'correlation',
        severity: 'info',
        error_code: c.error_code,
        suggestion: `Error ${c.error_code} occurs ${c.correlation_strength.toFixed(1)}x more frequently with ${c.factor}: ${c.factor_value}. Consider adjusting settings.`,
        confidence: Math.min(1, c.correlation_strength / 5),
        factor: c.factor,
        factor_value: c.factor_value
      });
    }

    return suggestions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }

  getAllPatterns() {
    return getErrorPatterns();
  }

  getPattern(id) {
    return getErrorPattern(id);
  }

  getAllCorrelations(code) {
    return getErrorCorrelations(code || null);
  }

  getAllHealthScores() {
    return getPrinterHealthScores();
  }

  getHealthScore(printerId) {
    return getPrinterHealthScore(printerId);
  }

  // ── Private helpers ──

  _findCommonConditions(codeErrors, history) {
    const conditions = {};

    // Find most common printers
    const printerCounts = {};
    for (const e of codeErrors) {
      if (e.printer_id) printerCounts[e.printer_id] = (printerCounts[e.printer_id] || 0) + 1;
    }
    const topPrinters = Object.entries(printerCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topPrinters.length) conditions.printers = topPrinters.map(([id]) => id);

    // Find material from closest print in history
    const materialCounts = {};
    for (const e of codeErrors) {
      const closestPrint = this._findClosestPrint(e, history);
      if (closestPrint?.filament_type) {
        materialCounts[closestPrint.filament_type] = (materialCounts[closestPrint.filament_type] || 0) + 1;
      }
    }
    const topMaterials = Object.entries(materialCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    if (topMaterials.length) conditions.materials = topMaterials.map(([m]) => m);

    // Temperature ranges from context
    const temps = [];
    for (const e of codeErrors) {
      let ctx;
      try { ctx = typeof e.context === 'string' ? JSON.parse(e.context) : e.context; } catch { continue; }
      if (ctx?.nozzle_temper != null) temps.push(ctx.nozzle_temper);
    }
    if (temps.length >= 2) {
      conditions.temp_range = {
        min: Math.round(Math.min(...temps)),
        max: Math.round(Math.max(...temps)),
        avg: Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)
      };
    }

    // Speed levels from closest prints
    const speedCounts = {};
    for (const e of codeErrors) {
      const closestPrint = this._findClosestPrint(e, history);
      if (closestPrint?.speed_level != null) {
        speedCounts[closestPrint.speed_level] = (speedCounts[closestPrint.speed_level] || 0) + 1;
      }
    }
    const topSpeeds = Object.entries(speedCounts).sort((a, b) => b[1] - a[1]);
    if (topSpeeds.length) conditions.speed_levels = topSpeeds.slice(0, 3).map(([s]) => Number(s));

    return conditions;
  }

  _findClosestPrint(error, history) {
    if (!error.timestamp || !error.printer_id) return null;
    const errorTime = new Date(error.timestamp).getTime();
    let closest = null;
    let closestDiff = Infinity;
    for (const h of history) {
      if (h.printer_id !== error.printer_id) continue;
      const startTime = new Date(h.started_at).getTime();
      const diff = Math.abs(errorTime - startTime);
      if (diff < closestDiff) {
        closestDiff = diff;
        closest = h;
      }
    }
    // Only return if within 24 hours
    return closestDiff < 24 * 60 * 60 * 1000 ? closest : null;
  }

  _dominantSeverity(errors) {
    const counts = { fatal: 0, error: 0, warning: 0, info: 0 };
    for (const e of errors) {
      const sev = (e.severity || 'info').toLowerCase();
      if (counts[sev] !== undefined) counts[sev]++;
    }
    if (counts.fatal > 0) return 'fatal';
    if (counts.error > 0) return 'error';
    if (counts.warning > 0) return 'warning';
    return 'info';
  }

  _generateSuggestion(code, conditions, errors) {
    const parts = [];
    const msg = errors[0]?.message || code;

    if (conditions.materials?.length) {
      const topMat = conditions.materials[0];
      parts.push(`Error ${code} occurs most frequently with material ${topMat}.`);
    }

    if (conditions.temp_range) {
      const tr = conditions.temp_range;
      parts.push(`Temperature range during errors: ${tr.min}-${tr.max}C (avg ${tr.avg}C).`);
      if (tr.avg > 260) {
        parts.push('Consider lowering nozzle temperature by 5-10C.');
      } else if (tr.avg < 190) {
        parts.push('Temperature may be too low. Consider increasing by 5-10C.');
      }
    }

    if (conditions.speed_levels?.length) {
      const topSpeed = conditions.speed_levels[0];
      if (topSpeed > 3) {
        parts.push(`Most errors occur at speed level ${topSpeed}. Consider reducing print speed.`);
      }
    }

    if (conditions.printers?.length === 1) {
      parts.push('This error is isolated to a single printer. Check printer-specific hardware.');
    }

    if (!parts.length) {
      parts.push(`Error ${code} (${msg}) has occurred ${errors.length} times. Monitor for further occurrences.`);
    }

    return parts.join(' ');
  }

  _correlateFactor(codeErrors, history, field, totalErrors, totalPrints) {
    const results = [];
    // Group history by field value
    const historyByValue = {};
    for (const h of history) {
      const val = h[field];
      if (val == null) continue;
      if (!historyByValue[val]) historyByValue[val] = [];
      historyByValue[val].push(h);
    }

    for (const [value, prints] of Object.entries(historyByValue)) {
      if (prints.length < 2) continue;

      // Count errors that happened during/near prints with this factor value
      let errorsWithFactor = 0;
      for (const e of codeErrors) {
        const closest = this._findClosestPrint(e, prints);
        if (closest) errorsWithFactor++;
      }

      if (errorsWithFactor === 0) continue;

      // correlation_strength = (errors_with_factor / total_with_factor) / (total_errors / total_prints)
      const baseRate = totalPrints > 0 ? totalErrors / totalPrints : 0;
      const factorRate = prints.length > 0 ? errorsWithFactor / prints.length : 0;
      const strength = baseRate > 0 ? Math.round((factorRate / baseRate) * 100) / 100 : 0;

      results.push({
        factor_value: String(value),
        correlation_strength: strength,
        sample_size: prints.length
      });
    }

    return results.filter(r => r.correlation_strength > 0);
  }

  _correlateByPrinter(codeErrors, history, totalErrors, totalPrints) {
    const results = [];
    const printerIds = [...new Set(codeErrors.map(e => e.printer_id).filter(Boolean))];

    for (const pid of printerIds) {
      const printerPrints = history.filter(h => h.printer_id === pid);
      const printerErrors = codeErrors.filter(e => e.printer_id === pid);
      if (printerPrints.length < 2) continue;

      const baseRate = totalPrints > 0 ? totalErrors / totalPrints : 0;
      const printerRate = printerPrints.length > 0 ? printerErrors.length / printerPrints.length : 0;
      const strength = baseRate > 0 ? Math.round((printerRate / baseRate) * 100) / 100 : 0;

      results.push({
        factor_value: pid,
        correlation_strength: strength,
        sample_size: printerPrints.length
      });
    }

    return results.filter(r => r.correlation_strength > 0);
  }

  _correlateTemperature(codeErrors, totalErrors) {
    const results = [];
    const tempRanges = { 'low (<200)': [0, 200], 'medium (200-250)': [200, 250], 'high (>250)': [250, 999] };

    for (const [label, [min, max]] of Object.entries(tempRanges)) {
      let count = 0;
      let total = 0;
      for (const e of codeErrors) {
        let ctx;
        try { ctx = typeof e.context === 'string' ? JSON.parse(e.context) : e.context; } catch { continue; }
        if (ctx?.nozzle_temper != null) {
          total++;
          if (ctx.nozzle_temper >= min && ctx.nozzle_temper < max) count++;
        }
      }
      if (count === 0 || total === 0) continue;

      const strength = Math.round((count / total) * 3 * 100) / 100; // Normalize: if all in one range, strength = 3
      results.push({
        factor_value: label,
        correlation_strength: strength,
        sample_size: total
      });
    }

    return results.filter(r => r.correlation_strength > 0);
  }
}
