import {Copy, Image as ImageIcon, Plus, Video, FileText, Music} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';

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
import type {MediaAsset} from '../../types';

type Kind = MediaAsset['kind'];
type Visibility = MediaAsset['visibility'];

const KINDS: Kind[] = ['image', 'video', 'document', 'audio'];
const VISIBILITIES: Visibility[] = ['private', 'shared', 'public'];

function kindTone(kind: Kind) {
  if (kind === 'image') return 'info' as const;
  if (kind === 'video') return 'gold' as const;
  if (kind === 'audio') return 'success' as const;
  return 'neutral' as const;
}

function kindIcon(kind: Kind) {
  if (kind === 'image') return <ImageIcon className="size-5" aria-hidden />;
  if (kind === 'video') return <Video className="size-5" aria-hidden />;
  if (kind === 'audio') return <Music className="size-5" aria-hidden />;
  return <FileText className="size-5" aria-hidden />;
}

function visibilityTone(visibility: Visibility) {
  if (visibility === 'public') return 'success' as const;
  if (visibility === 'shared') return 'info' as const;
  return 'neutral' as const;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function inferKind(type: string): Kind {
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'document';
}

export function ManagementMediaPage() {
  const {session} = useAuth();
  const me = session?.user.id ?? '';

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<'all' | Kind>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '',
    kind: 'image' as Kind,
    alt_text: '',
    visibility: 'private' as Visibility,
  });

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {data, error: resError} = await supabase
        .from('media_assets')
        .select('*')
        .order('created_at', {ascending: false})
        .limit(200);
      if (resError) throw new Error(resError.message);
      const rows = (data as MediaAsset[]) ?? [];
      setAssets(rows);
      const images = rows.filter(
        (row) => row.kind === 'image' && row.bucket && row.storage_path,
      );
      const entries = await Promise.all(
        images.map(async (row) => {
          const {data: signed, error: signError} = await supabase.storage
            .from(row.bucket as string)
            .createSignedUrl(row.storage_path as string, 360);
          return [row.id, signError ? null : signed.signedUrl] as const;
        }),
      );
      setSignedUrls(Object.fromEntries(entries));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the media library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = useCallback(async () => {
    if (!file) {
      setActionError('Choose a file first.');
      return;
    }
    setUploading(true);
    setActionError(null);
    setNotice(null);
    try {
      const kind = form.kind;
      const path = `${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
      const {error: uploadError} = await supabase.storage
        .from('management-media')
        .upload(path, file, {contentType: file.type || 'application/octet-stream'});
      if (uploadError) throw new Error(uploadError.message);
      const {error: insertError} = await supabase.from('media_assets').insert({
        title: form.title.trim() || file.name,
        kind,
        bucket: 'management-media',
        storage_path: path,
        url: null,
        alt_text: form.alt_text.trim() || null,
        visibility: form.visibility,
        uploaded_by: me,
      });
      if (insertError) throw new Error(insertError.message);
      setNotice('Asset uploaded to the media library.');
      setUploadOpen(false);
      setFile(null);
      setForm({title: '', kind: 'image', alt_text: '', visibility: 'private'});
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not upload the asset.');
    } finally {
      setUploading(false);
    }
  }, [form, load, me, file]);

  const updateAsset = useCallback(
    async (id: string, payload: Record<string, unknown>, success: string) => {
      setBusyId(id);
      setActionError(null);
      setNotice(null);
      try {
        const {data: updated, error: updateError} = await supabase
          .from('media_assets')
          .update(payload)
          .eq('id', id)
          .select('id')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated)
          throw new Error(
            'The change was not saved. Editing media requires an administrator or the content.manage permission.',
          );
        setNotice(success);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not update the asset.');
      } finally {
        setBusyId(null);
        setConfirmId(null);
      }
    },
    [load],
  );

  if (loading) return <Spinner label="Loading media library" />;

  const query = debouncedSearch.trim().toLowerCase();
  const visible = assets.filter((asset) => {
    if (kindFilter !== 'all' && asset.kind !== kindFilter) return false;
    if (query && !asset.title.toLowerCase().includes(query)) return false;
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Content"
        title="Media library"
        description="Assets used across the platform — stored privately and shared only through signed links."
        actions={
          <Button onClick={() => setUploadOpen((prev) => !prev)}>
            <Plus className="size-4" aria-hidden /> Upload asset
          </Button>
        }
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {uploadOpen ? (
        <section className="surface p-4 sm:p-6" aria-label="Upload an asset">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">File</span>
              <input
                type="file"
                className="field-input"
                accept="image/*,video/*,audio/*,application/pdf"
                onChange={(event) => {
                  const chosen = event.target.files?.[0] ?? null;
                  setFile(chosen);
                  if (chosen) setForm((prev) => ({...prev, kind: inferKind(chosen.type)}));
                }}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Title</span>
              <input
                className="field-input"
                value={form.title}
                placeholder="Defaults to the file name"
                onChange={(event) => setForm((prev) => ({...prev, title: event.target.value}))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Kind</span>
              <select
                className="field-input"
                value={form.kind}
                onChange={(event) => setForm((prev) => ({...prev, kind: event.target.value as Kind}))}
              >
                {KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Alt text
              </span>
              <input
                className="field-input"
                value={form.alt_text}
                onChange={(event) => setForm((prev) => ({...prev, alt_text: event.target.value}))}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Visibility
              </span>
              <select
                className="field-input"
                value={form.visibility}
                onChange={(event) =>
                  setForm((prev) => ({...prev, visibility: event.target.value as Visibility}))
                }
              >
                {VISIBILITIES.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {visibility}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button onClick={() => void upload()} loading={uploading}>
                Upload
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
          {(['all', ...KINDS] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              className={`btn ${kindFilter === filter ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setKindFilter(filter)}
            >
              {filter === 'all' ? 'All' : filter}
            </button>
          ))}
          <input
            className="field-input ml-auto max-w-56"
            value={search}
            placeholder="Search title"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="No assets yet."
            description="Upload the first asset above — media stays private unless you mark it shared or public."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((asset) => {
              const preview = signedUrls[asset.id];
              return (
                <article key={asset.id} className="overflow-hidden rounded-sm border border-stone">
                  <div className="flex aspect-video items-center justify-center bg-stone/60">
                    {asset.kind === 'image' && preview ? (
                      <img
                        src={preview}
                        alt={asset.alt_text || asset.title}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-muted">{kindIcon(asset.kind)}</span>
                    )}
                  </div>
                  <div className="space-y-2 p-3">
                    {renamingId === asset.id ? (
                      <div className="flex flex-wrap gap-2">
                        <input
                          className="field-input"
                          value={renameValue}
                          onChange={(event) => setRenameValue(event.target.value)}
                        />
                        <Button
                          variant="secondary"
                          loading={busyId === asset.id}
                          onClick={() =>
                            void updateAsset(
                              asset.id,
                              {title: renameValue.trim() || asset.title},
                              'Asset renamed.',
                            ).then(() => setRenamingId(null))
                          }
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <p className="truncate text-sm font-medium text-charcoal">{asset.title}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Chip tone={kindTone(asset.kind)}>{asset.kind}</Chip>
                      <Chip tone={visibilityTone(asset.visibility)}>{asset.visibility}</Chip>
                      <span className="text-[11px] text-muted">{formatDate(asset.created_at)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {preview ? (
                        <Button
                          variant="ghost"
                          onClick={() => window.open(preview, '_blank', 'noopener')}
                        >
                          Open
                        </Button>
                      ) : null}
                      {asset.url ? (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            void navigator.clipboard.writeText(asset.url as string);
                            setCopiedId(asset.id);
                            window.setTimeout(() => setCopiedId(null), 1500);
                          }}
                        >
                          <Copy className="size-4" aria-hidden />
                          {copiedId === asset.id ? 'Copied' : 'Copy link'}
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setRenamingId(asset.id);
                          setRenameValue(asset.title);
                        }}
                      >
                        Rename
                      </Button>
                      <select
                        className="field-input w-auto"
                        value={asset.visibility}
                        onChange={(event) =>
                          void updateAsset(
                            asset.id,
                            {visibility: event.target.value as Visibility},
                            `Visibility set to ${event.target.value}.`,
                          )
                        }
                      >
                        {VISIBILITIES.map((visibility) => (
                          <option key={visibility} value={visibility}>
                            {visibility}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
