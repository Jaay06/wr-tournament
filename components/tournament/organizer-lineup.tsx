"use client";

import { useState, type CSSProperties } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { GripVertical, Plus } from "lucide-react";
import { RoleIcon } from "@/components/tournament/role-icon";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { arrangeLineupAssignments, starterRoles, type LineupAssignment, type LineupDropTarget } from "@/lib/tournament-rules";
import type { TournamentMemberData } from "@/lib/tournament-types";
import { cn } from "@/lib/utils";

export function OrganizerLineup({ members, lineup, onChange, disabled = false }: {
  members: TournamentMemberData[];
  lineup: LineupAssignment[];
  onChange: (next: LineupAssignment[]) => void;
  disabled?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [animateSwap, setAnimateSwap] = useState(false);
  const subs = lineup.filter(item => item.lineupPosition === "substitute");
  const slots = [...starterRoles, "Substitute 1", "Substitute 2"];
  const indexFor = (entry: LineupAssignment) => entry.lineupPosition === "starter" ? starterRoles.indexOf(entry.starterRole!) : 5 + subs.findIndex(sub => sub.registrationId === entry.registrationId);
  const cellStyle = (index: number) => ({ "--slot-row": index + 1, "--desktop-row": index < 5 ? 1 : 2, "--desktop-column": index < 5 ? index + 1 : index === 5 ? "1 / span 2" : "3 / span 3" }) as CSSProperties;
  const cellClass = "[grid-row:var(--slot-row)] col-start-1 desktop:[grid-row:var(--desktop-row)] desktop:[grid-column:var(--desktop-column)]";

  function move(id: string, target: LineupDropTarget, animate: boolean) {
    if (disabled) return;
    const next = arrangeLineupAssignments(lineup, id, target);
    setAnimateSwap(animate);
    onChange(next);
    const name = members.find(member => member.registrationId === id)?.displayName ?? "Player";
    setMessage(next === lineup ? "No change. If both substitute slots are full, choose a player to swap with." : `${name} moved. Save lineup to apply the change.`);
    setDragged(null); setOver(null);
  }

  return <div className="grid gap-3">
    <p className="m-0 text-xs leading-relaxed text-muted-foreground">Drag a player by the grip, or choose a destination below their name. Occupied roles swap both players.</p>
    <LayoutGroup><div className="grid grid-cols-1 gap-2 select-none desktop:grid-cols-5">
      {slots.map((slot, index) => {
        const occupant = lineup.find(entry => indexFor(entry) === index);
        const target: LineupDropTarget = index < 5 ? { kind: "starter", role: starterRoles[index] } : occupant ? { kind: "player", registrationId: occupant.registrationId } : { kind: "substitute" };
        return <div key={slot} style={cellStyle(index)} className={cn(cellClass, "min-h-24 rounded-xl border border-dashed border-border bg-background/45 p-3", over === index && "border-primary bg-primary-soft")}
          onDragOver={event => { if (!disabled && dragged) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(index); } }}
          onDrop={event => { event.preventDefault(); const id = event.dataTransfer.getData("text/registration-id"); if (id && dragged === id) move(id, target, true); }}>
          {!occupant && <div className="flex h-full items-center justify-center gap-2 text-xs text-muted-foreground">{index < 5 ? <RoleIcon className="size-5" roleName={starterRoles[index]} /> : <Plus size={17} />}<span className="desktop:sr-only">{slot}</span><span className="text-xs">Open</span></div>}
        </div>;
      })}
      {lineup.map(entry => {
        const member = members.find(item => item.registrationId === entry.registrationId);
        if (!member) return null;
        const index = indexFor(entry);
        return <motion.div key={entry.registrationId} layout={!reduceMotion && animateSwap ? "position" : false} transition={{ type: "spring", duration: 0.26, bounce: 0 }} style={{ ...cellStyle(index), borderRadius: 12 }} className={cn(cellClass, "pointer-events-none z-10 min-w-0 border border-border bg-secondary p-3", dragged === entry.registrationId && "opacity-50")}>
          <div className="flex items-center gap-2"><span className="text-role-icon">{entry.starterRole ? <RoleIcon className="size-4" roleName={entry.starterRole} /> : <span className="font-mono text-2xs">SUB</span>}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">{member.displayName}</span>
            <span role="img" aria-label={`Drag ${member.displayName}`} draggable={!disabled} className="pointer-events-auto cursor-grab touch-none text-muted-foreground active:cursor-grabbing" onDragStart={event => { if (disabled) { event.preventDefault(); return; } window.getSelection()?.removeAllRanges(); event.dataTransfer.setData("text/registration-id", entry.registrationId); event.dataTransfer.effectAllowed = "move"; setDragged(entry.registrationId); }} onDragEnd={() => { setDragged(null); setOver(null); }}><GripVertical size={18} /></span>
          </div><p className="mt-2 mb-3 text-xs text-muted-foreground">{member.approvedTier ?? "Tier pending"}{member.isCaptain ? " / captain" : ""}</p>
          <NativeSelect className="pointer-events-auto w-full" aria-label={`Move ${member.displayName}`} disabled={disabled} value={entry.lineupPosition === "starter" ? entry.starterRole! : "substitute"} onChange={event => {
            const value = event.target.value;
            move(entry.registrationId, value.startsWith("player:") ? { kind: "player", registrationId: value.slice(7) } : value === "substitute" ? { kind: "substitute" } : { kind: "starter", role: value as typeof starterRoles[number] }, false);
          }}>
            {starterRoles.map(role => <NativeSelectOption key={role} value={role}>{role}</NativeSelectOption>)}
            <NativeSelectOption value="substitute" disabled={subs.length >= 2 && entry.lineupPosition !== "substitute"}>Substitute</NativeSelectOption>
            {subs.filter(sub => sub.registrationId !== entry.registrationId).map(sub => <NativeSelectOption key={sub.registrationId} value={`player:${sub.registrationId}`}>Swap with {members.find(member => member.registrationId === sub.registrationId)?.displayName}</NativeSelectOption>)}
          </NativeSelect>
        </motion.div>;
      })}
    </div></LayoutGroup>
    <p className="sr-only" role="status" aria-live="polite">{message}</p>
  </div>;
}
