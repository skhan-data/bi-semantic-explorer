/**
 * DAX Performance Analyzer
 * Pure pattern-matching engine — no AI needed.
 * Scans DAX expressions for known anti-patterns and returns findings.
 */

export interface DaxFinding {
  pattern: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion: string;
  lineMatch?: string;
}

interface DaxPattern {
  name: string;
  regex: RegExp;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

const DAX_PATTERNS: DaxPattern[] = [
  {
    name: 'Nested CALCULATE',
    regex: /CALCULATE\s*\([^)]*CALCULATE\s*\(/gi,
    severity: 'warning',
    message: 'Nested CALCULATE detected — may cause unexpected context transitions.',
    suggestion: 'Refactor into separate measures or use variables (VAR) to store intermediate results.',
  },
  {
    name: 'FILTER(ALL(...))',
    regex: /FILTER\s*\(\s*ALL\s*\(/gi,
    severity: 'warning',
    message: 'FILTER(ALL(...)) pattern found — consider simpler alternatives.',
    suggestion: 'Use REMOVEFILTERS() or KEEPFILTERS() for clearer intent and potentially better performance.',
  },
  {
    name: 'COUNTROWS(FILTER(...))',
    regex: /COUNTROWS\s*\(\s*FILTER\s*\(/gi,
    severity: 'info',
    message: 'COUNTROWS(FILTER(...)) can often be simplified.',
    suggestion: 'Consider CALCULATE(COUNTROWS(...), ...) with filter arguments instead of wrapping FILTER.',
  },
  {
    name: 'SUMX over table scan',
    regex: /SUMX\s*\(\s*(?:ALL|VALUES|FILTER)\s*\(/gi,
    severity: 'warning',
    message: 'SUMX iterating over a potentially large table scan.',
    suggestion: 'Ensure the inner table is filtered to a small subset. Consider CALCULATE + SUM if aggregation is simple.',
  },
  {
    name: 'No VAR in complex expression',
    regex: /(?![\s\S]*\bVAR\b)(?:CALCULATE|SUMX|AVERAGEX|MAXX|MINX)[\s\S]{100,}/gi,
    severity: 'info',
    message: 'Complex expression without VAR usage — may reduce readability.',
    suggestion: 'Use VAR/RETURN pattern to break complex logic into named steps for clarity and maintainability.',
  },
  {
    name: 'Hardcoded numeric value',
    regex: /(?:=|>|<|>=|<=)\s*(?:\d{4,}|\d+\.\d+)/g,
    severity: 'info',
    message: 'Hardcoded numeric value found in expression.',
    suggestion: 'Consider using a parameter table or What-If parameter for configurable thresholds.',
  },
  {
    name: 'IF with boolean return',
    regex: /IF\s*\([^,]+,\s*TRUE\s*(?:\(\))?\s*,\s*FALSE\s*(?:\(\))?\s*\)/gi,
    severity: 'info',
    message: 'IF returning TRUE/FALSE — the IF is redundant.',
    suggestion: 'Remove the IF wrapper and use the condition directly as the expression.',
  },
  {
    name: 'Division without error handling',
    regex: /(?<!\bDIVIDE\b[^)]*)\s+\/\s+/g,
    severity: 'warning',
    message: 'Division operator (/) used without DIVIDE function — risk of divide-by-zero error.',
    suggestion: 'Use DIVIDE(numerator, denominator, alternateResult) for safe division with error handling.',
  },
  {
    name: 'EARLIER function usage',
    regex: /\bEARLIER\s*\(/gi,
    severity: 'warning',
    message: 'EARLIER() is a legacy function that reduces readability.',
    suggestion: 'Replace with VAR to capture the outer row context before the inner iteration.',
  },
  {
    name: 'USERELATIONSHIP in measure',
    regex: /\bUSERELATIONSHIP\s*\(/gi,
    severity: 'info',
    message: 'USERELATIONSHIP activates an inactive relationship — ensure this is intentional.',
    suggestion: 'Document why this measure requires an alternate relationship path.',
  },
];

/**
 * Analyze a single DAX expression for anti-patterns.
 */
export function analyzeDaxExpression(expression: string): DaxFinding[] {
  if (!expression || expression.trim().length === 0) return [];

  const findings: DaxFinding[] = [];

  for (const pattern of DAX_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.regex.lastIndex = 0;
    const match = pattern.regex.exec(expression);
    if (match) {
      findings.push({
        pattern: pattern.name,
        severity: pattern.severity,
        message: pattern.message,
        suggestion: pattern.suggestion,
        lineMatch: match[0].trim().substring(0, 80),
      });
    }
  }

  return findings;
}

/**
 * Analyze all measures in a model and return a summary.
 */
export function analyzeModelDax(tables: { name: string; measures: { name: string; expression: string; tableName?: string }[] }[]): {
  totalMeasures: number;
  analyzedMeasures: number;
  totalFindings: number;
  critical: number;
  warnings: number;
  info: number;
  findingsByMeasure: Record<string, DaxFinding[]>;
  score: number; // 0-100
} {
  const findingsByMeasure: Record<string, DaxFinding[]> = {};
  let totalFindings = 0;
  let critical = 0;
  let warnings = 0;
  let info = 0;
  let totalMeasures = 0;

  for (const table of tables) {
    for (const measure of table.measures) {
      totalMeasures++;
      const key = `${table.name}.${measure.name}`;
      const findings = analyzeDaxExpression(measure.expression);

      if (findings.length > 0) {
        findingsByMeasure[key] = findings;
        totalFindings += findings.length;
        findings.forEach(f => {
          if (f.severity === 'critical') critical++;
          else if (f.severity === 'warning') warnings++;
          else info++;
        });
      }
    }
  }

  // Score: start at 100, deduct points per finding
  const deductions = (critical * 15) + (warnings * 5) + (info * 1);
  const maxDeduction = totalMeasures > 0 ? Math.min(deductions, 100) : 0;
  const score = Math.max(0, 100 - maxDeduction);

  return {
    totalMeasures,
    analyzedMeasures: totalMeasures,
    totalFindings,
    critical,
    warnings,
    info,
    findingsByMeasure,
    score,
  };
}
