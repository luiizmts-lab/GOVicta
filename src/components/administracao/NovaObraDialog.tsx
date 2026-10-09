"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { criarObra } from "@/app/actions/obra-actions";

export function NovaObraDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await criarObra({
        codigo: String(formData.get("codigo") ?? ""),
        nome: String(formData.get("nome") ?? ""),
        codigoRm: String(formData.get("codigoRm") ?? ""),
        responsavel: String(formData.get("responsavel") ?? ""),
      });
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  }

  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2 bg-emerald-700 hover:bg-emerald-800" />}>
        <Plus className="h-4 w-4" /> Nova obra
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar obra</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" name="codigo" required placeholder="OB-003" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da obra</Label>
            <Input id="nome" name="nome" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="codigoRm">Código no TOTVS RM</Label>
            <Input id="codigoRm" name="codigoRm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Input id="responsavel" name="responsavel" />
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
