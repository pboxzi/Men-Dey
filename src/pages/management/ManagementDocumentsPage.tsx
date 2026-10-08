import {Archive, ArchiveRestore, Download, Link2, Plus, Upload} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';

import {useAuth} from '../../auth/AuthContext';
import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {useDebouncedValue} from '../../hooks/useDebouncedValue';
import {supabase} from '../../lib/supabase';
import {
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_VISIBILITY_LABELS,
  formatBytes,
} from './shared';
import type {DocumentRow} from '../../types';

type DocumentCategory = DocumentRow['category'];
type Visibility = DocumentRow['visibility'];

interface DocumentHit extends DocumentRow {
  request_id: string | null;
  membership_id: string | null;
  archived_at: string | null;
}

interface OwnerMap {
  [userId: string]: {email: string | null; full_name: string | null};
}

interface RequestOption {
  id: string;
  title: string;
}

interface MembershipOption {
  id: string;
  membership_number: string | null;
}

const CATEGORIES: DocumentCategory[] = [
  'general',
  'contract',
  'agreement',
  'financial',
  'brief',
  'press',
  'other',
];

const VISIBILITIES: Visibility[] = ['private', 'shared', 'management'];

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

export function ManagementDocumentsPage({
  presetCategory,
}: {
  presetCategory?: DocumentCategory;
}) {
  const {session} = useAuth();
  const me = session?.user.id ?? '';

  const [documents, setDocuments] = useState<DocumentHit[]>([]);
  const [owners, setOwners] = useState<OwnerMap>({});
  const [requests, setRequests] = useState<RequestOption[]>([]);
  const [memberships, setMemberships] = useState<MembershipOption[]>([]);
  const [fans, setFans] = useState<Array<{id: string; email: string | null; full_name: string | null}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<'all' | DocumentCategory>(
    presetCategory ?? 'all',
  );
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | Visibility>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({request_id: '', membership_id: ''});

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: (presetCategory ?? 'general') as DocumentCategory,
    visibility: 'management' as Visibility,
    owner_user_id: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [documentsRes, requestsRes, membershipsRes, fansRes] = await Promise.all([
        supabase
          .from('documents')
          .select(
            'id, title, category, visibility, owner_user_id, bucket, storage_path, mime_type, size_bytes, uploaded_by, request_id, membership_id, archived_at, created_at, updated_at',
          )
          .order('created_at', {ascending: false})
          .limit(200),
        supabase
          .from('requests')
          .select('id, title')
          .order('submitted_at', {ascending: false})
          .limit(100),
        supabase
          .from('memberships')
          .select('id, membership_number')
          .order('created_at', {ascending: false})
          .limit(100),
        supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('role', 'user')
          .order('created_at', {ascending: false})
          .limit(200),
      ]);
      const firstError = [documentsRes, requestsRes, membershipsRes, fansRes]
        .map((result) => result.error)
        .find(Boolean);
      if (firstError) throw new Error(firstError.message);
      const rows = (documentsRes.data as DocumentHit[]) ?? [];
      setDocuments(rows);
      setRequests((requestsRes.data as RequestOption[]) ?? []);
      setMemberships((membershipsRes.data as MembershipOption[]) ?? []);
      setFans((fansRes.data as Array<{id: string; email: string | null; full_name: string | null}>) ?? []);
      const ownerIds = Array.from(
        new Set(rows.map((row) => row.owner_user_id).filter((value): value is string => !!value)),
      );
      if (ownerIds.length > 0) {
        const {data: ownerRows, error: ownerError} = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', ownerIds);
        if (ownerError) throw new Error(ownerError.message);
        const map: OwnerMap = {};
        for (const row of (ownerRows ?? []) as Array<OwnerMap[string] & {id: string}>) {
          map[row.id] = {email: row.email, full_name: row.full_name};
        }
        setOwners(map);
      } else {
        setOwners({});
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = useCallback(async () => {
    if (!file) {
      setActionError('Choose a file to upload.');
      return;
    }
    setUploading(true);
    setActionError(null);
    setNotice(null);
    try {
      const ownerId = uploadForm.owner_user_id || me;
      const path = `${ownerId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
      const {error: uploadError} = await supabase.storage
        .from('documents')
        .upload(path, file, {contentType: file.type || 'application/octet-stream'});
      if (uploadError) throw new Error(uploadError.message);
      const {error: insertError} = await supabase.from('documents').insert({
        title: uploadForm.title.trim() || file.name,
        category: uploadForm.category,
        visibility: uploadForm.visibility,
        owner_user_id: uploadForm.owner_user_id || null,
        bucket: 'documents',
        storage_path: path,
        mime_type: file.type || null,
        size_bytes: file.size,
        uploaded_by: me,
      });
      if (insertError) throw new Error(insertError.message);
      setNotice('Document uploaded.');
      setUploadOpen(false);
      setUploadForm({
        title: '',
        category: presetCategory ?? 'general',
        visibility: 'management',
        owner_user_id: '',
      });
      setFile(null);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not upload the document.');
    } finally {
      setUploading(false);
    }
  }, [load, me, presetCategory, uploadForm, file]);

  const setArchived = useCallback(
    async (document: DocumentHit, archived: boolean) => {
      setBusyId(document.id);
      setActionError(null);
      setNotice(null);
      try {
        const {data: updated, error: updateError} = await supabase
          .from('documents')
          .update({archived_at: archived ? new Date().toISOString() : null})
          .eq('id', document.id)
          .select('id, archived_at')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated)
          throw new Error(
            'The change was not saved. Managing documents requires the documents.manage permission.',
          );
        setNotice(archived ? 'Document archived.' : 'Document restored.');
        setConfirmId(null);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not update the document.');
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  const assign = useCallback(
    async (document: DocumentHit) => {
      setBusyId(document.id);
      setActionError(null);
      setNotice(null);
      try {
        const {data: updated, error: updateError} = await supabase
          .from('documents')
          .update({
            request_id: assignForm.request_id || null,
            membership_id: assignForm.membership_id || null,
          })
          .eq('id', document.id)
          .select('id, request_id, membership_id')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated)
          throw new Error(
            'The link was not saved. Managing documents requires the documents.manage permission.',
          );
        setNotice('Document linked to its record.');
        setAssignId(null);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not link the document.');
      } finally {
        setBusyId(null);
      }
    },
    [assignForm, load],
  );

  const download = useCallback(
    async (document: DocumentHit) => {
      if (!document.bucket || !document.storage_path) {
        setActionError('This document has no stored file.');
        return;
      }
      setActionError(null);
      try {
        const {data, error: signError} = await supabase.storage
          .from(document.bucket)
          .createSignedUrl(document.storage_path, 360);
        if (signError) throw new Error(signError.message);
        window.open(data.signedUrl, '_blank', 'noopener');
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not open the document.');
      }
    },
    [],
  );

  if (loading) return <Spinner label="Loading documents" />;

  const query = debouncedSearch.trim().toLowerCase();
  const visible = documents.filter((document) => {
    if (categoryFilter !== 'all' && document.category !== categoryFilter) return false;
    if (visibilityFilter !== 'all' && document.visibility !== visibilityFilter) return false;
    if (!showArchived && document.archived_at) return false;
    if (query && !document.title.toLowerCase().includes(query)) return false;
    return true;
  });

  const ownerLabel = (document: DocumentHit) => {
    if (!document.owner_user_id) return 'Management file';
    const owner = owners[document.owner_user_id];
    return owner?.full_name || owner?.email || 'Account';
  };

  const linkedLabel = (document: DocumentHit) => {
    const request = requests.find((row) => row.id === document.request_id);
    const membership = memberships.find((row) => row.id === document.membership_id);
    if (request) return {text: `Request: ${request.title}`, to: `/management/requests/${request.id}`};
    if (membership)
      return {
        text: `Membership: ${membership.membership_number ?? 'member'}`,
        to: `/management/memberships/${membership.id}`,
      };
    return null;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Content"
        title={presetCategory === 'agreement' ? 'Agreements' : 'Documents'}
        description={
          presetCategory === 'agreement'
            ? 'Agreements on file — assigned to the member or record they belong to, archived rather than deleted.'
            : 'The document centre — upload, assign to records, and archive instead of deleting.'
        }
        actions={
          <Button onClick={() => setUploadOpen((prev) => !prev)}>
            <Upload className="size-4" aria-hidden /> Upload
          </Button>
        }
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {uploadOpen ? (
        <section className="surface p-4 sm:p-6" aria-label="Upload a document">
          <h2 className="mb-4 text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
            Upload a document
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Title</span>
              <input
                className="field-input"
                value={uploadForm.title}
                placeholder="Defaults to the file name"
                onChange={(event) =>
                  setUploadForm((prev) => ({...prev, title: event.target.value}))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Category</span>
              <select
                className="field-input"
                value={uploadForm.category}
                disabled={!!presetCategory}
                onChange={(event) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    category: event.target.value as DocumentCategory,
                  }))
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {DOCUMENT_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Visibility
              </span>
              <select
                className="field-input"
                value={uploadForm.visibility}
                onChange={(event) =>
                  setUploadForm((prev) => ({
                    ...prev,
                    visibility: event.target.value as Visibility,
                  }))
                }
              >
                {VISIBILITIES.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {DOCUMENT_VISIBILITY_LABELS[visibility]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Owner (optional)
              </span>
              <select
                className="field-input"
                value={uploadForm.owner_user_id}
                onChange={(event) =>
                  setUploadForm((prev) => ({...prev, owner_user_id: event.target.value}))
                }
              >
                <option value="">Management file</option>
                {fans.map((fan) => (
                  <option key={fan.id} value={fan.id}>
                    {fan.full_name || fan.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">File</span>
              <input
                type="file"
                className="field-input"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button onClick={() => void upload()} loading={uploading}>
                <Plus className="size-4" aria-hidden /> Upload document
              </Button>
              <Button variant="ghost" onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="surface p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {!presetCategory
            ? (['all', ...CATEGORIES] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`btn ${categoryFilter === filter ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setCategoryFilter(filter)}
                >
                  {filter === 'all' ? 'All' : DOCUMENT_CATEGORY_LABELS[filter]}
                </button>
              ))
            : <span className="text-xs uppercase tracking-wider text-muted">Agreements</span>}
          <span className="ml-auto text-xs text-muted">{visible.length} shown</span>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <select
            className="field-input w-auto"
            value={visibilityFilter}
            onChange={(event) => setVisibilityFilter(event.target.value as 'all' | Visibility)}
          >
            <option value="all">All visibility</option>
            {VISIBILITIES.map((visibility) => (
              <option key={visibility} value={visibility}>
                {DOCUMENT_VISIBILITY_LABELS[visibility]}
              </option>
            ))}
          </select>
          <label className="flex flex-wrap items-center gap-2 text-sm text-muted min-h-11 sm:min-h-0">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(event) => setShowArchived(event.target.checked)}
            />
            Include archived
          </label>
          <input
            className="field-input max-w-56"
            value={search}
            placeholder="Search title"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="No documents here."
            description="Upload the first document with the button above — documents are archived, never silently deleted."
          />
        ) : (
          <ul className="divide-y divide-stone">
            {visible.map((document) => {
              const linked = linkedLabel(document);
              return (
                <li key={document.id} className="py-3">
                  <div className="flex flex-wrap flex-col items-start gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-charcoal">
                        {document.title}
                        {document.archived_at ? (
                          <span className="ml-2">
                            <Chip tone="neutral">Archived</Chip>
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted">
                        {DOCUMENT_CATEGORY_LABELS[document.category] ?? document.category} ·{' '}
                        {DOCUMENT_VISIBILITY_LABELS[document.visibility] ?? document.visibility} ·{' '}
                        {ownerLabel(document)} · {formatBytes(document.size_bytes)} ·{' '}
                        {formatDate(document.created_at)}
                      </p>
                      {linked ? (
                        <Link
                          to={linked.to}
                          className="mt-0.5 inline-flex items-center gap-1 text-xs text-gold-deep hover:underline py-3.5 sm:py-0"
                        >
                          <Link2 className="size-3" aria-hidden /> {linked.text}
                        </Link>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {document.storage_path ? (
                        <Button variant="ghost" onClick={() => void download(document)}>
                          <Download className="size-4" aria-hidden /> Download
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setAssignForm({
                            request_id: document.request_id ?? '',
                            membership_id: document.membership_id ?? '',
                          });
                          setAssignId(assignId === document.id ? null : document.id);
                        }}
                      >
                        <Link2 className="size-4" aria-hidden /> Link
                      </Button>
                      {document.archived_at ? (
                        <Button
                          variant="ghost"
                          loading={busyId === document.id}
                          onClick={() => void setArchived(document, false)}
                        >
                          <ArchiveRestore className="size-4" aria-hidden /> Restore
                        </Button>
                      ) : confirmId === document.id ? (
                        <span className="flex flex-wrap gap-2">
                          <Button variant="ghost" onClick={() => setConfirmId(null)}>
                            Keep
                          </Button>
                          <Button
                            variant="secondary"
                            loading={busyId === document.id}
                            onClick={() => void setArchived(document, true)}
                          >
                            Confirm archive
                          </Button>
                        </span>
                      ) : (
                        <Button variant="secondary" onClick={() => setConfirmId(document.id)}>
                          <Archive className="size-4" aria-hidden /> Archive
                        </Button>
                      )}
                    </div>
                  </div>

                  {assignId === document.id ? (
                    <div className="mt-3 grid gap-3 rounded-sm border border-stone bg-stone/40 p-4 sm:grid-cols-2">
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                          Link to request
                        </span>
                        <select
                          className="field-input"
                          value={assignForm.request_id}
                          onChange={(event) =>
                            setAssignForm((prev) => ({...prev, request_id: event.target.value}))
                          }
                        >
                          <option value="">Not linked</option>
                          {requests.map((request) => (
                            <option key={request.id} value={request.id}>
                              {request.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                          Link to membership
                        </span>
                        <select
                          className="field-input"
                          value={assignForm.membership_id}
                          onChange={(event) =>
                            setAssignForm((prev) => ({...prev, membership_id: event.target.value}))
                          }
                        >
                          <option value="">Not linked</option>
                          {memberships.map((membership) => (
                            <option key={membership.id} value={membership.id}>
                              {membership.membership_number ?? membership.id.slice(0, 8)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex flex-wrap gap-2 sm:col-span-2">
                        <Button
                          variant="secondary"
                          loading={busyId === document.id}
                          onClick={() => void assign(document)}
                        >
                          Save links
                        </Button>
                        <Button variant="ghost" onClick={() => setAssignId(null)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
