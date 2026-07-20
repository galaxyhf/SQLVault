"use client";

import { Check, GripVertical, Pencil, X } from "lucide-react";
import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { CommandCard } from "@/components/command-card";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import type { Command } from "@/db/schema";
import { cn } from "@/lib/utils";

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

export function FavoritesList({ commands }: { commands: Command[] }) {
  const { favorites, setFavoritesOrder } = useFavorites();
  const [draftOrder, setDraftOrder] = useState<string[] | null>(null);
  const draftOrderRef = useRef<string[] | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const dragPreviewRef = useRef<DragPreview | null>(null);
  const dragPreviewElementRef = useRef<HTMLDivElement | null>(null);
  const favoritesRef = useRef<HTMLDivElement | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const isEditingOrder = draftOrder !== null;

  const favoriteCommands = useMemo(() => {
    const commandsById = new Map(commands.map((command) => [command.id, command]));
    const activeOrder = draftOrder ?? favorites;

    return activeOrder.flatMap((id) => {
      const command = commandsById.get(id);
      return command ? [command] : [];
    });
  }, [commands, draftOrder, favorites]);

  const setDragPreviewElement = useCallback((element: HTMLDivElement | null) => {
    dragPreviewElementRef.current = element;
    const preview = dragPreviewRef.current;
    if (!element || !preview) return;

    element.style.transform = `translate3d(${preview.x - preview.offsetX}px, ${preview.y - preview.offsetY}px, 0)`;
  }, []);

  function moveCommand(commandId: string, targetIndex: number) {
    const currentOrder = draftOrderRef.current ?? favoriteCommands.map((command) => command.id);
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
    const currentOrder = draftOrderRef.current ?? favoriteCommands.map((command) => command.id);
    const targetIndex = currentOrder.indexOf(targetId);
    if (targetIndex >= 0) moveCommand(commandId, targetIndex);
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>, commandId: string) {
    if (event.button !== 0) return;
    event.preventDefault();
    const card = event.currentTarget.closest<HTMLElement>("[data-favorite-command-id]");
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
    favoritesRef.current?.setPointerCapture(event.pointerId);
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

    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-favorite-command-id]");
    const targetId = target?.dataset.favoriteCommandId;
    if (targetId) moveCommandBefore(currentPreview.commandId, targetId);
  }

  function clearDragPreview() {
    const preview = dragPreviewRef.current;
    if (preview && favoritesRef.current?.hasPointerCapture(preview.pointerId)) {
      favoritesRef.current.releasePointerCapture(preview.pointerId);
    }
    dragPreviewRef.current = null;
    setDragPreview(null);
  }

  function finishPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragPreviewRef.current?.pointerId !== event.pointerId) return;
    clearDragPreview();
  }

  function handleReorderKeyDown(event: KeyboardEvent<HTMLButtonElement>, commandId: string) {
    const currentOrder = draftOrderRef.current ?? favoriteCommands.map((command) => command.id);
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
    ? favoriteCommands.find((command) => command.id === dragPreview.commandId)
    : undefined;

  return (
    <div
      ref={favoritesRef}
      className="space-y-8"
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerMove}
      onPointerCancel={finishPointerMove}
      onLostPointerCapture={finishPointerMove}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Favoritos</h1>
          <p className="mt-2 text-sm text-muted-foreground">Comandos salvos apenas neste navegador.</p>
        </div>
        {isEditingOrder ? (
          <div className="flex flex-wrap gap-2">
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
                const nextOrder = draftOrderRef.current ?? draftOrder;
                const remainingFavorites = favorites.filter((id) => !nextOrder.includes(id));
                setFavoritesOrder([...nextOrder, ...remainingFavorites]);
                setDraftOrder(null);
                draftOrderRef.current = null;
                clearDragPreview();
                setAnnouncement("Nova ordem dos favoritos salva neste navegador.");
              }}
            >
              <Check />
              Concluir
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const nextDraftOrder = favoriteCommands.map((command) => command.id);
              draftOrderRef.current = nextDraftOrder;
              setDraftOrder(nextDraftOrder);
            }}
            disabled={favoriteCommands.length < 2}
          >
            <Pencil />
            Editar
          </Button>
        )}
      </div>

      {isEditingOrder ? (
        <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-accent/50 px-4 py-3 text-sm text-accent-foreground">
          <GripVertical className="size-4 shrink-0" />
          <p>Arraste os cards para organizar seus favoritos. A ordem fica salva somente neste navegador.</p>
        </div>
      ) : null}

      {favoriteCommands.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {favoriteCommands.map((command) => (
            <div
              key={command.id}
              data-favorite-command-id={command.id}
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
        <p className="rounded-lg border p-8 text-center text-muted-foreground">Nenhum comando favoritado.</p>
      )}

      {dragPreview && draggedCommand ? (
        <div
          ref={setDragPreviewElement}
          className="pointer-events-none fixed left-0 top-0 z-50"
          style={{ width: dragPreview.width, height: dragPreview.height }}
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
