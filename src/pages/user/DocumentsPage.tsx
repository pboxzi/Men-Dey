import {Download, FileText} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';

import {Chip} from '../../components/ui/Chip';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {useLiveRefresh} from '../../hooks/useLiveRefresh';
import {supabase} from '../../lib/supabase';
import type {DocumentRow} from '../../types';
import {EmptyNote, ErrorNote, SectionCard} from './components/SectionCard';

function formatSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPage() {
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const {data, error: resError} = await supabase
        .from('documents')
        .select('*')
        .order('created_at', {ascending: false})
        .limit(100);
      if (resError) throw new Error(resError.message);
      setRows((data as DocumentRow[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshLive = useCallback(() => {
    void load(true);
  }, [load]);
  useLiveRefresh(refreshLive, ['documents']);

  const download = useCallback(async (document: DocumentRow) => {
    setDownloadError(null);
    if (!document.bucket || !document.storage_path) {
      setDownloadError('This document has no downloadable file attached yet.');
      return;
    }
    try {
      const {data, error: signError} = await supabase.storage
        .from(document.bucket)
        .createSignedUrl(document.storage_path, 60);
      if (signError) throw new Error(signError.message);
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : 'Could not open this document.');
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-stone pb-6">
        <p className="eyebrow mb-2">Documents</p>
        <h1 className="text-3xl md:text-4xl">Your documents</h1>
        <p className="mt-2 max-w-xl text-muted">
          Documents shared with you by management — agreements, briefs and anything you upload
          yourself. Everything is private to your account.
        </p>
      </div>

      {downloadError ? <ErrorNote message={downloadError} /> : null}

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorNote message={error} onRetry={() => void load()} />
      ) : rows.length === 0 ? (
        <EmptyNote
          title="Nothing here yet."
          description="When management shares a document with you, it will appear here."
        />
      ) : (
        <SectionCard title="Documents">
          <ul className="divide-y divide-stone">
            {rows.map((document) => (
              <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-stone text-muted">
                    <FileText className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-charcoal">{document.title}</span>
                    <span className="block text-xs text-muted">
                      {document.category} · {formatDate(document.created_at)}
                      {formatSize(document.size_bytes) ? ` · ${formatSize(document.size_bytes)}` : ''}
                    </span>
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <Chip tone={document.visibility === 'shared' ? 'info' : 'neutral'}>{document.visibility}</Chip>
                  <button
                    type="button"
                    className="btn btn-ghost text-xs"
                    onClick={() => void download(document)}
                    disabled={!document.storage_path}
                  >
                    <Download className="size-4" aria-hidden />
                    Open
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
