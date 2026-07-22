"use client";

import Link from "next/link";
import { Check, GripVertical, Pencil, Plus, Search, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { CommandCard } from "@/components/command-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Command, CommandTag } from "@/db/schema";
import { useCommandOrder } from "@/hooks/useCommandOrder";
import { cn } from "@/lib/utils";

const filters = [
  { value: "all", label: "Todos" },
  { value: "conferencia", label: "Conferência" },
  { value: "conversao", label: "Conversão" },
  { value: "geral", label: "Geral" },
] as const;

const pageSize = 9;

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function getInitialTags(value?: string): CommandTag[] {
  return value === "conferencia" || value === "conversao" || value === "geral" ? [value] : [];
}

type CommandsLibraryProps = {
  commands: Command[];
  initialQuery?: string;
  initialTag?: string;
  initialPage?: number;
};

type DragPreview = {
  commandId: string;
  pointerId: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

export function CommandsLibrary({ commands, initialQuery = "", initialTag, initialPage = 1 }: CommandsLibraryProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedTags, setSelectedTags] = useState<CommandTag[]>(getInitialTags(initialTag));
  const [page, setPage] = useState(Math.max(initialPage, 1));
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const draftOrderRef = useRef<string[] | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const dragPreviewRef = useRef<DragPreview | null>(null);
  const dragPreviewElementRef = useRef<HTMLDivElement | null>(null);
  const libraryRef = useRef<HTMLDivElement | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const { order: commandOrder, setOrder: setCommandOrder } = useCommandOrder();
  const isEditingOrder = draftOrder !== null;
  const activeOrder = draftOrder ?? commandOrder;

  const orderedCommands = useMemo(() => {
    const commandsById = new Map(commands.map((command) => [command.id, command]));
    const result: Command[] = [];

    for (const id of activeOrder) {
      const command = commandsById.get(id);
      if (!command) continue;
      result.push(command);
      commandsById.delete(id);
    }

    for (const command of commands) {
      if (commandsById.has(command.id)) result.push(command);
    }

    return result;
  }, [activeOrder, commands]);

  const filteredCommands = useMemo(() => {
    const normalizedQuery = normalizeSearchText(query.trim());

    return orderedCommands.filter((command) => {
      const searchableContent = normalizeSearchText(`${command.title}\n${command.sqlCode}`);
      const matchesQuery = normalizedQuery ? searchableContent.includes(normalizedQuery) : true;
      const matchesTag =
        selectedTags.length === 0 ? true : selectedTags.some((selectedTag) => command.tags.includes(selectedTag));

      return matchesQuery && matchesTag;
    });
  }, [orderedCommands, query, selectedTags]);

  const pageCount = Math.max(Math.ceil(filteredCommands.length / pageSize), 1);
  const currentPage = Math.min(page, pageCount);
  const visibleCommands = filteredCommands.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const setDragPreviewElement = useCallback((element: HTMLDivElement | null) => {
    dragPreviewElementRef.current = element;
    const preview = dragPreviewRef.current;
    if (!element || !preview) return;

    element.style.transform = `translate3d(${preview.x - preview.offsetX}px, ${preview.y - preview.offsetY}px, 0)`;
  }, []);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateFilter(value: CommandTag | "all") {
    setSelectedTags((currentTags) => {
      if (value === "all") return [];
      return currentTags.includes(value)
        ? currentTags.filter((currentTag) => currentTag !== value)
        : [...currentTags, value];
    });
    setPage(1);
  }

  function isFilterSelected(value: CommandTag | "all") {
    return value === "all" ? selectedTags.length === 0 : selectedTags.includes(value);
  }

  function moveCommand(commandId: string, targetIndex: number) {
    const currentOrder = draftOrderRef.current ?? orderedCommands.map((command) => command.id);
    const currentIndex = currentOrder.indexOf(commandId);
    const boundedTargetIndex = Math.max(0, Math.min(targetIndex, currentOrder.length - 1));
    if (currentIndex < 0 || currentIndex === boundedTargetIndex) return;

    const nextOrder = [...currentOrder];
    nextOrder.splice(currentIndex, 1);
    nextOrder.splice(boundedTargetIndex, 0, commandId);
    draftOrderRef.current = nextOrder;
    setDraftOrder(nextOrder);

    const command = commands.find((item) => item.id === commandId);
    if (command) setAnnouncement(`${command.title} movido para a posição ${boundedTargetIndex + 1}.`);
  }

  function moveCommandBefore(commandId: string, targetId: string) {
    if (commandId === targetId) return;
    const currentOrder = draftOrderRef.current ?? orderedCommands.map((command) => command.id);
    const targetIndex = currentOrder.indexOf(targetId);
    if (targetIndex >= 0) moveCommand(commandId, targetIndex);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, commandId: string) {
    if (event.button !== 0) return;
    event.preventDefault();
    const card = event.currentTarget.closest<HTMLElement>("[data-command-id]");
    if (!card) return;

    const bounds = card.getBoundingClientRect();
    const nextPreview = {
      commandId,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      width: bounds.width,
      height: bounds.height,
    };
    dragPreviewRef.current = nextPreview;
    setDragPreview(nextPreview);
    libraryRef.current?.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const currentPreview = dragPreviewRef.current;
    if (!currentPreview || event.pointerId !== currentPreview.pointerId) return;
    event.preventDefault();

    const nextPreview = { ...currentPreview, x: event.clientX, y: event.clientY };
    dragPreviewRef.current = nextPreview;
    if (dragPreviewElementRef.current) {
      dragPreviewElementRef.current.style.transform = `translate3d(${nextPreview.x - nextPreview.offsetX}px, ${nextPreview.y - nextPreview.offsetY}px, 0)`;
    }
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-command-id]");
    const targetId = target?.dataset.commandId;
    if (targetId) moveCommandBefore(currentPreview.commandId, targetId);
  }

  function clearDragPreview() {
    const preview = dragPreviewRef.current;
    if (preview && libraryRef.current?.hasPointerCapture(preview.pointerId)) {
      libraryRef.current.releasePointerCapture(preview.pointerId);
    }
    dragPreviewRef.current = null;
    setDragPreview(null);
  }

  function finishPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragPreviewRef.current?.pointerId !== event.pointerId) return;
    clearDragPreview();
  }

  function handleReorderKeyDown(event: KeyboardEvent<HTMLButtonElement>, commandId: string) {
    const currentOrder = draftOrderRef.current ?? orderedCommands.map((command) => command.id);
    const currentIndex = currentOrder.indexOf(commandId);
    let targetIndex = currentIndex;

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") targetIndex -= 1;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") targetIndex += 1;
    else if (event.key === "Home") targetIndex = 0;
    else if (event.key === "End") targetIndex = currentOrder.length - 1;
    else return;

    event.preventDefault();
    moveCommand(commandId, targetIndex);
  }

  const draggedCommand = dragPreview
    ? orderedCommands.find((command) => command.id === dragPreview.commandId)
    : undefined;

  return (
    <div
      ref={libraryRef}
      className="space-y-8"
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerMove}
      onPointerCancel={finishPointerMove}
      onLostPointerCapture={finishPointerMove}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Biblioteca</h1>
          <p className="mt-2 text-sm text-muted-foreground">Pesquise, copie e favorite comandos SQL.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditingOrder ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraftOrder(null);
                  draftOrderRef.current = null;
                  clearDragPreview();
                  setAnnouncement("Alterações de ordem canceladas.");
                }}
              >
                <X />
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setCommandOrder(draftOrderRef.current ?? draftOrder);
                  setDraftOrder(null);
                  draftOrderRef.current = null;
                  clearDragPreview();
                  setAnnouncement("Nova ordem salva neste navegador.");
                }}
              >
                <Check />
                Concluir
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const nextDraftOrder = orderedCommands.map((command) => command.id);
                  draftOrderRef.current = nextDraftOrder;
                  setDraftOrder(nextDraftOrder);
                }}
                disabled={commands.length < 2}
              >
                <Pencil />
                Editar
              </Button>
              <Button asChild>
                <Link href="/commands/new">
                  <Plus className="size-4" />
                  Novo comando
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {isEditingOrder ? (
        <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-accent/50 px-4 py-3 text-sm text-accent-foreground">
          <GripVertical className="size-4 shrink-0" />
          <p>Arraste os cards desta página para organizar a biblioteca. A ordem fica salva somente neste navegador.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Pesquisar por título ou trecho do SQL"
              aria-label="Pesquisar comandos por título ou trecho do SQL"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateFilter(filter.value)}
                aria-pressed={isFilterSelected(filter.value)}
                className={cn(isFilterSelected(filter.value) && "border-primary bg-accent")}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {visibleCommands.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCommands.map((command) => (
            <div
              key={command.id}
              data-command-id={command.id}
              className={cn(
                "relative h-full",
                isEditingOrder && "library-card-editing",
                dragPreview?.commandId === command.id && "library-card-placeholder",
              )}
            >
              <CommandCard command={command} />
              {isEditingOrder ? (
                <button
                  type="button"
                  className="absolute inset-0 z-10 flex touch-none cursor-grab items-end justify-end rounded-lg p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                  aria-label={`Reordenar ${command.title}`}
                  aria-pressed={dragPreview?.commandId === command.id}
                  title="Arraste para reordenar"
                  onPointerDown={(event) => handlePointerDown(event, command.id)}
                  onKeyDown={(event) => handleReorderKeyDown(event, command.id)}
                >
                  <span className="rounded-md border bg-background/95 p-1.5 text-muted-foreground shadow-sm" aria-hidden="true">
                    <GripVertical className="size-4" />
                  </span>
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border p-8 text-center text-muted-foreground">Nenhum comando encontrado.</p>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Próxima
          </Button>
        </div>
      ) : null}

      {dragPreview && draggedCommand ? (
        <div
          ref={setDragPreviewElement}
          className="pointer-events-none fixed left-0 top-0 z-50"
          style={{
            width: dragPreview.width,
            height: dragPreview.height,
          }}
          aria-hidden="true"
        >
          <div className="library-card-drag-preview h-full">
            <CommandCard command={draggedCommand} />
          </div>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
