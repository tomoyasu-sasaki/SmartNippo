'use client';

import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import { File } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { Suspense, useEffect, useState, useTransition } from 'react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from '@/components/ui/command';
import { useDebounce } from '@/hooks/use-debounce';
import { REPORTS_CONSTANTS } from '@smartnippo/lib';

// NOTE: A debounce hook is assumed to exist at '@/hooks/use-debounce'
// If not, it needs to be created. Example:
/*
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
*/

function ReportSearchContent() {
  const router = useRouter();
  const [open, setOpen] = useState(true); // Start open
  const [query, setQuery] = useQueryState('q', {
    defaultValue: '',
    history: 'push',
  });
  const debouncedQuery = useDebounce(query, 300);
  const [isPending, startTransition] = useTransition();

  const searchResults = useQuery(
    api.index.searchReports,
    debouncedQuery ? { searchQuery: debouncedQuery } : 'skip'
  );

  // Effect to handle closing the dialog
  useEffect(() => {
    if (!open) {
      // Small timeout to allow the dialog to close before navigating
      const timer = setTimeout(() => {
        router.back();
      }, 150);
      return () => clearTimeout(timer);
    }
    // openがtrueの場合は何も返さない
    return undefined;
  }, [open, router]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className='bg-[var(--background)]'>
      <CommandInput
        placeholder={REPORTS_CONSTANTS.SEARCH_PLACEHOLDER_MODAL}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty
          className={searchResults === undefined || searchResults.length > 0 ? 'hidden' : ''}
        >
          {REPORTS_CONSTANTS.SEARCH_NO_RESULTS}
        </CommandEmpty>
        {searchResults === undefined && debouncedQuery && (
          <CommandLoading>
            <div className='py-6 text-center text-sm'>{REPORTS_CONSTANTS.SEARCHING}</div>
          </CommandLoading>
        )}
        {searchResults && searchResults.length > 0 && (
          <CommandGroup heading={REPORTS_CONSTANTS.SEARCH_RESULTS_HEADING}>
            {searchResults.map((report) => (
              <CommandItem
                key={report._id}
                value={`${report.title} ${report.author?.name} ${report.reportDate}`}
                onSelect={() => {
                  startTransition(() => {
                    setOpen(false);
                    router.push(`/reports/${report._id}`);
                  });
                }}
                className='flex items-center space-x-2'
              >
                <File className='h-4 w-4' />
                <div className='flex flex-col'>
                  <span className='font-medium'>{report.title}</span>
                  <span className='text-sm text-muted-foreground'>
                    {report.author?.name} - {report.reportDate}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export default function ReportSearchPage() {
  return (
    <Suspense fallback={<div>{REPORTS_CONSTANTS.SEARCH_LOADING}</div>}>
      <ReportSearchContent />
    </Suspense>
  );
}
