"use client";

import { createId } from "@paralleldrive/cuid2";
import {
  MoreHorizontalIcon,
  PenIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { useJsLoaded } from "@/hooks/use-js-loaded";
import type {
  KanbanBoardCircleColor,
  KanbanBoardDropDirection,
} from "@/components/kanban";
import {
  KANBAN_BOARD_CIRCLE_COLORS,
  KanbanBoard,
  KanbanBoardCard,
  KanbanBoardCardButton,
  KanbanBoardCardButtonGroup,
  KanbanBoardCardDescription,
  KanbanBoardCardTextarea,
  KanbanBoardColumn,
  KanbanBoardColumnButton,
  kanbanBoardColumnClassNames,
  KanbanBoardColumnFooter,
  KanbanBoardColumnHeader,
  KanbanBoardColumnIconButton,
  KanbanBoardColumnList,
  KanbanBoardColumnListItem,
  kanbanBoardColumnListItemClassNames,
  KanbanBoardColumnSkeleton,
  KanbanBoardColumnTitle,
  KanbanBoardExtraMargin,
  KanbanBoardProvider,
  KanbanColorCircle,
  useDndEvents,
} from "@/components/kanban";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUiStore } from "@/stores/ui";
import { api } from "@/trpc/react";
import { useParams } from "next/navigation";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";
import { Loader2 } from "lucide-react";

type RouterOutput = inferRouterOutputs<AppRouter>;
type EventDetails = RouterOutput["event"]["getById"];
type Card = EventDetails["todos"][number]["items"][number];
type Column = EventDetails["todos"][number];

export default function EventKanbanBoardPage() {
  const { headerHeight } = useUiStore();
  const { eventId } = useParams<{ eventId: string }>();

  const { data: event, isLoading } = api.event.getById.useQuery({
    id: eventId,
  });

  if (isLoading || !event) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div
      className="grid h-screen grid-rows-[var(--header-height)_1fr_6rem] overflow-x-hidden sm:grid-rows-[var(--header-height)_1fr_var(--header-height)]"
      style={{ paddingTop: headerHeight }}
    >
      <main className="relative">
        <div className="absolute inset-0 h-full overflow-x-hidden px-4 py-4 md:px-6">
          <KanbanBoardProvider>
            <MyKanbanBoard event={event} />
          </KanbanBoardProvider>
        </div>
      </main>
    </div>
  );
}

export function MyKanbanBoard({ event }: { event: EventDetails }) {
  const [columns, setColumns] = useState<Column[]>(
    [...event.todos].sort((a, b) => a.order - b.order),
  );
  const utils = api.useUtils();
  const { eventId } = useParams<{ eventId: string }>();

  useEffect(() => {
    setColumns([...event.todos].sort((a, b) => a.order - b.order));
  }, [event.todos]);

  const addColumnMutation = api.event.addEmptyTodoList.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: eventId }),
  });
  const updateColumnMutation = api.event.updateTodoItem.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: eventId }),
  });
  const addTodoItemMutation = api.event.addTodoItem.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: eventId }),
  });
  const deleteColumnMutation = api.event.deleteTodoList.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: eventId }),
  });
  const updateColumnTitleMutation = api.event.updateTodoList.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: eventId }),
  });
  const deleteTodoItemMutation = api.event.deleteTodoItem.useMutation({
    onSuccess: () => utils.event.getById.invalidate({ id: eventId }),
  });

  const scrollContainerReference = useRef<HTMLDivElement>(null);

  function scrollRight() {
    if (scrollContainerReference.current) {
      scrollContainerReference.current.scrollLeft =
        scrollContainerReference.current.scrollWidth;
    }
  }

  const handleAddColumn = (title?: string) => {
    if (title) {
      addColumnMutation.mutate({
        eventId: event.id,
        title,
      });
    }
    scrollRight();
  };

  function handleDeleteColumn(columnId: string) {
    deleteColumnMutation.mutate({ listId: columnId });
  }

  function handleUpdateColumnTitle(columnId: string, title: string) {
    updateColumnTitleMutation.mutate({ listId: columnId, title });
  }

  function handleAddCard(columnId: string, cardContent: string) {
    const column = columns.find((c) => c.id === columnId);
    if (!column) return;

    addTodoItemMutation.mutate({
      listId: columnId,
      content: cardContent,
      order: column.items.length,
    });
  }

  function handleDeleteCard(cardId: string) {
    deleteTodoItemMutation.mutate({ itemId: cardId });
  }

  function handleMoveCardToColumn(columnId: string, index: number, card: Card) {
    const newColumns = columns.map((col) => {
      const newItems = col.items.filter((item) => item.id !== card.id);
      if (col.id === columnId) {
        newItems.splice(index, 0, card);
      }
      return { ...col, items: newItems };
    });
    setColumns(newColumns);

    updateColumnMutation.mutate({
      itemId: card.id,
      listId: columnId,
      order: index,
    });
  }

  function handleUpdateCardTitle(cardId: string, cardTitle: string) {
    updateColumnMutation.mutate({
      itemId: cardId,
      content: cardTitle,
    });
  }

  const [activeCardId, setActiveCardId] = useState<string>("");
  const originalCardPositionReference = useRef<{
    columnId: string;
    cardIndex: number;
  } | null>(null);
  const { onDragStart, onDragEnd, onDragCancel, onDragOver } = useDndEvents();

  function getOverId(column: Column, cardIndex: number): string {
    const item = column.items[cardIndex + 1];
    if (item) {
      return item.id;
    }

    return column.id;
  }

  function findCardPosition(cardId: string): {
    columnIndex: number;
    cardIndex: number;
  } {
    for (const [columnIndex, column] of columns.entries()) {
      const cardIndex = column.items.findIndex((c) => c.id === cardId);

      if (cardIndex !== -1) {
        return { columnIndex, cardIndex };
      }
    }

    return { columnIndex: -1, cardIndex: -1 };
  }

  function moveActiveCard(
    cardId: string,
    direction: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown",
  ) {
    const { columnIndex, cardIndex } = findCardPosition(cardId);
    if (columnIndex === -1 || cardIndex === -1) return;

    const column = columns[columnIndex];
    if (!column) return;

    const card = column.items[cardIndex];
    if (!card) return;

    let newColumnIndex = columnIndex;
    let newCardIndex = cardIndex;

    switch (direction) {
      case "ArrowUp": {
        newCardIndex = Math.max(cardIndex - 1, 0);
        break;
      }
      case "ArrowDown": {
        newCardIndex = Math.min(cardIndex + 1, column.items.length - 1);
        break;
      }
      case "ArrowLeft": {
        newColumnIndex = Math.max(columnIndex - 1, 0);
        const newColumn = columns[newColumnIndex];
        if (!newColumn) return;
        newCardIndex = Math.min(newCardIndex, newColumn.items.length);
        break;
      }
      case "ArrowRight": {
        newColumnIndex = Math.min(columnIndex + 1, columns.length - 1);
        const newColumn = columns[newColumnIndex];
        if (!newColumn) return;
        newCardIndex = Math.min(newCardIndex, newColumn.items.length);
        break;
      }
    }

    const newColumn = columns[newColumnIndex];
    if (!newColumn) return;

    flushSync(() => {
      handleMoveCardToColumn(newColumn.id, newCardIndex, card);
    });

    const { columnIndex: updatedColumnIndex, cardIndex: updatedCardIndex } =
      findCardPosition(cardId);
    const updatedColumn = columns[updatedColumnIndex];
    if (!updatedColumn) return;
    const overId = getOverId(updatedColumn, updatedCardIndex);

    onDragOver(cardId, overId);
  }

  function handleCardKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    cardId: string,
  ) {
    const { key } = event;

    if (activeCardId === "" && key === " ") {
      event.preventDefault();
      setActiveCardId(cardId);
      onDragStart(cardId);

      const { columnIndex, cardIndex } = findCardPosition(cardId);
      const column = columns[columnIndex];
      if (!column) return;
      originalCardPositionReference.current =
        columnIndex !== -1 && cardIndex !== -1
          ? { columnId: column.id, cardIndex }
          : null;
    } else if (activeCardId === cardId) {
      if (key === " " || key === "Enter") {
        event.preventDefault();
        flushSync(() => {
          setActiveCardId("");
        });

        const { columnIndex, cardIndex } = findCardPosition(cardId);
        if (columnIndex !== -1 && cardIndex !== -1) {
          const column = columns[columnIndex];
          if (!column) return;
          const overId = getOverId(column, cardIndex);
          onDragEnd(cardId, overId);
        } else {
          onDragEnd(cardId);
        }

        originalCardPositionReference.current = null;
      } else if (key === "Escape") {
        event.preventDefault();
        onDragCancel(cardId);
        originalCardPositionReference.current = null;
        setActiveCardId("");
      } else if (
        key === "ArrowLeft" ||
        key === "ArrowRight" ||
        key === "ArrowUp" ||
        key === "ArrowDown"
      ) {
        event.preventDefault();
        moveActiveCard(cardId, key);
      }
    }
  }

  function handleCardBlur() {
    setActiveCardId("");
  }

  const jsLoaded = useJsLoaded();

  return (
    <KanbanBoard ref={scrollContainerReference}>
      {columns.map((column) =>
        jsLoaded ? (
          <MyKanbanBoardColumn
            activeCardId={activeCardId}
            column={column}
            key={column.id}
            onAddCard={handleAddCard}
            onCardBlur={handleCardBlur}
            onCardKeyDown={handleCardKeyDown}
            onDeleteCard={handleDeleteCard}
            onDeleteColumn={handleDeleteColumn}
            onMoveCardToColumn={handleMoveCardToColumn}
            onUpdateCardTitle={handleUpdateCardTitle}
            onUpdateColumnTitle={handleUpdateColumnTitle}
          />
        ) : (
          <KanbanBoardColumnSkeleton key={column.id} />
        ),
      )}
      {jsLoaded ? (
        <MyNewKanbanBoardColumn onAddColumn={handleAddColumn} />
      ) : (
        <Skeleton className="h-9 w-10.5 flex-shrink-0" />
      )}
      <KanbanBoardExtraMargin />
    </KanbanBoard>
  );
}

function MyKanbanBoardColumn({
  activeCardId,
  column,
  onAddCard,
  onCardBlur,
  onCardKeyDown,
  onDeleteCard,
  onDeleteColumn,
  onMoveCardToColumn,
  onUpdateCardTitle,
  onUpdateColumnTitle,
}: {
  activeCardId: string;
  column: Column;
  onAddCard: (columnId: string, cardContent: string) => void;
  onCardBlur: () => void;
  onCardKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    cardId: string,
  ) => void;
  onDeleteCard: (cardId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onMoveCardToColumn: (columnId: string, index: number, card: Card) => void;
  onUpdateCardTitle: (cardId: string, cardTitle: string) => void;
  onUpdateColumnTitle: (columnId: string, columnTitle: string) => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const listReference = useRef<HTMLUListElement>(null);
  const moreOptionsButtonReference = useRef<HTMLButtonElement>(null);
  const { onDragCancel, onDragEnd } = useDndEvents();

  function scrollList() {
    if (listReference.current) {
      listReference.current.scrollTop = listReference.current.scrollHeight;
    }
  }

  function closeDropdownMenu() {
    flushSync(() => {
      setIsEditingTitle(false);
    });

    moreOptionsButtonReference.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const columnTitle = formData.get("columnTitle") as string;
    onUpdateColumnTitle(column.id, columnTitle);
    closeDropdownMenu();
  }

  function handleDropOverColumn(dataTransferData: string) {
    const card = JSON.parse(dataTransferData) as Card;
    onMoveCardToColumn(column.id, 0, card);
  }

  function handleDropOverListItem(cardId: string) {
    return (
      dataTransferData: string,
      dropDirection: KanbanBoardDropDirection,
    ) => {
      const card = JSON.parse(dataTransferData) as Card;
      const cardIndex = column.items.findIndex(({ id }) => id === cardId);
      const currentCardIndex = column.items.findIndex(
        ({ id }) => id === card.id,
      );

      const baseIndex = dropDirection === "top" ? cardIndex : cardIndex + 1;
      const targetIndex =
        currentCardIndex !== -1 && currentCardIndex < baseIndex
          ? baseIndex - 1
          : baseIndex;

      const safeTargetIndex = Math.max(
        0,
        Math.min(targetIndex, column.items.length),
      );
      const overCard = column.items[safeTargetIndex];

      if (card.id === overCard?.id) {
        onDragCancel(card.id);
      } else {
        onMoveCardToColumn(column.id, safeTargetIndex, card);
        onDragEnd(card.id, overCard?.id ?? column.id);
      }
    };
  }

  return (
    <KanbanBoardColumn
      columnId={column.id}
      key={column.id}
      onDropOverColumn={handleDropOverColumn}
    >
      <KanbanBoardColumnHeader>
        {isEditingTitle ? (
          <form
            className="w-full"
            onSubmit={handleSubmit}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                closeDropdownMenu();
              }
            }}
          >
            <Input
              aria-label="Column title"
              autoFocus
              defaultValue={column.title}
              name="columnTitle"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closeDropdownMenu();
                }
              }}
              required
            />
          </form>
        ) : (
          <>
            <KanbanBoardColumnTitle columnId={column.id}>
              {column.title}
            </KanbanBoardColumnTitle>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <KanbanBoardColumnIconButton ref={moreOptionsButtonReference}>
                  <MoreHorizontalIcon />

                  <span className="sr-only">
                    More options for {column.title}
                  </span>
                </KanbanBoardColumnIconButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Column</DropdownMenuLabel>

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                    <PenIcon />
                    Edit Details
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDeleteColumn(column.id)}
                  >
                    <Trash2Icon />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </KanbanBoardColumnHeader>

      <KanbanBoardColumnList ref={listReference}>
        {column.items
          .sort((a, b) => a.order - b.order)
          .map((card) => (
            <KanbanBoardColumnListItem
              cardId={card.id}
              key={card.id}
              onDropOverListItem={handleDropOverListItem(card.id)}
            >
              <MyKanbanBoardCard
                card={card}
                isActive={activeCardId === card.id}
                onCardBlur={onCardBlur}
                onCardKeyDown={onCardKeyDown}
                onDeleteCard={onDeleteCard}
                onUpdateCardTitle={onUpdateCardTitle}
              />
            </KanbanBoardColumnListItem>
          ))}
      </KanbanBoardColumnList>

      <MyNewKanbanBoardCard
        column={column}
        onAddCard={onAddCard}
        scrollList={scrollList}
      />
    </KanbanBoardColumn>
  );
}

function MyKanbanBoardCard({
  card,
  isActive,
  onCardBlur,
  onCardKeyDown,
  onDeleteCard,
  onUpdateCardTitle,
}: {
  card: Card;
  isActive: boolean;
  onCardBlur: () => void;
  onCardKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    cardId: string,
  ) => void;
  onDeleteCard: (cardId: string) => void;
  onUpdateCardTitle: (cardId: string, cardTitle: string) => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const kanbanBoardCardReference = useRef<HTMLButtonElement>(null);
  const previousIsActiveReference = useRef(isActive);
  const wasCancelledReference = useRef(false);

  useEffect(() => {
    if (isActive && !isEditingTitle) {
      kanbanBoardCardReference.current?.focus();
    }

    if (
      !isActive &&
      previousIsActiveReference.current &&
      wasCancelledReference.current
    ) {
      kanbanBoardCardReference.current?.focus();
      wasCancelledReference.current = false;
    }

    previousIsActiveReference.current = isActive;
  }, [isActive, isEditingTitle]);

  function handleBlur() {
    flushSync(() => {
      setIsEditingTitle(false);
    });

    kanbanBoardCardReference.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const cardTitle = formData.get("cardTitle") as string;
    onUpdateCardTitle(card.id, cardTitle);
    handleBlur();
  }

  return isEditingTitle ? (
    <form onBlur={handleBlur} onSubmit={handleSubmit}>
      <KanbanBoardCardTextarea
        aria-label="Edit card title"
        autoFocus
        defaultValue={card.content}
        name="cardTitle"
        onFocus={(event) => event.target.select()}
        onInput={(event) => {
          const input = event.currentTarget as HTMLTextAreaElement;
          if (/\S/.test(input.value)) {
            input.setCustomValidity("");
          } else {
            input.setCustomValidity(
              "Card content cannot be empty or just whitespace.",
            );
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }

          if (event.key === "Escape") {
            handleBlur();
          }
        }}
        placeholder="Edit card title ..."
        required
      />
    </form>
  ) : (
    <KanbanBoardCard
      data={card}
      isActive={isActive}
      onBlur={onCardBlur}
      onClick={() => setIsEditingTitle(true)}
      onKeyDown={(event) => {
        if (event.key === " ") {
          event.preventDefault();
        }

        if (event.key === "Escape") {
          wasCancelledReference.current = true;
        }

        onCardKeyDown(event, card.id);
      }}
      ref={kanbanBoardCardReference}
    >
      <KanbanBoardCardDescription>{card.content}</KanbanBoardCardDescription>
      <KanbanBoardCardButtonGroup disabled={isActive}>
        <KanbanBoardCardButton
          className="text-destructive"
          onClick={() => onDeleteCard(card.id)}
          tooltip="Delete card"
        >
          <Trash2Icon />

          <span className="sr-only">Delete card</span>
        </KanbanBoardCardButton>
      </KanbanBoardCardButtonGroup>
    </KanbanBoardCard>
  );
}

function MyNewKanbanBoardCard({
  column,
  onAddCard,
  scrollList,
}: {
  column: Column;
  onAddCard: (columnId: string, cardContent: string) => void;
  scrollList: () => void;
}) {
  const [cardContent, setCardContent] = useState("");
  const newCardButtonReference = useRef<HTMLButtonElement>(null);
  const submitButtonReference = useRef<HTMLButtonElement>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);

  function handleAddCardClick() {
    flushSync(() => {
      setShowNewCardForm(true);
    });

    scrollList();
  }

  function handleCancelClick() {
    flushSync(() => {
      setShowNewCardForm(false);
      setCardContent("");
    });

    newCardButtonReference.current?.focus();
  }

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setCardContent(event.currentTarget.value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    flushSync(() => {
      onAddCard(column.id, cardContent.trim());
      setCardContent("");
    });

    scrollList();
  }

  return showNewCardForm ? (
    <>
      <form
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            handleCancelClick();
          }
        }}
        onSubmit={handleSubmit}
      >
        <div className={kanbanBoardColumnListItemClassNames}>
          <KanbanBoardCardTextarea
            aria-label="New card content"
            autoFocus
            name="cardContent"
            onChange={handleInputChange}
            onInput={(event) => {
              const input = event.currentTarget as HTMLTextAreaElement;
              if (/\S/.test(input.value)) {
                input.setCustomValidity("");
              } else {
                input.setCustomValidity(
                  "Card content cannot be empty or just whitespace.",
                );
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitButtonReference.current?.click();
              }

              if (event.key === "Escape") {
                handleCancelClick();
              }
            }}
            placeholder="New task..."
            required
            value={cardContent}
          />
        </div>

        <KanbanBoardColumnFooter>
          <Button ref={submitButtonReference} size="sm" type="submit">
            Add
          </Button>

          <Button
            onClick={handleCancelClick}
            size="sm"
            variant="outline"
            type="button"
          >
            Cancel
          </Button>
        </KanbanBoardColumnFooter>
      </form>
    </>
  ) : (
    <KanbanBoardColumnFooter>
      <KanbanBoardColumnButton
        onClick={handleAddCardClick}
        ref={newCardButtonReference}
      >
        <PlusIcon />

        <span aria-hidden>New card</span>

        <span className="sr-only">Add new card to {column.title}</span>
      </KanbanBoardColumnButton>
    </KanbanBoardColumnFooter>
  );
}

function MyNewKanbanBoardColumn({
  onAddColumn,
}: {
  onAddColumn: (columnTitle?: string) => void;
}) {
  const [showEditor, setShowEditor] = useState(false);
  const newColumnButtonReference = useRef<HTMLButtonElement>(null);
  const inputReference = useRef<HTMLInputElement>(null);

  function handleAddColumnClick() {
    flushSync(() => {
      setShowEditor(true);
    });

    onAddColumn();
  }

  function handleCancelClick() {
    flushSync(() => {
      setShowEditor(false);
    });

    newColumnButtonReference.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const columnTitle = formData.get("columnTitle") as string;
    onAddColumn(columnTitle);
    if (inputReference.current) {
      inputReference.current.value = "";
    }
  }

  return showEditor ? (
    <form
      className={kanbanBoardColumnClassNames}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          handleCancelClick();
        }
      }}
      onSubmit={handleSubmit}
    >
      <KanbanBoardColumnHeader>
        <Input
          aria-label="Column title"
          autoFocus
          name="columnTitle"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              handleCancelClick();
            }
          }}
          placeholder="New column title ..."
          ref={inputReference}
          required
        />
      </KanbanBoardColumnHeader>

      <KanbanBoardColumnFooter>
        <Button size="sm" type="submit">
          Add
        </Button>

        <Button
          onClick={handleCancelClick}
          size="sm"
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
      </KanbanBoardColumnFooter>
    </form>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleAddColumnClick}
          ref={newColumnButtonReference}
          variant="outline"
        >
          <PlusIcon />

          <span className="sr-only">Add column</span>
        </Button>
      </TooltipTrigger>

      <TooltipContent>Add a new column to the board</TooltipContent>
    </Tooltip>
  );
}
