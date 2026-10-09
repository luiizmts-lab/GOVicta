"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { setObraAtiva } from "@/app/actions/obra-actions";

type Obra = { id: string; codigo: string; nome: string };

export function ObraSelector({ obras, obraAtivaId }: { obras: Obra[]; obraAtivaId?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={obraAtivaId}
      disabled={isPending}
      onValueChange={(value) => {
        if (typeof value !== "string") return;
        startTransition(async () => {
          await setObraAtiva(value);
          router.refresh();
        });
      }}
    >
      <SelectTrigger className="w-[320px] bg-white">
        <SelectValue placeholder="Selecione a obra">
          {(value: string | null) => {
            const obra = obras.find((o) => o.id === value);
            return obra ? `${obra.codigo} — ${obra.nome}` : "Selecione a obra";
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {obras.map((obra) => (
          <SelectItem key={obra.id} value={obra.id}>
            {obra.codigo} — {obra.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
