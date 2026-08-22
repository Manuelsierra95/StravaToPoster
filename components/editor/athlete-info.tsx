"use client";

import { useMemo, useState } from "react";
import { GripVertical } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Draggable } from "@/components/ui/draggable";
import { Droppable } from "@/components/ui/droppable";
import { usePoster } from "@/components/poster-provider";
import {
  RIDER_FIELDS,
  type RiderFieldId,
} from "@/lib/strava/types";

const DRAG_TYPE = "rider";
const CUSTOM_CLUB_VALUE = "__custom__";

interface DragRiderItem {
  id: RiderFieldId;
  type: typeof DRAG_TYPE;
  index: number;
}

interface RiderFieldEditorProps {
  slot: number;
  fieldId: RiderFieldId;
  index: number;
}

function ClubField({ slot, fieldId, index }: RiderFieldEditorProps) {
  const {
    slotConfigs,
    athleteClubs,
    athleteClubsState,
    setRiderField,
    setRiderFieldVisible,
    reorderRiderFields,
  } = usePoster();

  const config = slotConfigs[slot];
  const value = config.rider.club;
  const visible = !config.hiddenRiderFields.includes(fieldId);

  const hasStravaClubs =
    athleteClubsState === "loaded" && athleteClubs.length > 0;
  const isStravaClub = useMemo(
    () => athleteClubs.some((club) => club.name === value),
    [athleteClubs, value],
  );

  const [customValue, setCustomValue] = useState<string>(
    isStravaClub || value === "" || value === "undefined" ? "" : value,
  );

  const handleSelectChange = (next: string | null) => {
    if (!next) return;
    if (next === CUSTOM_CLUB_VALUE) {
      setRiderField(slot, "club", customValue);
    } else {
      setRiderField(slot, "club", next);
    }
  };

  const triggerValue = isStravaClub
    ? value
    : value === "" || value == null
      ? ""
      : CUSTOM_CLUB_VALUE;

  return (
    <Droppable
      accept={DRAG_TYPE}
      onDrop={(item: unknown) => {
        const dropped = item as DragRiderItem;
        if (dropped.index !== index) {
          reorderRiderFields(slot, dropped.index, index);
        }
      }}
      hoverClassName="ring-foreground/40 rounded-sm ring-2"
    >
      <Draggable item={{ id: fieldId, type: DRAG_TYPE, index }}>
        <div className="flex items-center gap-2 rounded-sm px-1.5 py-1 text-xs transition-colors hover:bg-muted">
          <GripVertical className="text-muted-foreground size-3 shrink-0" />
          <Checkbox
            checked={visible}
            onCheckedChange={() => setRiderFieldVisible(slot, fieldId, !visible)}
          />
          <span className="shrink-0 font-medium">Club</span>
          <div className="min-w-0 flex-1">
            {hasStravaClubs ? (
              <div className="flex items-center gap-1.5">
                <Select
                  value={triggerValue || undefined}
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="Selecciona club" />
                  </SelectTrigger>
                  <SelectContent>
                    {athleteClubs.map((club) => (
                      <SelectItem key={club.id} value={club.name}>
                        {club.name}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_CLUB_VALUE}>
                      Personalizado…
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!isStravaClub && value !== "" && (
                  <Input
                    value={customValue}
                    onChange={(e) => {
                      setCustomValue(e.target.value);
                      setRiderField(slot, "club", e.target.value);
                    }}
                    placeholder="Club personalizado"
                    className="h-6 text-xs"
                  />
                )}
              </div>
            ) : (
              <Input
                value={value === "undefined" ? "" : value}
                onChange={(e) => setRiderField(slot, "club", e.target.value)}
                placeholder={
                  value === "undefined" ? "undefined" : "Club ciclista"
                }
                className="h-6 text-xs"
              />
            )}
          </div>
        </div>
      </Draggable>
    </Droppable>
  );
}

function TextField({
  slot,
  fieldId,
  index,
  label,
  placeholder,
  inputMode,
}: RiderFieldEditorProps & {
  label: string;
  placeholder: string;
  inputMode?: "text" | "numeric";
}) {
  const {
    slotConfigs,
    setRiderField,
    setRiderFieldVisible,
    reorderRiderFields,
  } = usePoster();

  const config = slotConfigs[slot];
  const value = config.rider[fieldId];
  const visible = !config.hiddenRiderFields.includes(fieldId);

  return (
    <Droppable
      accept={DRAG_TYPE}
      onDrop={(item: unknown) => {
        const dropped = item as DragRiderItem;
        if (dropped.index !== index) {
          reorderRiderFields(slot, dropped.index, index);
        }
      }}
      hoverClassName="ring-foreground/40 rounded-sm ring-2"
    >
      <Draggable item={{ id: fieldId, type: DRAG_TYPE, index }}>
        <div className="flex items-center gap-2 rounded-sm px-1.5 py-1 text-xs transition-colors hover:bg-muted">
          <GripVertical className="text-muted-foreground size-3 shrink-0" />
          <Checkbox
            checked={visible}
            onCheckedChange={() => setRiderFieldVisible(slot, fieldId, !visible)}
          />
          <span className="shrink-0 font-medium">{label}</span>
          <Input
            value={value}
            onChange={(e) => setRiderField(slot, fieldId, e.target.value)}
            placeholder={placeholder}
            inputMode={inputMode}
            className="h-6 flex-1 text-xs"
          />
        </div>
      </Draggable>
    </Droppable>
  );
}

export function AthleteInfo({ slot }: { slot: number }) {
  const { activities, slotConfigs, setRiderSectionEnabled } = usePoster();
  const activity = activities[slot] ?? null;
  const config = slotConfigs[slot];
  const enabled = config.riderSectionEnabled;

  if (!activity) {
    return (
      <p className="text-muted-foreground text-[0.7rem]">
        Selecciona una actividad para añadir los datos del ciclista.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 text-xs hover:bg-muted">
        <Checkbox
          checked={enabled}
          onCheckedChange={(checked) => {
            const next =
              typeof checked === "boolean" ? checked : Boolean(checked);
            if (next && !enabled) {
              setRiderSectionEnabled(slot, true);
            } else if (!next && enabled) {
              setRiderSectionEnabled(slot, false);
            }
          }}
        />
        <span className="font-medium">Mostrar datos del ciclista</span>
      </label>

      {enabled && (
        <div className="flex flex-col gap-1 pl-1">
          {config.riderFieldOrder.map((id, index) => {
            const def = RIDER_FIELDS.find((f) => f.id === id);
            if (!def) return null;
            if (id === "club") {
              return (
                <ClubField
                  key={id}
                  slot={slot}
                  fieldId={id}
                  index={index}
                />
              );
            }
            return (
              <TextField
                key={id}
                slot={slot}
                fieldId={id}
                index={index}
                label={def.label}
                placeholder={def.placeholder}
                inputMode={id === "bib" ? "numeric" : "text"}
              />
            );
          })}
        </div>
      )}

      {enabled && (
        <p className="text-muted-foreground pl-1 text-[0.65rem]">
          Arrastra para reordenar. Cada campo se puede ocultar o editar.
        </p>
      )}
    </div>
  );
}

