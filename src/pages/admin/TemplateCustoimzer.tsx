import Select from "../../components/ui/Select";
import React, { useMemo, useState } from "react";
import {
  FiPlus,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiSave,
  FiLayers,
} from "react-icons/fi";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Modal from "../../components/ui/Modal";
import { cn } from "../../utils/cn";
import {
  buildChecklistTree,
  flattenChecklistTree,
  type ChecklistTreeNode,
} from "./checklistTree";
import type {
  ChecklistItemTemplate,
  ChecklistTemplateDetail,
  ChecklistType,
  ChecklistSection,
  UpdateCustomTemplateSection,
  UpdateCustomTemplateRequest,
} from "../../types/checklist";
import {
  ChecklistType as ChecklistTypeValue,
  PRISMA_SECTIONS,
  SECTION_ORDER,
} from "../../types/checklist";

interface TemplateCustoimzerProps {
  template?: ChecklistTemplateDetail;
  onSave?: (data: UpdateCustomTemplateRequest) => Promise<void>;
  onClose?: () => void;
  isLoading?: boolean;
}

type AddItemMode = "root" | "sub-item";

interface AddChecklistItemInput {
  mode: AddItemMode;
  itemNumber: string;
  topic: string;
  section: ChecklistSection;
  description: string;
  isRequired: boolean;
  hasLocationField: boolean;
  isSectionHeaderOnly: boolean;
  parentId?: string;
}

interface ParentItemOption {
  id: string;
  itemNumber: string;
  topic: string;
  section: ChecklistSection;
}

interface SectionDraft {
  key: ChecklistSection;
  name: string;
  description?: string | null;
  sectionNumber?: string | null;
  order: number;
}

const SECTION_LABEL_TO_KEY = Object.entries(PRISMA_SECTIONS).reduce<
  Record<string, ChecklistSection>
>((acc, [key, value]) => {
  acc[value.toLowerCase()] = key as ChecklistSection;
  return acc;
}, {});

const toChecklistSection = (value: string): ChecklistSection => {
  const raw = value.trim();
  if (!raw) {
    return "OTHER_INFORMATION";
  }

  const normalized = raw.toUpperCase().replace(/\s+/g, "_");
  if (SECTION_ORDER.includes(normalized as ChecklistSection)) {
    return normalized as ChecklistSection;
  }

  const fromLabel = SECTION_LABEL_TO_KEY[raw.toLowerCase()];
  return (fromLabel ?? raw) as ChecklistSection;
};

const getSectionDisplayName = (section: ChecklistSection): string => {
  return (
    PRISMA_SECTIONS[section as keyof typeof PRISMA_SECTIONS] ?? String(section)
  );
};

const ORDER_GAP = 1000;

const getNextRootItemNumber = (
  section: ChecklistSection,
  flatItems: ChecklistItemTemplate[],
): string => {
  const rootNumbers = flatItems
    .filter((item) => item.section === section && !item.parentId)
    .map((item) => Number.parseInt(item.itemNumber, 10))
    .filter((value) => Number.isFinite(value));

  if (rootNumbers.length === 0) {
    return "1";
  }

  return String(Math.max(...rootNumbers) + 1);
};

const getNextSubItemNumber = (
  parentNumber: string,
  siblingCount: number,
): string => {
  return `${parentNumber}.${siblingCount + 1}`;
};

/**
 * Recomputes order after structural changes.
 * Root items are ordered first, then each root's children in sequence.
 */
const normalizeChecklistOrder = (
  flatItems: ChecklistItemTemplate[],
): ChecklistItemTemplate[] => {
  const tree = buildChecklistTree(flatItems);
  const flattened = flattenChecklistTree(tree);

  return flattened.map((item, index) => ({
    ...item,
    order: index * ORDER_GAP,
  }));
};

/**
 * Recursively collects descendant ids for safe parent deletion.
 */
const collectDescendantIds = (node: ChecklistTreeNode): string[] => {
  return node.children.reduce<string[]>((acc, child) => {
    acc.push(child.id);
    acc.push(...collectDescendantIds(child));
    return acc;
  }, []);
};

const findNodeById = (
  nodes: ChecklistTreeNode[],
  id: string,
): ChecklistTreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    if (node.children.length > 0) {
      const nested = findNodeById(node.children, id);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
};

/**
 * Moves a root item (and its whole subtree) up/down among other roots.
 */
const reorderRootNodes = (
  roots: ChecklistTreeNode[],
  itemId: string,
  direction: "up" | "down",
): ChecklistTreeNode[] => {
  const index = roots.findIndex((node) => node.id === itemId);
  if (index < 0) return roots;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= roots.length) return roots;

  const updated = [...roots];
  [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
  return updated;
};

/**
 * Moves a sub-item among siblings under the same parent.
 */
const reorderSubNodes = (
  roots: ChecklistTreeNode[],
  parentId: string,
  itemId: string,
  direction: "up" | "down",
): ChecklistTreeNode[] => {
  return roots.map((root) => {
    if (root.id === parentId) {
      const children = [...root.children];
      const index = children.findIndex((child) => child.id === itemId);
      if (index < 0) return root;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= children.length) return root;

      [children[index], children[swapIndex]] = [
        children[swapIndex],
        children[index],
      ];
      return { ...root, children };
    }

    if (root.children.length === 0) {
      return root;
    }

    return {
      ...root,
      children: reorderSubNodes(root.children, parentId, itemId, direction),
    };
  });
};

/**
 * Template Customizer for creating and editing PRISMA checklist templates
 * Supports reordering, adding/removing items, and editing descriptions
 */
const TemplateCustoimzerInner: React.FC<TemplateCustoimzerProps> = ({
  template,
  onSave,
  onClose,
  isLoading = false,
}) => {
  const [templateName, setTemplateName] = useState(template?.name || "");
  const [templateDescription, setTemplateDescription] = useState(
    template?.description || "",
  );
  const [checklistType, setChecklistType] = useState<ChecklistType>(
    template?.type ?? ChecklistTypeValue.FULL,
  );
  const [items, setItems] = useState<ChecklistItemTemplate[]>(
    template?.items || [],
  );
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemSessionId, setAddItemSessionId] = useState(0);
  const [addItemMode, setAddItemMode] = useState<AddItemMode>("root");
  const [addItemParentItem, setAddItemParentItem] = useState<
    ParentItemOption | undefined
  >();
  const [newSectionName, setNewSectionName] = useState("");
  const [sections, setSections] = useState<SectionDraft[]>(() => {
    const fromTemplate = (template?.sections ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        key: toChecklistSection(section.name),
        name: section.name,
        description: section.description ?? null,
        sectionNumber: section.sectionNumber,
        order: section.order,
      }));

    if (fromTemplate.length > 0) {
      return fromTemplate;
    }

    const fromItems = (template?.items ?? [])
      .map((item) => item.section)
      .filter((section, index, arr) => arr.indexOf(section) === index)
      .map((section, index) => ({
        key: section,
        name: getSectionDisplayName(section),
        description: null,
        sectionNumber: String(index + 1),
        order: index + 1,
      }));

    return fromItems;
  });
  const [preferredSectionForAdd, setPreferredSectionForAdd] =
    useState<ChecklistSection>(() =>
      toChecklistSection(
        sections[0]?.key ?? template?.items?.[0]?.section ?? "TITLE",
      ),
    );

  // Build a sorted tree for hierarchical rendering while keeping editable state flat.
  const checklistTree = useMemo(() => buildChecklistTree(items), [items]);
  const displayedSections = useMemo(
    () =>
      sections
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((section) => ({
          section: section.key,
          label: section.sectionNumber
            ? `${section.sectionNumber}. ${section.name}`
            : section.name,
          description: section.description ?? undefined,
          nodes: checklistTree.filter((node) => node.section === section.key),
          itemCount: items.filter((item) => item.section === section.key).length,
        })),
    [checklistTree, items, sections],
  );
  const normalizedNewSectionName = newSectionName.trim().replace(/\s+/g, " ");
  const hasDuplicateSectionName = useMemo(
    () =>
      sections.some(
        (section) =>
          section.name.toLowerCase() === normalizedNewSectionName.toLowerCase(),
      ),
    [normalizedNewSectionName, sections],
  );

  const handleAddSection = () => {
    const sectionName = normalizedNewSectionName;
    if (!sectionName) {
      return;
    }

    const sectionKey = toChecklistSection(sectionName);
    const nextOrder = sections.length + 1;

    setSections((prev) => [
      ...prev,
      {
        key: sectionKey,
        name: sectionName,
        description: null,
        sectionNumber: String(nextOrder),
        order: nextOrder,
      },
    ]);
    setPreferredSectionForAdd(sectionKey);
    setNewSectionName("");
  };

  const handleRemoveSection = (section: ChecklistSection) => {
    setItems((prevItems) =>
      normalizeChecklistOrder(
        prevItems.filter((item) => item.section !== section),
      ),
    );
    setSections((prev) => {
      const next = prev
        .filter((current) => current.key !== section)
        .map((current, index) => ({
          ...current,
          order: index + 1,
          sectionNumber: String(index + 1),
        }));

      if (next.length > 0) {
        return next;
      }

      return [];
    });
    setPreferredSectionForAdd((prev) => {
      if (prev !== section) {
        return prev;
      }

      return (
        sections.find((current) => current.key !== section)?.key ?? "TITLE"
      );
    });
  };

  const handleSaveTemplate = async () => {
    if (!onSave) return;

    const normalizedItems = normalizeChecklistOrder(items).map((item) => {
      const isGroupingItem = Boolean(item.isSectionHeaderOnly);

      return {
        ...item,
        hasLocationField:
          isGroupingItem || checklistType === ChecklistTypeValue.ABSTRACT
            ? false
            : (item.hasLocationField ?? true),
      };
    });

    const data: UpdateCustomTemplateRequest = {
      id: template?.id || "new",
      name: templateName,
      description: templateDescription,
      type: checklistType,
      sections: sections
        .slice()
        .sort((a, b) => a.order - b.order)
        .map<UpdateCustomTemplateSection>((section, index) => ({
          key: section.key,
          name: section.name,
          description: section.description ?? null,
          order: index + 1,
          sectionNumber: section.sectionNumber ?? String(index + 1),
        })),
      items: normalizedItems,
    };

    await onSave(data);
    onClose?.();
  };

  const handleAddItem = (newItem: AddChecklistItemInput) => {
    setItems((prevItems) => {
      const parentItem =
        newItem.mode === "sub-item"
          ? prevItems.find((item) => item.id === newItem.parentId)
          : undefined;
      const resolvedSection =
        newItem.mode === "sub-item" && parentItem
          ? parentItem.section
          : newItem.section;
      const trimmedItemNumber = newItem.itemNumber.trim();
      const autoItemNumber = (() => {
        if (trimmedItemNumber) {
          return trimmedItemNumber;
        }

        if (newItem.mode === "sub-item" && parentItem) {
          const siblingCount = prevItems.filter(
            (item) => item.parentId === parentItem.id,
          ).length;
          return getNextSubItemNumber(parentItem.itemNumber, siblingCount);
        }

        return getNextRootItemNumber(resolvedSection, prevItems);
      })();

      // Grouping/header-only items are organizational and should not carry response-oriented fields.
      const isSectionHeaderOnly =
        newItem.mode === "sub-item" ? false : newItem.isSectionHeaderOnly;
      const hasLocationField =
        isSectionHeaderOnly || checklistType === ChecklistTypeValue.ABSTRACT
          ? false
          : newItem.hasLocationField;

      const nextItem: ChecklistItemTemplate = {
        id: `${Date.now()}`,
        itemNumber: autoItemNumber,
        topic: newItem.topic,
        description: newItem.description,
        section: resolvedSection,
        isRequired: newItem.isRequired,
        isSubItem: newItem.mode === "sub-item",
        parentId: newItem.mode === "sub-item" ? newItem.parentId : undefined,
        isSectionHeaderOnly,
        hasLocationField,
        defaultSampleAnswer: isSectionHeaderOnly ? undefined : "",
        order: prevItems.length * ORDER_GAP,
      };

      return normalizeChecklistOrder([...prevItems, nextItem]);
    });

    setShowAddItemModal(false);
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prevItems) => {
      const tree = buildChecklistTree(prevItems);
      const nodeToDelete = findNodeById(tree, itemId);
      if (!nodeToDelete) {
        return prevItems;
      }

      const childIds = collectDescendantIds(nodeToDelete);
      const blockedIds = new Set([itemId, ...childIds]);

      return normalizeChecklistOrder(
        prevItems.filter((item) => !blockedIds.has(item.id)),
      );
    });
  };

  const handleReorderItem = (itemId: string, direction: "up" | "down") => {
    setItems((prevItems) => {
      const tree = buildChecklistTree(prevItems);
      const flat = flattenChecklistTree(tree);
      const target = flat.find((item) => item.id === itemId);

      if (!target) {
        return prevItems;
      }

      const nextTree = target.parentId
        ? reorderSubNodes(tree, target.parentId, itemId, direction)
        : reorderRootNodes(tree, itemId, direction);

      return normalizeChecklistOrder(flattenChecklistTree(nextTree));
    });
  };

  const handleUpdateItem = (
    itemId: string,
    updates: Partial<ChecklistItemTemplate>,
  ) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const merged = { ...item, ...updates };
        const isGroupingItem =
          Boolean(merged.isSectionHeaderOnly) || Boolean(merged.hasChildren);

        if (isGroupingItem || checklistType === ChecklistTypeValue.ABSTRACT) {
          return { ...merged, hasLocationField: false };
        }

        return merged;
      }),
    );
  };

  const renderTreeNodes = (nodes: ChecklistTreeNode[], depth = 0) => {
    return nodes.map((node, index) => (
      <React.Fragment key={node.id}>
        <TemplateItemEditor
          item={node}
          sectionOptions={sections.map((section) => section.key)}
          isSubItem={depth > 0}
          isExpanded={expandedItemId === node.id}
          onToggleExpand={() =>
            setExpandedItemId(expandedItemId === node.id ? null : node.id)
          }
          onUpdate={(updates) => handleUpdateItem(node.id, updates)}
          onDelete={() => handleDeleteItem(node.id)}
          onMoveUp={() => handleReorderItem(node.id, "up")}
          onMoveDown={() => handleReorderItem(node.id, "down")}
          onAddSubItem={() => {
            setAddItemMode("sub-item");
            setAddItemParentItem({
              id: node.id,
              itemNumber: node.itemNumber,
              topic: node.topic,
              section: node.section,
            });
            setPreferredSectionForAdd(node.section);
            setAddItemSessionId((prev) => prev + 1);
            setShowAddItemModal(true);
          }}
          canMoveUp={index > 0}
          canMoveDown={index < nodes.length - 1}
          canAddSubItem={!node.isSubItem || Boolean(node.isSectionHeaderOnly)}
          checklistType={checklistType}
          isLoading={isLoading}
        />

        {node.children.length > 0 && (
          <div className="space-y-2 border-t border-dashed border-border/70 pt-2">
            {renderTreeNodes(node.children, depth + 1)}
          </div>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-5 px-4 py-5 pb-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex items-center gap-2 text-xs">
              <li className="text-text-secondary">Checklist Templates</li>
              <li aria-hidden="true" className="text-text-muted">/</li>
              <li aria-current="page" className="font-medium text-text-primary">{template ? "Edit template" : "New template"}</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-[26px]">
            {template ? "Edit Checklist Template" : "Create Checklist Template"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            Configure template details and organize the checklist into clear sections.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTemplate}
            disabled={isLoading || !templateName.trim()}
            isLoading={isLoading}
            size="sm"
            className="min-w-32"
          >
            {!isLoading && <FiSave aria-hidden="true" className="h-4 w-4" />}
            {isLoading ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-surface-white">
        <section aria-labelledby="template-details-title" className="p-4 sm:p-5 lg:p-6">
          <div className="mb-4">
            <h2 id="template-details-title" className="text-base font-semibold text-text-primary">Template details</h2>
            <p className="mt-0.5 text-xs text-text-secondary">Set the name, format, and purpose of this checklist.</p>
          </div>
          <div className="grid gap-x-5 gap-y-3 md:grid-cols-2">
            <div>
              <label htmlFor="template-name" className="mb-1.5 block text-xs font-semibold text-text-secondary">Template name</label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder="e.g., PRISMA 2020 Main Checklist"
                disabled={isLoading}
                className="min-h-10 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="checklist-type" className="mb-1.5 block text-xs font-semibold text-text-secondary">Checklist type</label>
              <Select
                id="checklist-type"
                value={checklistType}
                onChange={(event) => setChecklistType(Number(event.target.value) as ChecklistType)}
                disabled={isLoading}
                className="min-h-10 w-full rounded-lg border border-border bg-surface-white px-3 py-2 text-sm text-text-primary transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-bg-secondary disabled:opacity-70"
              >
                <option value={ChecklistTypeValue.FULL}>Full</option>
                <option value={ChecklistTypeValue.ABSTRACT}>Abstract</option>
              </Select>
              <p className="mt-1 text-[11px] leading-4 text-text-secondary">
                {checklistType === ChecklistTypeValue.FULL
                  ? "Includes location fields for response items."
                  : "Hides location fields for response items."}
              </p>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="template-description" className="mb-1.5 block text-xs font-semibold text-text-secondary">Description</label>
              <Textarea
                id="template-description"
                value={templateDescription}
                onChange={(event) => setTemplateDescription(event.target.value)}
                placeholder="Describe when this checklist should be used"
                rows={2}
                disabled={isLoading}
                className="min-h-[72px] resize-y rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="checklist-items-title" className="border-t border-border">
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 id="checklist-items-title" className="text-base font-semibold text-text-primary">Checklist items</h2>
                <span className="rounded-full bg-bg-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
                <span className="text-xs text-text-muted">{displayedSections.length} {displayedSections.length === 1 ? "section" : "sections"}</span>
              </div>
              <p className="mt-0.5 text-xs text-text-secondary">Arrange questions and grouping headers in the order reviewers will see them.</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto lg:min-w-[360px]">
              <Input
                value={newSectionName}
                onChange={(event) => setNewSectionName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddSection();
                  }
                }}
                placeholder="Name a new section"
                aria-label="New section name"
                disabled={isLoading}
                className="min-h-10 rounded-lg px-3 py-2"
              />
              <Button
                onClick={handleAddSection}
                size="sm"
                variant="secondary"
                className="min-h-10 shrink-0"
                disabled={isLoading || !normalizedNewSectionName || hasDuplicateSectionName}
                title={hasDuplicateSectionName ? "Section name already exists" : undefined}
              >
                <FiPlus aria-hidden="true" className="h-4 w-4" />
                Add section
              </Button>
            </div>
          </div>

          <div className="border-t border-border px-4 sm:px-5 lg:px-6">
            {displayedSections.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-text-primary">No checklist sections yet</p>
                <p className="mt-1 text-xs text-text-secondary">Create a section above, then add the first checklist item.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {displayedSections.map((group) => (
                  <section key={group.section} aria-labelledby={`section-title-${group.section}`} className="py-4 first:pt-3 last:pb-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <h3 id={`section-title-${group.section}`} className="text-sm font-semibold text-text-primary">{group.label}</h3>
                            <span className="text-[11px] text-text-muted">{group.itemCount} {group.itemCount === 1 ? "item" : "items"}</span>
                          </div>
                          {group.description && <p className="mt-0.5 max-w-2xl truncate text-xs text-text-secondary">{group.description}</p>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          onClick={() => {
                            setAddItemMode("root");
                            setAddItemParentItem(undefined);
                            setPreferredSectionForAdd(group.section);
                            setAddItemSessionId((previous) => previous + 1);
                            setShowAddItemModal(true);
                          }}
                          size="sm"
                          variant="secondary"
                          className="min-h-9 rounded-lg px-3 text-xs"
                          disabled={isLoading}
                        >
                          <FiPlus aria-hidden="true" className="h-3.5 w-3.5" />
                          Add item
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(group.section)}
                          className="inline-flex min-h-9 items-center justify-center rounded-lg px-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30 disabled:opacity-50 motion-reduce:transition-none"
                          disabled={isLoading}
                          title="Remove section and its items"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 w-full space-y-2">
                      {group.nodes.length > 0 ? (
                        renderTreeNodes(group.nodes)
                      ) : (
                        <div className="rounded-lg border border-dashed border-border px-3 py-3 text-xs text-text-secondary">
                          No items in this section yet. Add a top-level item to begin.
                        </div>
                      )}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Add Item Modal */}
      <AddItemModal
        key={addItemSessionId}
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        onAdd={handleAddItem}
        existingItems={items}
        existingItemNumbers={items.map((item) => item.itemNumber)}
        mode={addItemMode}
        section={preferredSectionForAdd}
        parentItem={addItemParentItem}
        checklistType={checklistType}
      />
    </div>
  );
};

/**
 * Component for editing a single template item
 */
interface TemplateItemEditorProps {
  item: ChecklistTreeNode;
  sectionOptions: ChecklistSection[];
  isSubItem: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<ChecklistItemTemplate>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onAddSubItem: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canAddSubItem: boolean;
  checklistType: ChecklistType;
  isLoading?: boolean;
}

const TemplateItemEditor: React.FC<TemplateItemEditorProps> = ({
  item,
  sectionOptions,
  isSubItem,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddSubItem,
  canMoveUp,
  canMoveDown,
  canAddSubItem,
  checklistType,
  isLoading = false,
}) => {
  const isGroupingItem =
    Boolean(item.isSectionHeaderOnly) || (item.children?.length ?? 0) > 0;
  const isAbstractType = checklistType === ChecklistTypeValue.ABSTRACT;

  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2.5 transition-colors motion-reduce:transition-none",
        isGroupingItem
          ? "border-l-2 border-warning/60 bg-warning/5"
          : isSubItem
            ? "border-l-2 border-border bg-bg-secondary/50"
            : "border-l-2 border-transparent hover:bg-bg-secondary/40",
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2.5 gap-y-1">
          <span
            className={cn(
              "min-w-8 rounded-md bg-white/80 px-1.5 py-1 text-center font-mono text-xs font-semibold",
              isGroupingItem ? "text-warning" : "text-primary",
            )}
          >
            {item.itemNumber}
          </span>
          <h3
            className={cn(
              "min-w-0 break-words text-sm text-text-primary",
              isSubItem ? "font-medium" : "font-semibold",
            )}
          >
            {item.topic}
          </h3>
          {isGroupingItem && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
              <FiLayers aria-hidden="true" className="h-3 w-3" /> Grouping
            </span>
          )}
          {isSubItem && (
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-text-secondary">
              Sub-item
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 sm:shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp || isLoading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
            title="Move up"
            aria-label={`Move ${item.topic} up`}
          >
            <FiChevronUp aria-hidden="true" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown || isLoading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
            title="Move down"
            aria-label={`Move ${item.topic} down`}
          >
            <FiChevronDown aria-hidden="true" className="h-4 w-4" />
          </button>
          {canAddSubItem && (
            <button
              type="button"
              onClick={onAddSubItem}
              disabled={isLoading}
              className="inline-flex min-h-8 items-center gap-1 whitespace-nowrap rounded-md px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
              title="Add sub-item"
            >
              <FiLayers aria-hidden="true" className="h-3.5 w-3.5" />
              Add child
            </button>
          )}
          <button
            type="button"
            onClick={onToggleExpand}
            aria-expanded={isExpanded}
            className="inline-flex min-h-8 items-center justify-center rounded-md px-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-white hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none"
          >
            {isExpanded ? "Hide details" : "Edit"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isLoading}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/30 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
            title="Delete item"
            aria-label={`Delete ${item.topic}`}
          >
            <FiTrash2 aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3 border-t border-border/80 pt-3">
          {isGroupingItem && (
            <div className="rounded-md border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
              This item is a grouping header. Users will not enter responses
              here - only fill its sub-items.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">
                Section
              </label>
              <Select
                value={item.section}
                onChange={(e) =>
                  onUpdate({ section: e.target.value as ChecklistSection })
                }
                disabled={isLoading}
                className="min-h-11 w-full rounded-lg border border-border bg-surface-white px-2 py-1 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {Array.from(new Set([...sectionOptions, item.section])).map(
                  (section) => (
                    <option key={section} value={section}>
                      {getSectionDisplayName(section)}
                    </option>
                  ),
                )}
              </Select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={item.isRequired}
                onChange={(e) => onUpdate({ isRequired: e.target.checked })}
                disabled={isLoading}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm font-medium text-text-primary">
                Required
              </span>
            </label>
          </div>

          {!isGroupingItem && !isAbstractType && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={item.hasLocationField !== false}
                onChange={(e) =>
                  onUpdate({ hasLocationField: e.target.checked })
                }
                disabled={isLoading}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm font-medium text-text-primary">
                Has Location Field
              </span>
            </label>
          )}

          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">
              Description
            </label>
            <Textarea
              value={item.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              disabled={isLoading}
              rows={3}
              className="text-sm"
            />
            {isGroupingItem && (
              <p className="text-xs text-info mt-1">
                (Grouping item - fill sub-items below)
              </p>
            )}
          </div>

          {!isGroupingItem && item.defaultSampleAnswer && (
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">
                Sample Answer
              </label>
              <Textarea
                value={item.defaultSampleAnswer}
                onChange={(e) =>
                  onUpdate({ defaultSampleAnswer: e.target.value })
                }
                disabled={isLoading}
                rows={2}
                className="text-sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Modal for adding a new checklist item
 */
interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: AddChecklistItemInput) => void;
  existingItems: ChecklistItemTemplate[];
  existingItemNumbers?: string[];
  mode: AddItemMode;
  section: ChecklistSection;
  parentItem?: ParentItemOption;
  checklistType: ChecklistType;
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingItems,
  existingItemNumbers = [],
  mode,
  section,
  parentItem,
  checklistType,
}) => {
  const [itemNumber, setItemNumber] = useState("");
  const [topic, setTopic] = useState("");
  const [selectedSection, setSelectedSection] =
    useState<ChecklistSection>(section);
  const [description, setDescription] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [itemKind, setItemKind] = useState<"normal" | "grouping">("normal");
  const [hasLocationField, setHasLocationField] = useState(true);

  const effectiveKind = mode === "sub-item" ? "normal" : itemKind;
  const isAbstractType = checklistType === ChecklistTypeValue.ABSTRACT;

  const resolvedSection =
    mode === "sub-item" && parentItem ? parentItem.section : selectedSection;

  const suggestedItemNumber = useMemo(() => {
    if (mode === "sub-item" && parentItem) {
      const siblingCount = existingItems.filter(
        (item) => item.parentId === parentItem.id,
      ).length;
      return getNextSubItemNumber(parentItem.itemNumber, siblingCount);
    }

    return getNextRootItemNumber(resolvedSection, existingItems);
  }, [existingItems, mode, parentItem, resolvedSection]);

  const candidateItemNumber = itemNumber.trim() || suggestedItemNumber;

  const handleCloseModal = () => {
    setItemNumber("");
    setTopic("");
    setDescription("");
    setIsRequired(true);
    setHasLocationField(true);
    setItemKind("normal");
    onClose();
  };

  const applySuggestedNumber = () => {
    setItemNumber(suggestedItemNumber);
  };

  const handleAdd = () => {
    if (!topic.trim()) return;
    if (mode === "sub-item" && !parentItem) return;

    const resolvedItemNumber = itemNumber.trim() || suggestedItemNumber;

    onAdd({
      mode,
      itemNumber: resolvedItemNumber,
      topic,
      description,
      section: resolvedSection,
      isRequired,
      hasLocationField:
        effectiveKind === "normal" && !isAbstractType
          ? hasLocationField
          : false,
      isSectionHeaderOnly: effectiveKind === "grouping",
      parentId: mode === "sub-item" ? parentItem?.id : undefined,
    });

    handleCloseModal();
  };

  const isDuplicateItemNumber = existingItemNumbers.some(
    (existingItemNumber) =>
      existingItemNumber.toLowerCase() === candidateItemNumber.toLowerCase(),
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={mode === "sub-item" ? "Add Sub-item" : "Add Root Item"}
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={handleCloseModal}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={
              !topic.trim() ||
              isDuplicateItemNumber ||
              (mode === "sub-item" && !parentItem)
            }
            className="flex-1"
          >
            {mode === "sub-item" ? "Add Sub-item" : "Add Root Item"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {mode === "sub-item" && parentItem && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-text-primary">
            Adding as sub-item under: {parentItem.itemNumber} -{" "}
            {parentItem.topic}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">
            Item Kind
          </label>
          {mode === "sub-item" ? (
            <div className="rounded-xl border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary">
              Normal Item only
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemKind("normal")}
                className={cn(
                  "min-h-11 px-3 py-2 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
                  effectiveKind === "normal"
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-border bg-surface-white text-text-primary hover:bg-bg-primary",
                )}
              >
                Normal Item
              </button>
              <button
                type="button"
                onClick={() => setItemKind("grouping")}
                className={cn(
                  "min-h-11 rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/30 motion-reduce:transition-none",
                  effectiveKind === "grouping"
                    ? "border-warning/30 bg-warning/10 text-warning"
                    : "border-border bg-surface-white text-text-primary hover:bg-bg-primary",
                )}
              >
                Grouping Item
              </button>
            </div>
          )}

          {effectiveKind === "grouping" ? (
            <p className="mt-2 rounded-md border border-warning/20 bg-warning/10 px-2 py-1 text-xs text-warning">
              This item is a header only. Users will not enter responses here,
              and sub-items can be added underneath it.
            </p>
          ) : mode === "sub-item" ? (
            <p className="mt-2 text-xs text-text-secondary">
              Sub-items are always Normal Items.
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Item Number
            </label>
            <div className="flex gap-2">
              <Input
                value={itemNumber}
                onChange={(e) => setItemNumber(e.target.value)}
                placeholder={suggestedItemNumber}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={applySuggestedNumber}
              >
                Use Suggested
              </Button>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Suggested: {suggestedItemNumber}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Section
            </label>
            <Select
              value={resolvedSection}
              onChange={(e) =>
                setSelectedSection(e.target.value as ChecklistSection)
              }
              disabled={mode === "sub-item"}
              className="min-h-11 w-full rounded-xl border border-border bg-surface-white px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              {Array.from(
                new Set([
                  resolvedSection,
                  ...existingItems.map((item) => item.section),
                ]),
              ).map((section) => (
                <option key={section} value={section}>
                  {getSectionDisplayName(section)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">
            Topic
          </label>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Study design"
          />
        </div>

        {isDuplicateItemNumber && (
          <p className="text-sm text-error" role="alert">
            This item number already exists in the template.
          </p>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Full item description"
            rows={4}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm font-medium text-text-primary">Required</span>
        </label>

        {effectiveKind === "normal" && !isAbstractType && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hasLocationField}
              onChange={(e) => setHasLocationField(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm font-medium text-text-primary">
              Has Location Field
            </span>
          </label>
        )}

        {effectiveKind === "normal" && isAbstractType && (
          <p className="text-xs text-text-secondary">
            Abstract type disables location fields for all response items.
          </p>
        )}

      </div>
    </Modal>
  );
};

const TemplateCustoimzer: React.FC<TemplateCustoimzerProps> = (props) => {
  return (
    <TemplateCustoimzerInner key={props.template?.id ?? "new"} {...props} />
  );
};

export default TemplateCustoimzer;
