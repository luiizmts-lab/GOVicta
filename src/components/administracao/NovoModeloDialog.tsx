"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { criarModelo } from "@/app/actions/modelo-actions";
import type { LayoutCabecaExportacao } from "@prisma/client";

const LAYOUT_LABEL: Record<LayoutCabecaExportacao, string> = {
  DETALHADO: "Cabeça com total, itens detalhados abaixo",
  TITULO_SECAO: "Cabeça como título de seção",
  SEM_AGRUPAMENTO: "Itens analíticos, sem agrupamento",
};

export function NovoModeloDialog() {
  const [open, setOpen] = useState(false);
  const [mostrarPrecos, setMostrarPrecos] = useState(true);
  const [layoutCabeca, setLayoutCabeca] = useState<LayoutCabecaExportacao>("DETALHADO");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await criarModelo({
        codigo: String(formData.get("codigo") ?? ""),
        nome: String(formData.get("nome") ?? ""),
        categoria: String(formData.get("categoria") ?? ""),
        descricao: String(formData.get("descricao") ?? ""),
        mostrarPrecos,
        layoutCabeca,
      });
      formRef.current?.reset();
      setMostrarPrecos(true);
      setLayoutCabeca("DETALHADO");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2 bg-emerald-700 hover:bg-emerald-800" />}>
        <Plus className="h-4 w-4" /> Novo modelo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar modelo de contratação (demonstrativo)</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" name="codigo" required placeholder="MOD-DEMO-04" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input id="categoria" name="categoria" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" name="descricao" />
          </div>
          <div className="space-y-2">
            <Label>Layout das cabeças na exportação</Label>
            <Select value={layoutCabeca} onValueChange={(v) => typeof v === "string" && setLayoutCabeca(v as LayoutCabecaExportacao)}>
              <SelectTrigger className="w-full">
                <SelectValue>{() => LAYOUT_LABEL[layoutCabeca]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(LAYOUT_LABEL) as LayoutCabecaExportacao[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {LAYOUT_LABEL[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="mostrarPrecos"
              checked={mostrarPrecos}
              onCheckedChange={(v) => setMostrarPrecos(v === true)}
            />
            <Label htmlFor="mostrarPrecos" className="font-normal">
              Exibir preços de referência na exportação
            </Label>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending} className="bg-emerald-700 hover:bg-emerald-800">
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
