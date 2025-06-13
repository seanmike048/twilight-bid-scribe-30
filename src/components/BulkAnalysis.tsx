import { useCallback, useMemo, useState } from 'react';
import { analyse, AnalysisResult } from '@/lib/analyzer';
import Dropzone from './ui/Dropzone';
import ResultsTable from './ui/ResultsTable';
import DetailDrawer from './ui/DetailDrawer';

type Row = { raw: string; result: AnalysisResult };

export default function BulkAnalysis() {
  const [rows, setRows] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);

  /* Analyse each file exactly once – heavy lifting is memoised in lib */
  const handleFiles = useCallback((files: File[]) => {
    const readerPromises = files.map(
      (file) =>
        new Promise<Row>((res) => {
          const fr = new FileReader();
          fr.onload = () =>
            res({ raw: fr.result as string, result: analyse(fr.result as string) });
          fr.readAsText(file);
        }),
    );
    Promise.all(readerPromises).then((list) => setRows(list));
  }, []);

  /* Derived stats */
  const stats = useMemo(() => {
    const total = rows.length;
    const errors = rows.filter((r) =>
      r.result.issues.some((i) => i.severity === 'error'),
    ).length;
    return { total, errors };
  }, [rows]);

  return (
    <div className="p-6 space-y-6">
      <Dropzone onFiles={handleFiles} />
      {rows.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            Processed {stats.total} request(s) &bull; {stats.errors} with errors
          </p>
          <ResultsTable rows={rows} onSelect={setSelected} />
        </>
      )}
      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        result={selected?.result}
        rawJson={selected?.raw}
      />
    </div>
  );
}
