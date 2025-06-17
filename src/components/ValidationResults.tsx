import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle, Info, CheckCircle, Eye } from 'lucide-react';
import { AnalysisResult, ValidationIssue } from '@/lib/analyzer';
import { BidRequestSummaryCard } from './BidRequestSummaryCard';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Props {
  analysis: AnalysisResult | null;
  issues: ValidationIssue[];
  isLoading: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export const ValidationResults: React.FC<Props> = ({ analysis, issues, isLoading, page = 0, totalPages = 0, onPageChange }) => {
  const [filter, setFilter] = useState<'All' | 'Error' | 'Warning' | 'Info'>('All');

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center bg-slate-900 border-slate-800">
        <div className="animate-spin w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full" />
        <p className="mt-4 text-slate-400">Analyzing bid request...</p>
      </Card>
    );
  }
    
  if (!analysis) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center bg-slate-900 border-slate-800">
        <div className="text-6xl text-slate-600 mb-4">
          <Eye />
        </div>
        <h3 className="text-xl font-bold text-white">Ready for Analysis</h3>
        <p className="text-slate-400 mt-1">Paste a bid request and click "Analyze" to get started.</p>
      </Card>
    );
  }

  if (analysis.error) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center bg-red-900/20 border-red-500/30">
        <XCircle className="w-12 h-12 mb-4 text-red-400"/>
        <h3 className="text-xl font-bold text-white">Analysis Error</h3>
        <p className="text-red-400/80 mt-1 max-w-md">{analysis.error}</p>
        <p className="text-slate-400 text-sm mt-2">Please check the input and try again.</p>
      </Card>
    );
  }
  
  const filteredIssues = issues.filter(issue => filter === 'All' || issue.severity === filter);
  const summary = {
    errors: issues.filter(i => i.severity === 'Error').length,
    warnings: issues.filter(i => i.severity === 'Warning').length,
    info: issues.filter(i => i.severity === 'Info').length,
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Error': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'Warning': return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'Info': return <Info className="w-5 h-5 text-blue-400" />;
      default: return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'Error': return 'border-l-red-500 bg-red-900/20';
      case 'Warning': return 'border-l-orange-500 bg-orange-900/20';
      case 'Info': return 'border-l-blue-500 bg-blue-900/20';
      default: return 'border-l-slate-500 bg-slate-900/20';
    }
  };
  
  const FilterButton = ({
    value,
    currentFilter,
    onClick,
    count,
    children,
  }: {
    value: 'All' | 'Error' | 'Warning' | 'Info';
    currentFilter: string;
    onClick: (filter: 'All' | 'Error' | 'Warning' | 'Info') => void;
    count: number;
    children: React.ReactNode;
  }) => {
    const isActive = value === currentFilter;
    if (value !== 'All' && count === 0) return null;

    return (
      <Button
        onClick={() => onClick(value)}
        variant={isActive ? 'secondary' : 'ghost'}
        size="sm"
        className={`px-3 h-8 ${isActive ? 'bg-slate-600 hover:bg-slate-500' : 'hover:bg-slate-700'}`}
      >
        {children}
        <Badge className={`ml-2 px-1.5 py-0.5 text-xs font-semibold ${
          isActive ? 'bg-white text-slate-800' : 
          value === 'Error' ? 'bg-red-900/50 text-red-300' :
          value === 'Warning' ? 'bg-orange-900/50 text-orange-300' :
          value === 'Info' ? 'bg-blue-900/50 text-blue-300' :
          'bg-slate-700'
        }`}>
          {count}
        </Badge>
      </Button>
    );
  };


  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex-shrink-0">
        <BidRequestSummaryCard summary={analysis.summary} />
      </div>

      <Card className="bg-slate-900 border-slate-800 flex-grow flex flex-col overflow-hidden">
        <CardHeader className="flex-shrink-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-white">Validation Issues</CardTitle>
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg">
                <FilterButton value="All" currentFilter={filter} onClick={setFilter} count={issues.length}>All</FilterButton>
                <FilterButton value="Error" currentFilter={filter} onClick={setFilter} count={summary.errors}>Errors</FilterButton>
                <FilterButton value="Warning" currentFilter={filter} onClick={setFilter} count={summary.warnings}>Warnings</FilterButton>
                <FilterButton value="Info" currentFilter={filter} onClick={setFilter} count={summary.info}>Info</FilterButton>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto pr-4">
          {filteredIssues.length === 0 ? (
            <div className="text-center py-10 text-slate-400 flex flex-col items-center justify-center h-full">
              <CheckCircle className="w-10 h-10 mb-3 text-green-500"/>
              <p className="font-semibold text-green-400">
                {filter === 'All' 
                  ? "No issues found!" 
                  : `No ${filter.toLowerCase()} issues found.`}
              </p>
              <p className="text-sm mt-1">{filter === 'All' && "This bid request appears to be fully compliant."}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIssues.map((issue, i) => (
                <div 
                  key={i} 
                  className={`text-sm p-3 rounded-md border-l-4 ${getSeverityStyles(issue.severity)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(issue.severity)}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-100">{issue.message}</p>
                      {issue.path && (
                        <p className="text-xs text-slate-400 font-mono mt-1">
                          Path: {issue.path}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {totalPages > 1 && (
        <div className="pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => onPageChange && onPageChange(page - 1)} />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink isActive={i === page} onClick={() => onPageChange && onPageChange(i)}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => onPageChange && onPageChange(page + 1)} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};
