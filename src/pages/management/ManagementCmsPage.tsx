import {Plus} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';

import {Alert} from '../../components/ui/Alert';
import {Button} from '../../components/ui/Button';
import {Chip} from '../../components/ui/Chip';
import {EmptyState} from '../../components/ui/EmptyState';
import {PageHeader} from '../../components/ui/PageHeader';
import {Spinner} from '../../components/ui/Spinner';
import {formatDate} from '../../lib/format';
import {supabase} from '../../lib/supabase';
import type {CmsPage, CmsSection} from '../../types';

interface CmsData {
  pages: CmsPage[];
  sections: CmsSection[];
}

const EMPTY: CmsData = {pages: [], sections: []};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

export function ManagementCmsPage() {
  const [data, setData] = useState<CmsData>(EMPTY);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newPageOpen, setNewPageOpen] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);
  const [pageForm, setPageForm] = useState({title: '', slug: ''});
  const [editTitle, setEditTitle] = useState<string | null>(null);

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState({key: '', title: '', sort_order: '0', content: '{}'});
  const [newSectionOpen, setNewSectionOpen] = useState(false);
  const [newSectionForm, setNewSectionForm] = useState({key: '', title: '', content: '{}'});
  const [creatingSection, setCreatingSection] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pagesRes, sectionsRes] = await Promise.all([
        supabase.from('cms_pages').select('*').order('slug', {ascending: true}),
        supabase.from('cms_sections').select('*').order('sort_order', {ascending: true}),
      ]);
      const firstError = [pagesRes, sectionsRes].map((result) => result.error).find(Boolean);
      if (firstError) throw new Error(firstError.message);
      const pages = (pagesRes.data as CmsPage[]) ?? [];
      const sections = (sectionsRes.data as CmsSection[]) ?? [];
      setData({pages, sections});
      setSelectedId((prev) => prev ?? pages[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load CMS content.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateRow = useCallback(
    async (
      table: 'cms_pages' | 'cms_sections',
      id: string,
      payload: Record<string, unknown>,
      success: string,
      failure: string,
    ) => {
      setBusyId(id);
      setActionError(null);
      setNotice(null);
      try {
        const {data: updated, error: updateError} = await supabase
          .from(table)
          .update(payload)
          .eq('id', id)
          .select('id')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated) throw new Error(failure);
        setNotice(success);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : failure);
      } finally {
        setBusyId(null);
        setConfirmId(null);
      }
    },
    [load],
  );

  const createPage = useCallback(async () => {
    setCreatingPage(true);
    setActionError(null);
    setNotice(null);
    try {
      if (!pageForm.title.trim()) throw new Error('A page title is required.');
      const slug = (pageForm.slug.trim() || slugify(pageForm.title)) || '';
      if (!slug) throw new Error('A page slug is required.');
      const {error: insertError} = await supabase
        .from('cms_pages')
        .insert({slug, title: pageForm.title.trim(), status: 'draft'});
      if (insertError) throw new Error(insertError.message);
      setNotice('Page created as a draft.');
      setPageForm({title: '', slug: ''});
      setNewPageOpen(false);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not create the page.');
    } finally {
      setCreatingPage(false);
    }
  }, [load, pageForm]);

  const saveSection = useCallback(
    async (section: CmsSection) => {
      setBusyId(section.id);
      setActionError(null);
      setNotice(null);
      try {
        let content: Record<string, unknown>;
        try {
          content = JSON.parse(sectionForm.content) as Record<string, unknown>;
        } catch {
          throw new Error('Content must be valid JSON.');
        }
        const {data: updated, error: updateError} = await supabase
          .from('cms_sections')
          .update({
            key: sectionForm.key.trim() || section.key,
            title: sectionForm.title.trim() || null,
            sort_order: Number(sectionForm.sort_order || '0'),
            content,
          })
          .eq('id', section.id)
          .select('id')
          .maybeSingle();
        if (updateError) throw new Error(updateError.message);
        if (!updated)
          throw new Error(
            'The section was not saved. Editing content requires an administrator or the content.manage permission.',
          );
        setNotice('Section saved.');
        setEditingSectionId(null);
        await load();
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Could not save the section.');
      } finally {
        setBusyId(null);
      }
    },
    [load, sectionForm],
  );

  const createSection = useCallback(async () => {
    setCreatingSection(true);
    setActionError(null);
    setNotice(null);
    try {
      if (!selectedId) throw new Error('Choose a page first.');
      if (!newSectionForm.key.trim()) throw new Error('A section key is required.');
      let content: Record<string, unknown>;
      try {
        content = JSON.parse(newSectionForm.content) as Record<string, unknown>;
      } catch {
        throw new Error('Content must be valid JSON.');
      }
      const pageSections = data.sections.filter((row) => row.page_id === selectedId);
      const nextOrder = pageSections.reduce((max, row) => Math.max(max, row.sort_order), 0) + 1;
      const {error: insertError} = await supabase.from('cms_sections').insert({
        page_id: selectedId,
        key: newSectionForm.key.trim(),
        title: newSectionForm.title.trim() || null,
        content,
        sort_order: nextOrder,
        is_visible: true,
      });
      if (insertError) throw new Error(insertError.message);
      setNotice('Section created.');
      setNewSectionForm({key: '', title: '', content: '{}'});
      setNewSectionOpen(false);
      await load();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Could not create the section.');
    } finally {
      setCreatingSection(false);
    }
  }, [data.sections, load, newSectionForm, selectedId]);

  if (loading) return <Spinner label="Loading CMS" />;

  const selected = data.pages.find((page) => page.id === selectedId) ?? null;
  const pageSections = selected
    ? data.sections.filter((section) => section.page_id === selected.id)
    : [];

  const writeFailure =
    'The change was not saved. Editing content requires an administrator or the content.manage permission.';

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Content"
        title="CMS"
        description="Public pages and their sections — hiding a section replaces deleting it."
        actions={
          <Button onClick={() => setNewPageOpen((prev) => !prev)}>
            <Plus className="size-4" aria-hidden /> New page
          </Button>
        }
      />

      {error ? <Alert tone="error">{error}</Alert> : null}
      {actionError ? <Alert tone="error">{actionError}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}

      {newPageOpen ? (
        <section className="surface p-4 sm:p-6" aria-label="Create a page">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">Title</span>
              <input
                className="field-input"
                value={pageForm.title}
                onChange={(event) =>
                  setPageForm((prev) => ({...prev, title: event.target.value}))
                }
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                Slug (auto from title if empty)
              </span>
              <input
                className="field-input"
                value={pageForm.slug}
                placeholder="about"
                onChange={(event) => setPageForm((prev) => ({...prev, slug: event.target.value}))}
              />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button onClick={() => void createPage()} loading={creatingPage}>
                Create draft page
              </Button>
              <Button variant="ghost" onClick={() => setNewPageOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="surface p-4">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-muted">Pages</h2>
          {data.pages.length === 0 ? (
            <EmptyState
              title="No pages yet."
              description="Create the first public page with the button above."
            />
          ) : (
            <ul className="divide-y divide-stone">
              {data.pages.map((page) => (
                <li key={page.id}>
                  <button
                    type="button"
                    className={`block w-full px-3 py-2.5 text-left hover:bg-stone/40 ${
                      selectedId === page.id ? 'bg-stone/60' : ''
                    }`}
                    aria-current={selectedId === page.id}
                    onClick={() => setSelectedId(page.id)}
                  >
                    <span className="block truncate text-sm font-medium text-charcoal">
                      {page.title}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                      /{page.slug}
                      <Chip tone={page.status === 'published' ? 'success' : 'neutral'}>
                        {page.status}
                      </Chip>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          {!selected ? (
            <div className="surface p-4 sm:p-6">
              <EmptyState
                title="No page selected."
                description="Choose a page from the list to edit its sections."
              />
            </div>
          ) : (
            <>
              <section className="surface p-4 sm:p-6" aria-label="Page">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold uppercase tracking-[0.14em] text-charcoal">
                      {selected.title}
                    </h2>
                    <p className="text-xs text-muted">
                      /{selected.slug} · updated {formatDate(selected.updated_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={selected.status === 'published' ? 'success' : 'neutral'}>
                      {selected.status}
                    </Chip>
                    {editTitle === selected.id ? (
                      <span className="flex flex-wrap gap-2">
                        <input
                          className="field-input w-48"
                          defaultValue={selected.title}
                          onChange={(event) => setPageForm((prev) => ({...prev, title: event.target.value}))}
                        />
                        <Button
                          loading={busyId === selected.id}
                          onClick={() =>
                            void updateRow(
                              'cms_pages',
                              selected.id,
                              {title: pageForm.title.trim() || selected.title},
                              'Page title saved.',
                              writeFailure,
                            ).then(() => setEditTitle(null))
                          }
                        >
                          Save
                        </Button>
                        <Button variant="ghost" onClick={() => setEditTitle(null)}>
                          Cancel
                        </Button>
                      </span>
                    ) : (
                      <Button variant="ghost" onClick={() => {
                        setPageForm({title: selected.title, slug: selected.slug});
                        setEditTitle(selected.id);
                      }}>
                        Rename
                      </Button>
                    )}
                    {selected.status === 'draft' ? (
                      confirmId === selected.id ? (
                        <span className="flex flex-wrap gap-2">
                          <Button variant="ghost" onClick={() => setConfirmId(null)}>
                            Back
                          </Button>
                          <Button
                            loading={busyId === selected.id}
                            onClick={() =>
                              void updateRow(
                                'cms_pages',
                                selected.id,
                                {status: 'published'},
                                'Page published.',
                                writeFailure,
                              )
                            }
                          >
                            Confirm publish
                          </Button>
                        </span>
                      ) : (
                        <Button variant="secondary" onClick={() => setConfirmId(selected.id)}>
                          Publish
                        </Button>
                      )
                    ) : confirmId === selected.id ? (
                      <span className="flex flex-wrap gap-2">
                        <Button variant="ghost" onClick={() => setConfirmId(null)}>
                          Back
                        </Button>
                        <Button
                          loading={busyId === selected.id}
                          onClick={() =>
                            void updateRow(
                              'cms_pages',
                              selected.id,
                              {status: 'draft'},
                              'Page moved back to draft.',
                              writeFailure,
                            )
                          }
                        >
                          Confirm unpublish
                        </Button>
                      </span>
                    ) : (
                      <Button variant="secondary" onClick={() => setConfirmId(selected.id)}>
                        Unpublish
                      </Button>
                    )}
                  </div>
                </div>

                <div className="border-t border-stone pt-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-charcoal">
                      Sections
                    </h3>
                    <Button variant="secondary" onClick={() => setNewSectionOpen((prev) => !prev)}>
                      <Plus className="size-4" aria-hidden /> New section
                    </Button>
                  </div>

                  {newSectionOpen ? (
                    <div className="mb-4 grid gap-3 rounded-sm border border-stone bg-stone/40 p-4 sm:grid-cols-2">
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                          Key
                        </span>
                        <input
                          className="field-input"
                          value={newSectionForm.key}
                          placeholder="hero"
                          onChange={(event) =>
                            setNewSectionForm((prev) => ({...prev, key: event.target.value}))
                          }
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                          Title
                        </span>
                        <input
                          className="field-input"
                          value={newSectionForm.title}
                          onChange={(event) =>
                            setNewSectionForm((prev) => ({...prev, title: event.target.value}))
                          }
                        />
                      </label>
                      <label className="block text-sm sm:col-span-2">
                        <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                          Content (JSON)
                        </span>
                        <textarea
                          className="field-input min-h-24 resize-y font-mono text-xs"
                          rows={4}
                          value={newSectionForm.content}
                          onChange={(event) =>
                            setNewSectionForm((prev) => ({...prev, content: event.target.value}))
                          }
                        />
                      </label>
                      <div className="flex flex-wrap gap-2 sm:col-span-2">
                        <Button loading={creatingSection} onClick={() => void createSection()}>
                          Create section
                        </Button>
                        <Button variant="ghost" onClick={() => setNewSectionOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {pageSections.length === 0 ? (
                    <p className="text-sm text-muted">
                      This page has no sections yet — add the first one above.
                    </p>
                  ) : (
                    <ul className="divide-y divide-stone">
                      {pageSections.map((section) => (
                        <li key={section.id} className="py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-charcoal">
                                {section.key}{' '}
                                {section.title ? (
                                  <span className="text-xs text-muted">· {section.title}</span>
                                ) : null}
                              </p>
                              <p className="text-xs text-muted">
                                order {section.sort_order} · updated {formatDate(section.updated_at)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Chip tone={section.is_visible ? 'success' : 'neutral'}>
                                {section.is_visible ? 'Visible' : 'Hidden'}
                              </Chip>
                              <Button
                                variant="ghost"
                                loading={busyId === section.id}
                                onClick={() =>
                                  void updateRow(
                                    'cms_sections',
                                    section.id,
                                    {is_visible: !section.is_visible},
                                    section.is_visible ? 'Section hidden.' : 'Section shown.',
                                    writeFailure,
                                  )
                                }
                              >
                                {section.is_visible ? 'Hide' : 'Show'}
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  setEditingSectionId(
                                    editingSectionId === section.id ? null : section.id,
                                  );
                                  setSectionForm({
                                    key: section.key,
                                    title: section.title ?? '',
                                    sort_order: String(section.sort_order),
                                    content: JSON.stringify(section.content, null, 2),
                                  });
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>

                          {editingSectionId === section.id ? (
                            <div className="mt-3 grid gap-3 rounded-sm border border-stone bg-stone/40 p-4 sm:grid-cols-3">
                              <label className="block text-sm">
                                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                                  Key
                                </span>
                                <input
                                  className="field-input"
                                  value={sectionForm.key}
                                  onChange={(event) =>
                                    setSectionForm((prev) => ({
                                      ...prev,
                                      key: event.target.value,
                                    }))
                                  }
                                />
                              </label>
                              <label className="block text-sm">
                                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                                  Title
                                </span>
                                <input
                                  className="field-input"
                                  value={sectionForm.title}
                                  onChange={(event) =>
                                    setSectionForm((prev) => ({
                                      ...prev,
                                      title: event.target.value,
                                    }))
                                  }
                                />
                              </label>
                              <label className="block text-sm">
                                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                                  Sort order
                                </span>
                                <input
                                  className="field-input"
                                  inputMode="numeric"
                                  value={sectionForm.sort_order}
                                  onChange={(event) =>
                                    setSectionForm((prev) => ({
                                      ...prev,
                                      sort_order: event.target.value,
                                    }))
                                  }
                                />
                              </label>
                              <label className="block text-sm sm:col-span-3">
                                <span className="mb-1 block text-xs uppercase tracking-wider text-muted">
                                  Content (JSON)
                                </span>
                                <textarea
                                  className="field-input min-h-32 resize-y font-mono text-xs"
                                  rows={6}
                                  value={sectionForm.content}
                                  onChange={(event) =>
                                    setSectionForm((prev) => ({
                                      ...prev,
                                      content: event.target.value,
                                    }))
                                  }
                                />
                              </label>
                              <div className="flex flex-wrap gap-2 sm:col-span-3">
                                <Button
                                  loading={busyId === section.id}
                                  onClick={() => void saveSection(section)}
                                >
                                  Save section
                                </Button>
                                <Button variant="ghost" onClick={() => setEditingSectionId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
