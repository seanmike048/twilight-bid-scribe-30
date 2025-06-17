import { analyzer, AnalysisResult, ValidationIssue } from "./analyzer";
import { splitJsonObjects } from "./utils";

export interface AnalysisEntry {
  analysis: AnalysisResult;
  issues: ValidationIssue[];
  text: string;
}

export function runAnalysis(input: string): AnalysisEntry[] {
  const objects = splitJsonObjects(input);
  return objects.map((obj) => {
    const { analysis, issues } = analyzer.analyze(obj);
    let formatted = obj;
    try {
      formatted = JSON.stringify(JSON.parse(obj), null, 2);
    } catch {
      // ignore parse errors
    }
    return { analysis, issues, text: formatted };
  });
}
